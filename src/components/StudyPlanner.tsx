/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db, isDemoMode, handleFirestoreError } from "../lib/firebase";
import { useFirebase } from "../contexts/FirebaseContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Plus, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Target,
  Zap,
  Loader2,
  ClipboardList,
  ShieldCheck,
  Brain,
  X,
  Shield
} from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { formatISTDate, formatISTTime } from "../lib/utils";
import { getGeminiModel } from "../lib/gemini";

import { calculateBurnoutRisk, type BurnoutMetrics } from "../lib/metrics";
import { BurnoutMeter } from "./BurnoutMeter";

export const StudyPlanner = () => {
  const { user } = useFirebase();
  const [localTasks, setLocalTasks] = useState<any[]>([]);
  const [burnoutMetrics, setBurnoutMetrics] = useState<BurnoutMetrics | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // AI Verification State
  const [verifyingTask, setVerifyingTask] = useState<any | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [vError, setVError] = useState("");

  useEffect(() => {
    if (!user || isDemoMode) {
      if (isDemoMode) {
        const demoTasks = [
          { id: '1', title: 'Calculus Assignment', time: formatISTTime(new Date(new Date().setHours(9, 0))), duration: '2h', completed: false, priority: 'High' as const, subject: 'Math', createdAt: new Date(), verified: false },
          { id: '2', title: 'Chemistry Lab Report', time: formatISTTime(new Date(new Date().setHours(14, 0))), duration: '1.5h', completed: true, priority: 'Medium' as const, subject: 'Science', createdAt: new Date(), verified: true },
          { id: '3', title: 'English Essay', time: formatISTTime(new Date(new Date().setHours(16, 0))), duration: '1h', completed: false, priority: 'Low' as const, subject: 'English', createdAt: new Date(), verified: false }
        ];
        setLocalTasks(demoTasks);
        setBurnoutMetrics(calculateBurnoutRisk(demoTasks));
      }
      setIsInitialLoading(false);
      return;
    }
    setIsInitialLoading(true);

    const q = query(
      collection(db!, "users", user.uid, "tasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as any);
      setLocalTasks(tasksData);
      setBurnoutMetrics(calculateBurnoutRisk(tasksData as any[]));
      setIsInitialLoading(false);
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/tasks`);
      setIsInitialLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleVerify = async () => {
    if (!verificationInput.trim() || !verifyingTask) return;
    
    setIsVerifying(true);
    setVError("");

    try {
      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `
          You are an Academic Integrity Auditor. 
          A student claims they completed a task: "${verifyingTask.title}" (${verifyingTask.subject}).
          They provide this summary: "${verificationInput}"
          
          Is this a meaningful synthesis of learning related to the topic? 
          If it's just "I did it", "DONE", "gibberish", or unrelated, reject it.
          Return ONLY a JSON object: {"valid": boolean, "feedback": "brief message"}.
        ` }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      
      if (data.valid) {
        await completeTask(verifyingTask.id, true);
        setVerifyingTask(null);
        setVerificationInput("");
      } else {
        setVError(data.feedback || "Your summary didn't demonstrate learning. Try to be more specific.");
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setVError("Reo had trouble auditing. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const completeTask = async (taskId: string, verified: boolean) => {
    if (!user) return;
    if (isDemoMode) {
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, verified } : t));
      return;
    }
    try {
      const taskRef = doc(db!, "users", user.uid, "tasks", taskId);
      await updateDoc(taskRef, {
        completed: true,
        verified,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!user && !isDemoMode) return;
    
    // If we are uncompleting, just do it
    if (currentStatus) {
      if (isDemoMode) {
        setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false, verified: false } : t));
        return;
      }
      const taskRef = doc(db!, "users", user.uid, "tasks", taskId);
      await updateDoc(taskRef, { 
        completed: false, 
        verified: false,
        updatedAt: serverTimestamp()
      });
      return;
    }

    // If starting completion, check if needs verification
    const task = localTasks.find(t => t.id === taskId);
    if (task && (task.priority === 'High' || task.priority === 'Medium')) {
      setVerifyingTask(task);
      return;
    }

    // Low priority tasks don't need AI check
    await completeTask(taskId, false);
  };

  const addNewTask = async () => {
    if (!user && !isDemoMode) return;
    if (isDemoMode) {
      setLocalTasks(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        title: "New Study Session (Demo)",
        time: formatISTTime(new Date(new Date().setHours(10, 0))),
        duration: "1h 00m",
        completed: false,
        subject: "General",
        priority: 'Low' as const,
        verified: false,
        createdAt: new Date()
      }, ...prev]);
      return;
    }
    setIsAdding(true);
    try {
      await addDoc(collection(db!, "users", user.uid, "tasks"), {
        userId: user.uid,
        title: "New Study Session",
        time: "TBD",
        duration: "1h 00m",
        completed: false,
        subject: "General",
        priority: 'Low',
        verified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-4xl font-bold text-ink tracking-tight">Study Planner</h2>
          <p className="text-ink-muted font-light mt-1">Plan your day to achieve your academic goals.</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={addNewTask}
            disabled={isAdding}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Adding..." : "Add Task"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/20 bg-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink">Daily Schedule</h3>
                   <p className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">{formatISTDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/40 text-ink-muted"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-xs font-bold text-ink px-2">Today</span>
                <button className="p-2 rounded-lg hover:bg-white/40 text-ink-muted"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {localTasks.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                   <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/40">
                      <ClipboardList className="w-8 h-8" />
                   </div>
                   <p className="text-sm font-bold text-ink-muted uppercase tracking-widest">No tasks scheduled for today</p>
                </div>
              ) : localTasks.map((task) => (
                  <motion.div 
                  key={task.id}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/50 transition-all group"
                >
                  <div className="text-right w-20 shrink-0">
                    <p className="text-sm font-bold text-ink">{task.time}</p>
                    <p className="text-[10px] text-ink-muted">{task.duration}</p>
                  </div>
                  <div className="h-10 w-[2px] bg-neutral-200 group-hover:bg-primary transition-colors" />
                  <div className="flex-1 flex items-center justify-between">
                    <div onClick={() => toggleTask(task.id, task.completed)} className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`font-bold text-sm ${task.completed ? "text-ink-muted line-through" : "text-ink"}`}>
                          {task.title}
                        </h4>
                        {task.verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                          {task.subject}
                        </span>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-neutral-100 text-neutral-400'
                        }`}>
                          {task.priority || 'Low'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`p-2 rounded-full transition-colors ${task.completed ? "text-primary bg-primary/10" : "text-neutral-300 hover:text-primary hover:bg-primary/5"}`}
                    >
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Weekly Overview Mockup */}
          <Card className="flex items-center justify-between">
             <div className="space-y-1">
               <h3 className="font-bold text-ink">Weekly Performance</h3>
               <p className="text-xs text-ink-muted">You've completed 85% of your goals this week!</p>
             </div>
             <div className="flex gap-2">
                {[70, 90, 85, 95, 80, 100, 75].map((h, i) => (
                  <div key={i} className="w-3 h-12 bg-white/40 rounded-full relative overflow-hidden ring-1 ring-white/20">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      className="absolute bottom-0 w-full bg-primary rounded-full"
                    />
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Side Stats */}
        <div className="space-y-8">
          {burnoutMetrics && (
            <Card className={`p-8 border-none shadow-3xl shadow-black/20 relative overflow-hidden text-white transition-all duration-500 ${
              burnoutMetrics.status === 'burnout_risk' 
                ? 'bg-gradient-to-br from-red-600 via-rose-600 to-orange-600' 
                : burnoutMetrics.status === 'strained' 
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600' 
                  : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600'
            }`}>
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-14 h-14 bg-white/25 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center shadow-inner">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight leading-none">Biometric Load</h3>
                  <p className="text-[10px] opacity-90 uppercase font-black tracking-[0.2em] mt-1.5">{burnoutMetrics.message}</p>
                </div>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Cognitive Pressure</span>
                    <span className="text-2xl font-black font-mono leading-none">{Math.round(burnoutMetrics.score)}%</span>
                  </div>
                  <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden shadow-inner p-0.5 border border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${burnoutMetrics.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                   <p className="text-xs font-bold leading-relaxed">{burnoutMetrics.recommendation}</p>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-indigo-600 via-primary to-purple-700 text-white border-none shadow-2xl shadow-primary/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse group-hover:bg-white/30 transition-all" />
            <Zap className="w-12 h-12 text-white/30 mb-4" />
            <h3 className="text-2xl font-bold mb-1">Focus Mode</h3>
            <p className="text-white/70 text-sm mb-6 font-light">Boost your productivity with timed focus sessions.</p>
            <button className="w-full py-3 bg-white text-primary font-bold rounded-2xl hover:bg-white/60 transition-colors shadow-lg shadow-white/10">
              Start Session
            </button>
          </Card>

          <Card className="space-y-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-ink">Goals</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Daily Reading", p: 75 },
                { label: "Quiz Practice", p: 40 },
                { label: "Lab Preparation", p: 90 }
              ].map((goal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-ink">{goal.label}</span>
                    <span className="text-primary">{goal.p}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden border border-white/40 shadow-sm">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.p}%` }}
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden relative">
             <img src="https://picsum.photos/seed/study/400/250" className="w-full h-32 object-cover opacity-50" referrerPolicy="no-referrer" />
             <div className="p-6">
               <h4 className="font-bold text-ink mb-2">Did you know?</h4>
               <p className="text-xs text-ink-muted leading-relaxed">Spaced repetition can significantly improve long-term retention of complex academic subjects.</p>
             </div>
          </Card>
        </div>
      </div>

      {/* AI Verification Modal */}
      <AnimatePresence>
        {verifyingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-3xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ink italic">Academic Audit</h3>
                    <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Verifying "{verifyingTask.title}"</p>
                  </div>
                </div>
                <button onClick={() => setVerifyingTask(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-ink">Reo's Mastery Challenge</span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed italic">
                    To maintain your integrity streak, please provide a **one-sentence synthesis** of the most important concept you learned or applied during this task.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-ink-muted tracking-[0.2em] ml-2">Your Synthesis</label>
                  <textarea 
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    placeholder="e.g. Learned how specific heat capacity influences thermodynamic equilibrium in closed systems..."
                    className="w-full h-32 rounded-3xl bg-neutral-50 p-6 text-sm font-medium border-2 border-transparent focus:border-primary/30 focus:bg-white transition-all resize-none outline-none"
                  />
                  {vError && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-bold text-red-500 px-4"
                    >
                      {vError}
                    </motion.p>
                  )}
                </div>

                <button 
                  onClick={handleVerify}
                  disabled={isVerifying || !verificationInput.trim()}
                  className="w-full py-5 bg-ink text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Completion"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
