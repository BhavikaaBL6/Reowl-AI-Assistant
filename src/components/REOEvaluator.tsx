/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Target, 
  Brain, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  Zap,
  Fingerprint,
  Layers,
  Search,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

const MOCK_STUDENTS = [
  { id: "1", name: "Alex Johnson", synergy: 94, status: "Excelling", gaps: ["Organic Nomenclature"], sentiment: "Dynamic", lastQuiz: 98, submissions: 12 },
  { id: "2", name: "Sarah Miller", synergy: 82, status: "Mastering", gaps: ["Stoichiometry"], sentiment: "Focusing", lastQuiz: 85, submissions: 10 },
  { id: "3", name: "Leo Zhang", synergy: 45, status: "At Risk", gaps: ["Atomic Theory", "Valence Shells"], sentiment: "Frustrated", lastQuiz: 62, submissions: 5 },
  { id: "4", name: "Emma Wilson", synergy: 68, status: "Active", gaps: ["Periodic Trends"], sentiment: "Steady", lastQuiz: 74, submissions: 8 },
  { id: "5", name: "David K.", synergy: 31, status: "Critical", gaps: ["Ionic Bonding", "Covalent Struct."], sentiment: "Avoidant", lastQuiz: 45, submissions: 3 },
];

export const REOEvaluator = () => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const runNeuralScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="space-y-10 selection:bg-indigo-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                 <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-4xl font-black text-ink tracking-tighter italic uppercase">REO <span className="text-indigo-600">Evaluator</span></h2>
           </div>
           <p className="text-ink-muted font-bold text-sm uppercase tracking-widest">Neural Progress & AI-Driven Assessment</p>
        </div>
        <button 
          onClick={runNeuralScan}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group overflow-hidden relative"
        >
          {isScanning && (
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
          <Activity className={`w-4 h-4 ${isScanning ? 'animate-pulse' : 'group-hover:rotate-180 transition-transform'}`} />
          {isScanning ? "Scanning Neural Patterns..." : "Initialize Class Scan"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Student Roster Sector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 font-bold" />
            <input 
              type="text" 
              placeholder="Search Student ID..." 
              className="w-full bg-white border border-neutral-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-ink outline-none border-b-4 border-b-neutral-200 focus:border-b-indigo-600 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {MOCK_STUDENTS.map((student) => (
              <motion.div
                key={student.id}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedStudent(student)}
                className={`p-5 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between group ${
                  selectedStudent?.id === student.id 
                    ? 'bg-indigo-600 border-indigo-200 shadow-xl shadow-indigo-500/10' 
                    : 'bg-white border-neutral-100 shadow-sm hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                     selectedStudent?.id === student.id ? 'bg-white/20 text-white' : 'bg-neutral-50 text-indigo-600'
                   }`}>
                      {student.name.charAt(0)}
                   </div>
                   <div>
                      <h4 className={`font-black text-sm tracking-tight ${selectedStudent?.id === student.id ? 'text-white' : 'text-ink'}`}>{student.name}</h4>
                      <div className="flex items-center gap-2">
                         <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-white/60' : 'text-neutral-400'}`}>Synergy: {student.synergy}%</p>
                      </div>
                   </div>
                </div>
                <Badge className={`border-none text-[8px] uppercase font-black px-2 py-0.5 ${
                  student.status === 'Excelling' ? 'bg-emerald-100 text-emerald-600' :
                  student.status === 'At Risk' || student.status === 'Critical' ? 'bg-rose-100 text-rose-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {student.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed Insights Sector */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
             {selectedStudent ? (
               <motion.div
                 key={selectedStudent.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white rounded-[3.5rem] border border-neutral-100 shadow-2xl overflow-hidden p-10 space-y-10 relative"
               >
                 {/* Decorative Grid BG */}
                 <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#primary 1px, transparent 1px), linear-gradient(90deg, #primary 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                 
                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
                          <Fingerprint className="w-10 h-10" />
                       </div>
                       <div>
                          <h3 className="text-3xl font-black text-ink tracking-tighter italic">{selectedStudent.name}</h3>
                          <div className="flex flex-wrap gap-3 mt-1">
                             <div className="flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-black uppercase text-neutral-500 tracking-widest border border-neutral-200/60">
                                <Activity className="w-3 h-3 text-indigo-600" /> Neural ID: #4492-{selectedStudent.id}
                             </div>
                             <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-widest border border-indigo-100">
                                <Layers className="w-3 h-3" /> Submissions: {selectedStudent.submissions}
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">REO Synergy Score</p>
                       <p className="text-6xl font-black text-indigo-600 tracking-tighter italic">{selectedStudent.synergy}%</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Sentiment Analysis */}
                    <Card className="p-8 border-neutral-100 bg-neutral-50/50 rounded-[2.5rem] shadow-sm flex flex-col justify-between">
                       <div>
                          <div className="flex items-center gap-3 mb-6">
                             <Brain className="w-5 h-5 text-indigo-600" />
                             <h4 className="text-[11px] font-black text-ink uppercase tracking-widest">Cognitive Sentiment</h4>
                          </div>
                          <div className="flex items-center gap-6 mb-8">
                             <div className={`p-4 rounded-3xl ${
                               selectedStudent.sentiment === 'Dynamic' ? 'bg-emerald-500/10 text-emerald-600' :
                               selectedStudent.sentiment === 'Frustrated' ? 'bg-rose-500/10 text-rose-600' :
                               'bg-amber-500/10 text-amber-600'
                             }`}>
                                <Zap className="w-8 h-8" />
                             </div>
                             <div>
                                <p className="text-2xl font-black text-ink italic leading-none">{selectedStudent.sentiment}</p>
                                <p className="text-[10px] text-ink-muted font-bold mt-1 max-w-[150px]">REO Linguistic analysis indicates high cognitive energy.</p>
                             </div>
                          </div>
                       </div>
                       <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedStudent.synergy}%` }}
                            className="h-full bg-indigo-600"
                          />
                       </div>
                    </Card>

                    {/* Knowledge Gaps */}
                    <Card className="p-8 border-neutral-100 bg-neutral-50/50 rounded-[2.5rem] shadow-sm">
                       <div className="flex items-center gap-3 mb-6">
                          <Target className="w-5 h-5 text-rose-500" />
                          <h4 className="text-[11px] font-black text-ink uppercase tracking-widest">Knowledge Deficits</h4>
                       </div>
                       <div className="space-y-3">
                          {selectedStudent.gaps.map((gap: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl group/gap">
                               <span className="text-xs font-bold text-ink group-hover/gap:text-rose-500 transition-colors">{gap}</span>
                               <AlertTriangle className="w-4 h-4 text-rose-200 group-hover/gap:text-rose-500 transition-colors" />
                            </div>
                          ))}
                       </div>
                    </Card>
                 </div>

                 {/* AI Actions */}
                 <div className="p-8 bg-indigo-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 relative z-10 shadow-2xl shadow-indigo-200 overflow-hidden">
                    <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                          <Zap className="w-8 h-8" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black italic tracking-tight">Prescriptive Intervention</h4>
                          <p className="text-xs text-white/60 font-medium">REO recommends deploying a tailored knowledge-bridge session.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                       <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl">Deploy Sync Pack</button>
                       <button className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                          <MessageSquare className="w-5 h-5 text-white" />
                       </button>
                    </div>
                 </div>
               </motion.div>
             ) : (
               <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-10 bg-white/40 border-2 border-dashed border-neutral-200 rounded-[4rem]">
                  <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-8">
                     <Brain className="w-12 h-12 text-neutral-300" />
                  </div>
                  <h3 className="text-3xl font-black text-ink italic tracking-tight mb-4">Neural Analysis Pending</h3>
                  <p className="text-ink-muted max-w-sm font-medium">Select a student from the synchronizer roster to initialize high-fidelity REO evaluation.</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
