/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, AlertTriangle, Zap, Activity } from "lucide-react";
import { BurnoutMetrics } from "../lib/metrics";

export const BurnoutMeter = ({ metrics }: { metrics: BurnoutMetrics }) => {
  const { score, status, message, recommendation } = metrics;

  // Color mapping based on status
  const colors = {
    optimal: {
      accent: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/20",
      gauge: "#10b981"
    },
    strained: {
      accent: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/20",
      gauge: "#f59e0b"
    },
    burnout_risk: {
      accent: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      glow: "shadow-red-500/20",
      gauge: "#ef4444"
    }
  };

  const activeColor = colors[status];

  // SVG Gauge calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className={`glass relative overflow-hidden rounded-[2.5rem] p-8 border-white/60 shadow-2xl transition-all duration-500`}>
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Brain className="w-64 h-64 text-ink" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
        {/* The Gauge */}
        <div className="relative w-40 h-40 shrink-0">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl" />
          <svg className="w-full h-full -rotate-90 transform relative z-10" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-ink/10"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={activeColor.gauge}
              strokeWidth="12"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 10px ${activeColor.gauge}66)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <motion.span 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black font-sans tracking-tighter text-ink"
            >
              {Math.round(score)}%
            </motion.span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-muted">Stress</p>
          </div>
        </div>

        {/* Text Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${activeColor.bg} ${activeColor.accent} shadow-inner flex items-center justify-center`}>
              {status === 'optimal' ? <Zap className="w-6 h-6" /> : status === 'strained' ? <Brain className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-ink tracking-tight italic">Biometric Load</h3>
              <p className="text-[10px] font-black uppercase text-ink-muted tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Analysis
              </p>
            </div>
          </div>

          <div className="space-y-2">
             <p className={`text-2xl font-black uppercase tracking-tighter ${activeColor.accent}`}>
               {message}
             </p>
             <p className="text-sm font-medium text-ink-muted leading-relaxed max-w-md">
               {recommendation}
             </p>
          </div>

          <div className="pt-4 flex items-center gap-4">
             <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden border border-white/40">
                <motion.div 
                  className={`h-full bg-current ${activeColor.accent} opacity-80`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.5 }}
                />
             </div>
             <span className="text-[10px] font-black text-ink-muted uppercase whitespace-nowrap">Threshold: 75%</span>
          </div>
        </div>
      </div>

      {/* Warning Overlay for high risk */}
      <AnimatePresence>
        {score > 75 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600/5 pointer-events-none border-2 border-red-500/20 rounded-[2.5rem]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
