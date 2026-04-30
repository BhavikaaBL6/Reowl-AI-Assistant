import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

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
