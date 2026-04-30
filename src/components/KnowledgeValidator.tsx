/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  TrendingUp, 
  ArrowRight,
  Zap,
  BookOpen,
  RefreshCw,
  Search
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { neuralKeyManager } from "../lib/keyRotation";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

export const KnowledgeValidator = () => {
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  const validateKnowledge = async () => {
    if (!topic || !explanation) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);

    const ai = new GoogleGenAI({ apiKey: neuralKeyManager.getNextKey() });

    const prompt = `
      You are 'Neural Buddy', a cognitive diagnostic AI. A student is trying to explain the topic: '${topic}'.
      
      Student's Explanation:
      "${explanation}"
      
      Task:
      Analyze this explanation for accuracy, depth, and clarity. Use a diagnostic tone.
      
      Return a JSON object with:
      1. score: 0-100 (Mastery level)
      2. status: 'Novice', 'Apprentice', 'Master', or 'Expert'
      3. feedback: A concise 2-sentence summary of their understanding.
      4. strengths: Array of 3 specific points they got exactly right.
      5. gaps: Array of 3 key concepts they missed or explained incorrectly.
      6. correctiveAction: A specific "Pro Tip" to bridge the gap.
      7. followupQuestion: A challenging question to test their deeper logic.

      Be rigorous. If they are vague, point it out.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      const output = result.text || "{}";
      const cleanedJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
      setAnalysis(JSON.parse(cleanedJson));
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
          <Zap className="w-3 h-3 animate-pulse" /> Neural Sync Protocol active
        </div>
        <h2 className="text-5xl lg:text-7xl font-black italic tracking-tighter text-ink uppercase leading-none">
          NEURAL <span className="text-primary">BUDDY</span>
        </h2>
        <p className="text-ink-muted text-sm uppercase tracking-[0.2em] font-black">Explain to Master: The ultimate knowledge validation loop</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Input Sector */}
        <div className="lg:col-span-12">
          <Card className="p-10 bg-white border-2 border-neutral-100 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `linear-gradient(#primary 1px, transparent 1px), linear-gradient(90deg, #primary 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
            
            <div className="relative z-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-ink-muted tracking-widest pl-2">Target Concept</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Photosynthesis, Binary Search, French Revolution..."
                    className="w-full bg-neutral-50 border-2 border-neutral-100 rounded-2xl py-4 px-6 text-sm font-bold text-ink outline-none focus:border-primary transition-all shadow-sm"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <div className="flex items-end pb-1">
                   <p className="text-xs text-neutral-400 italic">"The best way to learn is to teach. Explain your topic as if you're teaching a beginner. REO will analyze your neural logic."</p>
                </div>
              </div>

              <div className="space-y-4 relative">
                <label className="text-[10px] font-black uppercase text-ink-muted tracking-widest pl-2">Your Neural Explanation</label>
                <textarea 
                  placeholder="Type or use the Neural Mic to begin your explanation..."
                  className="w-full h-64 bg-neutral-50 border-2 border-neutral-100 rounded-[2.5rem] p-8 text-sm font-medium leading-relaxed text-ink outline-none focus:border-primary transition-all shadow-sm resize-none"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
                
                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                   <button 
                     onClick={() => setIsRecording(!isRecording)}
                     className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-neutral-400 hover:text-primary shadow-lg border border-neutral-100'}`}
                   >
                     {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                   </button>
                   <button 
                     onClick={validateKnowledge}
                     disabled={isAnalyzing || !topic || !explanation}
                     className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-3"
                   >
                     {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                     {isAnalyzing ? "Analyzing Neural Flux..." : "Initialize Analysis"}
                   </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Results Sector */}
        <AnimatePresence>
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              {/* Mastery Score Card */}
              <div className="md:col-span-4">
                <Card className="p-10 bg-indigo-600 text-white rounded-[3.5rem] shadow-2xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10"><Brain className="w-24 h-24" /></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-white/60">Neural Mastery Score</p>
                   <div className="relative">
                      <svg className="w-48 h-48">
                         <circle className="text-white/10" strokeWidth="8" stroke="currentColor" fill="transparent" r="80" cx="96" cy="96" />
                         <circle 
                           className="text-white" 
                           strokeWidth="8" 
                           strokeDasharray={502.4} 
                           strokeDashoffset={502.4 - (502.4 * analysis.score) / 100} 
                           strokeLinecap="round" 
                           stroke="currentColor" 
                           fill="transparent" 
                           r="80" 
                           cx="96" 
                           cy="96" 
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-6xl font-black italic tracking-tighter">{analysis.score}</span>
                         <Badge className="bg-white/20 text-white border-none uppercase text-[9px] px-3 py-1 font-black">{analysis.status}</Badge>
                      </div>
                   </div>
                   <p className="mt-8 text-xs font-medium leading-relaxed opacity-80">{analysis.feedback}</p>
                </Card>
              </div>

              {/* Cognitive Breakdown */}
              <div className="md:col-span-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <h4 className="text-[11px] font-black text-ink uppercase tracking-widest">Neural Strengths</h4>
                       </div>
                       <div className="space-y-2">
                          {analysis.strengths.map((s: string, i: number) => (
                            <div key={i} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex gap-3 italic">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                               <p className="text-xs text-emerald-900 font-medium">{s}</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Gaps */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <h4 className="text-[11px] font-black text-ink uppercase tracking-widest">Cognitive Gaps</h4>
                       </div>
                       <div className="space-y-2">
                          {analysis.gaps.map((g: string, i: number) => (
                            <div key={i} className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex gap-3 italic">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                               <p className="text-xs text-rose-900 font-medium">{g}</p>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Focus Pack */}
                 <div className="p-8 bg-neutral-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Zap className="w-12 h-12 text-primary" /></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Neural Bridge Protocol</p>
                          <div className="space-y-2">
                             <h4 className="text-xl font-black italic tracking-tight">{analysis.followupQuestion}</h4>
                             <p className="text-xs text-white/40 font-medium">Think deeply. This question targets your neural gap: <span className="text-primary">{analysis.correctiveAction}</span></p>
                          </div>
                       </div>
                       <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-primary/20 shrink-0">
                          Deploy Mastery Session
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
