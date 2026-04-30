/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Compass, 
  Map, 
  Target, 
  Trophy, 
  Rocket, 
  Brain, 
  ChevronRight, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Star,
  Users,
  Search,
  Zap,
  Globe,
  Loader2,
  Lock,
  ChevronDown,
  Info,
  LineChart,
  CheckSquare,
  Layers,
  Plus,
  X as XIcon,
  ArrowUp as ArrowUpIcon
} from "lucide-react";
import { getGeminiModel } from "../lib/gemini";
import { 
  LineChart as Rechart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, isDemoMode, handleFirestoreError } from "../lib/firebase";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { useFirebase } from "../contexts/FirebaseContext";
import { useTheme } from "../contexts/ThemeContext";

interface CareerPath {
  title: string;
  category: string;
  description: string;
  skills: string[];
  roadmap: { phase: string; steps: string[] }[];
  marketDemand: "High" | "Medium" | "Steady";
  salaryRange: string;
  suggestedCourses: string[];
  recommendedDegrees: string[];
  portfolioQuests?: { title: string; difficulty: string }[];
  growthData?: { year: string; value: number }[];
  icon: any;
}

const CAREER_CATEGORIES = [
  "Technology & AI",
  "Design & Creative",
  "Science & Research",
  "Business & Entrepreneurship",
  "Healthcare & Wellness",
  "Law & Public Policy"
];

const getCareerIcon = (cat: string) => {
  switch (cat) {
    case "Technology & AI": return Rocket;
    case "Design & Creative": return Sparkles;
    case "Science & Research": return Brain;
    case "Business & Entrepreneurship": return TrendingUp;
    case "Healthcare & Wellness": return Target;
    default: return Briefcase;
  }
};

const CURATED_CAREERS: Record<string, { title: string; description: string }[]> = {
  "Technology & AI": [
    { title: "Machine Learning Engineer", description: "Architecting the neural networks of tomorrow." },
    { title: "Full-Stack Developer", description: "Building seamless digital experiences from end to end." },
    { title: "Cybersecurity Analyst", description: "Defending the global digital infrastructure." },
    { title: "Cloud Architect", description: "Designing scalable sky-high computing systems." }
  ],
  "Design & Creative": [
    { title: "UX/UI Designer", description: "Crafting intuitive and beautiful human interfaces." },
    { title: "3D Environment Artist", description: "Building immersive virtual worlds for gaming and metaverses." },
    { title: "Motion Graphics Designer", description: "Bringing stories to life through cinematic animation." },
    { title: "Creative Director", description: "Leading the vision for global brand identities." }
  ],
  "Science & Research": [
    { title: "Quantum Physicist", description: "Exploring the fundamental building blocks of reality." },
    { title: "Biotechnology Researcher", description: "Coding the hardware of life to solve global health crises." },
    { title: "Data Scientist", description: "Unlocking hidden patterns in massive data universes." },
    { title: "Space Systems Engineer", description: "Designing the vehicles for interplanetary exploration." }
  ],
  "Business & Entrepreneurship": [
    { title: "Product Manager", description: "The CEO of the product, balancing tech and business." },
    { title: "Venture Capitalist", description: "Identifying and fueling the next billion-dollar ideas." },
    { title: "Growth Hacker", description: "Using data-driven strategies to scale companies rapidly." },
    { title: "FinTech Consultant", description: "Revolutionizing how the world manages and moves value." }
  ],
  "Healthcare & Wellness": [
    { title: "Telemedicine Specialist", description: "Delivering world-class healthcare over digital borders." },
    { title: "Genetic Counselor", description: "Helping people navigate the future encoded in their DNA." },
    { title: "Digital Health Innovator", description: "Building wearable tech that predicts health issues." },
    { title: "Neuroscience Researcher", description: "Decoding the most complex machine: the human brain." }
  ],
  "Law & Public Policy": [
    { title: "Digital Rights Attorney", description: "Protecting privacy and speech in the age of AI." },
    { title: "Space Lawyer", description: "Defining the laws for the final frontier." },
    { title: "Sustainability Policy Expert", description: "Drafting the blueprints for a greener planet." },
    { title: "AI Ethics Consultant", description: "Ensuring machines reflect our highest human values." }
  ]
};

