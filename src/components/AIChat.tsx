/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDemoMode } from "../lib/firebase";
import { getGeminiModel } from "../lib/gemini";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, X, MessageSquare, Loader2, Mic, CircleStop, Volume2, RotateCcw, Paperclip, Trash2 } from "lucide-react";
import { Modality } from "@google/genai";

import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

export const AIChat = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello! I'm Reo, your personal study assistant. How can I help you today?" }
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = "";
  };

  const playTTS = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      if (isDemoMode) {
        // Mock TTS for Demo Mode (simple audio alert or just skip)
        console.log("Demo Mode: Simulating TTS for:", text);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSpeaking(false);
        return;
      }
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
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAudioBase64(null);
    const fileToUpload = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);

    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const responses = [
          "That's an interesting question! As a Gemini-powered tutor, I'd suggest focusing on the core principles first.",
          "I've analyzed your request. You might want to check the 'Syllabus Architect' for a better roadmap on this topic.",
          "I'm currently in Demo Mode, but if I were fully connected, I'd provide a deep dive into that academic area!",
          "Great point! Have you tried generating a quiz about this subject yet?"
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages((prev) => [...prev, { role: "model", text: randomResponse }]);
        return;
      }

      const systemInstruction = {
        role: "user",
        parts: [{ text: "SYSTEM INSTRUCTION: You are Reo, an expert AI academic tutor. Your goal is to provide highly structured, student-friendly responses. NEVER provide blocks of messy text. ALWAYS use clear headings (e.g., # Topic), bullet points for key facts, and **bold text** for important terms. Organize your output so it's easy to skim and understand. Use academic but encouraging tone. If a file is provided, analyze it thoroughly." }]
      };

      const messagesForGemini = [
        systemInstruction,
        ...messages.slice(-5).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        {
          role: "user",
          parts: [
            { text: input || (fileToUpload ? `Please analyze this file: ${fileToUpload.name}` : "Please transcribe and answer based on this audio content.") },
            ...(audioBase64 ? [{ inlineData: { mimeType: "audio/wav", data: audioBase64 } }] : []),
            ...(fileToUpload ? [{ inlineData: { mimeType: fileToUpload.type, data: fileToUpload.data } }] : [])
          ]
        }
      ];

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: messagesForGemini
      });

      const modelText = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "model", text: modelText }]);
    } catch (error) {
      console.error("Reo Chat Error:", error);
      setMessages((prev) => [...prev, { role: "model", text: "Something went wrong. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] md:hidden"
          />
          
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-white border-l border-neutral-200 z-[70] shadow-2xl flex flex-col transition-all duration-300 ${isDragging ? "ring-4 ring-primary ring-inset bg-primary/5" : ""}`}
          >
            {/* Drag Overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[80] flex items-center justify-center bg-primary/20 backdrop-blur-md"
                >
                  <div className="bg-white p-6 rounded-3xl shadow-xl text-center border-2 border-dashed border-primary">
                    <Paperclip className="w-8 h-8 text-primary animate-bounce mx-auto mb-2" />
                    <p className="font-bold text-sm text-ink">Drop to analyze</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">Reo</h3>
                  <p className="text-xs opacity-80">Always active</p>
                </div>
              </div>
              <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-primary-light text-primary" : "bg-white/60 text-ink-muted"
                    }`}>
                      {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed relative group/msg ${
                      m.role === "user" 
                        ? "bg-primary text-white rounded-tr-none" 
                        : "bg-white/40 border border-white/60 text-neutral-800 rounded-tl-none"
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                      {m.role === "model" && (
                        <button 
                          onClick={() => playTTS(m.text)}
                          className="absolute -right-8 top-0 p-1 rounded-lg bg-neutral-100 opacity-0 group-hover/msg:opacity-100 transition-opacity hover:text-primary"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-neutral-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white/40 p-3 rounded-2xl border border-white/60">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-neutral-100">
              {(audioBase64 || attachedFile) && !isRecording && (
                <div className="mb-3 space-y-2">
                  {audioBase64 && (
                    <div className="flex items-center justify-between bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Mic className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Audio Attached</span>
                      </div>
                      <button onClick={() => setAudioBase64(null)} className="text-emerald-400">
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {attachedFile && (
                    <div className="flex items-center justify-between bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-600 uppercase truncate max-w-[200px]">{attachedFile.name} Attached</span>
                      </div>
                      <button onClick={() => setAttachedFile(null)} className="text-blue-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.docx,.txt"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={attachedFile ? `Adding ${attachedFile.name}...` : "Ask Reo anything..."}
                  className="w-full bg-white/40 border border-white/60 rounded-2xl pl-12 pr-24 py-4 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 text-neutral-400 transition-colors"
                   >
                     <Paperclip className="w-4 h-4" />
                   </button>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "hover:bg-neutral-100 text-neutral-400"}`}
                  >
                    {isRecording ? <CircleStop className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={(!input.trim() && !audioBase64 && !attachedFile) || isLoading}
                    className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-primary/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 text-center mt-4">
                Powered by Gemini 3 Flash • Built for Scholars
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
