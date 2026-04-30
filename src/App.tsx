/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Home,
  BookOpen,
  MessageSquare,
  ClipboardList,
  Calendar,
  FolderOpen,
  Settings,
  Bell,
  Sparkles,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Search,
  User as UserIcon,
  Zap,
  Brain,
  MoreVertical,
  CheckCircle2,
  X,
  Plus,
  Upload,
  Music,
  Clock,
  RotateCcw,
  Share2,
  FileText,
  Users,
  Lock,
  Moon,
  Sun,
  Monitor,
  Command,
  ArrowRight,
  Compass,
  Sword
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { AIChat } from "./components/AIChat";
import { ResourceManager } from "./components/ResourceManager";
import { AIChatPage } from "./components/AIChatPage";
import { StudyPlanner } from "./components/StudyPlanner";
import { Quizzes } from "./components/Quizzes";
import { SmartNotes } from "./components/SmartNotes";
import { Home as HomePage } from "./components/Home";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { KnowledgeValidator } from "./components/KnowledgeValidator";
import { SyllabusArchitect } from "./components/SyllabusArchitect";
import { FocusRooms } from "./components/FocusRooms";
import { CareerExplorer } from "./components/CareerExplorer";
import { KnowledgeArena } from "./components/KnowledgeArena";
import { NeuralBridge } from "./components/NeuralBridge";
import { AIAudioNotes } from "./components/AIAudioNotes";
import { StudentSettings } from "./components/StudentSettings";
import { formatISTDate, formatISTTime } from "./lib/utils";
import { RoleSelector } from "./components/RoleSelector";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { UsernameSetup } from "./components/UsernameSetup";
import { FirebaseProvider, useFirebase } from "./contexts/FirebaseContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db, handleFirestoreError, isDemoMode } from "./lib/firebase";

