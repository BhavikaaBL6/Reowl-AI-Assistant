import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Zap, 
  Lightbulb, 
  Search, 
  Brain, 
  GraduationCap, 
  Loader2, 
  Clipboard, 
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  BookOpen
} from "lucide-react";
import { getGeminiModel } from "../lib/gemini";
import { useFirebase } from "../contexts/FirebaseContext";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, isDemoMode } from "../lib/firebase";

interface Analogy {
  beginner: string;
  intermediate: string;
  advanced: string;
}

interface ScriptContent {
  engagementHooks: string[];
  neuralCheckpoints: string[];
  analogies: Analogy;
}

interface LessonScript {
  id?: string;
  topic: string;
  content: ScriptContent;
  createdAt: any;
}

export const LessonScriptGenerator = () => {
  const { user } = useFirebase();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptContent | null>(null);
  const [savedScripts, setSavedScripts] = useState<LessonScript[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Load saved scripts
  React.useEffect(() => {
    if (!user || isDemoMode) return;
    const q = query(
      collection(db!, "users", user.uid, "lessonScripts"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSavedScripts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonScript)));
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/lessonScripts`);
    });
    return () => unsubscribe();
  }, [user]);

  const generateScript = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setGeneratedScript(null);

    try {
      const model = getGeminiModel({ model: "gemini-3-flash-preview" });
      const prompt = `Generate a neuro-scientifically grounded lesson script for the topic: "${topic}".
      Include:
      1. 3 Engagement Hooks: Mind-blowing facts or questions to grab attention.
      2. 3 Neural Checkpoints: Specific moments to stop and ask a "Reo-Quiz" question (active recall checkpoint).
      3. 3 Analogies: 3 different simplified analogies for different learning levels (Beginner, Intermediate, Advanced).`;

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              engagementHooks: { type: "ARRAY", items: { type: "STRING" } },
              neuralCheckpoints: { type: "ARRAY", items: { type: "STRING" } },
              analogies: {
                type: "OBJECT",
                properties: {
                  beginner: { type: "STRING" },
                  intermediate: { type: "STRING" },
                  advanced: { type: "STRING" }
                },
                required: ["beginner", "intermediate", "advanced"]
              }
            },
            required: ["engagementHooks", "neuralCheckpoints", "analogies"]
          }
        }
      });

      const content = JSON.parse(response.text);
      setGeneratedScript(content);
    } catch (error) {
      console.error("Failed to generate script:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveScript = async () => {
    if (!generatedScript || !user || !topic) return;
    
    if (isDemoMode) {
      const demoId = Math.random().toString(36).substring(7);
      const newScript: LessonScript = {
        id: demoId,
        topic,
        content: generatedScript,
        createdAt: new Date()
      };
      setSavedScripts(prev => [newScript, ...prev]);
      setGeneratedScript(null);
      setTopic("");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db!, "users", user.uid, "lessonScripts"), {
        userId: user.uid,
        topic,
        content: generatedScript,
        createdAt: serverTimestamp()
      });
      setGeneratedScript(null);
      setTopic("");
    } catch (error) {
      handleFirestoreError(error, 'write' as any, `users/${user.uid}/lessonScripts`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteScript = async (id: string) => {
    if (!user) return;
    
    if (isDemoMode) {
      setSavedScripts(prev => prev.filter(s => s.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db!, "users", user.uid, "lessonScripts", id));
    } catch (error) {
      handleFirestoreError(error, 'delete' as any, `users/${user.uid}/lessonScripts`);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-ink tracking-tight">Lesson Script Gen-Engine</h2>
          <p className="text-ink-muted font-light">Generate neuro-optimized lesson plans for maximum student engagement.</p>
        </div>
        <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border-white/60">
           <Zap className="w-5 h-5 text-indigo-600" />
           <span className="text-sm font-bold text-ink italic">Powered by Reo Neural AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-ink">Engine Input</h3>
              </div>
              <p className="text-xs text-ink-muted font-medium leading-relaxed">
                Enter your lesson topic. Reowl will analyze its complexity and generate hooks, analogies, and checkpoints.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generateScript()}
                  placeholder="e.g. Quantum Entanglement"
                  className="w-full bg-white/50 border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-200 transition-all"
                />
              </div>
              <button 
                disabled={!topic.trim() || isGenerating}
                onClick={generateScript}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? "Igniting Engine..." : "Generate Script"}
              </button>
            </div>
          </div>

          {/* Saved Scripts Preview */}
          <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-ink flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Vault
                </h3>
             </div>
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {savedScripts.map(script => (
                  <div key={script.id} className="p-4 rounded-2xl bg-white/40 border border-white hover:border-indigo-100 group transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-ink text-sm truncate pr-4">{script.topic}</h4>
                       <button onClick={() => deleteScript(script.id!)} className="p-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <button 
                      onClick={() => setGeneratedScript(script.content)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      View Script
                    </button>
                  </div>
                ))}
                {savedScripts.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-neutral-100 rounded-3xl">
                     <p className="text-xs font-bold text-ink-muted italic">No scripts saved yet.</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-8 flex flex-col">
          <AnimatePresence mode="wait">
            {generatedScript ? (
              <motion.div 
                key="script-output"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass p-10 rounded-[3rem] border-white/60 shadow-2xl space-y-12 bg-white/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-ink">{topic}</h3>
                      <p className="text-sm text-ink-muted">AI-Optimized Lesson Script</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={saveScript}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save to Vault
                    </button>
                  </div>
                </div>

                <div className="space-y-12">
                  {/* Engagement Hooks */}
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Engagement Hooks
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(generatedScript.engagementHooks.join("\n"), "hooks")}
                        className="text-[10px] font-bold text-ink-muted hover:text-indigo-600 transition-colors flex items-center gap-2"
                      >
                        {copiedSection === "hooks" ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                        {copiedSection === "hooks" ? "Copied!" : "Copy Section"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {generatedScript.engagementHooks.map((hook, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 relative group overflow-hidden">
                          <span className="absolute top-4 right-4 text-4xl font-black text-indigo-100 select-none group-hover:scale-110 group-hover:text-indigo-200 transition-all">{i + 1}</span>
                          <p className="text-sm font-medium text-ink leading-relaxed relative z-10 italic">
                             "{hook}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Neural Checkpoints */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-[0.3em] flex items-center gap-2">
                      <Brain className="w-4 h-4" /> Neural Checkpoints
                    </h4>
                    <div className="space-y-4">
                      {generatedScript.neuralCheckpoints.map((cp, i) => (
                        <div key={i} className="flex items-start gap-6 p-6 rounded-[2rem] bg-amber-50/50 border border-amber-100 group">
                           <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0 border-4 border-amber-50">
                              {i+1}
                           </div>
                           <p className="text-sm font-bold text-ink leading-relaxed group-hover:translate-x-2 transition-transform">
                              {cp}
                           </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Analogies */}
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.3em] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Multi-Level Analogies
                    </h4>
                    <div className="grid grid-cols-1 gap-6">
                      {[
                        { level: "Beginner", content: generatedScript.analogies.beginner, color: "emerald" },
                        { level: "Intermediate", content: generatedScript.analogies.intermediate, color: "blue" },
                        { level: "Advanced", content: generatedScript.analogies.advanced, color: "purple" }
                      ].map((ana, i) => (
                        <div key={i} className={`p-8 rounded-[2.5rem] bg-${ana.color}-50/50 border border-${ana.color}-100 flex flex-col md:flex-row gap-8 items-start`}>
                          <div className={`px-4 py-2 rounded-xl bg-white border border-${ana.color}-200 text-${ana.color}-600 font-black text-[10px] uppercase tracking-widest`}>
                             {ana.level}
                          </div>
                          <p className="text-sm text-ink-muted font-medium leading-relaxed italic">
                             "{ana.content}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-8"
              >
                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center text-indigo-100 relative">
                   <Zap className="w-12 h-12" />
                   <motion.div 
                     animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                     transition={{ duration: 4, repeat: Infinity }}
                     className="absolute inset-0 rounded-[2.5rem] bg-indigo-600 blur-2xl"
                   />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-ink">Engine Idle</h3>
                   <p className="text-sm font-medium text-ink-muted max-w-sm">Enter a topic on the left to start the neuro-generation engine.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                   {["Quantum Entanglement", "Cell Mitosis", "French Revolution", "Python Decorators"].map(tag => (
                     <button 
                       key={tag}
                       onClick={() => setTopic(tag)}
                       className="px-4 py-2 bg-white/50 border border-neutral-100 rounded-xl text-[10px] font-bold text-ink-muted hover:bg-white hover:text-indigo-600 transition-all"
                     >
                       {tag}
                     </button>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
