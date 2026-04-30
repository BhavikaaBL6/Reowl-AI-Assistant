import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Brain,
  Search,
  ArrowUpRight,
  User as UserIcon
} from "lucide-react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db, isDemoMode, handleFirestoreError } from "../lib/firebase";
import { useFirebase } from "../contexts/FirebaseContext";

interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: any;
}

export const TeacherAnalytics = () => {
  const { user } = useFirebase();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!user || isDemoMode) {
      if (isDemoMode) {
        setAttempts([
          { id: "1", quizId: "q1", quizTitle: "Neural Synapses", studentId: "s1", studentName: "Alice Miller", score: 8, totalQuestions: 10, percentage: 80, completedAt: { toDate: () => new Date() } },
          { id: "2", quizId: "q1", quizTitle: "Neural Synapses", studentId: "s2", studentName: "Bob Smith", score: 9, totalQuestions: 10, percentage: 90, completedAt: { toDate: () => new Date() } },
          { id: "3", quizId: "q2", quizTitle: "Organic Chemistry", studentId: "s1", studentName: "Alice Miller", score: 5, totalQuestions: 5, percentage: 100, completedAt: { toDate: () => new Date() } },
        ]);
        setIsLoading(false);
      }
      return;
    }

    const q = query(
      collection(db!, "quiz_attempts"),
      where("teacherId", "==", user.uid),
      orderBy("completedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QuizAttempt[];
      setAttempts(fetched);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, "list" as any, "quiz_attempts");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredAttempts = attempts.filter(a => 
    a.studentName.toLowerCase().includes(filter.toLowerCase()) || 
    a.quizTitle.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    avgScore: attempts.length > 0 ? Math.round(attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length) : 0,
    totalAttempts: attempts.length,
    distinctStudents: new Set(attempts.map(a => a.studentId)).size
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-4xl font-black text-ink tracking-tight">Analytics Dashboard</h2>
        <p className="text-ink-muted font-light mt-1">Real-time neural feedback on student performance metrics.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Class Average", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Quizzes Taken", value: stats.totalAttempts, icon: Brain, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Scholars", value: stats.distinctStudents, icon: Users, color: "text-amber-600", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="glass p-8 rounded-[2.5rem] border-white/60 shadow-lg"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-4xl font-black text-ink mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Attempts Table */}
      <div className="glass rounded-[3rem] border-white/60 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-ink flex items-center gap-3">
             <BarChart3 className="w-6 h-6 text-indigo-600" /> Recent Activity
          </h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by student or quiz..."
              className="pl-12 pr-6 py-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-sm font-medium focus:ring-4 ring-indigo-50 outline-none w-full md:w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-ink-muted uppercase tracking-widest">Student</th>
                <th className="px-8 py-4 text-[10px] font-black text-ink-muted uppercase tracking-widest">Quiz</th>
                <th className="px-8 py-4 text-[10px] font-black text-ink-muted uppercase tracking-widest text-center">Score</th>
                <th className="px-8 py-4 text-[10px] font-black text-ink-muted uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-ink-muted uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6 h-16 bg-white/40"></td>
                  </tr>
                ))
              ) : filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-ink-muted font-medium">
                    No attempts recorded yet.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-ink whitespace-nowrap">{attempt.studentName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-ink text-sm leading-tight">{attempt.quizTitle}</span>
                        <span className="text-[10px] font-black text-ink-muted uppercase tracking-widest mt-0.5">Assessment</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className={`inline-flex items-center justify-center px-4 py-1 rounded-full text-xs font-black italic ${
                        attempt.percentage >= 80 ? "bg-emerald-50 text-emerald-600" :
                        attempt.percentage >= 50 ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-ink-muted">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold whitespace-nowrap">
                          {attempt.completedAt?.toDate?.()?.toLocaleDateString() || "Today"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-neutral-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
