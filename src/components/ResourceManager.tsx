/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, where, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, isDemoMode } from "../lib/firebase";
import { useFirebase } from "../contexts/FirebaseContext";
import { motion, AnimatePresence } from "motion/react";
import { getGeminiModel } from "../lib/gemini";
import { formatISTTime, formatISTDateTime } from "../lib/utils";

import { 
  FileText, 
  Search, 
  Upload, 
  MoreVertical, 
  Filter, 
  Clock, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  FileCode,
  Folder,
  CheckCircle2,
  Bookmark,
  Loader2,
  ClipboardList,
  MessageSquare,
  BookOpen,
  PlayCircle,
  ExternalLink,
  Sparkles,
  Share2,
  Globe,
  Users
} from "lucide-react";

interface Suggestion {
  id: string;
  title: string;
  provider: string;
  type: "BOOK" | "COURSE";
  subject: string;
  url: string;
}

const recommendations: Record<string, Suggestion[]> = {
  "Chemistry": [
    { id: "c1", title: "Organic Chemistry: Structure and Function", provider: "Vollhardt & Schore", type: "BOOK", subject: "Chemistry", url: "#" },
    { id: "c2", title: "Chemistry of Life", provider: "edX / Harvard", type: "COURSE", subject: "Chemistry", url: "#" }
  ],
  "Biology": [
    { id: "b1", title: "Campbell Biology", provider: "Lisa Urry et al.", type: "BOOK", subject: "Biology", url: "#" },
    { id: "b2", title: "Introduction to Genetics", provider: "Coursera / Stanford", type: "COURSE", subject: "Biology", url: "#" }
  ],
  "Math": [
    { id: "m1", title: "Calculus", provider: "James Stewart", type: "BOOK", subject: "Math", url: "#" },
    { id: "m2", title: "Differential Equations Masterclass", provider: "MIT OpenCourseWare", type: "COURSE", subject: "Math", url: "#" }
  ],
  "Data Science": [
    { id: "ds1", title: "Hands-On Machine Learning", provider: "Aurélien Géron", type: "BOOK", subject: "Data Science", url: "#" },
    { id: "ds2", title: "Data Science Specialization", provider: "Coursera / Johns Hopkins", type: "COURSE", subject: "Data Science", url: "#" }
  ],
  "History": [
    { id: "h1", title: "Sapiens: A Brief History of Humankind", provider: "Yuval Noah Harari", type: "BOOK", subject: "History", url: "#" },
    { id: "h2", title: "Modern World History", provider: "Khan Academy", type: "COURSE", subject: "History", url: "#" }
  ]
};

interface Resource {
  id: string;
  title: string;
  type: "PDF" | "DOCX" | "QUIZ" | "FOLDER";
  subject: string;
  time: string;
  size?: string;
  isBookmarked?: boolean;
  insight?: {
    summary: string;
    topics: string[];
    difficulty: string;
  };
}

const resources: Resource[] = [
  { id: "1", title: "Organic Chemistry Notes", type: "PDF", subject: "Chemistry", time: "10 mins ago", size: "1.2 MB" },
  { id: "2", title: "History of Biology", type: "PDF", subject: "Biology", time: "1 hour ago", size: "335 KB" },
  { id: "3", title: "Differential Equations Guide", type: "PDF", subject: "Math", time: "3 days ago", size: "2.5 MB" },
  { id: "4", title: "Data Science Cheat Sheet", type: "PDF", subject: "Data Science", time: "1 week ago", size: "926 KB" },
  { id: "5", title: "Chemistry Flashcards", type: "QUIZ", subject: "Chemistry", time: "2 weeks ago", size: "584 KB", isBookmarked: true },
  { id: "6", title: "Math Practice Problems", type: "DOCX", subject: "Math", time: "2 weeks ago", size: "507 KB" },
];

