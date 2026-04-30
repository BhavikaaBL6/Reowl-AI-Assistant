/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { isDemoMode, db, handleFirestoreError } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import { getGeminiModel } from "../lib/gemini";
import { 
  Plus, 
  HelpCircle, 
  Trophy, 
  Clock, 
  ChevronRight, 
  Star,
  Play,
  RotateCcw,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Loader2,
  Check,
  X,
  User,
  Trash,
  EyeOff
} from "lucide-react";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-[2rem] p-6 border-white/40 shadow-sm ${className}`}>
    {children}
  </div>
);

// We'll keep the demo list as a fallback
const demoQuizList = [
  { id: "1", title: "Quantum Mechanics Fundamentals", subject: "Physics", questions: [], teacherId: "system", teacherName: "Dr. Smith", publishedAt: null },
  { id: "2", title: "Cell Structure & Function", subject: "Biology", questions: [], teacherId: "system", teacherName: "Prof. Miller", publishedAt: null },
];

interface Question {
  id?: string;
  type?: "multiple-choice" | "true-false" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string | number; // Support both string and numeric for legacy
}

interface PublishedQuiz {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  subject?: string;
  questions: Question[];
  publishedAt?: any;
}

export const Quizzes = () => {
  const { user, profile } = useFirebase();
  const [quizzes, setQuizzes] = useState<PublishedQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<PublishedQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [shortAnswerValue, setShortAnswerValue] = useState("");

  // Fetch quizzes
  useEffect(() => {
    if (isDemoMode) {
      setIsLoadingQuizzes(false);
      return;
    }

    const q = query(
      collection(db!, "quizzes"), 
      where("visibility", "==", "public"),
      orderBy("publishedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedQuizzes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PublishedQuiz[];
      setQuizzes(fetchedQuizzes);
      setIsLoadingQuizzes(false);
    }, (error) => {
      handleFirestoreError(error, "list" as any, "quizzes");
      setIsLoadingQuizzes(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGenerateQuiz = async (topic: string, difficulty: string = "Medium") => {
    setIsGenerating(true);
    setIsTopicModalOpen(false);
    try {
      const prompt = `You are an expert educator. Generate a high-quality, 5-question multiple-choice quiz about "${topic}".
      The difficulty level should be: ${difficulty}.
      Return JSON with a title and an array of 'questions' where each has: question, options (list of 4 strings), and correctAnswer (index 0-3).`;

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      const data = JSON.parse(text || "{}");
      
      const normalizedQuestions = (data.questions || []).map((q: any) => ({
        ...q,
        type: "multiple-choice"
      }));

      if (normalizedQuestions.length > 0) {
        const generatedQuiz: PublishedQuiz = {
          id: "generated-" + Date.now(),
          title: data.title || topic,
          teacherId: "system",
          teacherName: "Reo AI",
          questions: normalizedQuestions
        };
        setActiveQuiz(generatedQuiz);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizFinished(false);
        setSelectedOption(null);
      } else {
        throw new Error("Invalid quiz data format");
      }
    } catch (error) {
      console.error("Quiz Generation failed:", error);
      if (isDemoMode) {
        const fallbackQuiz: PublishedQuiz = {
          id: "demo-1",
          title: topic,
          teacherId: "demo",
          teacherName: "Demo Instructor",
          questions: [
            { 
              type: "multiple-choice",
              question: `Which of the following describes the core principle of "${topic}"?`, 
              options: ["The fundamental interaction", "The secondary observable", "A peripheral component", "A negligible factor"],
              correctAnswer: 0
            }
          ]
        };
        setActiveQuiz(fallbackQuiz);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuizFinished(false);
        setSelectedOption(null);
      } else {
        alert("Reo had trouble architecting your quiz. Please try a different topic.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveResult = async (finalScore: number) => {
    if (!user || !activeQuiz || activeQuiz.id.startsWith("generated-")) return;
    
    try {
      if (!isDemoMode) {
        await addDoc(collection(db!, "quiz_attempts"), {
          quizId: activeQuiz.id,
          quizTitle: activeQuiz.title,
          studentId: user.uid,
          studentName: user.displayName || "Scholar",
          teacherId: activeQuiz.teacherId,
          score: finalScore,
          totalQuestions: activeQuiz.questions.length,
          percentage: Math.round((finalScore / activeQuiz.questions.length) * 100),
          completedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Failed to save quiz result:", error);
    }
  };

  const [dismissedQuizzes, setDismissedQuizzes] = useState<string[]>([]);

  // Fetch dismissed quizzes for student
  useEffect(() => {
    if (!user || isDemoMode) return;

    const q = query(
      collection(db!, "users", user.uid, "dismissedQuizzes"),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDismissedQuizzes(snapshot.docs.map(doc => doc.id));
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/dismissedQuizzes`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismissQuiz = async (quizId: string) => {
    if (isDemoMode) {
      setDismissedQuizzes(prev => [...prev, quizId]);
      return;
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      await setDoc(doc(db!, "users", user!.uid, "dismissedQuizzes", quizId), {
        userId: user!.uid,
        dismissedAt: serverTimestamp()
      });
    } catch (error) {
       console.error("Dismiss failed:", error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!user || !window.confirm("Are you sure you want to delete this quiz for everyone?")) return;
    
    try {
      if (!isDemoMode) {
        await deleteDoc(doc(db!, "quizzes", quizId));
        alert("Quiz deleted successfully.");
      } else {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
      }
    } catch (error) {
      handleFirestoreError(error, "delete" as any, `quizzes/${quizId}`);
    }
  };

  const filteredQuizzes = (quizzes.length > 0 ? quizzes : demoQuizList).filter(q => !dismissedQuizzes.includes(q.id));

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];

  const handleAnswer = (answer: any) => {
    if (selectedOption !== null && currentQuestion?.type !== "short-answer") return;
    
    let isCorrect = false;
    if (currentQuestion?.type === "multiple-choice") {
      isCorrect = answer === currentQuestion.correctAnswer;
    } else if (currentQuestion?.type === "true-false") {
      isCorrect = answer === currentQuestion.correctAnswer;
    } else if (currentQuestion?.type === "short-answer") {
      isCorrect = answer.toLowerCase().trim() === String(currentQuestion.correctAnswer).toLowerCase().trim();
    } else {
      // Legacy support for numeric correct answers
      isCorrect = answer === currentQuestion?.correctAnswer;
    }

    setSelectedOption(answer);
    const newScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(newScore);

    setTimeout(() => {
      if (currentQuestionIndex < activeQuiz!.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setShortAnswerValue("");
      } else {
        setQuizFinished(true);
        handleSaveResult(newScore);
      }
    }, 1500);
  };

  if (activeQuiz && !quizFinished) {
    const q = activeQuiz.questions[currentQuestionIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveQuiz(null)}
            className="flex items-center gap-2 text-ink-muted hover:text-primary transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Exit Quiz
          </button>
          <div className="flex items-center gap-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</p>
             <div className="w-32 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                   className="h-full bg-primary"
                />
             </div>
          </div>
        </div>

        <Card className="p-10 text-center space-y-8 bg-white border-2 border-primary/10">
           <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
             <HelpCircle className="w-8 h-8" />
           </div>
           <h3 className="text-2xl font-black text-ink tracking-tight leading-tight">{q.question}</h3>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {q.type === "short-answer" ? (
            <div className="flex gap-4">
              <input 
                type="text"
                value={shortAnswerValue}
                onChange={(e) => setShortAnswerValue(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1 p-6 rounded-2xl border-2 border-neutral-100 outline-none focus:border-primary transition-all font-bold"
              />
              <button 
                onClick={() => handleAnswer(shortAnswerValue)}
                className="px-8 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20"
              >
                Submit
              </button>
            </div>
          ) : (q.options || ["True", "False"]).map((option, i) => {
            const val = q.type === "true-false" || !q.options ? option : i;
            const isCorrect = q.type === "true-false" || !q.options ? option === q.correctAnswer : i === q.correctAnswer;
            const isSelected = selectedOption === val;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(val)}
                className={`p-6 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                  isSelected 
                    ? (isCorrect ? "bg-emerald-500/10 border-emerald-500 text-emerald-700" : "bg-red-500/10 border-red-500 text-red-700")
                    : selectedOption !== null && isCorrect
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700"
                      : "glass border-white/60 hover:border-primary/40 hover:bg-white/40"
                }`}
              >
                <span className="font-bold">{option}</span>
                {isSelected && (
                  isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />
                )}
                {selectedOption !== null && isCorrect && <Check className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (activeQuiz && quizFinished) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-32 h-32 bg-primary/10 rounded-[3rem] flex items-center justify-center text-primary mx-auto mb-10 border-4 border-white shadow-2xl"
        >
          <Trophy className="w-16 h-16" />
        </motion.div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-ink tracking-tight italic">Quiz Completed!</h2>
          <p className="text-ink-muted">You've successfully analyzed your knowledge on <span className="text-primary font-bold">"{activeQuiz.title}"</span></p>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
           <Card className="text-center py-8">
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">Score</p>
              <h4 className="text-3xl font-black text-primary italic">{Math.round((score / activeQuiz.questions.length) * 100)}%</h4>
           </Card>
           <Card className="text-center py-8">
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">Correct</p>
              <h4 className="text-3xl font-black text-emerald-600 italic">{score}/{activeQuiz.questions.length}</h4>
           </Card>
           <Card className="text-center py-8">
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest mb-1">XP Earned</p>
              <h4 className="text-3xl font-black text-amber-500 italic">+{score * 20}</h4>
           </Card>
        </div>

        <div className="flex gap-4 pt-10">
          <button onClick={() => setActiveQuiz(null)} className="flex-1 py-4 glass border-white/60 font-bold rounded-2xl hover:bg-white/40 transition-all">Back to Library</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence>
        {isTopicModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
              onClick={() => setIsTopicModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass p-10 rounded-[3rem] w-full max-w-lg relative z-10 shadow-3xl bg-white border-2 border-primary/10"
            >
              <h3 className="text-2xl font-black text-ink mb-6 tracking-tight">Generate New Quiz</h3>
              <p className="text-sm text-ink-muted mb-8 font-light leading-relaxed">Describe a subject and Reo will architect a custom assessment for you.</p>
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest px-1">Difficulty Level</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["Beginner", "Medium", "Advanced"].map((d) => (
                      <button 
                         key={d}
                         onClick={() => setSelectedDifficulty(d)}
                         className={`py-3 rounded-xl border-2 transition-all font-bold text-xs ${
                           selectedDifficulty === d 
                             ? "border-primary bg-primary/5 text-primary" 
                             : "border-neutral-100 bg-neutral-50 text-ink-muted hover:border-primary/20"
                         }`}
                      >
                         {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <input 
                    type="text" 
                    autoFocus
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    placeholder="e.g. Organic Chemistry, Photosynthesis..."
                    className="w-full h-16 bg-neutral-50 border border-neutral-100 rounded-2xl px-6 outline-none focus:ring-4 ring-primary/10 focus:border-primary transition-all font-bold"
                  />
                  <button 
                    onClick={() => handleGenerateQuiz(selectedTopic, selectedDifficulty)}
                    disabled={!selectedTopic.trim()}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Generate with Reo
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="text-4xl font-bold text-ink tracking-tight">Quizzes</h2>
          <p className="text-ink-muted font-light mt-1">Test your knowledge and track your academic progress.</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setIsTopicModalOpen(true)}
             disabled={isGenerating}
             className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isGenerating ? "Reo is Architecting..." : "Generate AI Quiz"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-indigo-500 to-primary text-white border-none text-center py-10 relative overflow-hidden">
             <div className="w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md">
                <Trophy className="w-10 h-10 text-white" />
             </div>
             <p className="text-[10px] uppercase font-bold tracking-widest text-white/70 mb-1">Average Score</p>
             <h3 className="text-5xl font-black mb-6 italic">92%</h3>
             <div className="flex items-center justify-center gap-2 text-xs font-bold bg-white/10 py-2 rounded-xl mx-6">
                <Star className="w-4 h-4 fill-current" /> Top 5% Globally
             </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex gap-4">
               <button className="text-xs font-bold text-primary border-b-2 border-primary pb-1">Published by Teachers</button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoadingQuizzes ? (
              [1, 2].map(i => (
                <div key={i} className="glass p-8 rounded-[2.5rem] border-white/60 animate-pulse h-48" />
              ))
            ) : filteredQuizzes.length === 0 ? (
              <div className="md:col-span-2 py-20 flex flex-col items-center justify-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                    <HelpCircle className="w-8 h-8" />
                 </div>
                 <p className="font-bold text-ink-muted">No quizzes available in your stack.</p>
                 <button onClick={() => setDismissedQuizzes([])} className="text-sm text-primary font-bold hover:underline">Restore Dismissed Quizzes</button>
              </div>
            ) : (
                filteredQuizzes.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-[2.5rem] hover:shadow-xl transition-all group relative border-white/60"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDismissQuiz(quiz.id)}
                      className="p-2 text-neutral-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Dismiss Quiz"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                    {user?.uid === quiz.teacherId && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id); }}
                        className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
                        title="Delete for Everyone"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-8">
                  <h4 className="text-lg font-bold text-ink leading-tight group-hover:text-primary transition-colors">{quiz.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                    <User className="w-3 h-3" />
                    {quiz.teacherName} • {quiz.questions.length} Questions
                  </div>
                </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/20">
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5 text-ink-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">10 mins</span>
                       </div>
                    </div>
                    <button 
                      onClick={() => setActiveQuiz(quiz as any)}
                      className="w-10 h-10 rounded-xl bg-white border border-neutral-100 shadow-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all focus:outline-none focus:ring-2 ring-primary/20"
                    >
                      <Play className="w-5 h-5 fill-current" />
                    </button>
                  </div>
              </motion.div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