export const CareerExplorer = () => {
  const { user, profile } = useFirebase();
  const { preset } = useTheme();
  const [activeCategory, setActiveCategory] = useState("Technology & AI");
  const [suggestedCareers, setSuggestedCareers] = useState<CareerPath[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [userInterests, setUserInterests] = useState(profile?.subjects?.join(", ") || "");
  const [careerInsight, setCareerInsight] = useState("");
  const [comparingCareers, setComparingCareers] = useState<CareerPath[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const getThemeColors = () => {
    const config: Record<string, any> = {
      blue: { from: "from-blue-600", to: "to-indigo-700", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
      purple: { from: "from-purple-600", to: "to-fuchsia-700", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
      green: { from: "from-emerald-600", to: "to-teal-700", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
      rose: { from: "from-rose-600", to: "to-pink-700", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
    };
    return config[preset] || config.blue;
  };

  const colors = getThemeColors();

  const analyzeCareerGalaxy = async () => {
    if (!userInterests) return;
    setIsAnalyzing(true);
    setSelectedCareer(null);
    setAnalysisText("Scanning career trajectories...");
    
    try {
      const model = getGeminiModel();
      const prompt = `You are a Career Architect AI. Based on the student's interests: "${userInterests}", suggest 3 exciting and modern career paths. 
      IMPORTANT: Provide realistic, market-accurate salary ranges (entry to mid-level). Do not exaggerate peak earnings.
      Specifically, provide these in a structured JSON format:
      {
        "careers": [
          {
            "title": "Career Name",
            "category": "One of: ${CAREER_CATEGORIES.join(", ")}",
            "description": "Short exciting summary",
            "skills": ["Skill 1", "Skill 2", "Skill 3"],
            "marketDemand": "High/Medium/Steady",
            "salaryRange": "$X - $Y (Entry-Mid Range)",
            "suggestedCourses": ["Course 1", "Course 2"],
            "recommendedDegrees": ["Degree 1"],
            "portfolioQuests": [
              { "title": "Project Idea 1", "difficulty": "Entry" },
              { "title": "Project Idea 2", "difficulty": "Advanced" }
            ],
            "growthData": [
              { "year": "2024", "value": 100 },
              { "year": "2025", "value": 115 },
              { "year": "2026", "value": 130 },
              { "year": "2027", "value": 150 },
              { "year": "2028", "value": 180 }
            ],
            "roadmap": [
              { "phase": "Learning Phase", "steps": ["Step 1", "Step 2"] },
              { "phase": "Building Phase", "steps": ["Step A", "Step B"] }
            ]
          }
        ],
        "insight": "A short, motivational prediction about the student's future impact."
      }`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const text = result.text;
      if (!text) throw new Error("No response from AI");
      
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      const mappedCareers = (data.careers || []).map((c: any) => ({
        ...c,
        icon: getCareerIcon(c.category)
      }));

      setSuggestedCareers(mappedCareers);
      setCareerInsight(data.insight);
    } catch (error) {
      console.error("Career analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisText("");
    }
  };

  const exploreSpecificCareer = async (careerTitle: string, asComparison = false) => {
    setIsAnalyzing(true);
    setAnalysisText(`Architecting ${careerTitle} trajectory...`);
    
    try {
      const model = getGeminiModel();
      const prompt = `You are a Career Architect AI. Provide a deep-dive analysis for the specific career: "${careerTitle}". 
      IMPORTANT: Provide realistic, market-accurate salary ranges (entry to mid-level). Do not exaggerate top-tier earnings.
      Provide the detailed roadmap, skills, demand, and academic foundations in a structured JSON format:
      {
        "career": {
          "title": "${careerTitle}",
          "category": "Identify the most relevant category",
          "description": "Exhilarating 2-sentence summary of the career",
          "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
          "marketDemand": "High/Medium/Steady",
          "salaryRange": "$X - $Y (Entry-Mid Range)",
          "suggestedCourses": ["Course 1", "Course 2", "Course 3"],
          "recommendedDegrees": ["Degree 1", "Degree 2"],
          "portfolioQuests": [
            { "title": "Discovery Project", "difficulty": "Beginner" },
            { "title": "Complexity Milestone", "difficulty": "Advanced" }
          ],
          "growthData": [
            { "year": "2024", "value": 100 },
            { "year": "2025", "value": 115 },
            { "year": "2026", "value": 125 },
            { "year": "2027", "value": 140 },
            { "year": "2028", "value": 165 }
          ],
          "roadmap": [
            { "phase": "Foundations", "steps": ["Step 1", "Step 2"] },
            { "phase": "Specialization", "steps": ["Step A", "Step B"] },
            { "phase": "Expertise & Launch", "steps": ["Step X", "Step Y"] }
          ]
        },
        "insight": "A unique, inspiring prediction about this career's future."
      }`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const text = result.text;
      if (!text) throw new Error("No response from AI");
      
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);
      
      const career = {
        ...data.career,
        icon: getCareerIcon(data.career.category)
      };

      if (asComparison) {
        setComparingCareers(prev => {
          if (prev.find(c => c.title === career.title)) return prev;
          if (prev.length >= 2) return [prev[1], career];
          return [...prev, career];
        });
      } else {
        setSelectedCareer(career);
      }
      
      setCareerInsight(data.insight);
      
      if (!asComparison) {
        setSuggestedCareers(prev => {
          if (prev.find(c => c.title === career.title)) return prev;
          return [career, ...prev].slice(0, 4);
        });

        setTimeout(() => {
          const detailView = document.getElementById('career-detail-view');
          if (detailView) detailView.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

    } catch (error) {
      console.error("Specific career exploration failed:", error);
      alert("Failed to explore this specific galaxy. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisText("");
    }
  };

  const syncToPlanner = async () => {
    if (!selectedCareer || !user) return;
    setIsSyncing(true);
    
    try {
      const tasksToAdd = selectedCareer.roadmap.flatMap(stage => 
        stage.steps.map(step => ({
          title: `[${selectedCareer.title}] ${step}`,
          subject: selectedCareer.category,
          priority: 'Medium',
          duration: '1.5h',
          time: 'TBD',
          completed: false,
          verified: false,
          createdAt: serverTimestamp(),
          userId: user.uid
        }))
      );

      if (isDemoMode) {
        alert(`Synced ${tasksToAdd.length} steps to your local planner demo.`);
      } else {
        const batch = tasksToAdd.map(task => 
          addDoc(collection(db!, "users", user.uid, "tasks"), task)
        );
        await Promise.all(batch);
        alert(`Successfully synced ${tasksToAdd.length} journey milestones to your Study Planner!`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Reo failed to sync tasks. Check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (suggestedCareers.length === 0 && userInterests) {
      analyzeCareerGalaxy();
    }
  }, []);

  return (
    <div className="space-y-10 pb-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-[#0D0B21] text-white p-12 lg:p-20 border border-white/10 shadow-3xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Career Exploration Alpha</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-white/50 tracking-widest uppercase">
              <Globe className="w-3 h-3" /> Future Guided
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black mb-8 italic tracking-tight"
          >
            Your Career <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary">Galaxy Awaits.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 font-light mb-10 leading-relaxed"
          >
            Don't just choose a job. Design a trajectory. Reo's Career Explorer uses AI to analyze your academic strengths and map them to the world's most exciting industries.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text" 
                placeholder="What interests you? (e.g., Space, Math, AI, Art)" 
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                value={userInterests}
                onChange={(e) => setUserInterests(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeCareerGalaxy()}
              />
            </div>
            <button 
              onClick={analyzeCareerGalaxy}
              disabled={isAnalyzing}
              className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Compass className="w-5 h-5" />}
              {isAnalyzing ? "Scanning..." : "Launch Scan"}
            </button>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden xl:block">
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
             className="relative w-96 h-96 border border-white/5 rounded-full flex items-center justify-center"
           >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]" />
              <div className="absolute bottom-20 left-10 w-2 h-2 bg-indigo-400 rounded-full" />
              <Compass className="w-40 h-40 text-white/5" />
           </motion.div>
        </div>
      </section>

      {/* Suggested Galaxy */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
           <div>
             <h2 className="text-3xl font-black text-ink tracking-tight italic">Recommended Trajectories</h2>
             <p className="text-ink-muted mt-1 font-medium">Mapped from your interests & academic performance</p>
           </div>
           {careerInsight && (
             <div className="hidden md:flex items-center gap-3 bg-primary/5 px-6 py-4 rounded-3xl border border-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
                <p className="text-xs font-bold text-ink italic leading-tight max-w-xs">"{careerInsight}"</p>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isAnalyzing ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="glass h-[400px] rounded-[3rem] animate-pulse flex flex-col justify-center items-center gap-4 p-8 border-dashed border-neutral-200">
                 <div className="w-20 h-20 bg-neutral-100 rounded-2xl" />
                 <div className="h-6 bg-neutral-100 rounded w-3/4" />
                 <div className="h-4 bg-neutral-100 rounded w-1/2" />
              </div>
            ))
          ) : suggestedCareers.length > 0 ? (
            suggestedCareers.map((career, i) => (
              <motion.div
                key={career.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card 
                  onClick={() => setSelectedCareer(career)}
                  className={`h-full group cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden ${selectedCareer?.title === career.title ? 'ring-2 ring-primary ring-offset-4' : ''}`}
                >
                   <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                   
                   <div className="flex flex-col h-full">
                      <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mb-8 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                         <career.icon className="w-8 h-8" />
                      </div>
                      
                      <div className="flex-1">
                        <Badge className="bg-primary/5 text-primary border-primary/10 px-3 py-1 mb-4 italic">{career.category}</Badge>
                        <h3 className="text-2xl font-black text-ink mb-3 group-hover:text-primary transition-colors">{career.title}</h3>
                        <p className="text-sm text-ink-muted leading-relaxed font-medium mb-8">
                          {career.description}
                        </p>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-neutral-50">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-ink-muted">Demand</span>
                            <span className={career.marketDemand === "High" ? "text-green-500" : "text-amber-500"}>{career.marketDemand}</span>
                         </div>
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-ink">
                            <span className="text-ink-muted">Avg Range</span>
                            <span>{career.salaryRange}</span>
                         </div>
                         <div className="pt-4 border-t border-neutral-50">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">Core Competencies</p>
                            <div className="flex flex-wrap gap-2">
                              {career.skills.slice(0, 4).map(skill => (
                                <span key={skill} className="px-2 py-1 bg-primary/5 text-[9px] font-bold text-primary rounded-md border border-primary/10">
                                  {skill}
                                </span>
                              ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass rounded-[3rem] border-dashed border-neutral-200">
               <Compass className="w-16 h-16 text-neutral-200 mx-auto mb-6" />
               <h3 className="text-xl font-bold text-ink-muted">Start an exploration scan above</h3>
               <p className="text-sm text-ink-muted mt-1">We'll find paths based on what makes you curious.</p>
            </div>
          )}
        </div>
      </section>

      {/* Selected Career Detail & Roadmap */}
      <AnimatePresence>
        {selectedCareer && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10" id="career-detail-view">
               <div className="lg:hidden col-span-full">
                  <div className="p-6 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 text-center">Core Competencies</p>
                     <div className="flex flex-wrap justify-center gap-2">
                        {selectedCareer.skills?.map(skill => (
                           <span key={skill} className="px-3 py-1.5 bg-white text-[10px] font-black text-ink rounded-xl uppercase tracking-widest border border-indigo-100">{skill}</span>
                        ))}
                     </div>
                  </div>
               </div>
               
               {/* Roadmap View */}
               <Card className="lg:col-span-8 p-10 lg:p-16 border-none shadow-3xl bg-white">
                  <div className="flex items-center justify-between mb-12">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
                           <Map className="w-7 h-7" />
                        </div>
                        <div>
                           <h3 className="text-3xl font-black text-ink italic tracking-tight">{selectedCareer.title} Roadmap</h3>
                           <p className="text-xs font-black uppercase tracking-widest text-primary mt-1">Generated Career Architecture</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => setSelectedCareer(null)}
                       className="p-3 bg-neutral-50 text-ink-muted rounded-xl hover:bg-neutral-100 transition-all"
                     >
                       <XIcon className="w-5 h-5" />
                     </button>
                  </div>

                  <div className="relative space-y-12">
                     {/* Timeline Connection */}
                     <div className="absolute left-6 top-8 bottom-8 w-1 bg-neutral-100 -z-0" />

                     {selectedCareer.roadmap.map((stage, i) => (
                       <motion.div 
                         key={stage.phase}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.15 }}
                         className="relative z-10 pl-16 group"
                       >
                          <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-white border-4 border-primary/10 flex items-center justify-center shadow-sm group-hover:border-primary transition-all">
                             <span className="text-sm font-black text-primary">{i + 1}</span>
                          </div>
                          
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-xl font-black text-ink mb-1 group-hover:text-primary transition-colors">{stage.phase}</h4>
                                <div className="h-1 w-12 bg-primary/20 rounded-full" />
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stage.steps.map((step, idx) => (
                                  <div key={idx} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 group-hover:bg-white group-hover:shadow-lg transition-all flex items-start gap-4">
                                     <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm border border-neutral-100 text-primary">
                                        <Zap className="w-4 h-4" />
                                     </div>
                                     <p className="text-sm font-bold text-ink-muted leading-relaxed flex-1">{step}</p>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </motion.div>
                     ))}
                  </div>

                  <div className="mt-16 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 flex flex-col md:flex-row items-center gap-8">
                     <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shadow-xl shrink-0 rotate-3">
                        <Rocket className="w-10 h-10" />
                     </div>
                     <div className="text-center md:text-left">
                        <h4 className="text-xl font-black text-ink italic leading-tight">Ready to start this journey?</h4>
                        <p className="text-sm text-ink-muted font-medium mt-1">Reo can create a personalized Study Plan aligned with this roadmap.</p>
                     </div>
                     <button 
                       onClick={syncToPlanner}
                       disabled={isSyncing}
                       className="md:ml-auto px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                     >
                        {isSyncing ? <Loader2 className="w-5 h-4 animate-spin" /> : <Rocket className="w-5 h-4" />}
                        {isSyncing ? "Syncing..." : "Sync to Planner"}
                     </button>
                  </div>
               </Card>

               {/* Stats & Knowledge Side */}
               <div className="lg:col-span-4 space-y-8">
                   <Card className="bg-white border-none shadow-3xl overflow-hidden relative ring-4 ring-primary/5">
                     <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                              <Target className="w-5 h-5 text-primary" />
                           </div>
                           <h3 className="text-xl font-black italic tracking-tight text-ink">Core Competencies</h3>
                        </div>
                        <div className="space-y-6">
                           {(selectedCareer.skills || []).map((skill, i) => (
                             <div key={skill} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-ink/60">
                                   <span>{skill}</span>
                                   <span>Level {90 - i * 15}%</span>
                                </div>
                                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${90 - i * 15}%` }}
                                     transition={{ duration: 1, delay: i * 0.2 }}
                                     className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                                   />
                                </div>
                             </div>
                           ))}
                           {(!selectedCareer.skills || selectedCareer.skills.length === 0) && (
                             <p className="text-xs text-ink/40 italic">No competencies identified yet.</p>
                           )}
                        </div>
                     </div>
                  </Card>

                  <Card className="border-none shadow-md bg-white">
                     <h3 className="text-lg font-black text-ink mb-6 italic tracking-tight">Market Momentum</h3>
                     {selectedCareer.growthData && (
                        <div className="h-48 w-full mb-6">
                           <ResponsiveContainer width="100%" height="100%">
                              <Rechart data={selectedCareer.growthData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                 <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                 <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                 <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#999' }}
                                 />
                                 <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                              </Rechart>
                           </ResponsiveContainer>
                        </div>
                     )}
                     <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl">
                        <LineChart className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Projected Market Value Index</span>
                     </div>
                  </Card>

                  <Card className="border-none shadow-md bg-white">
                     <h3 className="text-lg font-black text-ink mb-6 italic tracking-tight">Portfolio Quests</h3>
                     <div className="space-y-3">
                        {selectedCareer.portfolioQuests?.map((quest, idx) => (
                           <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between group/quest cursor-pointer hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary border border-neutral-100 group-hover/quest:bg-primary group-hover/quest:text-white transition-all">
                                    <CheckSquare className="w-4 h-4" />
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-bold text-ink leading-none mb-1">{quest.title}</p>
                                    <p className="text-[9px] font-black text-ink-muted uppercase tracking-widest">{quest.difficulty} Milestone</p>
                                 </div>
                              </div>
                              <ArrowRight className="w-3 h-3 text-neutral-300 group-hover/quest:text-primary transition-all" />
                           </div>
                        ))}
                     </div>
                  </Card>

                  <Card className="border-none shadow-md bg-white">
                     <h3 className="text-lg font-black text-ink mb-6 italic tracking-tight">Academic Foundations</h3>
                     <div className="space-y-6">
                        <div>
                           <div className="flex items-center gap-2 mb-3 text-indigo-600">
                              <GraduationCap className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Recommended Degrees</span>
                           </div>
                           <ul className="space-y-2">
                              {selectedCareer.recommendedDegrees.map((degree, idx) => (
                                <li key={idx} className="text-xs font-bold text-ink-muted flex items-start gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-1.5" />
                                   {degree}
                                </li>
                              ))}
                           </ul>
                        </div>
                        <div className="pt-4 border-t border-neutral-50">
                           <div className="flex items-center gap-2 mb-3 text-primary">
                              <Brain className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Crucial Courses</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {selectedCareer.suggestedCourses.map((course, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-primary/5 text-[10px] font-bold text-primary rounded-xl border border-primary/10">
                                   {course}
                                </span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </Card>

                  <Card className="border-none shadow-md bg-white">
                     <h3 className="text-lg font-black text-ink mb-6 italic tracking-tight">AI Insights</h3>
                     <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                           <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-amber-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Future Proofing</span>
                           </div>
                           <p className="text-xs font-bold text-amber-900/70 leading-relaxed">
                             This field shows 14% growth annually. Proficiency in AI tools will be a mandatory standard by 2028.
                           </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                           <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-indigo-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Degree Relevance</span>
                           </div>
                           <p className="text-xs font-bold text-indigo-900/70 leading-relaxed">
                             While formal education is key, 60% of recruiters value the "Proof of Concept" portfolio more in this industry.
                           </p>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Career Categories Explorer */}
      <section className="space-y-8">
        <div>
           <h2 className="text-2xl font-black text-ink tracking-tight italic">Industry Galaxies</h2>
           <p className="text-ink-muted mt-1 font-medium">Browse popular paths by category</p>
        </div>

        <div className="flex flex-wrap gap-4">
           {CAREER_CATEGORIES.map(cat => {
             const Icon = getCareerIcon(cat);
             return (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                   activeCategory === cat 
                     ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                     : "bg-white text-ink-muted hover:bg-primary/5 hover:text-primary border border-neutral-100"
                 }`}
               >
                 <Icon className="w-4 h-4" />
                 {cat}
               </button>
             );
           })}
        </div>

        <Card className="p-8 lg:p-12 border-none bg-neutral-50/50">
           {comparingCareers.length > 0 && (
              <div className="mb-8 p-6 bg-indigo-600 rounded-3xl text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Layers className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold">Comparison Mode</h3>
                    <p className="text-xs opacity-70">Comparing {comparingCareers.length} focus areas</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {comparingCareers.map(c => (
                    <Badge key={c.title} className="bg-white/20 text-white border-none">{c.title}</Badge>
                  ))}
                  <button onClick={() => setComparingCareers([])} className="text-[10px] font-black uppercase tracking-widest ml-4 hover:underline">Clear</button>
                </div>
              </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(CURATED_CAREERS[activeCategory] || []).map((path, idx) => (
                <div 
                  key={idx} 
                  onClick={() => exploreSpecificCareer(path.title)}
                  className="glass p-8 rounded-[2.5rem] bg-white border-white/60 hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden"
                >
                   <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform" />
                   <h4 className="font-black text-ink mb-2 group-hover:text-primary transition-colors">{path.title}</h4>
                   <p className="text-xs text-ink-muted leading-relaxed font-medium">{path.description}</p>
                   <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                      Explore {isAnalyzing && analysisText.includes(path.title) ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />}
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); exploreSpecificCareer(path.title, true); }}
                     className="absolute top-4 right-4 p-2 bg-neutral-50 text-neutral-400 rounded-lg hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                </div>
              ))}
           </div>
        </Card>
      </section>

      {/* Footer CTA */}
      <section className="mt-20">
         <Card className="bg-gradient-to-br from-[#0D0B21] to-black text-white border-none p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
               <div className="w-20 h-20 bg-primary/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10 rotate-12">
                  <Star className="w-10 h-10 text-primary" />
               </div>
               <h2 className="text-4xl font-black italic tracking-tight">Your future is not a destination. <br /> It's a design.</h2>
               <p className="text-white/60 font-light text-lg">Every syllabus you master, every quiz you solve, and every note you take is a building block for your career galaxy.</p>
               <div className="pt-8">
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-10 py-5 bg-white text-ink rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto">
                     Back to Top <ArrowUpIcon className="w-5 h-5" />
                  </button>
               </div>
            </div>
         </Card>
      </section>
    </div>
  );
};