const SidebarItem = ({ icon: Icon, label, active = false, onClick, collapsed = false }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative ${
      active 
        ? "bg-white/10 text-white shadow-xl ring-1 ring-white/20 backdrop-blur-md" 
        : "text-white/60 hover:bg-white/5 hover:text-white"
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
    {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    {active && !collapsed && (
      <motion.div 
        layoutId="sidebar-active" 
        className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full" 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    )}
  </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-[2.5rem] overflow-hidden ${className}`}>
    {children}
  </div>
);

const AppContent = () => {
  const [activeTab, setActiveTab] = useState("Home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { user, profile, loading, signIn, signOut } = useFirebase();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user || isDemoMode) return;

    const q = query(
      collection(db!, "users", user.uid, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        icon: doc.data().type === 'CLASS_ADDED' ? BookOpen : 
              doc.data().type === 'RESOURCE_SHARED' ? FolderOpen : 
              doc.data().type === 'QUIZ_ASSIGNED' ? ClipboardList : Bell,
        time: doc.data().createdAt?.toDate() ? formatISTTime(doc.data().createdAt.toDate()) : "just now"
      }));
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, 'list' as any, `users/${user.uid}/notifications`);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || isDemoMode || notifications.length === 0) return;
    try {
      const batch = writeBatch(db!);
      notifications.forEach(n => {
        if (!n.read) {
          const ref = doc(db!, "users", user.uid, "notifications", n.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, 'write' as any, `users/${user.uid}/notifications`);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user || isDemoMode) return;
    try {
      const ref = doc(db!, "users", user.uid, "notifications", id);
      await updateDoc(ref, { read: true });
    } catch (error) {
      handleFirestoreError(error, 'write' as any, `users/${user.uid}/notifications/${id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const searchData = [
    { id: "note1", type: "Note", title: "Smart Notes: Biology", detail: "Lecture 8", tab: "Notes" },
    { id: "quiz1", type: "Quiz", title: "Neural Biology Exam", detail: "Upcoming", tab: "Quizzes" },
    { id: "res1", type: "Resource", title: "Organic Chem Guide", detail: "PDF Download", tab: "Resources" },
    { id: "plan1", type: "Planner", title: "Study Schedule", detail: "Week 12", tab: "Planner" },
    { id: "set1", type: "Settings", title: "Profile Security", detail: "Account Info", tab: "Settings" }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#FAF9FF] to-[#F5F9FF]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F0F4FF] via-[#FAF9FF] to-[#F5F9FF]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[3.5rem] border-white/60 shadow-3xl text-center max-w-md w-full"
        >
          <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-primary/30 rotate-3">
            <Sparkles className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-ink mb-3 italic">Reowl</h1>
          <p className="text-ink-muted mb-10 font-light leading-relaxed">The ultimate academic command center. Connect to save your syllabus, notes, and progress.</p>
          <button 
            onClick={async () => {
              try {
                await signIn();
              } catch (err) {
                console.error("Login failed:", err);
                alert("Sign-in failed. If using Firebase, please check the popup window or your network connection.");
              }
            }}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 tracking-tight"
          >
            <UserIcon className="w-5 h-5" /> Start with Google
          </button>
          <p className="mt-8 text-[10px] font-black uppercase text-ink-muted tracking-[0.2em]">Academic Integrity Assured</p>
        </motion.div>
      </div>
    );
  }

  // Handle Role Selection
  if (!profile?.role) {
    return <RoleSelector />;
  }

  // Handle Manual Name Setup
  if (!profile?.displayName) {
    return <UsernameSetup />;
  }

  // Handle Teacher Dashboard
  if (profile.role === "teacher") {
    return <TeacherDashboard />;
  }

  return (
    <div className="flex h-screen selection:bg-primary/20 selection:text-primary overflow-hidden relative">
      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-[#0D0B21]/60 backdrop-blur-md"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-7 border-b border-neutral-100 flex items-center gap-4">
                <Search className="w-6 h-6 text-primary" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search your notes, quizzes, or resources..." 
                  className="flex-1 bg-transparent text-xl font-bold text-ink outline-none"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-neutral-100 rounded-xl text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">
                  <Command className="w-3.5 h-3.5" /> ESC
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-5">
                {searchQuery.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
                      <Sparkles className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-ink">Search Reowl</h3>
                    <p className="text-ink-muted text-sm max-w-sm mx-auto leading-relaxed">Find any academic content, search through AI chat history, or jump directly back into your studies.</p>
                  </div>
                ) : filteredSearch.length > 0 ? (
                  <div className="space-y-1.5">
                    {filteredSearch.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.tab);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between p-5 rounded-[2rem] hover:bg-primary/5 group transition-all"
                      >
                        <div className="flex items-center gap-5 text-left">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-white flex items-center justify-center text-primary shadow-sm ring-1 ring-neutral-50">
                            {item.type === "Note" ? <Sparkles className="w-6 h-6" /> : 
                             item.type === "Quiz" ? <ClipboardList className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-ink text-lg group-hover:text-primary transition-colors leading-tight">{item.title}</p>
                            <p className="text-[10px] uppercase font-black text-ink-muted tracking-[0.2em] mt-1">{item.type} • {item.detail}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-2 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <p className="text-ink-muted font-bold text-lg">No results found for "{searchQuery}"</p>
                    <p className="text-ink-muted text-sm mt-1">Try searching for broader terms or categories.</p>
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
        className="h-full border-r border-white/10 px-4 py-8 flex flex-col gap-6 bg-[#0D0B21]/95 backdrop-blur-3xl hidden md:flex z-50 overflow-hidden text-white relative"
      >
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20 shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <h1 className="text-xl font-black tracking-tight text-white italic leading-none">Reowl</h1>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-black mt-0.5">Student Hub</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 mb-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all mx-auto shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <nav className="flex-1 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar dark-scrollbar pr-1">
          <SidebarItem icon={Home} label="Home" active={activeTab === "Home"} onClick={() => setActiveTab("Home")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Sparkles} label="Smart Notes" active={activeTab === "Smart Notes" || activeTab === "Notes"} onClick={() => setActiveTab("Notes")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={FolderOpen} label="Resources" active={activeTab === "Resources"} onClick={() => setActiveTab("Resources")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={MessageSquare} label="AI Chat" active={activeTab === "AI Chat"} onClick={() => setActiveTab("AI Chat")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Plus} label="Quizzes" active={activeTab === "Quizzes"} onClick={() => setActiveTab("Quizzes")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Music} label="Audio Notes" active={activeTab === "Audio Notes"} onClick={() => setActiveTab("Audio Notes")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={MessageSquare} label="Mentor Bridge" active={activeTab === "Bridge"} onClick={() => setActiveTab("Bridge")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Brain} label="Neural Buddy" active={activeTab === "Buddy"} onClick={() => setActiveTab("Buddy")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Sword} label="Knowledge Arena" active={activeTab === "Arena"} onClick={() => setActiveTab("Arena")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={ClipboardList} label="Study Planner" active={activeTab === "Planner"} onClick={() => setActiveTab("Planner")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Compass} label="Career Explorer" active={activeTab === "Career Explorer"} onClick={() => setActiveTab("Career Explorer")} collapsed={!isSidebarOpen} />
          <div className="pt-2 mt-2 border-t border-white/10" />
          <SidebarItem icon={Share2} label="Knowledge Graph" active={activeTab === "Graph"} onClick={() => setActiveTab("Graph")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={FileText} label="Syllabus Architect" active={activeTab === "Syllabus"} onClick={() => setActiveTab("Syllabus")} collapsed={!isSidebarOpen} />
          <SidebarItem icon={Users} label="Focus Rooms" active={activeTab === "Focus Rooms"} onClick={() => setActiveTab("Focus Rooms")} collapsed={!isSidebarOpen} />
          <div className="pt-4 mt-4 border-t border-white/10">
            <SidebarItem icon={Settings} label="Settings" active={activeTab === "Settings"} onClick={() => setActiveTab("Settings")} collapsed={!isSidebarOpen} />
          </div>
        </nav>

        <div className="mt-auto space-y-6">
          <div className="flex items-center gap-3 pl-2 group cursor-pointer p-2 rounded-2xl hover:bg-white/10 transition-colors overflow-hidden">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 shadow-sm shrink-0 overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5 text-white/60" />
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight truncate">{profile?.displayName || "Scholar"}</p>
                <p className="text-[10px] text-white/50 font-bold tracking-tight truncate">Alpha Member • lvl {profile?.stats?.level || 1}</p>
              </div>
            )}
            {isSidebarOpen && <MoreVertical className="w-4 h-4 text-white/40 shrink-0" />}
          </div>
          
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-100 hover:bg-red-500/10 text-sm transition-colors glass-dark rounded-2xl border-white/10 overflow-hidden shadow-2xl group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            {isSidebarOpen && <span className="font-bold">Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Top Header */}
        <header className="h-20 border-b border-white/20 bg-white/10 backdrop-blur-3xl px-10 flex items-center justify-between sticky top-0 z-10 text-ink">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {["Home", "Notes", "Chat", "Quizzes", "Buddy", "Audio Notes", "Arena", "Planner", "Resources"].map(t => (
                <button 
                  key={t} 
                  className={`text-sm font-bold transition-all ${t === activeTab || (t === "Notes" && activeTab === "Smart Notes") || (t === "Chat" && activeTab === "AI Chat") || (t === "Arena" && activeTab === "Arena") || (t === "Buddy" && activeTab === "Buddy") || (t === "Audio Notes" && activeTab === "Audio Notes") ? "text-primary border-b-2 border-primary pb-0.5" : "text-ink-muted hover:text-ink"}`}
                  onClick={() => setActiveTab(t === "Chat" ? "AI Chat" : t)}
                >
                  {t}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-xl hover:bg-white/20 text-ink-muted flex items-center gap-2 group transition-all"
              >
                <Search className="w-5 h-5 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Search</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2.5 rounded-xl transition-all relative ${
                    isNotificationsOpen ? "bg-primary text-white shadow-xl" : "hover:bg-white/20 text-ink-muted"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[7px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-96 bg-white rounded-[3rem] shadow-3xl border border-white z-50 overflow-hidden"
                      >
                        <div className="p-8 pb-6 border-b border-neutral-50 flex items-center justify-between">
                          <h3 className="text-xl font-black text-ink">Alerts</h3>
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">Live</span>
                        </div>
                        <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                          {notifications.map(notif => (
                            <div 
                              key={notif.id} 
                              onClick={() => markAsRead(notif.id)}
                              className={`p-6 border-b border-neutral-50 hover:bg-primary/5 transition-all flex gap-5 items-start group cursor-pointer relative overflow-hidden ${!notif.read ? "bg-primary/[0.02]" : ""}`}
                            >
                              <div className={`absolute inset-y-0 left-0 w-1 bg-primary transition-transform origin-top ${!notif.read ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`} />
                              <div className={`w-12 h-12 rounded-[1.25rem] shrink-0 flex items-center justify-center transition-all ${
                                notif.type === 'CLASS_ADDED' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' :
                                notif.type === 'QUIZ_ASSIGNED' ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' :
                                'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'
                              }`}>
                                <notif.icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className={`font-bold text-sm text-ink truncate group-hover:text-primary transition-colors ${!notif.read ? "text-primary" : ""}`}>{notif.title}</p>
                                  <span className="text-[9px] font-black text-ink-muted lowercase opacity-60 tracking-tight">{notif.time}</span>
                                </div>
                                <p className="text-[11px] text-ink-muted font-medium line-clamp-2 leading-relaxed tracking-tight group-hover:text-ink transition-colors">{notif.message || notif.desc}</p>
                              </div>
                            </div>
                          ))}
                          {notifications.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                              <Bell className="w-10 h-10 text-neutral-200 mx-auto" />
                              <p className="text-sm font-bold text-ink-muted">All caught up!</p>
                            </div>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="w-full p-6 text-[10px] font-black text-primary hover:bg-primary/5 transition-colors uppercase tracking-[0.3em] border-t border-neutral-50"
                          >
                            Mark all as read
                          </button>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-white/20" />
            <div className="w-10 h-10 rounded-full border-2 border-primary/40 shadow-xl overflow-hidden bg-primary/10 flex items-center justify-center">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "Home" && <HomePage onNavigate={setActiveTab} />}
              {activeTab === "Settings" && <StudentSettings />}
              {activeTab === "Resources" && <ResourceManager />}
              {activeTab === "Notes" || activeTab === "Smart Notes" ? <SmartNotes /> : null}
              {activeTab === "AI Chat" ? <AIChatPage /> : null}
              {activeTab === "Planner" || activeTab === "Study Planner" ? <StudyPlanner /> : null}
              {activeTab === "Quizzes" ? <Quizzes /> : null}
              {activeTab === "Audio Notes" && <AIAudioNotes />}
              {activeTab === "Arena" && <KnowledgeArena />}
              {activeTab === "Buddy" && <KnowledgeValidator />}
              {activeTab === "Bridge" && (
                <div className="max-w-4xl mx-auto py-10 px-6">
                  <div className="mb-10 text-center">
                    <h2 className="text-4xl font-black text-ink tracking-tighter italic uppercase">Mentor <span className="text-primary">Bridge</span></h2>
                    <p className="text-ink-muted font-bold text-sm uppercase tracking-widest">Connect with your Professor via Secure Neural Link</p>
                  </div>
                  <NeuralBridge 
                    recipientId="teacher_primary" 
                    recipientName="Professor Reowl" 
                    currentUser={user} 
                    isTeacherView={false} 
                  />
                </div>
              )}
              {activeTab === "Career Explorer" && <CareerExplorer />}
              {activeTab === "Graph" && <KnowledgeGraph />}
              {activeTab === "Syllabus" && <SyllabusArchitect onNavigate={setActiveTab} />}
              {activeTab === "Focus Rooms" && <FocusRooms />}
              {activeTab !== "Home" && 
               activeTab !== "Settings" && 
               activeTab !== "Resources" && 
               activeTab !== "AI Chat" && 
               activeTab !== "Planner" && 
               activeTab !== "Study Planner" && 
               activeTab !== "Quizzes" && 
               activeTab !== "Career Explorer" &&
               activeTab !== "Notes" && 
               activeTab !== "Smart Notes" && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-ink">{activeTab} Page Coming Soon</h3>
                  <p className="text-ink-muted max-w-sm">We're currently building our this section of Reowl. Check back soon!</p>
                  <button onClick={() => setActiveTab("Resources")} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Go to Resources</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Reo Drawer */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Floating Chat Trigger */}
      {!isChatOpen && (
        <motion.button 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center z-50 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-20 group-hover:translate-y-0 transition-transform duration-500" />
          <MessageSquare className="w-8 h-8 relative z-10" />
          <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-4 border-surface" />
        </motion.button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <FirebaseProvider>
        <AppContent />
      </FirebaseProvider>
    </ThemeProvider>
  );
}
