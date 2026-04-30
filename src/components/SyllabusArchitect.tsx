import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Sparkles, Calendar, Target, Clock, Upload, ChevronRight, CheckCircle2 } from "lucide-react";
import { doc, collection, writeBatch, serverTimestamp } from "firebase/firestore";
import { db, isDemoMode, handleFirestoreError } from "../lib/firebase";
import { useFirebase } from "../contexts/FirebaseContext";
import { getGeminiModel } from "../lib/gemini";
import { formatISTShortDate } from "../lib/utils";
import { Type } from "@google/genai";

interface RoadmapItem {
  week: string;
  topic: string;
  deadline?: string;
  priority: "High" | "Medium" | "Low";
}

interface RoadmapSummary {
  primaryFocus: string;
  totalTopics: number;
  criticalMilestones: number;
  estimatedWorkload: string;
}

export const SyllabusArchitect = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user } = useFirebase();
  const [syllabusText, setSyllabusText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [roadmap, setRoadmap] = useState<RoadmapItem[] | null>(null);
  const [summary, setSummary] = useState<RoadmapSummary | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const analysisSteps = [
    "Reading syllabus structure...",
    "Extracting weekly milestones...",
    "Identifying critical deadlines...",
    "Prioritizing high-impact topics...",
    "Finalizing your semester architecture..."
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(",")[1];
      setAttachedFile({
        name: file.name,
        type: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!syllabusText.trim() && !attachedFile) return;
    
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setRoadmap(null);
    setSummary(null);

    // Progress simulation
    const interval = setInterval(() => {
      setAnalysisStep(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1000);

    try {
      const parts: any[] = [
        { text: `You are an expert Academic Architect. Parse the provided syllabus and generate a structured academic roadmap.
        
        Rules:
        1. Extract all weekly topics, exam dates, and major deadlines.
        2. Assign a priority: "High" for exams/large projects, "Medium" for quizzes/labs, "Low" for standard weekly topics.
        3. Provide a summary object with high-level stats.
        4. Output MUST be a valid JSON object.
        
        Syllabus Content:
        ${syllabusText || "Analyze the attached file for milestones."}` }
      ];

      if (attachedFile) {
        parts.push({
          inlineData: {
            mimeType: attachedFile.type,
            data: attachedFile.data
          }
        });
      }

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });
      
      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    week: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    deadline: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                  },
                  required: ["week", "topic", "priority"]
                }
              },
              summary: {
                type: Type.OBJECT,
                properties: {
                  primaryFocus: { type: Type.STRING },
                  totalTopics: { type: Type.NUMBER },
                  criticalMilestones: { type: Type.NUMBER },
                  estimatedWorkload: { type: Type.STRING }
                },
                required: ["primaryFocus", "totalTopics", "criticalMilestones", "estimatedWorkload"]
              }
            },
            required: ["roadmap", "summary"]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      // Robust JSON extraction
      let cleanedText = text.trim();
      if (cleanedText.includes("```")) {
        const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) {
          cleanedText = match[1];
        }
      }

      const data = JSON.parse(cleanedText);
      if (data && Array.isArray(data.roadmap)) {
        setRoadmap(data.roadmap);
        setSummary(data.summary || {
          primaryFocus: "Syllabus Analysis",
          totalTopics: data.roadmap.length,
          criticalMilestones: data.roadmap.filter((r: any) => r.priority === "High").length,
          estimatedWorkload: "Standard"
        });
      } else {
        throw new Error("Invalid roadmap format");
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      if (isDemoMode) {
        setSummary({
          primaryFocus: "Advanced Academic Mastery",
          totalTopics: 12,
          criticalMilestones: 4,
          estimatedWorkload: "Intense (10-15 hrs/week)"
        });
        const demoRoadmap: RoadmapItem[] = [
          { week: "Week 1-2", topic: "Foundations & Core Principles", priority: "Medium", deadline: "Aug 30" },
          { week: "Week 3-5", topic: "Advanced Theories & Applications", priority: "High", deadline: "Sep 15" },
          { week: "Week 6", topic: "Mid-Term Examination Phase", priority: "High", deadline: "Oct 2" },
          { week: "Week 7-10", topic: "Case Studies & Group Projects", priority: "Medium", deadline: "Oct 25" },
          { week: "Week 11-15", topic: "Final Review & Certification", priority: "High", deadline: "Dec 10" }
        ];
        setRoadmap(demoRoadmap);
      } else {
        alert("Reo was unable to architect your syllabus. Please ensure the file is clear or try pasting the text instructions.");
      }
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const syncToPlanner = async () => {
    if (!roadmap || !user) return;
    
    if (isDemoMode) {
      alert("Roadmap successfully simulated in your Study Planner!");
      onNavigate("Planner");
      return;
    }

    setIsSyncing(true);
    try {
      const batch = writeBatch(db!);
      const tasksRef = collection(db!, "users", user.uid, "tasks");

      roadmap.forEach((item) => {
        const newTaskRef = doc(tasksRef);
        batch.set(newTaskRef, {
          title: `[Roadmap] ${item.topic}`,
          time: "09:00 AM",
          duration: "All Day",
          completed: false,
          subject: "Academic Roadmap",
          week: item.week,
          priority: item.priority,
          deadline: item.deadline || "TBD",
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        onNavigate("Planner");
      }, 1500);
    } catch (error) {
      console.error("Sync to Planner failed:", error);
      const firestoreError = handleFirestoreError(error, "write", `users/${user?.uid}/tasks`);
      alert(`Failed to sync roadmap: ${firestoreError}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-ink mb-2 tracking-tight">Syllabus Architect</h2>
          <p className="text-ink-muted font-light">Reo builds your entire semester roadmap in seconds.</p>
        </div>
        <div className="flex items-center gap-4 bg-indigo-600/10 px-6 py-3 rounded-2xl border border-indigo-600/20">
           <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
           </div>
           <p className="text-sm font-bold text-indigo-600">Reo AI Engine Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
            
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">Input Syllabus</h3>
            </div>

            <div className="space-y-4">
              <div className="relative group/upload">
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${attachedFile ? "bg-primary/5 border-primary/30" : "bg-neutral-50 border-neutral-200 group-hover/upload:border-primary/40 group-hover/upload:bg-primary/5"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg transition-transform group-hover/upload:scale-110 ${attachedFile ? "bg-primary text-white" : "bg-white text-ink-muted"}`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-ink">
                    {attachedFile ? attachedFile.name : "Upload Syllabus File"}
                  </p>
                  <p className="text-[10px] text-ink-muted mt-1 uppercase font-black">PDF, PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div className="relative">
                <textarea 
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste additional notes or raw text here... (e.g., 'Focus more on labs')"
                  className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 text-sm text-ink outline-none focus:ring-2 ring-primary/20 focus:border-primary transition-all resize-none font-light leading-relaxed"
                />
              </div>
            </div>

            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!syllabusText.trim() && !attachedFile)}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl ${
                isAnalyzing ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-primary text-white hover:scale-[1.02] shadow-primary/30"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                  Reo is Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My Roadmap
                </>
              )}
            </button>
          </div>

          <div className="glass p-8 rounded-[2.5rem] bg-indigo-50/30">
             <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-indigo-600" />
                <h4 className="font-bold text-ink">Architect's Tip</h4>
             </div>
             <p className="text-xs text-ink-muted leading-relaxed">
               For best results, include **exam dates**, **weekly topics**, and **grading weight**. Reo will prioritize items that impact your final grade most.
             </p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full min-h-[500px] glass rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-primary/5 border-primary/20"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <motion.div 
                    className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-ink tracking-tight mb-2">Architecting Roadmap</h3>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-primary font-bold text-sm animate-pulse">{analysisSteps[analysisStep]}</p>
                  <div className="w-48 h-1.5 bg-neutral-100 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : !roadmap ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[500px] glass rounded-[3rem] border-dashed border-neutral-300 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                  <Upload className="w-10 h-10 text-neutral-300" />
                </div>
                <h3 className="text-2xl font-bold text-ink/30 italic">No Roadmap Generated Yet</h3>
                <p className="text-neutral-400 text-sm max-w-sm mt-2">Paste your syllabus content on the left and let Reo handle the organization.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Summary Header */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass p-6 rounded-3xl bg-primary/5 border-primary/10">
                      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">Primary Focus</p>
                      <p className="font-bold text-ink truncate">{summary.primaryFocus}</p>
                    </div>
                    <div className="glass p-6 rounded-3xl bg-indigo-500/5 border-indigo-500/10">
                      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">Total Milestones</p>
                      <p className="flex items-center gap-2 font-bold text-ink">
                        <Target className="w-4 h-4 text-indigo-500" /> {summary.totalTopics}
                      </p>
                    </div>
                    <div className="glass p-6 rounded-3xl bg-amber-500/5 border-amber-500/10">
                      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">Critical Deadlines</p>
                      <p className="flex items-center gap-2 font-bold text-ink">
                        <Clock className="w-4 h-4 text-amber-500" /> {summary.criticalMilestones}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
                      <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">Architecture Health</p>
                      <p className="text-xl font-black italic">OPTIMAL</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-bold text-ink">Academic Roadmap</h3>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[8px] font-black uppercase text-ink-muted leading-none">Architectural Coverage</span>
                          <div className="w-32 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{ width: '100%' }} />
                          </div>
                       </div>
                       <button 
                         onClick={syncToPlanner}
                         disabled={isSyncing || syncSuccess}
                         className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${
                           syncSuccess 
                             ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                             : "bg-primary text-white shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                         }`}
                       >
                         {isSyncing ? (
                           <>
                             <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                             Syncing...
                           </>
                         ) : syncSuccess ? (
                           <>
                             <CheckCircle2 className="w-3 h-3" />
                             Synced!
                           </>
                         ) : (
                           "Sync to Planner"
                         )}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {roadmap.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass p-6 rounded-[2rem] border-white/60 hover:border-primary/30 transition-all group hover:shadow-xl shadow-primary/5"
                      >
                        <div className="flex gap-6 items-start">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-neutral-50 flex flex-col items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                            <span className="text-[8px] font-black uppercase text-ink-muted group-hover:text-primary mb-1">Week</span>
                            <span className="text-xl font-black text-ink group-hover:text-primary">{item.week.replace(/\D/g,'') || (i+1)}</span>
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-ink group-hover:text-primary transition-colors truncate">{item.topic}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                item.priority === "High" ? "bg-red-500/10 text-red-500" :
                                item.priority === "Medium" ? "bg-amber-500/10 text-amber-500" :
                                "bg-emerald-500/10 text-emerald-500"
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              {item.deadline && (
                                <div className="flex items-center gap-2 text-[10px] font-bold text-ink-muted">
                                  <Clock className="w-3.5 h-3.5" /> {item.deadline}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[10px] font-bold text-ink-muted">
                                <Calendar className="w-3.5 h-3.5" /> {formatISTShortDate()}
                              </div>
                            </div>
                          </div>
                          <button className="self-center p-3 rounded-xl hover:bg-neutral-100 text-neutral-300 hover:text-primary transition-all">
                            <CheckCircle2 className="w-6 h-6" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
