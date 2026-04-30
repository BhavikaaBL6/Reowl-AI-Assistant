/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Zap, 
  Sparkles, 
  Skull, 
  Target, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Crown,
  ChevronRight,
  Info,
  Sword,
  Search,
  Lock,
  Star
} from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

// --- Mock Data ---
const TOP_SYNCHRONIZERS = [
  { id: 1, name: "NeuralGhost", score: 9840, level: 42, rank: "Master", avatar: "👻", bonus: "+15%" },
  { id: 2, name: "Cypher_X", score: 9520, level: 38, rank: "Expert", avatar: "⚡", bonus: "+12%" },
  { id: 3, name: "QuantumReaper", score: 9210, level: 35, rank: "Expert", avatar: "💀", bonus: "+10%" },
  { id: 4, name: "BinarySoul", score: 8700, level: 31, rank: "Veteran", avatar: "🤖", bonus: "+8%" },
  { id: 5, name: "VoidRunner", score: 8450, level: 29, rank: "Veteran", avatar: "🌀", bonus: "+8%" },
  { id: 6, name: "HexCode", score: 7900, level: 25, rank: "Elite", avatar: "💠", bonus: "+5%" },
  { id: 7, name: "NeonAura", score: 7650, level: 24, rank: "Elite", avatar: "✨", bonus: "+5%" },
  { id: 8, name: "ShadowNet", score: 7200, level: 22, rank: "Elite", avatar: "🌑", bonus: "+5%" },
  { id: 9, name: "DataWitch", score: 6800, level: 19, rank: "Adept", avatar: "🔮", bonus: "+2%" },
  { id: 10, name: "LogicBomb", score: 6500, level: 18, rank: "Adept", avatar: "💣", bonus: "+2%" },
  { id: 11, name: "PulseCore", score: 6100, level: 16, rank: "Adept", avatar: "💗", bonus: "+2%" },
  { id: 12, name: "BitMaster", score: 5800, level: 15, rank: "Initiate", avatar: "🎲", bonus: "0%" },
];

const RECENT_DUELS = [
  { user1: "NeuralGhost", user2: "BinarySoul", result: "Win", points: "+120 FP", time: "2m ago" },
  { user1: "VoidRunner", user2: "Cypher_X", result: "Loss", points: "-40 FP", time: "5m ago" },
  { user1: "HexCode", user2: "NeonAura", result: "Win", points: "+85 FP", time: "12m ago" },
  { user1: "ShadowNet", user2: "DataWitch", result: "Win", points: "+95 FP", time: "18m ago" },
];

const BATTLE_PASS_TIERS = [
  { tier: 1, reward: "Neural Sync Badge", type: "Equippable", requiredFP: 0, unlocked: true },
  { tier: 2, reward: "100 Focus Crystals", type: "Currency", requiredFP: 500, unlocked: true },
  { tier: 3, reward: "Skull Core Avatar", type: "Cosmetic", requiredFP: 1200, unlocked: false },
  { tier: 4, reward: "Enhanced Processing", type: "Perk", requiredFP: 2500, unlocked: false },
  { tier: 5, reward: "Master Rank Frame", type: "Cosmetic", requiredFP: 5000, unlocked: false },
];

