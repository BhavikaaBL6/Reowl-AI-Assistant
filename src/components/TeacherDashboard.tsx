import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  BarChart3, 
  BookMarked, 
  Plus, 
  Search, 
  Bell, 
  MoreVertical, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Zap,
  ChevronRight,
  ChevronLeft,
  Menu,
  User as UserIcon,
  LogOut,
  Settings,
  LayoutDashboard,
  FileText,
  HelpCircle,
  ListChecks,
  MessageSquare,
  X,
  Command,
  ArrowRight
} from "lucide-react";

import { formatISTDate, formatISTTime } from "../lib/utils";
import { useFirebase } from "../contexts/FirebaseContext";
import { SyllabusArchitect } from "./SyllabusArchitect";
import { TeacherSettings } from "./TeacherSettings";
import { Classrooms } from "./Classrooms";
import { QuizBuilder } from "./QuizBuilder";
import { TeacherAnalytics } from "./TeacherAnalytics";
import { SmartNotes } from "./SmartNotes";
import { ResourceManager } from "./ResourceManager";
import { LessonScriptGenerator } from "./LessonScriptGenerator";
import { REOEvaluator } from "./REOEvaluator";
import { NeuralBridge } from "./NeuralBridge";

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false, variant = "default" }: any) => (
  <button 
    onClick={onClick}
    title={collapsed ? label : ""}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative group/item ${
      variant === "danger" 
        ? "text-red-400 hover:bg-red-500/10"
        : active 
          ? "bg-indigo-600 text-white shadow-xl" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
    } ${collapsed ? "justify-center px-0" : ""}`}
  >
    <Icon className={`shrink-0 w-5 h-5 ${active ? "text-white" : ""} ${variant === "danger" ? "text-red-400" : ""}`} />
    {!collapsed && <span className="font-bold text-sm whitespace-nowrap">{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="teacher-sidebar-active" 
        className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" 
      />
    )}
  </button>
);

const TeacherHome = ({ onNavigate }: { onNavigate: (tab: string) => void }) => (
  <div className="space-y-10">
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-4xl font-black text-ink tracking-tight">Teacher Portal</h2>
        <p className="text-ink-muted font-light mt-1">Manage your classes and monitor student neural progress.</p>
      </div>
      <div className="flex items-center gap-4 glass px-6 py-3 rounded-2xl border-white/60">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-ink">Active Sessions: 12</span>
        </div>
      </div>
    </div>

    {/* Analytics Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { id: "Analytics", label: "Class Performance", value: "88%", change: "+12%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        { id: "Classrooms", label: "Active Students", value: "124", change: "+5%", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: "Creator", label: "AI Interactions", value: "2.4k", change: "+18%", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" }
      ].map((stat, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={i} 
          onClick={() => onNavigate(stat.id)}
          className="glass p-8 rounded-[2.5rem] border-white/60 shadow-lg group hover:scale-[1.02] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{stat.change}</span>
          </div>
          <h3 className="text-3xl font-black text-ink mb-1">{stat.value}</h3>
          <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">{stat.label}</p>
        </motion.div>
      ))}
    </div>

    {/* Class Management List */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass p-8 rounded-[3rem] border-white/60 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-ink flex items-center gap-3">
            <BookMarked className="w-6 h-6 text-indigo-600" /> Active Classes
          </h3>
          <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            { name: "Advanced Neural Biology", code: "BIO-402", count: 42, color: "bg-blue-500" },
            { name: "Organic Chemistry II", code: "CHM-201", count: 35, color: "bg-purple-500" },
            { name: "Global History & Ethics", code: "HIS-110", count: 47, color: "bg-amber-500" }
          ].map((cls, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-10 rounded-full ${cls.color}`} />
                <div>
                  <h4 className="font-bold text-ink group-hover:text-indigo-600 transition-colors">{cls.name}</h4>
                  <p className="text-[10px] text-ink-muted uppercase font-black">{cls.code} • {cls.count} Students</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-600" />
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-[3rem] border-white/60 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-ink flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-600" /> Content Queue
          </h3>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">4 Pending</span>
        </div>
        <div className="space-y-4">
          {[
            { title: "Weekly Quiz: Neural Synapses", date: `Today, ${formatISTTime(new Date(new Date().setHours(16, 0)))}`, status: "Ready" },
            { title: "Syllabus Update: Week 12", date: "Tomorrow", status: "Draft" },
            { title: "Study Pack: Reaction Mechanics", date: formatISTDate(new Date(new Date().setDate(new Date().getDate() + 1))), status: "Scheduled" }
          ].map((item, i) => (
            <div key={i} onClick={() => onNavigate("Quiz")} className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-neutral-200 hover:border-indigo-300 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-ink text-sm">{item.title}</h4>
                  <p className="text-[10px] text-ink-muted font-bold">{item.date}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                item.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'
              }`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TeacherDashboard = () => {
  const { user, profile, signOut } = useFirebase();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    { id: 1, title: "Class Admission", desc: "Alex Johnson requested to join BIO-402", time: "2 min ago", type: "request", icon: Users },
    { id: 2, title: "Quiz Completed", desc: "42 students finished 'Neural Synapses' quiz", time: "1 hour ago", type: "alert", icon: ListChecks },
    { id: 3, title: "AI Generated Content", desc: "New study guide ready for HIS-110", time: "3 hours ago", type: "success", icon: Sparkles },
    { id: 4, title: "System Update", desc: "Portal maintenance scheduled for midnight", time: "5 hours ago", type: "info", icon: Zap }
  ];

  const searchData = [
    { id: "cls1", type: "Class", title: "Advanced Neural Biology", detail: "BIO-402", tab: "Classrooms" },
    { id: "cls2", type: "Class", title: "Organic Chemistry II", detail: "CHM-201", tab: "Classrooms" },
    { id: "quiz1", type: "Quiz", title: "Neural Synapses", detail: "Active Queue", tab: "Quiz" },
    { id: "syll1", type: "Syllabus", title: "Week 12 Architect", detail: "Draft", tab: "Syllabus" },
    { id: "analytics1", type: "Analytics", title: "Performance Data", detail: "Overall Growth", tab: "Analytics" },
    { id: "set1", type: "Settings", title: "Portal Security", detail: "General Settings", tab: "Settings" }
  ];

  const filteredSearch = searchQuery 
    ? searchData.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden selection:bg-indigo-100 selection:text-indigo-600">
      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-slate-900/60 backdrop-blur-md"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-6 border-b border-neutral-100 flex items-center gap-4">
                <Search className="w-5 h-5 text-neutral-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search classes, quizzes, or students..." 
                  className="flex-1 bg-transparent text-lg font-bold text-ink outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-2 px-2 py-1 bg-neutral-100 rounded-lg text-[10px] font-black text-neutral-400 uppercase">
                  <Command className="w-3 h-3" /> ESC
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4">
                {searchQuery.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-ink">Smart Search</h3>
                    <p className="text-neutral-500 text-sm max-w-xs mx-auto">Quickly access any class, quiz, or educator tool across your portal.</p>
                  </div>
                ) : filteredSearch.length > 0 ? (
                  <div className="space-y-1">
                    {filteredSearch.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.tab);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-indigo-50 group transition-all"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            {item.type === "Class" ? <BookMarked className="w-5 h-5" /> : 
                             item.type === "Quiz" ? <ListChecks className="w-5 h-5" /> : 
                             item.type === "Analytics" ? <BarChart3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-ink group-hover:text-indigo-600">{item.title}</p>
                            <p className="text-[10px] uppercase font-black text-neutral-400 tracking-wider font-mono">{item.type} • {item.detail}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-neutral-400 font-bold">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 288 : 88 }}
        className="h-full border-r border-slate-800 p-4 flex flex-col gap-6 bg-slate-900 z-50 shadow-2xl relative"
      >
        <div className="flex items-center justify-between px-2 mb-4">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div 
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white italic">Reowl</h1>
                  <p className="text-[9px] uppercase tracking-widest text-indigo-400 font-black -mt-1">Portal</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="logo-small"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto"
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mb-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all mx-auto"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar dark-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "Dashboard"} onClick={() => setActiveTab("Dashboard")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Sparkles} label="REO Evaluator" active={activeTab === "REO"} onClick={() => setActiveTab("REO")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={MessageSquare} label="Neural Bridge" active={activeTab === "Bridge"} onClick={() => setActiveTab("Bridge")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={FileText} label="Syllabus Architect" active={activeTab === "Syllabus"} onClick={() => setActiveTab("Syllabus")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Users} label="Classrooms" active={activeTab === "Classrooms"} onClick={() => setActiveTab("Classrooms")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Command} label="Script Engine" active={activeTab === "Scripts"} onClick={() => setActiveTab("Scripts")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={ListChecks} label="Quiz Builder" active={activeTab === "Quiz"} onClick={() => setActiveTab("Quiz")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Sparkles} label="Reo Notes" active={activeTab === "Notes"} onClick={() => setActiveTab("Notes")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={BookMarked} label="Resource Hub" active={activeTab === "Resources"} onClick={() => setActiveTab("Resources")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "Analytics"} onClick={() => setActiveTab("Analytics")} collapsed={!isSidebarOpen} />
          
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5">
            <SidebarItem icon={Settings} label="Portal Settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} collapsed={!isSidebarOpen} />
          </div>
        </nav>

        <div className="mt-auto space-y-4 pt-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 p-2 rounded-2xl bg-slate-800/50 ${!isSidebarOpen ? "justify-center" : ""}`}>
             <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-400 bg-white flex items-center justify-center shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Teacher" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                )}
             </div>
             {isSidebarOpen && (
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{profile?.displayName || "Professor"}</p>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-tight">Verified Educator</p>
               </div>
             )}
          </div>
          <SidebarItem 
            icon={LogOut} 
            label="Sign Out" 
            variant="danger"
            onClick={() => signOut()} 
            collapsed={!isSidebarOpen} 
          />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-50/50 relative custom-scrollbar">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-10 flex items-center justify-between sticky top-0 z-[60]">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="relative max-w-md w-full group"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
              <div className="w-full bg-neutral-100/50 hover:bg-neutral-100 border border-neutral-200/60 rounded-xl py-2.5 pl-11 pr-4 text-sm text-neutral-500 font-medium text-left transition-all flex justify-between items-center">
                Search students or content...
                <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-black border border-neutral-400 rounded-md px-1 py-0.5">⌘ K</span>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-4 h-full">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2.5 rounded-xl transition-all relative ${
                  isNotificationsOpen ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-neutral-100 text-neutral-400"
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                    >
                      <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                        <h3 className="text-lg font-black text-ink">Notifications</h3>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">4 New</span>
                      </div>
                      <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {notifications.map(notif => (
                          <div key={notif.id} className="p-5 border-b border-neutral-50 hover:bg-indigo-50 transition-colors flex gap-4 items-start group cursor-pointer">
                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all ${
                              notif.type === 'request' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                              notif.type === 'alert' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white' :
                              'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            }`}>
                              <notif.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="font-bold text-sm text-ink truncate">{notif.title}</p>
                                <span className="text-[9px] font-black text-neutral-400 lowercase">{notif.time}</span>
                              </div>
                               <p className="text-xs text-neutral-500 font-medium line-clamp-2 leading-relaxed">{notif.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="w-full p-4 text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-colors uppercase tracking-widest border-t border-neutral-100">
                        Mark all as read
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 w-[1px] bg-neutral-200 mx-2" />
            <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-200 hover:scale-105 transition-all">
              Invite Students
            </button>
          </div>
        </header>

        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "Dashboard" && <TeacherHome onNavigate={setActiveTab} />}
              {activeTab === "REO" && <REOEvaluator />}
              {activeTab === "Bridge" && (
                <div className="max-w-4xl mx-auto py-10">
                  <div className="mb-10">
                    <h2 className="text-4xl font-black text-ink tracking-tighter italic uppercase">Neural <span className="text-indigo-600">Bridge</span></h2>
                    <p className="text-ink-muted font-bold text-sm uppercase tracking-widest">Active Teacher-Student Support Links</p>
                  </div>
                  <NeuralBridge 
                    recipientId="st123" 
                    recipientName="Student Registry" 
                    currentUser={user} 
                    isTeacherView={true} 
                  />
                </div>
              )}
              {activeTab === "Classrooms" && <Classrooms />}
              {activeTab === "Scripts" && <LessonScriptGenerator />}
              {activeTab === "Quiz" && <QuizBuilder />}
              {activeTab === "Notes" && <SmartNotes />}
              {activeTab === "Resources" && <ResourceManager />}
              {activeTab === "Analytics" && <TeacherAnalytics />}
              {activeTab === "Syllabus" && <SyllabusArchitect onNavigate={setActiveTab} />}
              {activeTab === "Settings" && <TeacherSettings />}
              {activeTab !== "Dashboard" && activeTab !== "Classrooms" && activeTab !== "Syllabus" && activeTab !== "Settings" && activeTab !== "Analytics" && activeTab !== "Quiz" && activeTab !== "Notes" && activeTab !== "Resources" && activeTab !== "Scripts" && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-ink">{activeTab} Module</h3>
                  <p className="text-ink-muted max-w-sm font-medium">This professional teaching tool is currently under development. Stay tuned!</p>
                  <button onClick={() => setActiveTab("Dashboard")} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100">Return to Dashboard</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
