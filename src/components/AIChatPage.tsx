/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getGeminiModel } from "../lib/gemini";
import { formatISTDate, formatISTTime } from "../lib/utils";
import { 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Loader2, 
  Sparkles, 
  Paperclip, 
  Mic, 
  History as HistoryIcon, 
  Settings2,
  Share2,
  Trash2,
  Plus,
  ArrowRight,
  CircleStop,
  Volume2,
  RotateCcw
} from "lucide-react";
import { Modality } from "@google/genai";
import { useFirebase } from "../contexts/FirebaseContext";
import { db, handleFirestoreError, isDemoMode } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc,
  setDoc
} from "firebase/firestore";

import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: any;
}

export const AIChatPage = () => {
  const { user } = useFirebase();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(localStorage.getItem("last_active_chat"));
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Welcome to the Reo Power Chat! I can help you analyze documents, solve equations, or summarize your entire syllabus. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Sessions
  useEffect(() => {
    if (!user || isDemoMode) return;

    const q = query(
      collection(db!, "users", user.uid, "chatHistory"),
      where("userId", "==", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(sessionData);
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/chatHistory`);
    });

    return () => unsubscribe();
  }, [user]);

  // Load current messages when session changes
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const active = sessions.find(s => s.id === currentSessionId);
      if (active) {
        setMessages(active.messages);
      }
    }
  }, [currentSessionId, sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAttachedFile({
        name: file.name,
        type: file.type || "application/octet-stream",
        data: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const createNewSession = async () => {
    if (!user || isDemoMode) {
       setMessages([{ role: "model", text: "New demo session started." }]);
       setCurrentSessionId(null);
       return;
    }

    try {
      const path = `/users/${user.uid}/chatHistory`;
      const docRef = await addDoc(collection(db!, "users", user.uid, "chatHistory"), {
        userId: user.uid,
        title: "New Academic Inquiry",
        messages: [{ role: "model", text: "Welcome back! How can Reo assist you in this new session?" }],
        updatedAt: serverTimestamp()
      });
      setCurrentSessionId(docRef.id);
      localStorage.setItem("last_active_chat", docRef.id);
    } catch (error) {
      handleFirestoreError(error, 'create', `/users/${user.uid}/chatHistory`);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isDemoMode) return;
    try {
      const path = `/users/${user.uid}/chatHistory/${id}`;
      await deleteDoc(doc(db!, "users", user.uid, "chatHistory", id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([{ role: "model", text: "Session deleted." }]);
      }
    } catch (error) {
      handleFirestoreError(error, 'delete', `/users/${user.uid}/chatHistory/${id}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setAudioBase64(base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    // Reset input for same file selection
    e.target.value = "";
  };

  const playTTS = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const model = getGeminiModel({
        model: "gemini-3.1-flash-tts-preview", 
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Say clearly: ${text}` }] }],
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const context = audioContext || new AudioContext();
        setAudioContext(context);
        const buffer = await context.decodeAudioData(arrayBuffer);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !audioBase64 && !attachedFile) || isLoading) return;

    const userText = input || (attachedFile ? `Analyzing ${attachedFile.name}` : "Voice Input");
    const userMessage: Message = { role: "user", text: userText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setAudioBase64(null);
    const fileToUpload = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);

    const systemInstruction = {
      role: "user",
      parts: [{ text: "SYSTEM INSTRUCTION: You are Reo, an expert AI academic tutor. Your goal is to provide highly structured, student-friendly responses. NEVER provide blocks of messy text. ALWAYS use clear headings (e.g., # Topic), bullet points for key facts, and **bold text** for important terms. Organize your output so it's easy to skim and understand. Use academic but encouraging tone. If a file is provided, analyze it thoroughly and answer questions related to it." }]
    };

    try {
      const contextMessages = messages.slice(-10).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const currentParts: any[] = [
        { text: input || (fileToUpload ? `Please analyze this file: ${fileToUpload.name}` : "Please transcribe and answer based on this audio content.") },
        ...(audioBase64 ? [{ inlineData: { mimeType: "audio/wav", data: audioBase64 } }] : []),
        ...(fileToUpload ? [{ inlineData: { mimeType: fileToUpload.type, data: fileToUpload.data } }] : [])
      ];

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [
          systemInstruction,
          ...contextMessages,
          { role: "user", parts: currentParts }
        ]
      });

      const modelText = response.text || "I'm sorry, I couldn't generate a response.";
      const finalMessages = [...newMessages, { role: "model", text: modelText } as Message];
      setMessages(finalMessages);

      // Save to Firestore
      if (user && !isDemoMode) {
        if (!currentSessionId) {
          // Auto-create session if first message
          const docRef = await addDoc(collection(db!, "users", user.uid, "chatHistory"), {
            userId: user.uid,
            title: userText.slice(0, 30) + (userText.length > 30 ? "..." : ""),
            messages: finalMessages,
            updatedAt: serverTimestamp()
          });
          setCurrentSessionId(docRef.id);
          localStorage.setItem("last_active_chat", docRef.id);
        } else {
          const sessionRef = doc(db!, "users", user.uid, "chatHistory", currentSessionId);
          await updateDoc(sessionRef, {
            messages: finalMessages,
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error("Reo Chat Error:", error);
      setMessages((prev) => [...prev, { role: "model", text: "Something went wrong. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-[calc(100vh-160px)] flex gap-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col glass rounded-[2.5rem] overflow-hidden border-white/40 shadow-2xl relative transition-all duration-300 ${isDragging ? "ring-4 ring-primary ring-inset scale-[0.99] bg-primary/5" : ""}`}>
        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md"
            >
              <div className="bg-white p-10 rounded-[3rem] shadow-3xl text-center border-4 border-dashed border-primary">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Paperclip className="w-10 h-10 text-primary animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-ink mb-2">Drop to Analyze</h3>
                <p className="text-ink-muted">Reo will read your document instantly</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Chat Header */}
        <div className="px-8 py-5 border-b border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-lg tracking-tight">Reo Assistant</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">Active • Gemini 3 Flash</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentSessionId(null)}
              className="p-2.5 rounded-xl hover:bg-white/40 text-primary transition-colors flex items-center gap-2 group"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">New Chat</span>
            </button>
            <button className="p-2.5 rounded-xl hover:bg-white/40 text-ink-muted transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if(currentSessionId) deleteSession(currentSessionId, {} as any);
              }}
              className="p-2.5 rounded-xl hover:bg-white/40 text-red-500/60 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                  m.role === "user" ? "bg-primary text-white border-primary/20" : "glass text-primary border-white/50"
                }`}>
                  {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`px-6 py-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm relative group/msg ${
                  m.role === "user" 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "glass text-ink border-white/50 rounded-tl-none font-medium"
                }`}>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                  {m.role === "model" && (
                    <button 
                      onClick={() => playTTS(m.text)}
                      className="absolute -right-12 top-0 p-2 rounded-xl bg-white/40 opacity-0 group-hover/msg:opacity-100 transition-opacity hover:text-primary"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary animate-pulse">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass px-6 py-4 rounded-[1.5rem] rounded-tl-none">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="p-8 bg-white/10 backdrop-blur-xl border-t border-white/20">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.docx,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-white/20 text-ink-muted transition-colors"
                title="Attach Document"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={attachedFile ? `Adding ${attachedFile.name}...` : "Describe what you want to learn today..."}
              className="w-full glass rounded-[2rem] pl-16 pr-32 py-5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none min-h-[70px] max-h-[200px] resize-none"
              rows={1}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2.5 rounded-full transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "hover:bg-white/20 text-ink-muted"}`}
              >
                {isRecording ? <CircleStop className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button 
                onClick={handleSend}
                disabled={(!input.trim() && !audioBase64 && !attachedFile) || isLoading}
                className="bg-primary text-white p-3.5 rounded-2xl shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {(audioBase64 || attachedFile) && !isRecording && (
            <div className="mt-2 flex items-center justify-center gap-3">
              {audioBase64 && (
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Voice Recording Attached</span>
                  <button onClick={() => setAudioBase64(null)} className="text-emerald-600 hover:text-emerald-900">
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              )}
              {attachedFile && (
                <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate max-w-[150px]">{attachedFile.name} Attached</span>
                  <button onClick={() => setAttachedFile(null)} className="text-blue-600 hover:text-blue-900">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-ink-muted tracking-widest bg-white/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-primary" /> Multi-modal Enabled
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-ink-muted tracking-widest bg-white/20 px-3 py-1 rounded-full">
              <Settings2 className="w-3 h-3 text-primary" /> Advanced Reasoning
            </div>
          </div>
        </div>
      </div>

      {/* Side Info Panel */}
      <div className="hidden xl:flex w-80 flex-col gap-6">
        <div className="glass p-6 rounded-[2.5rem] border-white/40">
          <h4 className="font-bold text-ink mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Quick Suggestions
          </h4>
          <div className="space-y-3">
            {[
              "Explain Quantum Entanglement",
              "Summarize my Physics notes",
              "Generate a Mock Quiz",
              "Help with Thesis Outline"
            ].map((s, i) => (
              <button 
                key={i}
                onClick={() => setInput(s)}
                className="w-full text-left p-3.5 rounded-2xl bg-white/30 hover:bg-white/60 border border-white/40 text-xs font-medium text-ink transition-all group"
              >
                {s}
                <ArrowRight className="w-3 h-3 float-right opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-[2.5rem] border-white/40 flex-1 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <h4 className="font-bold text-ink mb-6 flex items-center gap-2 shrink-0">
            <HistoryIcon className="w-4 h-4 text-primary" /> Session History
          </h4>
          <div className="space-y-3 overflow-y-auto flex-1 no-scrollbar pb-20">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setCurrentSessionId(s.id);
                    localStorage.setItem("last_active_chat", s.id);
                  }}
                  className={`flex flex-col gap-1 p-4 rounded-2xl cursor-pointer transition-all border group relative ${
                    currentSessionId === s.id 
                      ? "bg-primary text-white border-primary shadow-lg" 
                      : "bg-white/30 hover:bg-white/50 border-white/20"
                  }`}
                >
                  <p className={`text-xs font-bold truncate pr-6 ${currentSessionId === s.id ? "text-white" : "text-ink"}`}>{s.title}</p>
                  <p className={`text-[10px] font-medium leading-none ${currentSessionId === s.id ? "text-white/60" : "text-ink-muted"}`}>
                    {s.updatedAt?.toDate ? formatISTTime(s.updatedAt.toDate()) : "Just now"}
                  </p>
                  <button 
                    onClick={(e) => deleteSession(s.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3 opacity-40">
                <HistoryIcon className="w-8 h-8" />
                <p className="text-[10px] uppercase font-black tracking-widest leading-tight">No history found<br/>Start a new inquiry</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
