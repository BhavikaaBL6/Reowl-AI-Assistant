import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  Bell, 
  Calendar, 
  Sparkles, 
  Zap, 
  Upload, 
  Clock, 
  MoreVertical, 
  CheckCircle2, 
  Plus, 
  Lock, 
  ChevronRight, 
  Sun, 
  Moon, 
  Monitor, 
  RotateCcw,
  X,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatISTTime } from "../lib/utils";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-[2.5rem] overflow-hidden ${className}`}>
    {children}
  </div>
);

export const StudentSettings = () => {
  const { user, profile, updateProfile } = useFirebase();
  const { mode, setMode, preset, setPreset } = useTheme();
  
  const [studyGoal, setStudyGoal] = useState(3.5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••••••");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // AI Preferences
  const [verbosity, setVerbosity] = useState("Balanced");
  const [complexity, setComplexity] = useState("Undergraduate");
  
  // Subjects Management
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || user?.displayName || "");
      setEmail(profile.email || user?.email || "");
      setSubjects(profile.subjects || ["Quantum Mechanics", "Neural Biology", "Organic Chemistry"]);
      if (profile.studyGoal) setStudyGoal(profile.studyGoal);
    }
  }, [profile, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ 
        displayName: name, 
        email: email,
        subjects,
        studyGoal,
        password: password !== "••••••••••••" ? password : undefined
      });
      alert("Settings updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-4xl font-bold text-ink mb-2 tracking-tight">Settings</h2>
          <p className="text-ink-muted font-light">Manage your student profile and personalized study environment.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/40">
           <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <GraduationCap className="w-4 h-4" />
           </div>
           <p className="text-sm font-bold text-ink">
             {formatISTTime()}
           </p>
           <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
              <Clock className="w-4 h-4" /> IST
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details */}
        <Card className="lg:col-span-2 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink">Account Profile</h3>
                <p className="text-[10px] text-ink-muted uppercase font-black tracking-widest mt-0.5">Verified Identity</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-12 relative z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group/photo">
                <div className="w-44 h-44 rounded-[3rem] overflow-hidden glass shadow-2xl border-4 border-white">
                  <img 
                    src={user?.photoURL || "https://picsum.photos/seed/alex/400/400"} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary text-white shadow-xl rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] font-black text-ink-muted uppercase tracking-tighter">Student ID: {user?.uid.slice(0, 8)}</p>
            </div>

            <div className="flex-1 space-y-8 w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass px-6 py-4 rounded-2xl text-ink font-bold shadow-sm border-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent"
                      placeholder="Enter Full Name"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={email}
                      disabled
                      className="w-full glass px-6 py-4 rounded-2xl text-ink-muted font-bold shadow-sm border-white/40 bg-neutral-50/50 opacity-70 cursor-not-allowed"
                    />
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Secure Password</label>
                 <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => { if(password === "••••••••••••") setPassword(""); }}
                      className="w-full glass px-6 py-4 rounded-2xl text-ink font-bold shadow-sm border-white/40 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-transparent pr-20"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary hover:bg-primary/20 bg-primary/10 px-4 py-2 rounded-xl transition-colors uppercase tracking-widest"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                 </div>
                 <p className="text-[8px] text-ink-muted font-medium ml-1">Keep your password strong and private for security.</p>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-10 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <><RotateCcw className="w-4 h-4 animate-spin" /> Synchronizing...</>
                  ) : (
                    "Save Portal Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Support & Security */}
        <Card className="p-10 space-y-8 h-full bg-neutral-100/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-white flex items-center justify-center text-ink-muted shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-ink">Trust & Safety</h3>
          </div>
          
          <div className="space-y-4">
             <button className="w-full p-6 glass border-white text-left group hover:border-primary transition-all rounded-[2rem]">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Security Audit</p>
                <p className="font-bold text-ink">Two-Factor Auth</p>
                <p className="text-[10px] text-ink-muted mt-1">Enhance protection with 2FA verification.</p>
             </button>
             <button className="w-full p-6 glass border-white text-left group hover:border-primary transition-all rounded-[2rem]">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Active Sessions</p>
                <p className="font-bold text-ink">Manage Devices</p>
                <p className="text-[10px] text-ink-muted mt-1">Review where you are currently logged in.</p>
             </button>
          </div>

          <div className="pt-6 border-t border-white/20">
             <div className="flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100">
               <div>
                 <p className="text-[10px] font-black uppercase">Dangerous Area</p>
                 <p className="text-sm font-bold">Deactivate Account</p>
               </div>
               <ChevronRight className="w-5 h-5" />
             </div>
          </div>
        </Card>

        {/* Study Preferences & Subjects */}
        <Card className="lg:col-span-2 p-10">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-ink">Study Preferences</h3>
                  <p className="text-[10px] text-ink-muted uppercase font-black tracking-widest mt-0.5">Optimized for Mastery</p>
                </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-10">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <p className="text-xs font-black uppercase text-ink-muted tracking-widest">Daily Study Goal</p>
                       <p className="text-sm font-black text-primary bg-primary/10 px-4 py-1.5 rounded-xl">{studyGoal} hours</p>
                    </div>
                    <div className="relative h-3 bg-neutral-100 rounded-full flex items-center">
                       <div className="absolute left-0 h-full bg-primary rounded-full transition-all" style={{ width: `${(studyGoal/10)*100}%` }} />
                       <input 
                          type="range" 
                          min="0" 
                          max="12" 
                          step="0.5" 
                          value={studyGoal} 
                          onChange={(e) => setStudyGoal(parseFloat(e.target.value))}
                          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       <div className="w-8 h-8 bg-white border-4 border-primary rounded-[1rem] shadow-xl absolute pointer-events-none transition-all" style={{ left: `calc(${(studyGoal/12)*100}% - 16px)` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-ink-muted px-1 uppercase tracking-tighter">
                       <span>Min (0h)</span>
                       <span>Perfect (6h)</span>
                       <span>Max (12h)</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Learning Depth</p>
                       <div className="glass px-5 py-4 rounded-2xl border-white hover:border-primary transition-all cursor-pointer flex items-center justify-between text-xs font-bold text-ink">
                          Comprehensive
                          <ChevronRight className="w-4 h-4 rotate-90" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Break Pattern</p>
                       <div className="glass px-5 py-4 rounded-2xl border-white hover:border-primary transition-all cursor-pointer flex items-center justify-between text-xs font-bold text-ink">
                          Pomodoro (25/5)
                          <ChevronRight className="w-4 h-4 rotate-90" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <p className="text-xs font-black uppercase text-ink-muted tracking-widest">My Academic Stack</p>
                 <div className="space-y-4">
                    <div className="relative group">
                       <input 
                          type="text"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addSubject()}
                          placeholder="Add new subject (e.g. Physics)"
                          className="w-full glass px-6 py-4 rounded-[1.5rem] text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 border-white/60 pr-20"
                       />
                       <button 
                          onClick={addSubject}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                       >
                          <Plus className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                       <AnimatePresence>
                          {subjects.map((sub, i) => (
                             <motion.div 
                                key={sub}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="px-5 py-3 glass bg-white/40 border-white rounded-2xl flex items-center gap-3 group/sub hover:bg-white hover:shadow-xl transition-all"
                             >
                                <span className="text-xs font-bold text-ink">{sub}</span>
                                <button 
                                   onClick={() => removeSubject(sub)}
                                   className="text-ink-muted hover:text-red-500 transition-colors"
                                >
                                   <X className="w-4 h-4" />
                                </button>
                             </motion.div>
                          ))}
                       </AnimatePresence>
                    </div>
                    {subjects.length === 0 && (
                       <div className="py-12 border-2 border-dashed border-neutral-200 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-40">
                          <BookOpen className="w-8 h-8 mb-3" />
                          <p className="text-xs font-bold">Your stack is empty.</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </Card>

        {/* AI Co-Pilot Preferences */}
        <Card className="p-10 space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">AI Interaction</h3>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Co-Pilot Persona</p>
                 <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                       <Zap className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-ink">Academic Socratic</p>
                       <p className="text-[9px] text-ink-muted mt-0.5">Focuses on critical thinking</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Verbosity Level</p>
                   <div className="relative group">
                      <select 
                        value={verbosity}
                        onChange={(e) => setVerbosity(e.target.value)}
                        className="w-full glass px-6 py-4 rounded-2xl text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-transparent cursor-pointer hover:border-primary transition-all border-white"
                      >
                        <option value="Concise">Concise (Bullet points only)</option>
                        <option value="Balanced">Balanced (Standard responses)</option>
                        <option value="Detailed">Detailed (Deep explainers)</option>
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-ink-muted pointer-events-none group-focus-within:text-primary transition-colors" />
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Cognitive Complexity</p>
                   <div className="relative group">
                      <select 
                        value={complexity}
                        onChange={(e) => setComplexity(e.target.value)}
                        className="w-full glass px-6 py-4 rounded-2xl text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-transparent cursor-pointer hover:border-primary transition-all border-white"
                      >
                        <option value="High School">High School Level</option>
                        <option value="Undergraduate">Undergraduate Level</option>
                        <option value="PhD Level">PhD / Researcher Level</option>
                      </select>
                      <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 text-ink-muted pointer-events-none group-focus-within:text-primary transition-colors" />
                   </div>
                </div>
              </div>
           </div>

           <div className="pt-4">
              <p className="text-[8px] text-ink-muted italic text-center font-medium">Reo AI adapts to your learning curve in real-time.</p>
           </div>
        </Card>

        {/* Visual Engine */}
        <Card className="lg:col-span-3 p-10">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-ink text-white flex items-center justify-center shadow-2xl">
                  <Monitor className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ink">Interface Engine</h3>
              </div>
           </div>
           
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
              <div className="space-y-8">
                 <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${
                          mode === m.id 
                           ? "border-primary bg-primary/5 text-primary shadow-2xl shadow-primary/10" 
                           : "glass border-white text-ink-muted hover:border-primary/20"
                        }`}
                      >
                        <m.icon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">{m.label}</span>
                      </button>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Motion & Fidelity</p>
                    <div className="flex items-center justify-between p-6 glass rounded-3xl border-white">
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-ink">Fluid Transitions</p>
                          <p className="text-[10px] text-ink-muted">Enabling 60fps UI animations</p>
                       </div>
                       <button className="w-14 h-7 bg-primary rounded-full flex items-center px-1">
                          <div className="w-5 h-5 bg-white rounded-full shadow-lg translate-x-7" />
                       </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest ml-1">Atmospheric Presets</p>
                 <div className="flex flex-wrap gap-4">
                    {["blue", "purple", "green", "teal", "indigo", "rose", "amber"].map((c) => (
                       <button 
                          key={c}
                          onClick={() => setPreset(c as any)}
                          className={`group transition-all`}
                       >
                          <div className={`w-16 h-16 rounded-[1.5rem] p-1 border-4 transition-all ${preset === c ? "border-primary scale-110 shadow-2xl shadow-primary/20" : "border-transparent opacity-60 hover:opacity-100"}`}>
                             <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white ${
                                c === "blue" ? "bg-blue-500" :
                                c === "purple" ? "bg-purple-500" :
                                c === "green" ? "bg-emerald-500" :
                                c === "teal" ? "bg-teal-500" :
                                c === "rose" ? "bg-rose-500" :
                                c === "amber" ? "bg-amber-500" : "bg-primary"
                             }`}>
                                {preset === c && <CheckCircle2 className="w-8 h-8" />}
                             </div>
                          </div>
                       </button>
                    ))}
                 </div>
                 
                 <div className="pt-6 border-t border-white/10">
                    <button className="w-full py-5 glass border-white text-ink-muted font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:text-primary transition-all text-[10px] uppercase tracking-widest">
                       <RotateCcw className="w-5 h-5" /> Apply Engine Reset
                    </button>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