export const KnowledgeArena = () => {
  const [activeTab, setActiveTab] = useState("leaderboard");
  
  return (
    <div className="min-h-screen bg-[#0D0B21] text-white selection:bg-primary/30 font-sans relative overflow-x-hidden">
      {/* Global Grainy Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-repeat z-50" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/60-lines.png')` }} />
      
      {/* Neural Sync Hero Landing Zone */}
      <section className="relative pt-20 pb-32 px-10 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(#primary 1px, transparent 1px), linear-gradient(90deg, #primary 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0B21]/0 via-[#0D0B21]/50 to-[#0D0B21]" />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md"
            >
              <Zap className="w-3 h-3 animate-pulse" /> Neural Network Online
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-8xl font-black italic tracking-tighter leading-none"
            >
              KNOWLEDGE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary animate-gradient-x">ARENA</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Enter the collective neural network. Prove your cognitive dominance through high-stakes study duels and earn Focus Points to ascend the ranks.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4"
            >
              <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group">
                <Sword className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Initiate Duel
              </button>
              <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                Practice Protocol
              </button>
            </motion.div>
          </div>
          
          <div className="relative flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
              className="relative w-[300px] h-[300px] lg:w-[450px] lg:h-[450px]"
            >
              {/* Outer Decorative Rings */}
              <div className="absolute inset-0 border border-white/5 rounded-full animate-spin-slow" />
              <div className="absolute inset-4 border border-primary/20 rounded-full animate-reverse-spin-slow" />
              <div className="absolute inset-10 border-2 border-dashed border-primary/10 rounded-full" />
              
              {/* Animated Skull Core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                  <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-[#1a1b3a] to-[#0D0B21] border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #primary 1px, transparent 0)`, backgroundSize: '12px 12px' }} />
                    <Skull className="w-24 h-24 lg:w-32 lg:h-32 text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                  </div>
                </div>
              </div>
              
              {/* Floating Orbiting Data Chips */}
              <motion.div 
                animate={{ y: [0, -20, 0], x: [0, 10, 0] }} 
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-0 right-0 p-4 glass rounded-2xl border-white/10 shadow-xl backdrop-blur-md"
              >
                <Target className="w-6 h-6 text-primary mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Accuracy</p>
                <p className="text-xl font-bold">98.4%</p>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 20, 0], x: [0, -15, 0] }} 
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute bottom-10 left-0 p-4 glass rounded-2xl border-white/10 shadow-xl backdrop-blur-md"
              >
                <Zap className="w-6 h-6 text-amber-500 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">FP Gained</p>
                <p className="text-xl font-bold">+12,400</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Sync Feed - Fixed Height Scrolling Ticker */}
      <section className="bg-primary/5 border-y border-primary/10 overflow-hidden py-4">
        <div className="flex whitespace-nowrap animate-ticker">
          {[...RECENT_DUELS, ...RECENT_DUELS].map((duel, i) => (
            <div key={i} className="flex items-center gap-6 px-12 border-r border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-sm tracking-tight">{duel.user1}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white/5 rounded text-white/40">VS</span>
                <span className="text-white font-bold text-sm tracking-tight">{duel.user2}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${duel.result === 'Win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} border-none text-[9px] uppercase font-black`}>{duel.result}</Badge>
                <span className="text-primary font-black text-xs">{duel.points}</span>
                <span className="text-[9px] text-white/30 truncate">{duel.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Battle Pass Protocol Section */}
      <section className="py-24 px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight italic flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-primary" /> BATTLE PASS <span className="text-white/20">/ v1.4</span>
            </h2>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-[0.2em] font-black">Neural Tier Progression</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-white/60 mb-2">My Focus Points</p>
            <div className="flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-2xl font-black italic tracking-tight text-white">1,450 <span className="text-xs text-white/20 not-italic uppercase tracking-widest ml-1">FP</span></span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {BATTLE_PASS_TIERS.map((tier, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group ${tier.unlocked ? 'bg-primary/5 border-primary/20 shadow-2xl shadow-primary/5' : 'bg-white/[0.02] border-white/5 opacity-60'}`}
            >
              {!tier.unlocked && (
                <div className="absolute top-4 right-4 text-white/20">
                  <Lock className="w-4 h-4" />
                </div>
              )}
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Tier 0{tier.tier}</span>
                    {tier.unlocked && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] uppercase font-black px-2 py-0.5">Unlocked</Badge>}
                 </div>
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${tier.unlocked ? 'bg-primary text-white' : 'bg-white/5 text-white/20'}`}>
                    {tier.type === 'Currency' ? <Star className="w-6 h-6" /> : 
                     tier.type === 'Equippable' ? <ShieldCheck className="w-6 h-6" /> : 
                     tier.type === 'Cosmetic' ? <Skull className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                 </div>
                 <h4 className={`text-lg font-black tracking-tight mb-1 ${tier.unlocked ? 'text-white' : 'text-white/40'}`}>{tier.reward}</h4>
                 <p className="text-[10px] uppercase font-black text-white/20 tracking-widest mb-6">{tier.type}</p>
                 
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${tier.unlocked ? 'bg-primary' : 'bg-white/20'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: tier.unlocked ? '100%' : '30%' }}
                      transition={{ duration: 1 }}
                    />
                 </div>
                 <p className="mt-3 text-[9px] font-black uppercase text-white/30 tracking-tighter">
                   {tier.unlocked ? 'Claimed' : `${tier.requiredFP - 1450} FP to Unlock`}
                 </p>
              </div>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hall of Legends - Structured Rankings Section */}
      <section className="py-24 px-10 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-7xl font-black tracking-tighter italic"
            >
              HALL OF <span className="text-primary">LEGENDS</span>
            </motion.h2>
            <p className="text-white/40 text-sm uppercase tracking-[0.4em] font-black">Top Performers in the Synchronizer Network</p>
          </div>
          
          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-24 items-end max-w-5xl mx-auto">
            {/* Rank 2 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center order-2 md:order-1"
            >
              <div className="relative group cursor-pointer mb-6">
                <div className="absolute inset-0 bg-white/20 blur-[30px] rounded-full group-hover:bg-white/40 transition-colors" />
                <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-gradient-to-br from-[#1a1b3a] to-[#0D0B21] flex items-center justify-center text-4xl relative z-10 shadow-2xl">
                  {TOP_SYNCHRONIZERS[1].avatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-[#0D0B21] px-4 py-1 rounded-lg font-black text-sm relative z-20 shadow-xl">
                  #2
                </div>
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-1 text-white/80">{TOP_SYNCHRONIZERS[1].name}</h3>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-4">{TOP_SYNCHRONIZERS[1].rank} • lvl {TOP_SYNCHRONIZERS[1].level}</p>
              <div className="w-full h-40 bg-gradient-to-t from-white/10 to-white/5 rounded-t-[2rem] border-x border-t border-white/10 flex flex-col items-center justify-center p-6 text-center">
                 <p className="text-2xl font-black text-white italic">{TOP_SYNCHRONIZERS[1].score.toLocaleString()}</p>
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Focus Points</p>
              </div>
            </motion.div>
            
            {/* Rank 1 (Tallest) */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center order-1 md:order-2"
            >
              <div className="relative group cursor-pointer mb-8">
                <div className="absolute inset-0 bg-primary/30 blur-[50px] rounded-full group-hover:bg-primary/50 transition-colors" />
                <div className="w-40 h-40 rounded-full border-4 border-primary bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-6xl relative z-10 shadow-2xl">
                  {TOP_SYNCHRONIZERS[0].avatar}
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                  <Crown className="w-10 h-10 drop-shadow-lg" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-xl font-black text-lg relative z-20 shadow-2xl">
                  #1
                </div>
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-1 text-white">{TOP_SYNCHRONIZERS[0].name}</h3>
              <p className="text-primary font-black uppercase text-xs tracking-[0.2em] mb-6">{TOP_SYNCHRONIZERS[0].rank} • lvl {TOP_SYNCHRONIZERS[0].level}</p>
              <div className="w-full h-64 bg-gradient-to-t from-primary/20 to-primary/5 rounded-t-[3rem] border-x border-t border-primary/20 flex flex-col items-center justify-center p-8 text-center shadow-2xl shadow-primary/5">
                 <p className="text-4xl font-black text-primary italic mb-2">{TOP_SYNCHRONIZERS[0].score.toLocaleString()}</p>
                 <p className="text-sm font-black uppercase text-white/40 tracking-widest">Total Focus Points</p>
                 <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase">Rank Bonus: {TOP_SYNCHRONIZERS[0].bonus}</span>
                 </div>
              </div>
            </motion.div>
            
            {/* Rank 3 */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center order-3 md:order-3"
            >
              <div className="relative group cursor-pointer mb-6">
                <div className="absolute inset-0 bg-[#cd7f32]/20 blur-[30px] rounded-full" />
                <div className="w-28 h-28 rounded-full border-4 border-[#cd7f32]/40 bg-gradient-to-br from-[#1a1b3a] to-[#0D0B21] flex items-center justify-center text-3xl relative z-10 shadow-2xl">
                  {TOP_SYNCHRONIZERS[2].avatar}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#cd7f32] text-white px-4 py-1 rounded-lg font-black text-sm relative z-20 shadow-xl">
                  #3
                </div>
              </div>
              <h3 className="text-xl font-black tracking-tight mb-1 text-white/70">{TOP_SYNCHRONIZERS[2].name}</h3>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-4">{TOP_SYNCHRONIZERS[2].rank} • lvl {TOP_SYNCHRONIZERS[2].level}</p>
              <div className="w-full h-32 bg-gradient-to-t from-white/5 to-transparent rounded-t-[1.5rem] border-x border-t border-white/5 flex flex-col items-center justify-center p-6 text-center">
                 <p className="text-xl font-black text-white/60 italic">{TOP_SYNCHRONIZERS[2].score.toLocaleString()}</p>
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Focus Points</p>
              </div>
            </motion.div>
          </div>

          {/* Rest of Leaderboard Table */}
          <div className="bg-white/[0.03] border border-white/5 rounded-[3.5rem] p-4 lg:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(#primary 1px, transparent 1px), linear-gradient(90deg, #primary 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10 px-6">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:scale-110 transition-transform">
                      <Search className="w-5 h-5 text-white/40" />
                   </div>
                   <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-white">Live Rankings</h4>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Network Synchronized</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {TOP_SYNCHRONIZERS.slice(3).map((user, i) => (
                  <motion.div 
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col md:flex-row items-center justify-between p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] hover:border-primary/20 rounded-[2rem] transition-all group/row cursor-pointer"
                  >
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-4 md:mb-0">
                      <span className="text-sm font-black text-white/20 group-hover/row:text-primary transition-colors w-6">#{i + 4}</span>
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-[#1a1b3a] border border-white/5 flex items-center justify-center text-2xl shadow-xl group-hover/row:rotate-6 transition-transform">
                            {user.avatar}
                         </div>
                         <div>
                            <h5 className="text-lg font-black text-white group-hover/row:text-primary transition-colors leading-tight">{user.name}</h5>
                            <p className="text-[10px] uppercase font-black text-white/20 tracking-widest flex items-center gap-2">
                               <ShieldCheck className="w-3 h-3" /> {user.rank} • LVL {user.level}
                            </p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-10 md:gap-16">
                       <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Rank Bonus</p>
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px]">{user.bonus}</Badge>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.2em] mb-1">Cumulative FP</p>
                          <p className="text-xl font-black italic text-white group-hover/row:scale-110 transition-transform">{user.score.toLocaleString()}</p>
                       </div>
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover/row:bg-primary group-hover/row:text-white transition-all">
                          <ChevronRight className="w-5 h-5 group-hover/row:translate-x-0.5 transition-transform" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Arena Mechanics - Structured Footer Explanation */}
      <section className="py-32 px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4 space-y-6">
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 w-fit">
              <Info className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Arena <br /> Mechanics</h2>
            <p className="text-white/40 text-sm font-medium leading-relaxed">The Knowledge Arena facilitates high-speed cognitive synchronization through competitive evaluation. Understand the protocol to minimize data loss.</p>
          </div>
          
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6 group hover:border-primary/20 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                <Target className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black tracking-tight italic">Combat System</h4>
              <p className="text-xs text-white/40 leading-relaxed font-medium">Duels consist of synchronized data retrieval queries. Speed and accuracy provide multiplicative bonuses to your final FP outcome. Missing a query results in neural degradation and ranking penalty.</p>
              <ul className="space-y-2 pt-4">
                 <li className="flex items-center gap-3 text-[10px] font-black uppercase text-white/60 tracking-widest">
                    <Activity className="w-4 h-4 text-emerald-500" /> Perfect Accuracy: +50% Bonus
                 </li>
                 <li className="flex items-center gap-3 text-[10px] font-black uppercase text-white/60 tracking-widest">
                    <Activity className="w-4 h-4 text-amber-500" /> Speed Blitz: +30% Bonus
                 </li>
              </ul>
            </div>
            
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6 group hover:border-primary/20 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black tracking-tight italic">Sync Hierarchy</h4>
              <p className="text-xs text-white/40 leading-relaxed font-medium">Your rank is determined by cumulative Focus Points. Higher ranks unlock advanced decryption tools and exclusive cosmetic identifies from the neural Battle Pass.</p>
              <div className="grid grid-cols-3 gap-2 pt-4">
                 {['Initiate', 'Adept', 'Elite', 'Veteran', 'Expert', 'Master'].map(rank => (
                    <div key={rank} className="p-2 border border-white/5 rounded-lg text-center">
                       <p className="text-[8px] font-black uppercase text-white/40 tracking-tight">{rank}</p>
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Game Footer */}
      <footer className="py-20 px-10 bg-black/40 backdrop-blur-3xl border-t border-white/5 text-center">
         <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8 opacity-40 grayscale group-hover:grayscale-0 transition-all">
               <Skull className="w-6 h-6 text-primary" />
               <h1 className="text-xl font-black italic tracking-tighter text-white">REOWL ARENA</h1>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20 max-w-lg mx-auto leading-relaxed">
               Proprietary Neural Combat Environment . Authorized Access Only . Unauthorized Decryption is a Tier 1 Academic Infraction
            </p>
            <div className="flex items-center justify-center gap-8 mt-12 opacity-30">
               <div className="h-[1px] w-32 bg-gradient-to-r from-transparent to-white" />
               <Crown className="w-4 h-4 text-white" />
               <div className="h-[1px] w-32 bg-gradient-to-l from-transparent to-white" />
            </div>
         </div>
      </footer>
      
      {/* Styles for Animations */}
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          animation: ticker 40s linear infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        .animate-reverse-spin-slow {
          animation: reverse-spin 20s linear infinite;
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
