import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Socket.io Logic
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomName) => {
      socket.join(roomName);
      if (!rooms.has(roomName)) {
        rooms.set(roomName, {
          name: roomName,
          users: [],
          timer: 25 * 60,
          isActive: false
        });
      }
      
      const room = rooms.get(roomName);
      const user = { id: socket.id, name: `Student ${rooms.get(roomName).users.length + 1}` };
      room.users.push(user);
      
      io.to(roomName).emit("room-data", room);
      console.log(`User ${socket.id} joined room ${roomName}`);
    });

    socket.on("toggle-timer", ({ roomName, isActive }) => {
      const room = rooms.get(roomName);
      if (room) {
        room.isActive = isActive;
        io.to(roomName).emit("timer-status", { isActive: room.isActive, timer: room.timer });
      }
    });

    socket.on("sync-timer", ({ roomName, timer }) => {
      const room = rooms.get(roomName);
      if (room) {
        room.timer = timer;
        socket.to(roomName).emit("timer-update", timer);
      }
    });

    socket.on("send-message", ({ roomName, text, userName }) => {
      io.to(roomName).emit("new-chat-message", {
        id: Date.now().toString(),
        userId: socket.id,
        userName,
        text,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      rooms.forEach((room, roomName) => {
        room.users = room.users.filter(u => u.id !== socket.id);
        if (room.users.length === 0) {
          rooms.delete(roomName);
        } else {
          io.to(roomName).emit("room-data", room);
        }
      });
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Gemini API Proxy
  app.use(express.json({ limit: '10mb' }));
  
  // Collect all available Gemini keys for rotation
  const getAvailableKeys = () => {
    const keys: string[] = [];
    const isPlaceholder = (k: string) => 
      !k || 
      k === "MY_GEMINI_API_KEY" || 
      k === "YOUR_API_KEY" || 
      k === "undefined" ||
      k.startsWith("<") ||
      k.includes("placeholder");

    const cleanKey = (k: string) => {
      if (!k) return "";
      return k.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
    };

    if (process.env.GEMINI_API_KEY) {
      const k = cleanKey(process.env.GEMINI_API_KEY);
      if (!isPlaceholder(k)) keys.push(k);
    }
    
    // Check for GEMINI_API_KEY_1...10
    for (let i = 1; i <= 10; i++) {
      let key = process.env[`GEMINI_API_KEY_${i}`];
      if (key) {
        key = cleanKey(key);
        if (!isPlaceholder(key) && !keys.includes(key)) {
          keys.push(key);
        }
      }
    }
    return keys;
  };

  let currentKeyIndex = 0;

  app.post("/api/gemini", async (req, res) => {
    const { model: modelName, contents, config } = req.body;
    
    const availableKeys = getAvailableKeys();
    
    if (availableKeys.length === 0) {
      console.error("[Gemini Proxy] No API keys found in environment.");
      return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
    }

    // Pick keys and try until one works or we run out of keys
    let lastError: any = null;
    const keysToTry = [...availableKeys];
    // Start from the current index
    const startIndex = currentKeyIndex;
    
    for (let i = 0; i < keysToTry.length; i++) {
      const attemptIndex = (startIndex + i) % keysToTry.length;
      const apiKey = keysToTry[attemptIndex];
      // Update global index for next request
      currentKeyIndex = (attemptIndex + 1) % keysToTry.length;

      try {
        const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
        console.log(`[Gemini Proxy] Attempt ${i + 1} using key: ${maskedKey} for model: ${modelName}`);

        const genAI = new GoogleGenAI({ apiKey });
        
        const result = await genAI.models.generateContent({
          model: modelName || "gemini-3-flash-preview",
          contents,
          config
        });
        
        return res.json({
          text: result.text,
          candidates: result.candidates,
          usageMetadata: result.usageMetadata
        });
      } catch (error: any) {
        lastError = error;
        console.error(`[Gemini Proxy] Attempt ${i + 1} failed:`, error.message);
        
        // If it's a "key not valid" error, try next key
        if (error.message?.includes("API key not valid") || error.status === 400 || error.status === 401) {
          continue; 
        }
        
        // For other errors (like rate limits or safety), maybe we should also try next?
        // But for things like 404 (model not found), it's better to stop.
        if (error.status === 429) {
          continue; // Rate limit - definitely try next key!
        }
        
        break; // Unrecoverable or unexpected error
      }
    }

    // If we get here, all attempts failed
    console.error("Gemini Proxy: All attempts failed.");
    const status = lastError?.status || 500;
    res.status(status).json({ 
      error: lastError?.message || "All Gemini API key attempts failed.",
      details: lastError?.toString()
    });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
