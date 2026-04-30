import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  ChevronRight, 
  BookOpen, 
  Users2, 
  GraduationCap,
  MessageSquare,
  ArrowLeft,
  Mail,
  Zap,
  TrendingUp,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  X,
  Check,
  Loader2,
  CheckCircle2,
  Sparkles,
  FileText,
  Trash,
  ListChecks
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import { useFirebase } from "../contexts/FirebaseContext";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, isDemoMode } from "../lib/firebase";

interface Student {
  id: string;
  name: string;
  email: string;
  status?: "Active" | "At Risk" | "Exceling";
  progress?: number;
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
  studentIds: string[];
  code: string;
  teacherId: string;
  createdAt: any;
  studentData?: Student[];
}

const classroomData: Classroom[] = [
  {
    id: "1",
    name: "Advanced Neural Biology",
    subject: "Biology",
    studentIds: ["s1", "s2", "s3", "s4"],
    code: "BIO-402",
    teacherId: "mock-teacher",
    createdAt: null,
    studentData: [
      { id: "s1", name: "Alex Johnson", email: "alex.j@uni.edu", status: "Exceling", progress: 94 },
      { id: "s2", name: "Maria Garcia", email: "m.garcia@uni.edu", status: "Active", progress: 78 },
      { id: "s3", name: "Sam Wilson", email: "s.wilson@uni.edu", status: "At Risk", progress: 45 },
      { id: "s4", name: "Elena Petrov", email: "e.petrov@uni.edu", status: "Exceling", progress: 89 },
    ]
  },
  {
    id: "2",
    name: "Organic Chemistry II",
    subject: "Chemistry",
    studentIds: [],
    code: "CHM-201",
    teacherId: "mock-teacher",
    createdAt: null
  },
  {
    id: "3",
    name: "Global History & Ethics",
    subject: "History",
    studentIds: [],
    code: "HIS-110",
    teacherId: "mock-teacher",
    createdAt: null
  }
];