const Tag = ({ children, color = "primary" }: { children: React.ReactNode; color?: string }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
    color === "primary" ? "bg-primary/5 text-primary border border-primary/10" : "bg-white/40 text-neutral-500 border border-white/60"
  }`}>
    {children}
  </span>
);

export const ResourceManager = () => {
  const { user, profile } = useFirebase();
  const isTeacher = profile?.role === "teacher";
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [resourceToShare, setResourceToShare] = useState<Resource | null>(null);

  useEffect(() => {
    if (isTeacher && user && !isDemoMode) {
      const q = query(
        collection(db!, "classrooms"),
        where("teacherId", "==", user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setClassrooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, "list" as any, "classrooms");
      });
      return () => unsubscribe();
    }
  }, [isTeacher, user]);

  const handleShare = async () => {
    if (!selectedClassId || !resourceToShare || !user) return;
    setIsSharing(true);

    if (isDemoMode) {
      alert("Resource shared successfully (demo)!");
      setIsShareModalOpen(false);
      setResourceToShare(null);
      setIsSharing(false);
      return;
    }

    try {
      const selectedClass = classrooms.find(c => c.id === selectedClassId);
      await addDoc(collection(db!, "classrooms", selectedClassId, "sharedResources"), {
        title: resourceToShare.title,
        type: "FILE",
        content: { ...resourceToShare },
        teacherId: user.uid,
        classId: selectedClassId,
        studentIds: selectedClass?.studentIds || [],
        sharedAt: serverTimestamp()
      });
      alert("Resource shared successfully with the class!");
      setIsShareModalOpen(false);
      setResourceToShare(null);
    } catch (error) {
      console.error("Sharing failed:", error);
      handleFirestoreError(error, "write" as any, `/classrooms/${selectedClassId}/sharedResources`);
    } finally {
      setIsSharing(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Home");
  const [localResources, setLocalResources] = useState<Resource[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [resourceQuestion, setResourceQuestion] = useState("");
  const [resourceAnswer, setResourceAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [sharedResources, setSharedResources] = useState<Resource[]>([]);
  const sharedUnsubscribes = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!user || isDemoMode || profile?.role !== "student") return;

    // 1. Find classrooms student is in
    const classesQuery = query(
      collection(db!, "classrooms"),
      where("studentIds", "array-contains", user.uid)
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      // Clear existing sub-listeners
      sharedUnsubscribes.current.forEach(u => u());
      sharedUnsubscribes.current = [];

      const classIds = snapshot.docs.map(doc => doc.id);
      
      // For each class, subscribe to sharedResources
      classIds.forEach(classId => {
        const sharedQuery = query(
          collection(db!, "classrooms", classId, "sharedResources"),
          where("studentIds", "array-contains", user.uid),
          orderBy("sharedAt", "desc")
        );
        
        const unsub = onSnapshot(sharedQuery, (resSnap) => {
          const resData = resSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data.content,
              time: data.sharedAt?.toDate() ? formatISTDateTime(data.sharedAt.toDate()) : "Just now",
              isShared: true,
              teacherId: data.teacherId
            };
          });
          
          setSharedResources(prev => {
            // Merge and dedup
            const filtered = prev.filter(p => !resData.find(r => r.id === p.id));
            return [...filtered, ...resData].sort((a, b) => b.time.localeCompare(a.time));
          });
        }, (error) => {
          handleFirestoreError(error, 'list', `/classrooms/${classId}/sharedResources`);
        });
        sharedUnsubscribes.current.push(unsub);
      });
    }, (error) => {
      handleFirestoreError(error, 'list', "classrooms");
    });

    return () => {
      unsubscribeClasses();
      sharedUnsubscribes.current.forEach(u => u());
      sharedUnsubscribes.current = [];
    };
  }, [user, profile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const processAndUploadFile = async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    try {
      // 1. Read file as base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // 2. Get AI Insight
      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { text: `Analyze this study resource: ${file.name}. Provide a brief summary, key topics, and estimated difficulty level. Return as JSON with keys: summary, topics (array), difficulty.` },
            { inlineData: { mimeType: file.type || "application/pdf", data: base64 } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const insightText = response.text;
      let insight = { summary: "No summary available", topics: [], difficulty: "Unknown" };
      try {
        const parsed = JSON.parse(insightText || "{}");
        insight = {
          summary: parsed.summary || "No summary",
          topics: parsed.topic || [],
          difficulty: parsed.difficulty || "Unknown"
        };
      } catch (e) {
        console.warn("AI parse failed", insightText);
      }

      const type = file.type.includes("pdf") ? "PDF" : 
                   file.type.includes("word") || file.name.endsWith(".docx") ? "DOCX" : "PDF";

      if (isDemoMode) {
        setLocalResources(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          title: file.name,
          type: type as any,
          subject: activeCategory === "Home" ? "General" : activeCategory,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          time: "Just now",
          isBookmarked: false,
          insight
        }, ...prev]);
        alert(`Reo analyzed your file! Summary: ${insight.summary}`);
        return;
      }

      await addDoc(collection(db!, "users", user.uid, "resources"), {
        userId: user.uid,
        title: file.name,
        type: type,
        subject: activeCategory === "Home" ? "General" : activeCategory,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        isBookmarked: false,
        createdAt: serverTimestamp(),
        insight
      });
      alert(`Resource "${file.name}" indexed and analyzed by Reo!`);
    } catch (error) {
      console.error("Upload/Analysis Error:", error);
      handleFirestoreError(error, 'write', `/users/${user.uid}/resources`);
    } finally {
      setIsUploading(false);
    }
  };

  const askAboutResource = async () => {
    if (!selectedResource || !resourceQuestion.trim()) return;
    setIsAsking(true);
    setResourceAnswer("");
    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResourceAnswer("Based on the document metadata, this resource focuses heavily on neural architectures and backpropagation algorithms. Would you like a deeper explanation of any specific part?");
        return;
      }

      const prompt = `Context: This is a study resource titled "${selectedResource.title}". Summary: ${selectedResource.insight?.summary}. User Question: ${resourceQuestion}`;
      
      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });
      
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      setResourceAnswer((response as any).text || "Reo is slightly confused by the depth of this document. Try rephrasing!");
    } catch (error) {
      console.error("Resource Q&A failed:", error);
    } finally {
      setIsAsking(false);
    }
  };

  useEffect(() => {
    if (!user || isDemoMode) {
      if (isDemoMode) {
        setLocalResources(resources); // Fallback to initial dummy data in demo mode
      }
      return;
    }

    const q = query(
      collection(db!, "users", user.uid, "resources"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resourcesData = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeLabel = "Just now";
        if (data.createdAt?.toDate()) {
          timeLabel = formatISTDateTime(data.createdAt.toDate());
        }
        return {
          id: doc.id,
          ...data,
          time: timeLabel
        };
      }) as Resource[];
      setLocalResources(resourcesData);
    }, (error) => {
      handleFirestoreError(error, "list" as any, `users/${user.uid}/resources`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDeleteResource = async (resourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm("Delete this resource forever?")) return;
    
    try {
      if (isDemoMode) {
        setLocalResources(prev => prev.filter(r => r.id !== resourceId));
        return;
      }
      await deleteDoc(doc(db!, "users", user.uid, "resources", resourceId));
    } catch (error) {
      handleFirestoreError(error, "delete", `users/${user.uid}/resources/${resourceId}`);
    }
  };

  const allResources = [...localResources, ...sharedResources];

  const filteredResources = allResources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Home" || 
                            (activeCategory === "Shared" && (r as any).isShared) ||
                            r.subject === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
    // Reset input
    e.target.value = "";
  };

  return (
    <div 
      className="space-y-8 pb-20 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-primary/20 backdrop-blur-md p-10"
          >
            <div className="bg-white p-20 rounded-[4rem] shadow-3xl text-center border-8 border-dashed border-primary max-w-2xl w-full">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <Upload className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-4xl font-black text-ink mb-4">Add to Library</h3>
              <p className="text-xl text-ink-muted">Reo will index and summarize this resource automatically</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-4xl font-bold text-ink tracking-tight">Resource Manager</h2>
          <p className="text-ink-muted font-light mt-1">Organize and manage your study resources effectively.</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="glass px-4 py-2.5 rounded-2xl flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-ink">
                {formatISTTime()}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-200" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-ink">35min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..." 
            className="w-full glass rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all border-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none h-[52px]">
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.txt,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleUpload}
              disabled={isUploading}
            />
            <button 
              className="w-full h-full px-6 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Indexing..." : "Upload Resource"}
            </button>
          </div>
        </div>
      </div>

      {/* Categories / Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {["Home", profile?.role === "student" ? "Shared" : null, "Chemistry", "Biology", "Math", "Data Science", "History"].filter(Boolean).map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat!)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === cat 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "glass text-ink-muted border-white/50 hover:border-primary/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reo's Recommendations Section */}
      <AnimatePresence mode="wait">
        {activeCategory !== "Home" && recommendations[activeCategory] && (
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-8 rounded-[2.5rem] border-primary/10 relative overflow-hidden group mb-4">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-ink">Reo's Subject Guide</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Curated Resources for {activeCategory}</p>
                 </div>
              </div>

              <div className="space-y-8 relative z-10">
                 {/* Grouped Recommendations */}
                 {(() => {
                   const books = recommendations[activeCategory].filter(s => s.type === "BOOK");
                   const courses = recommendations[activeCategory].filter(s => s.type === "COURSE");
                   
                   return (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Books Section */}
                       <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                           <BookOpen className="w-4 h-4 text-primary" />
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Books</h4>
                         </div>
                         <div className="space-y-3">
                           {books.map(suggest => (
                             <div key={suggest.id} className="bg-white/40 hover:bg-white rounded-2xl p-4 border border-white/60 transition-all group/card flex items-center justify-between shadow-sm">
                               <div className="flex items-center gap-4">
                                 <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                   <BookOpen className="w-4 h-4" />
                                 </div>
                                 <div>
                                   <h5 className="text-sm font-bold text-ink line-clamp-1 group-hover/card:text-primary transition-colors">{suggest.title}</h5>
                                   <p className="text-[10px] text-ink-muted uppercase font-black">{suggest.provider}</p>
                                 </div>
                               </div>
                               <button className="p-2 text-ink-muted hover:text-primary transition-colors">
                                 <ExternalLink className="w-4 h-4" />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Courses Section */}
                       <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                           <PlayCircle className="w-4 h-4 text-indigo-500" />
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Courses</h4>
                         </div>
                         <div className="space-y-3">
                           {courses.map(suggest => (
                             <div key={suggest.id} className="bg-white/40 hover:bg-white rounded-2xl p-4 border border-white/60 transition-all group/card flex items-center justify-between shadow-sm">
                               <div className="flex items-center gap-4">
                                 <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                   <PlayCircle className="w-4 h-4" />
                                 </div>
                                 <div>
                                   <h5 className="text-sm font-bold text-ink line-clamp-1 group-hover/card:text-primary transition-colors">{suggest.title}</h5>
                                   <p className="text-[10px] text-ink-muted uppercase font-black">{suggest.provider}</p>
                                 </div>
                               </div>
                               <button className="p-2 text-ink-muted hover:text-primary transition-colors">
                                 <ExternalLink className="w-4 h-4" />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   );
                 })()}
                 
                 <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                       <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-ink-muted">
                       "Hey! I've picked these based on your current {activeCategory} documents. They should help fill any conceptual gaps we found." <span className="text-primary cursor-pointer hover:underline">— Reo</span>
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-[2rem] hover:shadow-xl transition-all group border-white/60"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform relative">
                  {r.type === "QUIZ" ? <FileCode className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  {(r as any).isShared && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-ink leading-tight group-hover:text-primary transition-colors">{r.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-ink-muted uppercase">{r.type}</span>
                    <span className="text-[10px] text-neutral-300">•</span>
                    <span className="text-[10px] font-medium text-ink-muted">{r.size || "Folder"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!(r as any).isShared && (
                  <button 
                    onClick={(e) => handleDeleteResource(r.id, e)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button className="p-2 hover:bg-white/40 rounded-lg text-ink-muted transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-2">
                <Tag>{r.subject}</Tag>
                {r.isBookmarked && <Tag color="secondary"><Bookmark className="w-3 h-3" /> Bookmarked</Tag>}
              </div>
              <div className="flex items-center gap-2">
                 {isTeacher && (
                   <button 
                    onClick={() => { setResourceToShare(r); setIsShareModalOpen(true); }}
                    className="p-2 glass border-white/60 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all rounded-xl"
                    title="Share with Class"
                   >
                      <Share2 className="w-4 h-4" />
                   </button>
                 )}
                 <button 
                  onClick={() => setSelectedResource(r)}
                  className="p-2 glass border-white/60 text-primary hover:bg-primary hover:text-white transition-all rounded-xl"
                  title="Ask Reo about this document"
                 >
                    <MessageSquare className="w-4 h-4" />
                 </button>
                 <span className="text-[10px] font-bold text-ink-muted">{r.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resource Q&A Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResource(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass p-10 rounded-[3rem] border-white/60 shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ink">{selectedResource.title}</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-primary">Semantic Resource Query</p>
                  </div>
                </div>
                <button onClick={() => setSelectedResource(null)} className="p-3 glass hover:bg-neutral-100 rounded-2xl text-ink-muted transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-white/40 rounded-2xl border border-white/60 max-h-40 overflow-y-auto no-scrollbar">
                   <p className="text-[10px] uppercase font-black text-ink-muted mb-2 tracking-widest sticky top-0 bg-white/40 backdrop-blur-sm py-1">Document Insight</p>
                   <p className="text-sm text-ink leading-relaxed font-medium italic">"{selectedResource.insight?.summary || "No automated summary available yet. Scanning complete."}"</p>
                </div>

                <div className="space-y-4">
                   <div className="relative">
                      <input 
                        type="text" 
                        value={resourceQuestion}
                        onChange={(e) => setResourceQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && askAboutResource()}
                        placeholder={`Ask Reo about ${selectedResource.title}...`}
                        className="w-full glass bg-white focus:bg-white rounded-2xl py-4 pl-5 pr-16 text-sm border-none shadow-sm focus:ring-2 ring-primary/20 transition-all font-medium"
                      />
                      <button 
                        onClick={askAboutResource}
                        disabled={isAsking || !resourceQuestion.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 hover:scale-105 transition-all"
                      >
                         {isAsking ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                   </div>
                </div>

                {resourceAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3 max-h-64 overflow-y-auto no-scrollbar"
                  >
                    <div className="flex items-center gap-2 sticky top-0 bg-primary/5 backdrop-blur-sm py-1">
                       <CheckCircle2 className="w-4 h-4 text-primary" />
                       <span className="text-[10px] font-black uppercase text-primary tracking-widest">Reo's Analysis</span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{resourceAnswer}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsShareModalOpen(false); setResourceToShare(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass p-10 rounded-[3rem] border-white/60 shadow-2xl space-y-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                  <Globe className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-ink">Publish to Class</h3>
                  <p className="text-sm text-ink-muted">Share "{resourceToShare?.title}" with your students.</p>
                </div>
              </div>

              <div className="space-y-4">
                {classrooms.length > 0 ? (
                  <div className="grid gap-3">
                    {classrooms.map(cls => (
                      <button 
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                          selectedClassId === cls.id 
                            ? "bg-indigo-50 border-indigo-600 shadow-sm" 
                            : "bg-white/40 border-transparent hover:border-indigo-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedClassId === cls.id ? "bg-indigo-600 text-white" : "bg-neutral-100 text-neutral-400"}`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-ink">{cls.name}</p>
                            <p className="text-[10px] font-black text-ink-muted uppercase">{cls.code}</p>
                          </div>
                        </div>
                        {selectedClassId === cls.id && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-neutral-100 rounded-3xl">
                    <p className="text-sm font-medium text-ink-muted mb-4">You haven't created any classrooms yet.</p>
                    <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">Create a Classroom</button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setIsShareModalOpen(false); setResourceToShare(null); }}
                  className="flex-1 py-4 border border-neutral-100 text-ink font-bold rounded-2xl hover:bg-neutral-50 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={!selectedClassId || isSharing}
                  onClick={handleShare}
                  className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isSharing ? "Publishing..." : "Publish Resource"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
