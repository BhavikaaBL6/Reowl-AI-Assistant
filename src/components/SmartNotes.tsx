/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getGeminiModel } from "../lib/gemini";
import { neuralKeyManager } from "../lib/keyRotation";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Type as TypeIcon, 
  FileCheck, 
  RotateCcw,
  Copy,
  Download,
  Share2,
  Highlighter,
  Layout,
  Layers,
  FileSearch,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  CircleStop,
  Clock,
  Globe,
  Users,
  Play,
  Pause,
  Trash2,
  Volume2
} from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, isDemoMode } from "../lib/firebase";
import { Badge } from "./ui/Badge";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass rounded-[2rem] p-8 border-white/60 shadow-xl ${className}`}>
    {children}
  </div>
);

export const SmartNotes = () => {
  const { user, profile } = useFirebase();
  const isTeacher = profile?.role === "teacher";
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

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
    if (!selectedClassId || !generatedNotes || !user) return;
    
    if (isDemoMode) {
      alert("Demo Mode: Notes successfully simulated sharing with the class!");
      setIsShareModalOpen(false);
      return;
    }

    setIsSharing(true);
    try {
      const selectedClass = classrooms.find(c => c.id === selectedClassId);
      await addDoc(collection(db!, "classrooms", selectedClassId, "sharedResources"), {
        title: generatedNotes.title,
        type: "NOTE",
        content: generatedNotes,
        teacherId: user.uid,
        classId: selectedClassId,
        studentIds: selectedClass?.studentIds || [],
        sharedAt: serverTimestamp()
      });
      alert("Notes shared successfully with the class!");
      setIsShareModalOpen(false);
    } catch (error) {
      console.error("Sharing failed:", error);
      handleFirestoreError(error, "write" as any, `/classrooms/${selectedClassId}/sharedResources`);
    } finally {
      setIsSharing(false);
    }
  };

  const [activeStyle, setActiveStyle] = useState("Detailed");
  const [learningTone, setLearningTone] = useState("Academic"); // Academic, Simplified, Storytelling
  const [isFlipped, setIsFlipped] = useState(false);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<any>(null);
  const [flashcards, setFlashcards] = useState<{ question: string; answer: string }[]>([]);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVCardColors = (suffix: string) => {
    const colors: Record<string, any> = {
      blue: { bg: "bg-blue-50", border: "bg-blue-100", text: "text-blue-900", subtext: "text-blue-700/80", icon: "bg-blue-600", innerBorder: "border-blue-200/50", innerBg: "bg-white/60", innerText: "text-blue-800" },
      purple: { bg: "bg-purple-50", border: "bg-purple-100", text: "text-purple-900", subtext: "text-purple-700/80", icon: "bg-purple-600", innerBorder: "border-purple-200/50", innerBg: "bg-white/60", innerText: "text-purple-800" },
      emerald: { bg: "bg-emerald-50", border: "bg-emerald-100", text: "text-emerald-900", subtext: "text-emerald-700/80", icon: "bg-emerald-600", innerBorder: "border-emerald-200/50", innerBg: "bg-white/60", innerText: "text-emerald-800" },
      indigo: { bg: "bg-indigo-50", border: "bg-indigo-100", text: "text-indigo-900", subtext: "text-indigo-700/80", icon: "bg-indigo-600", innerBorder: "border-indigo-200/50", innerBg: "bg-white/60", innerText: "text-indigo-800" },
      rose: { bg: "bg-rose-50", border: "bg-rose-100", text: "text-rose-900", subtext: "text-rose-700/80", icon: "bg-rose-600", innerBorder: "border-rose-200/50", innerBg: "bg-white/60", innerText: "text-rose-800" },
      amber: { bg: "bg-amber-50", border: "bg-amber-100", text: "text-amber-900", subtext: "text-amber-700/80", icon: "bg-amber-600", innerBorder: "border-amber-200/50", innerBg: "bg-white/60", innerText: "text-amber-800" },
    };
    return colors[suffix] || colors.indigo;
  };

  const generateFlashcards = async () => {
    if (!generatedNotes || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);
    try {
      const hasKey = neuralKeyManager.hasKeys();

      if (!hasKey && isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setFlashcards([
          { question: "What is active learning?", answer: "Strategic engagement that increases student retention by 40%." },
          { question: "Define Metacognition.", answer: "The awareness and understanding of one's own thought processes." },
          { question: "What does Scaffolding help with?", answer: "Transitioning learners from dependence to autonomy." }
        ]);
        return;
      }

      if (!hasKey) {
        throw new Error("Gemini API Key is missing.");
      }

      const contextForFlashcards = `
        Title: ${generatedNotes.title}
        Definition: ${generatedNotes.definition}
        Key Points: ${generatedNotes.keyPoints?.join(", ") || ""}
        Sections: ${generatedNotes.sections?.map((s: any) => `${s.heading}: ${s.content}`).join(" | ") || ""}
        Terms: ${generatedNotes.terms?.map((t: any) => `${t.term}: ${t.definition}`).join("; ") || ""}
      `;

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Analyze these study notes and generate 5 highly relevant conceptual flashcards that test the user's understanding of key principles and terminology.
        
        Notes Context:
        ${contextForFlashcards}
        
        Requirements:
        1. Focus on higher-order thinking questions (Why/How) rather than just simple definitions.
        2. Ensure answers are concise but academically rigorous.
        3. Respond strictly with a JSON array of objects having "question" and "answer" properties.` }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      const data = JSON.parse(text);
      setFlashcards(data);
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Flashcard generation failed:", error);
      alert("Reo couldn't generate flashcards. Please ensure your notes are generated first.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      setUploadedFile({
        name: file.name,
        base64,
        type: file.type || "application/pdf"
      });
    } catch (error) {
      console.error("File read failed:", error);
      alert("Failed to read file.");
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setAudioBase64(base64);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed:", err);
      alert("Microphone access denied or error occurred.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleGenerate = async () => {
    if ((!input.trim() && !audioBase64 && !uploadedFile) || isGenerating) return;

    setIsGenerating(true);
    try {
      // Save original audio notes if needed locally
      if (audioUrl) {
        // Here we could persist to a storage service
      }
      // Prioritize Real AI if key exists, otherwise check demo mode
      const hasKey = neuralKeyManager.hasKeys();

      if (!hasKey && isDemoMode) {
        // Simulation for Demo Mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        const demoNotes = {
          title: input ? `Analysis: ${input.split(' ').slice(0, 5).join(' ')}...` : uploadedFile ? `Analysis: ${uploadedFile.name}` : "Simulation: Advanced Pedagogy",
          definition: input ? `An AI-synthesized overview based on your input: "${input.substring(0, 50)}..."` : "A synthesized overview of educational strategies and instructional design.",
          sections: [
            { heading: "Foundational Concepts", content: "Active learning is a method of learning in which students are actively or experientially involved in the learning process and where there are different levels of active learning, depending on student involvement." },
            { heading: "Instructional Scaffolding", content: "Instructional scaffolding is a process through which a teacher adds support for students in order to enhance learning and aid in the mastery of tasks." }
          ],
          keyPoints: [
            "Active learning increases student engagement by 40%.",
            "Scaffolding helps transition learners from dependence to autonomy.",
            "Metacognition is the awareness and understanding of one's own thought processes."
          ],
          formula: "Efficiency = (Knowledge * Retention) / Time",
          actionItems: ["Review specific sections in text", "Cross-reference with lecture audio"],
          deadlines: ["Weekly Quiz: Friday", "Project Draft: Two weeks"],
          terms: [
            { term: "Heuristic", definition: "A mental shortcut that allows people to solve problems quickly.", importance: "Essential" },
            { term: "Cognitive Load", definition: "The amount of information that working memory can hold at once.", importance: "Core Concept" }
          ],
          visualCards: [
            { title: "The Knowledge Funnel", concept: "Filtering noise into structured wisdom.", visualPrompt: "A futuristic funnel capturing glowing particles and emitting solid geometric blocks.", colorSuffix: "indigo" },
            { title: "Metacognition Mirror", concept: "Reflecting on thought patterns for optimization.", visualPrompt: "A crystal mirror reflecting a brain composed of circuit networks.", colorSuffix: "purple" }
          ],
          logicModels: [
            { 
              type: 'cycle', 
              title: 'The Feedback-Learning Loop', 
              steps: [
                { label: 'Ingestion', description: 'Consuming raw data' },
                { label: 'Processing', description: 'Linking to existing nodes' },
                { label: 'Evaluation', description: 'Testing mental models' },
                { label: 'Refinement', description: 'Correcting misconceptions' }
              ] 
            }
          ]
        };
        setGeneratedNotes(demoNotes);
        setIsGenerating(false);
        return;
      }

      if (!hasKey) {
        throw new Error("Gemini API Key is missing. Please add it to your environment.");
      }

      const parts: any[] = [
        { text: `You are an elite academic synthesizer. Analyze the provided study material and generate a high-rigor structured study guide.
        
        Style: ${activeStyle === "Detailed" ? "Comprehensive, prioritizing deep mechanics and 'Why' explanations" : "Concise, prioritizing high-impact 'What' facts and speed-reading structures"}.
        Tone: ${learningTone}. (If 'Simplified', use analogies and plain language. If 'Academic', use domain-specific jargon and formal structure. If 'Storytelling', frame concepts as a narrative journey).
        
        Material to analyze:
        ${input ? `TEXT INPUT: "${input}"\n` : ""}
        ${audioBase64 ? "AUDIO INPUT: (Attached audio transcript/recording)\n" : ""}
        ${uploadedFile ? `DOCUMENT INPUT: "${uploadedFile.name}"\n` : ""}

        Required Output Structure:
        1. title: A professional academic title.
        2. definition: A 1-2 sentence core definition of the subject.
        3. sections: An array of { heading, content, deepDive? } objects providing structured, logical breakdowns. 'deepDive' is an optional extra detail for complex concepts.
        4. keyPoints: An array of high-impact factual takeaways.
        5. formula: The most important symbolic representation or "Golden Rule".
        6. actionItems: An array of tasks (e.g., "Practice problem set 4").
        7. deadlines: Any mentioned dates or timeframes.
        8. terms: Array of { term, definition, importance } for key vocabulary. 'importance' is a string describing why this term matters (e.g., "Crucial for Exam", "Basic Foundation").
        9. visualCards: Array of { title, concept, visualPrompt, colorSuffix } representing core mental models or metaphors. 'colorSuffix' is a tailwind color name (e.g., 'blue', 'purple', 'emerald').
        10. logicModels: Array of { type, title, steps } where type is 'cycle' (repeating), 'flow' (linear), or 'hierarchy' (layered). 'steps' is an array of strings or { label, description }.
        
        CRITICAL: If the topic involves any process, cause-effect chain, transition, or biological/technical cycle, you MUST generate at least one 'logicModels' entry. Look for verbs like "leads to", "results in", "transforms into", or "cycles".

        Instructions for Maximum Rigor:
        - Identify specific academic branches and use domain-specific terminology correctly.
        - Explain relationships between concepts in the sections content.
        - Ensure action items are practical and derived from the context.` }
      ];

      if (audioBase64) {
        parts.push({
          inlineData: {
            mimeType: "audio/wav",
            data: audioBase64
          }
        });
      }

      if (uploadedFile) {
        parts.push({
          inlineData: {
            mimeType: uploadedFile.type,
            data: uploadedFile.base64
          }
        });
      }

      const model = getGeminiModel({
        model: "gemini-3-flash-preview",
      });

      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty AI response");
      const data = JSON.parse(text);
      setGeneratedNotes(data);
    } catch (error) {
      console.error("Notes Generation failed:", error);
      alert("Reo had an issue synthesizing your notes. Please check your material and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-4xl font-black text-ink tracking-tight">Smart Notes Generator</h2>
        <p className="text-ink-muted font-light">Create concise, intelligent notes from any study material in seconds.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Input & Analysis */}
        <div className="space-y-8">
          {/* Upload Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Input Material
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".pdf,.docx,.doc,.txt,image/*"
                  />
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-100 text-ink rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-neutral-50 transition-all group">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-primary" />}
                    Upload File
                  </button>
                </div>
                {isRecording ? (
                  <motion.button 
                    animate={{ 
                      scale: [1, 1.02, 1],
                      boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 20px rgba(239, 68, 68, 0.2)", "0 0 0px rgba(239, 68, 68, 0)"]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    onClick={stopRecording}
                    className="flex items-center gap-3 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg border border-white/20 transition-all"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    {formatTime(recordingTime)} - Stop Scribing
                  </motion.button>
                ) : (
                  <button 
                    onClick={startRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-[#151619] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/10 hover:bg-black transition-all group"
                  >
                    <Mic className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" /> 
                    Record Lecture
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {isRecording && (
                <div className="p-10 bg-rose-50/50 border-2 border-dashed border-rose-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 animate-pulse">
                   <div className="flex gap-1 items-end h-12">
                      {[...Array(12)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={{ height: [12, Math.random() * 40 + 10, 12] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                          className="w-1.5 bg-rose-500 rounded-full"
                        />
                      ))}
                   </div>
                   <p className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Neural Audio Scribe Active</p>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div className="p-6 bg-white border-2 border-neutral-100 rounded-[2rem] shadow-sm flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) audioRef.current.pause();
                            else audioRef.current.play();
                            setIsPlaying(!isPlaying);
                          }
                        }}
                        className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
                      >
                         {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                      </button>
                      <div>
                         <p className="text-xs font-black text-ink uppercase tracking-tight">Audio Scribe Fragment</p>
                         <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Captured Lecture Node</p>
                      </div>
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        onEnded={() => setIsPlaying(false)} 
                        className="hidden" 
                      />
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg">
                         <Volume2 className="w-4 h-4 text-neutral-400" />
                         <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 w-2/3" />
                         </div>
                      </div>
                      <button 
                        onClick={() => { setAudioUrl(null); setAudioBase64(null); }}
                        className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              )}
                  {uploadedFile && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-900">{uploadedFile.name}</p>
                          <p className="text-[10px] text-blue-600 font-medium">Document attached</p>
                        </div>
                      </div>
                      <button onClick={() => setUploadedFile(null)} className="text-blue-400 hover:text-blue-600">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
               
               <textarea 
                 value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste text OR Record a lecture above... Reo will merge both contexts into your notes."
                className="w-full h-48 bg-white/20 border border-white/60 rounded-[1.5rem] p-6 text-sm text-ink outline-none focus:ring-4 ring-primary/10 transition-all resize-none font-light leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || (!input.trim() && !audioBase64 && !uploadedFile)}
                className={`flex-1 min-w-[140px] px-6 py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${
                  isGenerating ? "bg-neutral-100 text-neutral-400" : "bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95"
                }`}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? "Reo is Synthesizing..." : "Process with Reo AI"}
              </button>
              <button 
                 onClick={() => { setInput(""); setGeneratedNotes(null); setAudioBase64(null); setUploadedFile(null); }}
                 className="px-6 py-3.5 border border-white/60 text-ink font-bold rounded-2xl hover:bg-white/40 transition-all font-black text-xs uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          </Card>

          {/* Highlighted Terms */}
          <Card className={generatedNotes ? "opacity-100" : "opacity-50 pointer-events-none"}>
            <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
              <Highlighter className="w-5 h-5 text-primary" /> Key Concepts Extracted
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(generatedNotes?.terms || [{ term: "Analysis Pending", definition: "Reo is waiting for input..." }]).map((item: any, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.05 }}
                    className="group relative"
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-neutral-100 shadow-sm text-xs font-bold text-ink hover:border-primary transition-colors cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {item.term}
                    </div>
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-ink text-white text-[10px] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl">
                      <p className="font-black uppercase text-primary mb-1 tracking-widest">Definition</p>
                      {item.definition}
                      <div className="absolute top-full left-4 border-8 border-transparent border-t-ink" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Results & Tools */}
        <div className="space-y-8">
          {/* Output Card */}
          <Card className="p-0 border-primary/20 overflow-hidden">
            <div className="p-8 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                  <FileCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-primary">Generated Notes</h3>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-colors"><Copy className="w-5 h-5" /></button>
                <button className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-colors"><Download className="w-5 h-5" /></button>
                {isTeacher && (
                  <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Share with Class
                  </button>
                )}
                {!isTeacher && (
                  <button className="p-2.5 rounded-xl hover:bg-primary/10 text-primary transition-colors"><Share2 className="w-5 h-5" /></button>
                )}
              </div>
            </div>

            <div className="p-8 space-y-8 min-h-[400px]">
              <AnimatePresence mode="wait">
                {!generatedNotes && !isGenerating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20"
                  >
                    <BookOpen className="w-16 h-16 text-neutral-200" />
                    <p className="text-sm text-ink-muted font-light italic">Waiting for input material...</p>
                  </motion.div>
                ) : isGenerating ? (
                   <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full space-y-6 py-20"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-primary animate-bounce">Reo is synthesizing knowledge...</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                  >
                    {/* Sticky Sidebar Navigation */}
                    <div className="lg:col-span-3">
                      <div className="sticky top-8 space-y-4">
                        <p className="text-[10px] font-black uppercase text-ink-muted tracking-[0.2em] px-2 mb-4">Note Contents</p>
                        <nav className="space-y-1">
                          {[
                            { id: 'summary', label: 'Executive Summary', icon: Sparkles },
                            { id: 'concepts', label: 'Core Sections', icon: Layers },
                            { id: 'visuals', label: 'Mental Models', icon: Zap },
                            { id: 'diagrams', label: 'Logic Flows', icon: Share2 },
                            { id: 'glossary', label: 'Glossary', icon: BookOpen },
                            { id: 'actions', label: 'Study Roadmap', icon: CheckCircle2 }
                          ].map(item => (
                            <a 
                              key={item.id}
                              href={`#${item.id}`}
                              className="flex items-center gap-3 px-4 py-2 rounded-xl text-[11px] font-bold text-ink-muted hover:bg-primary/5 hover:text-primary transition-all group"
                            >
                              <item.icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              {item.label}
                            </a>
                          ))}
                        </nav>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-12">
                      <div id="summary">
                        <h4 className="text-3xl font-black text-ink tracking-tight italic mb-6">{generatedNotes.title}</h4>
                        <div className="flex gap-4 p-6 bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] border border-indigo-100 shadow-sm">
                          <Sparkles className="w-6 h-6 text-primary shrink-0" />
                          <p className="text-sm text-ink leading-relaxed">
                            <strong className="text-primary tracking-tight font-black uppercase text-[10px] block mb-2">Subject Foundation</strong> 
                            {generatedNotes.definition}
                          </p>
                        </div>
                      </div>

                      {/* Structured Sections */}
                      <div id="concepts" className="space-y-8">
                        {generatedNotes.sections?.map((section: any, i: number) => (
                          <div key={i} className="space-y-4 bg-white/40 p-6 rounded-[2rem] border border-neutral-100">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <h5 className="font-black text-[12px] uppercase tracking-[0.15em] text-ink">{section.heading}</h5>
                            </div>
                            <div className="pl-5 space-y-4">
                              <p className="text-sm text-ink-muted leading-relaxed font-light">
                                {section.content}
                              </p>
                              {section.deepDive && (
                                <div className="p-4 bg-amber-50/50 border-l-4 border-amber-400 rounded-r-2xl">
                                  <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Deep Dive Focus</p>
                                  <p className="text-[11px] text-amber-900 leading-relaxed italic">{section.deepDive}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Visual Cards Section */}
                      {generatedNotes.visualCards && generatedNotes.visualCards.length > 0 && (
                        <div id="visuals" className="space-y-6 pt-4">
                           <div className="flex items-center gap-3">
                              <Zap className="w-5 h-5 text-amber-500" />
                              <h4 className="text-[11px] font-black text-ink uppercase tracking-[0.2em]">Mental Models & Visuals</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {generatedNotes.visualCards.map((vcard: any, idx: number) => {
                                const cfg = getVCardColors(vcard.colorSuffix);
                                return (
                                  <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-6 rounded-3xl border-2 shadow-sm transition-all hover:shadow-md cursor-help group relative overflow-hidden ${cfg.bg} ${cfg.border}`}
                                  >
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                      <Sparkles className="w-8 h-8" />
                                    </div>
                                    <h5 className={`font-black text-[13px] tracking-tight mb-2 ${cfg.text}`}>{vcard.title}</h5>
                                    <p className={`text-[11px] leading-relaxed mb-4 ${cfg.subtext}`}>{vcard.concept}</p>
                                    
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${cfg.innerBg} ${cfg.innerBorder}`}>
                                       <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 ${cfg.icon}`}>
                                          <Zap className="w-4 h-4" />
                                       </div>
                                       <p className={`text-[9px] font-medium leading-tight italic ${cfg.innerText}`}>
                                          "{vcard.visualPrompt}"
                                       </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                           </div>
                        </div>
                      )}

                      {/* Logic Models Section */}
                      {generatedNotes.logicModels && generatedNotes.logicModels.map((model: any, mIdx: number) => (
                        <div key={mIdx} id="diagrams" className="space-y-6 pt-10 border-t border-neutral-100">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <Share2 className="w-5 h-5 text-primary" />
                                 <h4 className="text-[11px] font-black text-ink uppercase tracking-[0.2em]">{model.title}</h4>
                              </div>
                              <Badge className="bg-primary/10 text-primary border-none uppercase text-[9px] tracking-widest px-3 py-1">{model.type}</Badge>
                           </div>

                           <div className={`relative ${model.type === 'cycle' ? 'pb-12' : ''}`}>
                              <div className={`grid grid-cols-1 md:grid-cols-${model.steps.length > 3 ? '4' : '3'} gap-6 relative`}>
                                 {model.steps.map((step: any, sIdx: number) => (
                                   <React.Fragment key={sIdx}>
                                     <motion.div 
                                       initial={{ opacity: 0, scale: 0.9 }}
                                       whileInView={{ opacity: 1, scale: 1 }}
                                       viewport={{ once: true }}
                                       transition={{ delay: (mIdx * 0.2) + (sIdx * 0.1) }}
                                       className="p-6 rounded-[2.5rem] bg-white border-2 border-neutral-100 flex flex-col items-center text-center group hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all relative z-10"
                                     >
                                       <div className="w-10 h-10 rounded-2xl bg-neutral-50 shadow-sm border border-neutral-100 flex items-center justify-center text-[12px] font-black text-primary mb-4 group-hover:bg-primary group-hover:text-white group-hover:rotate-12 transition-all">
                                         {sIdx + 1}
                                       </div>
                                       <p className="text-[12px] font-black text-ink mb-2">{typeof step === 'string' ? step : step.label}</p>
                                       {step.description && <p className="text-[10px] text-ink-muted leading-relaxed font-medium">{step.description}</p>}
                                     </motion.div>
                                     {sIdx < model.steps.length - 1 && (
                                       <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 pointer-events-none items-center justify-center text-neutral-300" style={{ left: `${((sIdx + 1) / model.steps.length) * 100}%`, width: '4rem', marginLeft: '-2rem' }}>
                                         <ArrowRight className="w-5 h-5 opacity-40" />
                                       </div>
                                     )}
                                   </React.Fragment>
                                 ))}
                              </div>
                              {model.type === 'cycle' && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  className="hidden md:flex absolute -bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10"
                                >
                                  <RotateCcw className="w-3 h-3" /> Infinite Feedback Loop
                                </motion.div>
                              )}
                           </div>
                        </div>
                      ))}

                      {/* Glossary Section */}
                      {generatedNotes.terms && generatedNotes.terms.length > 0 && (
                        <div id="glossary" className="space-y-6 pt-10 border-t border-neutral-100">
                           <div className="flex items-center gap-3">
                              <BookOpen className="w-5 h-5 text-indigo-500" />
                              <h4 className="text-[11px] font-black text-ink uppercase tracking-[0.2em]">Glossary of Mastery</h4>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {generatedNotes.terms.map((item: any, idx: number) => (
                                <div key={idx} className="p-5 rounded-[1.5rem] bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-black text-[13px] text-ink group-hover:text-primary transition-colors">{item.term}</h5>
                                    {item.importance && <Badge className="bg-indigo-50 text-indigo-600 border-none text-[8px] px-2 py-0.5">{item.importance}</Badge>}
                                  </div>
                                  <p className="text-[11px] text-ink-muted leading-relaxed font-medium">{item.definition}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div id="actions" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-neutral-100">
                        <div className="space-y-6">
                          <p className="text-[11px] font-black text-ink uppercase tracking-[0.2em] flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Conceptual Mastery
                          </p>
                          <ul className="space-y-4">
                            {generatedNotes.keyPoints.map((p: string, i: number) => (
                              <li key={i} className="flex gap-4 p-4 bg-neutral-50/50 rounded-2xl border border-neutral-100 hover:border-primary/20 transition-colors group">
                                <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors mt-1.5 shrink-0" />
                                <p className="text-xs text-ink-muted leading-relaxed font-medium">{p}</p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* AI Extracted Actions */}
                        <div className="space-y-8">
                          {generatedNotes.actionItems?.length > 0 && (
                            <div className="p-8 bg-[#151619] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-20"><Zap className="w-12 h-12 text-primary" /></div>
                              <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-6">Strategic Study Roadmap</p>
                              <ul className="space-y-4">
                                {generatedNotes.actionItems.map((task: string, i: number) => (
                                  <li key={i} className="text-[12px] font-bold flex items-center gap-4 group cursor-pointer hover:translate-x-2 transition-transform">
                                    <div className="w-6 h-6 rounded-xl border-2 border-white/10 group-hover:border-primary group-hover:bg-primary flex items-center justify-center transition-all">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-transparent group-hover:text-white" />
                                    </div>
                                    {task}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {generatedNotes.deadlines?.length > 0 && (
                            <div className="p-8 bg-rose-50/50 rounded-[2.5rem] border border-rose-100/50">
                              <p className="text-[10px] font-black uppercase text-rose-600 tracking-[0.3em] mb-6">Critical Deadlines</p>
                              <ul className="space-y-4">
                                {generatedNotes.deadlines.map((date: string, i: number) => (
                                  <li key={i} className="text-xs font-black text-rose-900 flex items-center gap-4">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm border border-rose-100">
                                      <Clock className="w-4 h-4 text-rose-500" /> 
                                    </div>
                                    {date}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {generatedNotes.formula && (
                        <div className="p-8 rounded-[2.5rem] bg-ink text-white flex flex-col items-center text-center space-y-4 shadow-xl border border-white/5">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">The Golden Rule / Key Formula</p>
                          <p className="text-2xl font-black italic tracking-tighter font-mono bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                            {generatedNotes.formula}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Style & Tone Selectors */}
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-ink-muted tracking-[0.2em] px-2">Knowledge Transformation Profile</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveStyle("Detailed")}
                className={`p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 relative overflow-hidden group ${
                  activeStyle === "Detailed" 
                    ? "bg-gradient-to-br from-indigo-600 via-primary to-purple-700 border-none shadow-xl shadow-primary/30 text-white" 
                    : "glass border-white/60 hover:border-primary/30"
                }`}
              >
                <div className={`p-3 rounded-xl w-fit transition-colors ${activeStyle === "Detailed" ? "bg-white/20 text-white" : "bg-indigo-50/60 text-ink-muted border border-indigo-100/50"}`}>
                  <Layout className="w-6 h-6 animate-pulse" />
                </div>
                <p className={`font-bold transition-colors ${activeStyle === "Detailed" ? "text-white" : "text-ink"}`}>Detailed Notes</p>
                <p className={`text-xs transition-colors ${activeStyle === "Detailed" ? "text-white/80" : "text-ink-muted"}`}>In-depth and structured content with evidence.</p>
              </button>
              <button 
                onClick={() => setActiveStyle("Quick")}
                className={`p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 relative overflow-hidden group ${
                  activeStyle === "Quick" 
                    ? "bg-gradient-to-br from-indigo-600 via-primary to-purple-700 border-none shadow-xl shadow-primary/30 text-white" 
                    : "glass border-white/60 hover:border-primary/30"
                }`}
              >
                <div className={`p-3 rounded-xl w-fit transition-colors ${activeStyle === "Quick" ? "bg-white/20 text-white" : "bg-indigo-50/60 text-ink-muted border border-indigo-100/50"}`}>
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <p className={`font-bold transition-colors ${activeStyle === "Quick" ? "text-white" : "text-ink"}`}>Quick Summary</p>
                <p className={`text-xs transition-colors ${activeStyle === "Quick" ? "text-white/80" : "text-ink-muted"}`}>Short and concise overview for quick review.</p>
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 glass rounded-2xl border-white/60">
              {["Academic", "Simplified", "Storytelling"].map(tone => (
                <button
                  key={tone}
                  onClick={() => setLearningTone(tone)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    learningTone === tone 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-ink-muted hover:bg-white/40"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>

          {/* Flashcards Preview */}
          <Card className="bg-white/40 border border-white/60">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Flashcards
              </h3>
              <button 
                onClick={generateFlashcards}
                disabled={!generatedNotes || isGeneratingFlashcards}
                className="px-4 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {isGeneratingFlashcards ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {isGeneratingFlashcards ? "Generating..." : flashcards.length > 0 ? "Regenerate" : "Create Flashcards"}
              </button>
            </div>
            
            <div className="perspective-1000">
              {flashcards.length > 0 ? (
                <motion.div
                  key={currentFlashcardIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full h-48 relative cursor-pointer"
                  >
                    {/* Front */}
                    <div 
                      className="absolute inset-0 backface-hidden glass bg-white flex flex-col items-center justify-center p-8 rounded-[2rem] text-center"
                    >
                      <p className="text-[10px] uppercase font-bold text-primary mb-2 tracking-widest">Question</p>
                      <p className="text-lg font-bold text-ink leading-tight">{flashcards[currentFlashcardIndex].question}</p>
                    </div>
                    {/* Back */}
                    <div 
                      className="absolute inset-0 backface-hidden glass bg-primary text-white flex flex-col items-center justify-center p-8 rounded-[2rem] text-center"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      <p className="text-[10px] uppercase font-bold text-white/60 mb-2 tracking-widest">Answer</p>
                      <p className="text-sm font-medium leading-relaxed">{flashcards[currentFlashcardIndex].answer}</p>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed border-neutral-200 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                   <Sparkles className="w-8 h-8 mb-2 opacity-30" />
                   <p className="text-xs font-medium">Generate notes first, then create flashcards to test your knowledge.</p>
                </div>
              )}
            </div>
            
            {flashcards.length > 0 && (
              <div className="flex items-center justify-center gap-6 mt-6">
                <button 
                  onClick={() => {
                    setCurrentFlashcardIndex(prev => (prev > 0 ? prev - 1 : flashcards.length - 1));
                    setIsFlipped(false);
                  }}
                  className="p-2 text-ink-muted hover:text-primary transition-colors focus:ring-2 ring-primary/20 rounded-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group" onClick={() => setIsFlipped(!isFlipped)}>
                  <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Flip Card
                </button>
                <button 
                  onClick={() => {
                    setCurrentFlashcardIndex(prev => (prev < flashcards.length - 1 ? prev + 1 : 0));
                    setIsFlipped(false);
                  }}
                  className="p-2 text-ink-muted hover:text-primary transition-colors focus:ring-2 ring-primary/20 rounded-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
            
            {flashcards.length > 0 && (
              <p className="text-center text-[10px] font-black text-ink-muted uppercase tracking-widest mt-4">
                Card {currentFlashcardIndex + 1} of {flashcards.length}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
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
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                  <Globe className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-ink">Publish to Class</h3>
                  <p className="text-sm text-ink-muted">Select a class to share these Reo notes with.</p>
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
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-white/40 border-transparent hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedClassId === cls.id ? "bg-primary text-white" : "bg-neutral-100 text-neutral-400"}`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-ink">{cls.name}</p>
                            <p className="text-[10px] font-black text-ink-muted uppercase">{cls.code}</p>
                          </div>
                        </div>
                        {selectedClassId === cls.id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed border-neutral-100 rounded-3xl">
                    <p className="text-sm font-medium text-ink-muted mb-4">You haven't created any classrooms yet.</p>
                    <button 
                      onClick={() => setIsShareModalOpen(false)}
                      className="text-xs font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Go to Classrooms Tab
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 py-4 border border-neutral-100 text-ink font-bold rounded-2xl hover:bg-neutral-50 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  disabled={!selectedClassId || isSharing}
                  onClick={handleShare}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isSharing ? "Publishing..." : "Publish Notes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