const ClassAnalytics = ({ classroom }: { classroom: Classroom }) => {
  // Mock data for analytics
  const topicData = [
    { subject: 'Mitosis', A: 45, B: 110, fullMark: 150 },
    { subject: 'Genetics', A: 85, B: 130, fullMark: 150 },
    { subject: 'Synapses', A: 65, B: 130, fullMark: 150 },
    { subject: 'Metabolism', A: 90, B: 100, fullMark: 150 },
    { subject: 'Cell Bio', A: 75, B: 120, fullMark: 150 },
  ];

  const distributionData = [
    { name: '0-25%', value: 2 },
    { name: '26-50%', value: 8 },
    { name: '51-75%', value: 15 },
    { name: '76-100%', value: 17 },
  ];

  const COLORS = ['#F43F5E', '#F59E0B', '#6366F1', '#10B981'];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Topic Mastery Radar */}
      <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-6">
        <h4 className="font-bold text-ink flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" /> Topic Mastery Focus
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topicData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
              <Radar
                name="Performance"
                dataKey="A"
                stroke="#6366F1"
                fill="#6366F1"
                fillOpacity={0.6}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-ink-muted text-center font-medium italic">
          Values represent average class performance across core neural modules.
        </p>
      </div>

      {/* Progress Distribution Bar */}
      <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-6">
        <h4 className="font-bold text-ink flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Student Progress Distribution
        </h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6">
          {distributionData.map((d, i) => (
             <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[9px] font-black text-ink-muted uppercase tracking-tight">{d.name}</span>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Classrooms = () => {
  const { user, profile } = useFirebase();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [detailedTab, setDetailedTab] = useState<"roster" | "analytics" | "resources">("roster");
  const [sharedResources, setSharedResources] = useState<any[]>([]);

  // Fetch shared resources for selected class
  useEffect(() => {
    if (!selectedClass || !user || isDemoMode) return;

    const q = query(
      collection(db!, "classrooms", selectedClass.id, "sharedResources"),
      orderBy("sharedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSharedResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, "list" as any, `classrooms/${selectedClass.id}/sharedResources`);
    });

    return () => unsubscribe();
  }, [selectedClass, user]);

  // Create Class States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassSubject, setNewClassSubject] = useState("");
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user || isDemoMode) return;

    const q = query(
      collection(db!, "classrooms"),
      where("teacherId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const classData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Classroom[];
      
      // For each class, we should ideally fetch student data, 
      // but for list view we just need the count
      setClassrooms(classData);
    }, (error) => {
      handleFirestoreError(error, 'list', "classrooms");
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch students for creation modal
  useEffect(() => {
    if (isCreateModalOpen && !isDemoMode) {
      const fetchStudents = async () => {
        try {
          const q = query(collection(db!, "users"), where("role", "==", "student"));
          const snap = await getDocs(q);
          setAllStudents(snap.docs.map(d => ({
            id: d.id,
            name: d.data().displayName || "Anonymous Student",
            email: d.data().email || ""
          })));
        } catch (error) {
          handleFirestoreError(error, 'list' as any, "users");
        }
      };
      fetchStudents();
    }
  }, [isCreateModalOpen]);

  const handleCreateClass = async () => {
    if (!newClassName || !newClassSubject || !user) return;
    setIsCreating(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    if (isDemoMode) {
      setClassrooms(prev => [{
        id: "demo-" + Date.now(),
        name: newClassName,
        subject: newClassSubject,
        code,
        teacherId: user.uid,
        studentIds: selectedStudentIds,
        createdAt: new Date()
      }, ...prev]);
      setIsCreateModalOpen(false);
      setNewClassName("");
      setNewClassSubject("");
      setSelectedStudentIds([]);
      alert("Demo classroom created successfully!");
      setIsCreating(false);
      return;
    }
    
    try {
      const classRef = await addDoc(collection(db!, "classrooms"), {
        name: newClassName,
        subject: newClassSubject,
        code,
        teacherId: user.uid,
        studentIds: selectedStudentIds,
        createdAt: serverTimestamp()
      });

      // Send notifications to students
      const notificationPromises = selectedStudentIds.map(studentId => 
        addDoc(collection(db!, "users", studentId, "notifications"), {
          userId: studentId,
          title: "New Classroom Invitation",
          message: `Teacher ${profile?.displayName || "someone"} has added you to the class: ${newClassName} (${code})`,
          type: "CLASS_ADDED",
          read: false,
          createdAt: serverTimestamp(),
          metadata: { classId: classRef.id, code }
        })
      );

      await Promise.all(notificationPromises);

      setIsCreateModalOpen(false);
      setNewClassName("");
      setNewClassSubject("");
      setSelectedStudentIds([]);
      alert("Classroom created successfully!");
    } catch (error) {
      handleFirestoreError(error, 'create', "classrooms");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!selectedClass || !window.confirm("Are you sure you want to remove this resource from the classroom?")) return;
    
    if (isDemoMode) {
      setSharedResources(prev => prev.filter(r => r.id !== resourceId));
      return;
    }

    try {
      await deleteDoc(doc(db!, "classrooms", selectedClass.id, "sharedResources", resourceId));
    } catch (error) {
      handleFirestoreError(error, "delete" as any, `classrooms/${selectedClass.id}/sharedResources/${resourceId}`);
    }
  };

  const handleDeleteClassroom = async (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm("Delete this classroom and all its data? This cannot be undone.")) return;
    
    if (isDemoMode) {
      setClassrooms(prev => prev.filter(c => c.id !== classId));
      return;
    }

    try {
      await deleteDoc(doc(db!, "classrooms", classId));
    } catch (error) {
      handleFirestoreError(error, "delete", `classrooms/${classId}`);
    }
  };

  const filteredClasses = classrooms.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <AnimatePresence mode="wait">
        {!selectedClass ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-black text-ink tracking-tight">Your Classrooms</h2>
                <p className="text-ink-muted font-light mt-1">Monitor and manage your academic cohorts.</p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-xs uppercase tracking-widest"
              >
                <Plus className="w-5 h-5" />
                Create New Class
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search class by name or code..."
                   className="w-full bg-white border border-neutral-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredClasses.map((cls) => (
                <motion.div 
                  key={cls.id}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedClass(cls)}
                  className="glass p-8 rounded-[2.5rem] border-white/60 shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => handleDeleteClassroom(cls.id, e)}
                        className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                         <Trash className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-neutral-300 hover:text-ink transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-ink mb-1 group-hover:text-indigo-600 transition-colors">{cls.name}</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">{cls.code} • {cls.subject}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-neutral-400" />
                       <span className="text-sm font-bold text-ink">{cls.studentIds?.length || 0} Students</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-indigo-600 translate-x-0 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* Detailed View Header */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedClass(null)}
                className="w-12 h-12 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-ink hover:bg-neutral-50 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-4xl font-black text-ink tracking-tight">{selectedClass.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{selectedClass.code}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                  <span className="text-sm font-medium text-ink-muted">{selectedClass.studentIds?.length || 0} Students Enrolled</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Analytics Sidebar */}
              <div className="space-y-8">
                <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-6">
                  <h4 className="font-bold text-ink flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Mastery Pulse
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: "Quiz Accuracy", val: 82, color: "bg-emerald-500" },
                      { label: "Engagement Rate", val: 64, color: "bg-indigo-500" },
                      { label: "Assignment Completion", val: 91, color: "bg-blue-500" }
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                           <span className="text-ink-muted">{stat.label}</span>
                           <span className="text-ink">{stat.val}%</span>
                         </div>
                         <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${stat.val}%` }}
                             className={`h-full ${stat.color} rounded-full`}
                           />
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass p-8 rounded-[2.5rem] border-white/60 shadow-xl bg-indigo-600 text-white">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-white/50" /> Reo Insights
                  </h4>
                  <p className="text-xs text-white/80 leading-relaxed font-light">
                    Your class is struggling with **"Mitotic Regulation"**. Consider deploying a targeted focus session or quiz for next week.
                  </p>
                  <button className="w-full mt-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xs transition-colors backdrop-blur-md">
                    Generate Review Pack
                  </button>
                </div>
              </div>

              {/* Student Roster / Analytics Container */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center justify-between px-4">
                  <div className="flex bg-neutral-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setDetailedTab("roster")}
                      className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${detailedTab === "roster" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
                    >
                      Roster
                    </button>
                    <button 
                      onClick={() => setDetailedTab("analytics")}
                      className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${detailedTab === "analytics" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
                    >
                      Analytics
                    </button>
                    <button 
                      onClick={() => setDetailedTab("resources")}
                      className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${detailedTab === "resources" ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"}`}
                    >
                      Resources
                    </button>
                  </div>
                  
                  {detailedTab === "roster" && (
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                        <input 
                          type="text" 
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="Search students..."
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                         <button className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-bold text-ink transition-colors">Export CSV</button>
                         <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20">Invite Student</button>
                      </div>
                    </div>
                  )}
                </div>

                  <AnimatePresence mode="wait">
                    {detailedTab === "roster" ? (
                      <motion.div 
                        key="roster"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass rounded-[3rem] border-white/60 shadow-xl overflow-hidden"
                      >
                        <table className="w-full text-left">
                          {/* ... table content remains same ... */}
                          <thead className="bg-neutral-50/50 border-b border-neutral-100">
                            <tr>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Student</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Status</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Mastery</th>
                              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {(() => {
                              const filtered = (selectedClass.studentData || []).filter(s => 
                                s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                              );

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                      <Users2 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                                      <p className="text-sm font-bold text-ink-muted">
                                        {studentSearchQuery ? `No students matching "${studentSearchQuery}"` : "No students enrolled in this class yet."}
                                      </p>
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((student) => (
                                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm overflow-hidden">
                                        <img src={`https://picsum.photos/seed/${student.id}/100/100`} />
                                      </div>
                                      <div>
                                        <p className="font-bold text-ink">{student.name}</p>
                                        <p className="text-[10px] text-ink-muted font-medium italic">{student.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                      student.status === "Exceling" ? "bg-emerald-50 text-emerald-600" :
                                      student.status === "At Risk" ? "bg-rose-50 text-rose-600" :
                                      "bg-blue-50 text-blue-600"
                                    }`}>
                                      {student.status}
                                    </span>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 min-w-[80px] h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full transition-all duration-1000 ${
                                            student.progress > 85 ? "bg-emerald-500" : student.progress > 60 ? "bg-indigo-500" : "bg-rose-500"
                                          }`}
                                          style={{ width: `${student.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-black text-ink">{student.progress}%</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-neutral-100 transition-all">
                                        <Mail className="w-4 h-4" />
                                      </button>
                                      <button className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-neutral-100 transition-all text-[10px] font-black">
                                        VIEW
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </motion.div>
                    ) : detailedTab === "analytics" ? (
                      <motion.div
                        key="analytics"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <ClassAnalytics classroom={selectedClass} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="resources"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        {sharedResources.length === 0 ? (
                          <div className="md:col-span-2 py-20 text-center glass rounded-[3rem] border-white/60">
                             <FileText className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                             <p className="text-sm font-bold text-ink-muted">No resources shared with this class yet.</p>
                          </div>
                        ) : (
                          sharedResources.map((res) => (
                            <div key={res.id} className="glass p-6 rounded-[2rem] border-white/60 shadow-lg flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${res.type === "QUIZ" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}>
                                  {res.type === "QUIZ" ? <ListChecks className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                                </div>
                                <div>
                                  <h4 className="font-bold text-ink">{res.title}</h4>
                                  <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest">{res.type}</p>
                                </div>
                              </div>
                               {profile?.role === "teacher" && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteResource(res.id); }}
                                  className="p-3 text-neutral-300 hover:text-red-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
                                  title="Remove resource"
                                >
                                  <Trash className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass p-10 rounded-[3rem] border-white/60 shadow-2xl space-y-8 max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                    <Plus className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-ink">New Cohort</h3>
                    <p className="text-sm text-ink-muted">Set up a new academic classroom.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-3 hover:bg-neutral-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink-muted tracking-widest px-1">Class Name</label>
                    <input 
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="e.g. Advanced Physics II"
                      className="w-full bg-white/40 border border-neutral-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 ring-indigo-500/5 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-ink-muted tracking-widest px-1">Subject Area</label>
                    <select 
                      value={newClassSubject}
                      onChange={(e) => setNewClassSubject(e.target.value)}
                      className="w-full bg-white/40 border border-neutral-100 rounded-2xl p-4 text-sm font-medium focus:ring-4 ring-indigo-500/5 outline-none appearance-none"
                    >
                      <option value="">Select Subject</option>
                      <option value="Physics">Physics</option>
                      <option value="Biology">Biology</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-ink-muted tracking-widest">Enroll Students ({selectedStudentIds.length})</label>
                    <span className="text-[10px] font-bold text-indigo-600 italic">Students currently registered in Reowl</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                    {allStudents.map(student => (
                      <button 
                        key={student.id}
                        onClick={() => {
                          setSelectedStudentIds(prev => 
                            prev.includes(student.id) 
                              ? prev.filter(id => id !== student.id)
                              : [...prev, student.id]
                          );
                        }}
                        className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          selectedStudentIds.includes(student.id)
                            ? "bg-indigo-50 border-indigo-600 shadow-sm"
                            : "bg-white/40 border-transparent hover:border-indigo-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                            selectedStudentIds.includes(student.id) ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-400"
                          }`}>
                            {student.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-ink text-sm">{student.name}</p>
                            <p className="text-[10px] text-ink-muted italic">{student.email}</p>
                          </div>
                        </div>
                        {selectedStudentIds.includes(student.id) ? (
                          <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-neutral-100 group-hover:border-indigo-200 transition-colors" />
                        )}
                      </button>
                    ))}
                    {allStudents.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-neutral-100 rounded-[2rem]">
                        <Users2 className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-ink-muted">No students found in the database.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-neutral-100">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-4 border border-neutral-100 text-ink font-bold rounded-2xl hover:bg-neutral-50 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  disabled={!newClassName || !newClassSubject || isCreating}
                  onClick={handleCreateClass}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-indigo-300" />}
                  {isCreating ? "Deploying..." : "Create Class"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

  );
};
