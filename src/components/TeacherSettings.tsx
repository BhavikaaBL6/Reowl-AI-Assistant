import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User as UserIcon, 
  Bell, 
  Calendar, 
  Sparkles, 
  Zap, 
  Settings as SettingsIcon,
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
  School,
  Building2
} from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";
import { useTheme } from "../contexts/ThemeContext";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-[2.5rem] overflow-hidden ${className}`}>
    {children}
  </div>
);

export const TeacherSettings = () => {
  const { user, profile, updateProfile } = useFirebase();
  const { mode, setMode, preset, setPreset } = useTheme();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("Metropolitan University");
  const [department, setDepartment] = useState("Neural Sciences");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("••••••••••••");

  React.useEffect(() => {
    if (profile) {
      setName(profile.displayName || user?.displayName || "");
      setEmail(profile.email || user?.email || "");
      if (profile.institution) setInstitution(profile.institution);
      if (profile.department) setDepartment(profile.department);
    } else if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ 
        displayName: name, 
        email: email,
        institution,
        department,
        password: password !== "••••••••••••" ? password : undefined
      });
      alert("Portal settings updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update portal settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-4xl font-black text-ink mb-2 tracking-tight">Portal Settings</h2>
          <p className="text-ink-muted font-light">Configure your professional educator profile and dashboard.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/40">
           <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600">
              <SettingsIcon className="w-4 h-4" />
           </div>
           <p className="text-sm font-bold text-ink italic uppercase tracking-tighter">Educator mode</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Professional Profile */}
        <Card className="lg:col-span-2 p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <School className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">Professional Profile</h3>
            </div>
            <button className="text-ink-muted hover:text-ink"><MoreVertical className="w-5 h-5" /></button>
          </div>

          <div className="flex flex-col xl:flex-row gap-12 relative z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group/photo">
                <div className="w-44 h-44 rounded-[3rem] overflow-hidden glass shadow-2xl border-4 border-white">
                  <img src={user?.photoURL || "https://picsum.photos/seed/prof/400/400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <button className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white shadow-xl rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-4 border-white">
                  <Upload className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] font-black text-ink-muted uppercase tracking-tighter">Educator ID: {user?.uid.slice(0, 8)}</p>
            </div>

            <div className="flex-1 space-y-8 w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Legal Name</p>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass px-6 py-4 rounded-2xl text-ink font-bold shadow-sm border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 bg-transparent"
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Academic Institution</p>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within:scale-110 transition-transform" />
                    <input 
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full glass pl-12 pr-6 py-4 rounded-2xl text-ink font-bold shadow-sm border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 bg-transparent"
                      placeholder="Institution Name"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Department</p>
                  <input 
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full glass px-6 py-4 rounded-2xl text-ink font-bold shadow-sm border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 bg-transparent"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest font-black text-ink-muted ml-1">Verified Email</p>
                  <div className="relative">
                    <input 
                      type="email"
                      value={email}
                      disabled
                      className="w-full glass px-6 py-4 rounded-2xl text-ink-muted font-bold shadow-sm border-white/40 opacity-70 cursor-not-allowed bg-neutral-50/50"
                    />
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Synchronizing..." : "Update Portal Profile"}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Notifications */}
        <Card className="p-10 space-y-8 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-ink-muted">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">Alert System</h3>
            </div>
          </div>
          <div className="space-y-8">
            {[
              { label: "Student Inquiries", desc: "Alert when students ask Reo", enabled: true, icon: CheckCircle2 },
              { label: "Course Deployment", desc: "Notify on syllabus changes", enabled: false, icon: Zap },
              { label: "Neural Insights", desc: "Weekly class mastery report", enabled: true, icon: Sparkles }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex gap-4 items-center">
                   <div className="p-2.5 rounded-xl bg-neutral-50 text-ink-muted group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                     <item.icon className="w-5 h-5" />
                   </div>
                   <div>
                    <p className="font-bold text-sm text-ink">{item.label}</p>
                    <p className="text-[10px] text-ink-muted font-medium">{item.desc}</p>
                  </div>
                </div>
                <button className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 border border-neutral-200 ${item.enabled ? "bg-indigo-600 border-indigo-600" : "bg-neutral-100"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${item.enabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Dashboard Visuals */}
        <Card className="lg:col-span-3 p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">Interface Customization</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
            <div className="space-y-8">
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Interface Mode</p>
              <div className="flex gap-4">
                {[
                  { id: "light", label: "Light", icon: Sun },
                  { id: "dark", label: "Dark", icon: Moon },
                  { id: "system", label: "System", icon: Monitor }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as any)}
                    className={`flex-1 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                      mode === m.id 
                       ? "border-indigo-600 bg-indigo-600/5 text-indigo-600 shadow-lg" 
                       : "glass border-white/60 text-ink-muted hover:border-indigo-600/20"
                    }`}
                  >
                    <m.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Educator Accents</p>
              <div className="flex flex-wrap items-center gap-6">
                {["blue", "indigo", "rose", "slate"].map((c) => (
                  <button 
                    key={c}
                    onClick={() => setPreset(c as any)}
                    className={`flex flex-col items-center gap-3 group transition-all`}
                  >
                    <div className={`w-16 h-16 rounded-[1.5rem] p-1 border-4 transition-all ${preset === c ? "border-indigo-600 scale-110 shadow-xl" : "border-transparent opacity-80"}`}>
                       <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white ${
                          c === "blue" ? "bg-blue-600" :
                          c === "indigo" ? "bg-indigo-600" :
                          c === "rose" ? "bg-rose-600" : "bg-slate-600"
                       }`}>
                          {preset === c && <CheckCircle2 className="w-8 h-8" />}
                       </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest capitalize ${preset === c ? "text-indigo-600" : "text-ink-muted"}`}>{c}</span>
                  </button>
                ))}
              </div>
              
              <div className="pt-4">
                <button className="w-full py-4 glass border-white/60 text-ink font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/20 transition-all text-xs uppercase tracking-widest">
                   <RotateCcw className="w-4 h-4" /> Reset Portal Layout
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
