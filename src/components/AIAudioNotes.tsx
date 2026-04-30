/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Music, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Volume2, 
  Brain, 
  Zap, 
  Type, 
  Mic2,
  Trash2,
  ChevronRight,
  Ear
} from "lucide-react";
import { GoogleGenAI, Modality } from "@google/genai";
import { neuralKeyManager } from "../lib/keyRotation";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export const AIAudioNotes = () => {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const playPCM = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert Uint8Array (PCM 16-bit) to Float32Array
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }

      const bufferSource = audioContextRef.current.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioContextRef.current.destination);
      
      bufferSource.onended = () => setIsPlaying(false);
      
      sourceNodeRef.current = bufferSource;
      bufferSource.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setAudioUrl(null);
    setTranscript("");

    const ai = new GoogleGenAI({ apiKey: neuralKeyManager.getNextKey() });

    try {
      // Step 1: Generate Transcript
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a clear, educational explanation (about 100-150 words) for the topic: "${topic}". Make it engaging and easy to understand for a student.`
      });

      const text = textResponse.text || "No explanation generated.";
      setTranscript(text);

      // Step 2: Generate Audio (TTS)
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Read this educational note clearly and warmly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        // We'll store it for manual play
        (window as any)._lastAudioBase64 = base64Audio;
        setAudioUrl("generated"); // Dummy state to show UI
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
    } else if ((window as any)._lastAudioBase64) {
      playPCM((window as any)._lastAudioBase64);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-200">
          <Music className="w-3 h-3" /> Reowl Audio Foundry
        </div>
        <h2 className="text-5xl font-black italic tracking-tighter text-ink uppercase leading-none">
          AUDIO <span className="text-indigo-600">NOTES</span>
        </h2>
        <p className="text-ink-muted text-sm uppercase tracking-widest font-bold">Neural Voice Synthesis for Efficient Learning</p>
      </div>

      <Card className="p-10 bg-white border border-neutral-100 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #4f46e5 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <input 
                   type="text" 
                   placeholder="Enter any topic to generate audio notes..."
                   className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-5 px-6 pt-8 text-lg font-black text-ink outline-none focus:border-indigo-600 transition-all shadow-sm"
                   value={topic}
                   onChange={(e) => setTopic(e.target.value)}
                 />
                 <label className="absolute left-6 top-3 text-[9px] font-black uppercase text-neutral-400 tracking-widest">Concept Node</label>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {isGenerating ? "Synthesizing..." : "Generate Audio Note"}
              </button>
           </div>

           <AnimatePresence>
              {transcript && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Playback Component */}
                  <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-200">
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={togglePlayback}
                          className="w-16 h-16 rounded-3xl bg-white text-indigo-600 flex items-center justify-center shadow-inner hover:scale-110 transition-all"
                        >
                           {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                        </button>
                        <div>
                           <h4 className="text-xl font-black italic tracking-tight">Audio Fragment Generated</h4>
                           <p className="text-[10px] uppercase font-black tracking-widest text-white/50">Neural Voice: Kore (Engaging)</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-4 px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md">
                           <Volume2 className="w-4 h-4" />
                           <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                              <motion.div 
                                animate={isPlaying ? { width: "100%" } : { width: "0%" }}
                                transition={isPlaying ? { duration: 30, ease: "linear" } : { duration: 0.5 }}
                                className="h-full bg-white" 
                              />
                           </div>
                        </div>
                        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                           <Download className="w-5 h-5" />
                        </button>
                     </div>
                  </div>

                  {/* Transcript Sector */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 px-2">
                        <Type className="w-4 h-4 text-neutral-400" />
                        <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Neural Transcript</h4>
                     </div>
                     <div className="p-8 bg-neutral-50 rounded-[2rem] border border-neutral-100 text-sm font-medium leading-relaxed text-ink italic opacity-80 border-l-8 border-l-indigo-600">
                        {transcript}
                     </div>
                  </div>
                </motion.div>
              )}
           </AnimatePresence>

           {!transcript && !isGenerating && (
             <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                <Ear className="w-20 h-20 mb-6 text-neutral-400" />
                <h3 className="text-2xl font-black italic uppercase italic">Awaiting Input</h3>
                <p className="text-xs font-bold tracking-widest">The neural synthesizer is ready for your first node.</p>
             </div>
           )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Zap, label: "Lightning Speed", desc: "Generated in seconds using Gemini 3.1 Flash." },
           { icon: Ear, label: "Neural Clarity", desc: "High-fidelity voice synthesis for natural hearing." },
           { icon: Share2, label: "Sync Ready", desc: "Download and sync to your neural repository." }
         ].map((feat, i) => (
           <Card key={i} className="p-6 bg-white border border-neutral-100 rounded-[2rem] shadow-sm group hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-neutral-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                 <feat.icon className="w-5 h-5" />
              </div>
              <h5 className="font-black italic text-sm mb-1">{feat.label}</h5>
              <p className="text-[10px] text-neutral-400 font-medium">{feat.desc}</p>
           </Card>
         ))}
      </div>
    </div>
  );
};

const Share2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
);
