/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  User, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  FileText, 
  Clock, 
  MoreVertical,
  Paperclip,
  Smile,
  X,
  Target,
  Sparkles
} from "lucide-react";
import { Badge } from "./ui/Badge";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  type: 'text' | 'feedback' | 'system';
  isTeacher: boolean;
  relatedModule?: string;
}

export const NeuralBridge = ({ 
  recipientId, 
  recipientName, 
  currentUser, 
  isTeacherView = false 
}: { 
  recipientId: string; 
  recipientName: string; 
  currentUser: any;
  isTeacherView?: boolean;
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "system",
      senderName: "Neural Bridge",
      text: `Secure communication link established with ${recipientName}.`,
      timestamp: new Date(),
      type: "system",
      isTeacher: false
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || (isTeacherView ? "Professor" : "Student"),
      text: message,
      timestamp: new Date(),
      type: "text",
      isTeacher: isTeacherView
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Mock auto-reply for demo if it's the student view
    if (!isTeacherView) {
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          senderId: recipientId,
          senderName: recipientName,
          text: "I've received your data packet. I'll review your neural logs and get back to you shortly.",
          timestamp: new Date(),
          type: "text",
          isTeacher: true
        };
        setMessages(prev => [...prev, reply]);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[3rem] border border-neutral-100 shadow-2xl overflow-hidden relative group">
      {/* Header */}
      <header className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <User className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-indigo-700" />
          </div>
          <div>
            <h3 className="font-black italic tracking-tight">{recipientName}</h3>
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-emerald-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Secure Neural Link</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <Target className="w-5 h-5 text-indigo-200" />
           </button>
           <button className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40">
              <MoreVertical className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-neutral-50/30">
        {messages.map((msg, i) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.type === 'system' ? 'justify-center' : msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'system' ? (
              <div className="bg-neutral-100/50 px-4 py-1.5 rounded-full border border-neutral-200/50">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">{msg.text}</p>
              </div>
            ) : (
              <div className={`max-w-[80%] space-y-1 ${msg.senderId === currentUser.uid ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 px-1 ${msg.senderId === currentUser.uid ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <span className="text-[10px] font-black text-ink uppercase tracking-widest opacity-40">{msg.senderName}</span>
                  {msg.isTeacher && <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] h-4">Educator</Badge>}
                </div>
                <div 
                  className={`p-4 rounded-[1.5rem] shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
                    msg.senderId === currentUser.uid 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-ink border border-neutral-100 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  
                  {msg.senderId === currentUser.uid && (
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Zap className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-bold text-neutral-400 px-2">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-neutral-100">
        <form onSubmit={handleSendMessage} className="relative">
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-2 pl-4 transition-all focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-indigo-500/5">
            <input 
              type="text" 
              placeholder="Send message or upload data packet..." 
              className="flex-1 bg-transparent text-sm font-bold text-ink outline-none border-none py-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center gap-2">
               <button type="button" className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Paperclip className="w-5 h-5" />
               </button>
               <button type="button" className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Smile className="w-5 h-5" />
               </button>
               <button 
                 type="submit" 
                 disabled={!message.trim()}
                 className={`p-3 rounded-xl transition-all ${
                   message.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                 }`}
               >
                  <Send className="w-5 h-5" />
               </button>
            </div>
          </div>
        </form>
        <p className="text-[10px] text-center mt-4 text-neutral-300 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3" /> End-to-End Neural Encryption Active
        </p>
      </div>
    </div>
  );
};
