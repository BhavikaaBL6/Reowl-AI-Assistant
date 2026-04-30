/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Brain,
  Loader2,
  Bell,
  AlertCircle,
  Users,
  Compass
} from "lucide-react";
import { collection, query, onSnapshot, orderBy, where, limit } from "firebase/firestore";
import { db, isDemoMode, handleFirestoreError } from "../lib/firebase";
import { getGeminiModel } from "../lib/gemini";
import { useFirebase } from "../contexts/FirebaseContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatISTDate, formatISTTime } from "../lib/utils";
import { calculateBurnoutRisk, BurnoutMetrics } from "../lib/metrics";
import { BurnoutMeter } from "./BurnoutMeter";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <Card className="flex items-center gap-6 group hover:scale-[1.02] transition-all">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color}`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] uppercase font-black tracking-widest text-ink-muted">{label}</p>
      <div className="flex items-end gap-2">
        <h4 className="text-2xl font-black text-ink leading-none">{value}</h4>
        {trend && (
          <span className="text-[10px] font-bold text-green-500 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5" /> {trend}
          </span>
        )}
      </div>
    </div>
  </Card>
);

export const Home = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user, profile } = useFirebase();
  const { preset } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [burnoutMetrics, setBurnoutMetrics] = useState<BurnoutMetrics | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<any>(null);
  const [latestResource, setLatestResource] = useState<any>(null);
  const [academicInsight, setAcademicInsight] = useState<string>("Reo is analyzing your performance...");
  const [recommendation, setRecommendation] = useState<{ text: string, link: string }>({ text: "Review your latest module", link: "Notes" });
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
  const sharedUnsubscribes = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!user || isDemoMode || profile?.role !== "student") return;

    const classesQuery = query(
      collection(db!, "classrooms"),
      where("studentIds", "array-contains", user.uid)
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      // Clear existing sub-listeners
      sharedUnsubscribes.current.forEach(u => u());
      sharedUnsubscribes.current = [];

      const classIds = snapshot.docs.map(doc => doc.id);
      
      classIds.forEach(classId => {
        const sharedQuery = query(
          collection(db!, "classrooms", classId, "sharedResources"),
          where("studentIds", "array-contains", user.uid),
          orderBy("sharedAt", "desc"),
          limit(3)
        );
        
        const unsub = onSnapshot(sharedQuery, (resSnap) => {
          const resData = resSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
          }));
          
          setSharedResources(prev => {
            const filtered = prev.filter(p => !resData.find(r => r.id === p.id));
            return [...filtered, ...resData].sort((a, b) => {
              const dateA = a.sharedAt?.toDate() || new Date(0);
              const dateB = b.sharedAt?.toDate() || new Date(0);
              return dateB.getTime() - dateA.getTime();
            }).slice(0, 5);
          });
        }, (error) => {
          handleFirestoreError(error, "list" as any, `classrooms/${classId}/sharedResources`);
        });
        sharedUnsubscribes.current.push(unsub);
      });
    }, (error) => {
      console.error("Error fetching classrooms:", error);
    });

    return () => {
      unsubscribeClasses();
      sharedUnsubscribes.current.forEach(u => u());
      sharedUnsubscribes.current = [];
    };
  }, [user, profile]);

  const studentSubjects = profile?.subjects || ["Quantum Mechanics", "Neural Biology", "Organic Chemistry"];

  const facts: Record<string, string[]> = {
    "Physics": [
      "At the speed of light, time actually stops relative to the observer.",
      "Neutron stars are so dense that a teaspoon of their material would weigh a billion tons.",
      "The universe is expanding at a rate of about 73 kilometers per second per megaparsec.",
      "Light takes 8 minutes and 20 seconds to travel from the Sun to Earth."
    ],
    "Quantum Mechanics": [
      "Particles can exist in two places at once until they are observed (Superposition).",
      "Quantum entanglement allows particles to communicate instantaneously across any distance.",
      "Teleportation is theoretically possible for quantum information, not yet for humans.",
      "The vacuum of space is actually filled with 'virtual particles' that pop in and out of existence."
    ],
    "Biology": [
      "The human brain uses about 20% of the body's total energy despite only being 2% of the weight.",
      "DNA is so thin that if you uncoiled all the DNA in your body, it would reach Pluto and back.",
      "There are more bacterial cells in your body than there are human cells.",
      "Octopuses have three hearts and blue blood."
    ],
    "Neural Biology": [
      "Synaptic pruning happens more during sleep, literally cleaning your brain's connections.",
      "Information travels along nerves at speeds up to 400 km/h (250 mph).",
      "The brain cannot feel pain itself; it lacks pain-sensing nerves.",
      "Your brain generates enough electricity to power a small light bulb."
    ],
    "Chemistry": [
      "A diamond is an octahedron of carbon atoms, while graphite is layers of hexagons.",
      "There is about 0.2mg of gold in the average human body.",
      "Glass is actually a solid that behaves like a liquid (amorphous solid).",
      "Hydrofluoric acid is so reactive it will dissolve glass but can be stored in plastic."
    ],
    "Organic Chemistry": [
      "Carbon is the 'duct tape' of life because it can form four incredibly stable bonds.",
      "A single drop of oil can spread to cover an entire acre of water surface.",
      "Aspirin was originally derived from the bark of various species of willow trees.",
      "Wait until you learn about Chirality—molecules that are mirror images can have totally different effects."
    ],
    "Math": [
      "A 'googol' is the number 1 followed by 100 zeros.",
      "If you shuffle a deck of cards, the resulting order has likely never existed before in history.",
      "The Fibonacci sequence is found everywhere in nature, from pinecones to galaxies.",
      "Prime numbers are the 'atoms' of mathematics; every number is made of them."
    ],
    "History": [
      "The Great Wall of China is not actually visible from space with the naked eye.",
      "Cleopatra lived closer to the moon landing than to the building of the Great Pyramids.",
      "The shortest war in history (Anglo-Zanzibar) lasted just 38 minutes.",
      "Ancient Romans used human urine as a mouthwash because the ammonia killed bacteria."
    ],
    "Economics": [
      "The first paper money was used by the Chinese in the 7th century.",
      "Inflation can be so high that people need wheelbarrows of cash to buy a loaf of bread.",
      "The world's first central bank was established in Sweden in 1668.",
      "Bitcoin's creator, Satoshi Nakamoto, is still anonymous and owns roughly 1.1M BTC."
    ],
    "Data Science": [
      "90% of the world's data was generated in just the last two years.",
      "By 2025, it's estimated that 463 exabytes of data will be created each day globaly.",
      "A human brain has a storage capacity of roughly 2.5 petabytes.",
      "The first hard drive in 1956 weighed over a ton and held only 5 megabytes."
    ]
  };

  const getDailyFact = () => {
    const today = new Date();
    const daySeed = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate();
    
    // Flatten possible facts from choices
    const availableFacts: { subject: string, fact: string }[] = [];
    studentSubjects.forEach(sub => {
      if (facts[sub]) {
        facts[sub].forEach(f => availableFacts.push({ subject: sub, fact: f }));
      }
    });

    // Fallback if no subject matches
    if (availableFacts.length === 0) {
      Object.keys(facts).forEach(sub => {
         facts[sub].forEach(f => availableFacts.push({ subject: sub, fact: f }));
      });
    }

    const index = daySeed % availableFacts.length;
    return availableFacts[index];
  };

  const dailyFact = getDailyFact();

  const getThemeColors = () => {
    const config: Record<string, any> = {
      blue: {
        from: "from-blue-100", via: "via-indigo-50", to: "to-blue-200", border: "border-blue-300",
        btn: "from-blue-600 to-indigo-700", icon: "from-blue-500 to-indigo-600",
        text: "from-blue-800 to-indigo-700", sub: "text-blue-800/80 bg-blue-200/60",
        p: "text-blue-900/70", pulse: "bg-blue-600", iconBg: "bg-blue-200", shadow: "shadow-blue-500/10", hover: "hover:shadow-blue-500/20"
      },
      purple: {
        from: "from-purple-100", via: "via-fuchsia-50", to: "to-purple-200", border: "border-purple-300",
        btn: "from-purple-600 to-fuchsia-700", icon: "from-purple-500 to-fuchsia-600",
        text: "from-purple-800 to-fuchsia-700", sub: "text-purple-800/80 bg-purple-200/60",
        p: "text-purple-900/70", pulse: "bg-purple-600", iconBg: "bg-purple-200", shadow: "shadow-purple-500/10", hover: "hover:shadow-purple-500/20"
      },
      green: {
        from: "from-emerald-100", via: "via-teal-50", to: "to-emerald-200", border: "border-emerald-300",
        btn: "from-emerald-600 to-teal-700", icon: "from-emerald-500 to-teal-600",
        text: "from-emerald-800 to-teal-700", sub: "text-emerald-800/80 bg-emerald-200/60",
        p: "text-emerald-900/70", pulse: "bg-emerald-600", iconBg: "bg-emerald-200", shadow: "shadow-emerald-500/10", hover: "hover:shadow-emerald-500/20"
      },
      teal: {
        from: "from-teal-100", via: "via-cyan-50", to: "to-teal-200", border: "border-teal-300",
        btn: "from-teal-600 to-cyan-700", icon: "from-teal-500 to-cyan-600",
        text: "from-teal-800 to-cyan-700", sub: "text-teal-800/80 bg-teal-200/60",
        p: "text-teal-900/70", pulse: "bg-teal-600", iconBg: "bg-teal-200", shadow: "shadow-teal-500/10", hover: "hover:shadow-teal-500/20"
      },
      indigo: {
        from: "from-indigo-100", via: "via-blue-50", to: "to-indigo-200", border: "border-indigo-300",
        btn: "from-indigo-600 to-blue-700", icon: "from-indigo-500 to-blue-600",
        text: "from-indigo-800 to-blue-700", sub: "text-indigo-800/80 bg-indigo-200/60",
        p: "text-indigo-900/70", pulse: "bg-indigo-600", iconBg: "bg-indigo-200", shadow: "shadow-indigo-500/10", hover: "hover:shadow-indigo-500/20"
      },
      rose: {
        from: "from-rose-100", via: "via-pink-50", to: "to-rose-200", border: "border-rose-300",
        btn: "from-rose-600 to-pink-700", icon: "from-rose-500 to-pink-600",
        text: "from-rose-800 to-pink-700", sub: "text-rose-800/80 bg-rose-200/60",
        p: "text-rose-900/70", pulse: "bg-rose-600", iconBg: "bg-rose-200", shadow: "shadow-rose-500/10", hover: "hover:shadow-rose-500/20"
      },
      amber: {
        from: "from-amber-100", via: "via-orange-50", to: "to-amber-200", border: "border-amber-300",
        btn: "from-amber-600 to-orange-700", icon: "from-amber-500 to-orange-600",
        text: "from-amber-800 to-orange-700", sub: "text-amber-800/80 bg-amber-200/60",
        p: "text-amber-900/70", pulse: "bg-amber-600", iconBg: "bg-amber-200", shadow: "shadow-amber-500/10", hover: "hover:shadow-amber-500/20"
      }
    };
    return config[preset] || config.blue;
  };

  const colors = getThemeColors();

  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      const demoTasks = [
        { id: "t1", title: "Linear Algebra Homework", priority: 'High' as const, completed: false, createdAt: new Date() },
        { id: "t2", title: "Macroeconomics Reading", priority: 'Medium' as const, completed: false, createdAt: new Date() },
        { id: "t3", title: "Chemistry Lab Report", priority: 'High' as const, completed: true, createdAt: new Date() },
        { id: "t4", title: "History Essay Draft", priority: 'Low' as const, completed: false, createdAt: new Date() }
      ];
      setTasks(demoTasks);
      setQuizzes([
        { id: "q1", title: "Quantum Mechanics Fundamentals", questions: [1, 2, 3] },
        { id: "q2", title: "Cell Structure & Function", questions: [1, 2, 3, 4] }
      ]);
      setAttempts([
        { quizId: "q1", studentId: user.uid, percentage: 96 }
      ]);
      setLatestAttempt({ quizId: "q1", quizTitle: "Quantum Mechanics Fundamentals", percentage: 96 });
      setBurnoutMetrics(calculateBurnoutRisk(demoTasks.map(t => ({ priority: t.priority, completed: t.completed }))));
      return;
    }

    const qTasks = query(
      collection(db!, "users", user.uid, "tasks"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTasks(tasksData);
      setBurnoutMetrics(calculateBurnoutRisk(tasksData.map((t: any) => ({
        priority: t.priority || 'Medium',
        completed: t.completed || false
      }))));
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/tasks`);
    });

    const qQuizzes = query(
      collection(db!, "quizzes"), 
      where("visibility", "==", "public"),
      orderBy("publishedAt", "desc")
    );
    const unsubscribeQuizzes = onSnapshot(qQuizzes, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, "list" as any, "quizzes");
    });

    const qAttempts = query(
      collection(db!, "quiz_attempts"),
      where("studentId", "==", user.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribeAttempts = onSnapshot(qAttempts, (snapshot) => {
      const attemptsData = snapshot.docs.map(doc => doc.data());
      setAttempts(attemptsData);
      if (!snapshot.empty) {
        setLatestAttempt(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, "list" as any, "quiz_attempts");
    });

    return () => {
      unsubscribeTasks();
      unsubscribeQuizzes();
      unsubscribeAttempts();
    };
  }, [user]);

  useEffect(() => {
    if (!user || isDemoMode) return;

    const qResources = query(
      collection(db!, "users", user.uid, "resources"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribeResources = onSnapshot(qResources, (snapshot) => {
      if (!snapshot.empty) {
        setLatestResource({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/resources`);
    });

    return () => unsubscribeResources();
  }, [user]);

  useEffect(() => {
    if (!user || isDemoMode) {
      if (isDemoMode) {
        setAcademicInsight("Based on your recent scores in Thermodynamics, focus on Entropy concepts today. You're consistently missing details in heat engine cycles.");
        setRecommendation({ text: "Practice Heat Engine Quizzes", link: "Quizzes" });
      }
      return;
    }

    const generateInsight = async () => {
      if (isGeneratingInsight) return;
      
      setIsGeneratingInsight(true);
      try {
        const model = getGeminiModel();
        const performanceSummary = {
          quizzes: attempts.slice(0, 5).map(a => ({ title: a.quizTitle, score: a.percentage })),
          tasks: tasks.slice(0, 5).map(t => ({ title: t.title, completed: t.completed, priority: t.priority })),
          subjects: studentSubjects
        };

        const prompt = `You are Reo, an AI academic advisor. Use this student performance data:
        Quizzes: ${JSON.stringify(performanceSummary.quizzes)}
        Tasks: ${JSON.stringify(performanceSummary.tasks)}
        Major Subjects: ${performanceSummary.subjects.join(", ")}

        Provide:
        1. ONE short, impactful, and SPECIFIC academic insight (max 2 sentences).
        2. A SPECIFIC "next-step" recommendation (one sentence) and which app module it relates to (one of: "Planner", "Quizzes", "Resources", "Notes", "AI Chat", "Syllabus").

        Respond ONLY in JSON format:
        {
          "insight": "the insight text",
          "recommendation": "the next-step text",
          "link": "target module name"
        }`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(result.text || "{}");
        if (data.insight) {
          setAcademicInsight(data.insight);
          setRecommendation({ text: data.recommendation, link: data.link });
        }
      } catch (error) {
        console.error("Failed to generate insight:", error);
      } finally {
        setIsGeneratingInsight(false);
      }
    };

    const timeout = setTimeout(generateInsight, 3000);
    return () => clearTimeout(timeout);
  }, [attempts.length, tasks.length, user]);

  const incompleteTasks = tasks.filter(t => !t.completed);
  const attemptedQuizIds = new Set(attempts.map(a => a.quizId));
  const unattemptedQuizzes = quizzes.filter(q => !attemptedQuizIds.has(q.id));

  const totalReminders = incompleteTasks.length + unattemptedQuizzes.length;

  return (
    <div className="space-y-10 pb-20">
      {/* Burnout Monitoring Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-primary/5 rounded-[3rem] blur-3xl -z-10" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {burnoutMetrics ? (
            <BurnoutMeter metrics={burnoutMetrics} />
          ) : (
            <div className="glass h-[200px] rounded-[2.5rem] flex items-center justify-center border-dashed border-neutral-200">
               <div className="text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-primary/40 animate-spin mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Syncing Biometrics...</p>
               </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
             <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/5">Welcome Back</span>
             <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest italic flex items-center gap-1 group cursor-pointer hover:text-primary transition-colors">
               {formatISTDate()} <ArrowUpRight className="w-3 h-3" />
             </span>
          </div>
          <h2 className="text-4xl font-black text-ink tracking-tight">How's it going, {(profile?.displayName || 'Scholar').split(' ')[0]}?</h2>
          <p className="text-ink-muted font-light mt-1">
            {burnoutMetrics?.status === 'optimal' 
              ? "You're making great progress! Your cognitive load is optimal." 
              : burnoutMetrics?.status === 'strained'
              ? "You're working hard! Remember to pace yourself for the long haul."
              : "Burnout risk detected. Reo suggests a short break to reboot."}
          </p>
        </motion.div>
        
        <div className="flex gap-4">
           <button onClick={() => onNavigate("Planner")} className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <Clock className="w-4 h-4" /> Resume Session
           </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Clock} label="Study Time" value="24.5h" trend="+12%" color="bg-primary" />
        <StatCard icon={CheckCircle2} label="Goals Hit" value="18/20" trend="+5%" color="bg-indigo-500" />
        <StatCard icon={Target} label="Avg Accuracy" value="92%" trend="+2%" color="bg-teal-500" />
        <StatCard icon={Zap} label="Notes Gen" value="42" trend="+18%" color="bg-orange-500" />
      </div>

      {/* Reminders Section */}
      <AnimatePresence>
        {totalReminders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <Card className="lg:col-span-12 border-none bg-rose-50/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm border border-rose-200">
                        <Bell className="w-7 h-7" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-rose-900 tracking-tight">Academic Watchlist</h3>
                        <p className="text-xs font-bold text-rose-700/60 uppercase tracking-widest">{totalReminders} Pending Actions Required</p>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                     {unattemptedQuizzes.length > 0 && (
                        <div className="px-4 py-2 bg-white rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                           <Zap className="w-4 h-4 text-amber-500" />
                           <span className="text-[10px] font-black text-ink uppercase tracking-tighter">
                              {unattemptedQuizzes.length} Quizzes Unattempted
                           </span>
                           <button onClick={() => onNavigate("Quizzes")} className="ml-2 text-[10px] font-black text-primary hover:underline">Solve Now</button>
                        </div>
                     )}
                     {incompleteTasks.length > 0 && (
                        <div className="px-4 py-2 bg-white rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                           <AlertCircle className="w-4 h-4 text-rose-500" />
                           <span className="text-[10px] font-black text-ink uppercase tracking-tighter">
                              {incompleteTasks.length} Incomplete Tasks
                           </span>
                           <button onClick={() => onNavigate("Planner")} className="ml-2 text-[10px] font-black text-primary hover:underline">Review</button>
                        </div>
                     )}
                  </div>
               </div>

               <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unattemptedQuizzes.slice(0, 3).map((quiz) => (
                    <div 
                      key={quiz.id} 
                      className="p-4 bg-white/60 rounded-2xl border border-rose-100/50 hover:bg-white transition-all cursor-pointer group"
                      onClick={() => onNavigate("Quizzes")}
                    >
                       <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                             <p className="text-[8px] font-black uppercase text-rose-600 tracking-widest mb-1 italic">New Assessment</p>
                             <h4 className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors">{quiz.title}</h4>
                             <p className="text-[10px] text-ink-muted mt-1 uppercase font-black">{quiz.subject || "Subject"}</p>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <ChevronRight className="w-4 h-4" />
                          </div>
                       </div>
                    </div>
                  ))}
                  {incompleteTasks.slice(0, 3).map((task) => (
                    <div 
                      key={task.id} 
                      className="p-4 bg-white/60 rounded-2xl border border-rose-100/50 hover:bg-white transition-all cursor-pointer group"
                      onClick={() => onNavigate("Planner")}
                    >
                       <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                             <p className="text-[8px] font-black uppercase text-rose-600 tracking-widest mb-1 italic">Pending Task</p>
                             <h4 className="text-xs font-bold text-ink truncate group-hover:text-primary transition-colors">{task.title}</h4>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                                  task.priority === 'High' ? 'bg-red-500 text-white' : 
                                  task.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                                }`}>
                                  {task.priority}
                                </span>
                             </div>
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                             <ChevronRight className="w-4 h-4" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity & Planner Summary */}
        <div className="lg:col-span-2 space-y-8">
           {/* Daily Schedule Preview */}
           <Card className="relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
             <div className="flex items-center justify-between mb-8 relative z-10">
               <h3 className="text-xl font-bold text-ink flex items-center gap-3">
                 <CalendarIcon className="w-6 h-6 text-primary" /> Next Up Today
               </h3>
               <button onClick={() => onNavigate("Planner")} className="text-primary font-bold text-xs hover:underline flex items-center gap-1">
                 View Planner <ChevronRight className="w-3 h-3" />
               </button>
             </div>

             <div className="space-y-4 relative z-10">
                {[
                  { time: formatISTTime(new Date(new Date().setHours(11, 0))), task: "Linear Algebra Homework", sub: "Math", status: "Focus Mode" },
                  { time: formatISTTime(new Date(new Date().setHours(14, 0))), task: "Macroeconomics Reading", sub: "Economics", status: "Upcoming" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-white/60 hover:bg-white/80 border border-white/40 transition-all cursor-pointer group">
                    <div className="text-center w-20">
                      <p className="text-sm font-black text-ink">{item.time}</p>
                    </div>
                    <div className="h-8 w-[2px] bg-neutral-200 group-hover:bg-primary transition-colors" />
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-ink">{item.task}</h4>
                       <p className="text-[10px] text-ink-muted font-bold uppercase tracking-widest">{item.sub}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.status === "Focus Mode" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white/60 text-ink-muted border border-white/40"}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
             </div>
           </Card>

           {/* Module Summaries */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quiz Summary */}
              <Card>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-ink flex items-center gap-2">
                       <Zap className="w-4 h-4 text-primary" /> Latest Quiz
                    </h3>
                    <span className="text-xs font-black text-primary">High Score</span>
                 </div>
                 <div className="bg-white/40 p-6 rounded-2xl border border-white/60 mb-6 text-center">
                    <p className="text-[10px] text-ink-muted uppercase font-black mb-1">{latestAttempt ? latestAttempt.quizTitle : "Quantum Mechanics"}</p>
                    <h4 className="text-4xl font-black text-primary italic">{latestAttempt ? `${latestAttempt.percentage}%` : "96%"}</h4>
                 </div>
                 <button onClick={() => onNavigate("Quizzes")} className="w-full py-3 glass text-xs font-bold text-ink-muted hover:text-primary transition-colors flex items-center justify-center gap-2">
                    Retake for Mastery <ArrowUpRight className="w-3 h-3" />
                 </button>
              </Card>

              {/* Resources Summary */}
              <Card>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-ink flex items-center gap-2">
                       <BookOpen className="w-4 h-4 text-primary" /> Recent Resource
                    </h3>
                 </div>
                 <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/60 border border-white/40 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary">
                       <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                       <h4 className="text-sm font-bold text-ink truncate">{latestResource?.title || "Add your first resource"}</h4>
                       <p className="text-[10px] text-ink-muted font-bold tracking-tight">
                         {latestResource?.createdAt?.toDate ? `Added ${formatISTDate(latestResource.createdAt.toDate())}` : "Get started by uploading a PDF"}
                       </p>
                    </div>
                 </div>
                 <button onClick={() => onNavigate("Resources")} className="w-full py-3 glass text-xs font-bold text-ink-muted hover:text-primary transition-colors flex items-center justify-center gap-2">
                    Manage Files <ArrowUpRight className="w-3 h-3" />
                 </button>
              </Card>
           </div>

           {/* Daily Academic Discovery Card */}
           <Card className={`bg-linear-to-br ${colors.from} ${colors.via} ${colors.to} ${colors.border} overflow-hidden relative group shadow-lg ${colors.shadow} ${colors.hover} transition-all`}>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/15 transition-colors" />
              
              <div className="flex items-center gap-3 mb-5">
                 <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${colors.icon} flex items-center justify-center text-white shadow-md transform group-hover:rotate-12 transition-transform`}>
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className={`text-base font-black text-ink uppercase tracking-tight italic bg-clip-text text-transparent bg-gradient-to-r ${colors.text}`}>Did You Know?</h3>
                    <p className={`text-[10px] font-black uppercase ${colors.p} tracking-widest leading-none mt-0.5`}>Daily Academic Discovery</p>
                 </div>
              </div>

              <div className="space-y-3 relative z-10">
                 <p className={`text-[10px] font-black uppercase ${colors.sub} tracking-[0.2em] mb-1 italic w-fit px-2 py-0.5 rounded-full`}>Subject: {dailyFact.subject}</p>
                 <p className="text-base font-extrabold text-ink leading-relaxed drop-shadow-sm">
                   {dailyFact.fact}
                 </p>
              </div>

              <div className={`mt-8 flex items-center justify-between border-t ${colors.border}/50 pt-5`}>
                 <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${colors.pulse} animate-pulse`} />
                    <p className={`text-[9px] font-black ${colors.p} uppercase tracking-tighter`}>Powered by Reo AI</p>
                 </div>
                 <button className={`text-[10px] font-black text-white bg-gradient-to-r ${colors.btn} px-4 py-2 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all uppercase tracking-widest`}>
                    Learn More
                 </button>
              </div>
           </Card>
        </div>

        {/* Right Column: AI Insights & Quick Chat */}
        <div className="space-y-8">
           {/* Reo AI Insights Card */}
           <Card className="bg-gradient-to-br from-primary to-indigo-600 text-white border-none shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="relative z-10 flex-1">
                 <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-xl border border-white/20">
                    <Sparkles className="w-10 h-10 text-white" />
                 </div>
                 <h3 className="text-2xl font-black mb-4 leading-tight italic">Reo's Academic Insights</h3>
                 <div className="min-h-[80px] mb-8">
                    {isGeneratingInsight ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-white/20 rounded w-full" />
                        <div className="h-4 bg-white/20 rounded w-3/4" />
                      </div>
                    ) : (
                      <p className="text-white/80 text-sm leading-relaxed font-medium">
                        "{academicInsight}"
                      </p>
                    )}
                 </div>
                 
                 <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                       <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-2">Smart Recommendation</p>
                       <p className="text-xs font-bold">{recommendation.text}</p>
                       <button onClick={() => onNavigate(recommendation.link as any)} className="mt-3 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                          Go to {recommendation.link} <ChevronRight className="w-3 h-3" />
                       </button>
                    </div>
                 </div>
              </div>
              
              <button onClick={() => onNavigate("AI Chat")} className="w-full py-4 mt-12 bg-white text-primary rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/40 relative z-10">
                 <MessageSquare className="w-5 h-5" /> Chat with Reo
              </button>
           </Card>
        </div>

        {/* Teacher Materials Section for Students */}
        {profile?.role === "student" && sharedResources.length > 0 && (
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Teacher Materials
              </h3>
              <button 
                onClick={() => onNavigate("Resources")}
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
              >
                View Hub
              </button>
            </div>
            <div className="space-y-4">
              {sharedResources.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onNavigate("Resources")}
                  className="glass p-5 rounded-3xl hover:shadow-xl transition-all group cursor-pointer border-white/60"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-ink truncate group-hover:text-primary transition-colors">{res.title}</p>
                      <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Shared by Teacher</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
