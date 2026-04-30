import React, { useState } from "react";
import { motion } from "motion/react";
import { User, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";

export const UsernameSetup: React.FC = () => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile({ displayName: name.trim() });
    } catch (err) {
      console.error("Failed to save name:", err);
      alert("Something went wrong saving your name. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F0F4FF] via-[#FAF9FF] to-[#F5F9FF]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-[3.5rem] border-white/60 shadow-3xl text-center max-w-md w-full"
      >
        <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-primary/30 -rotate-3">
          <User className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl font-black text-ink mb-3 italic">Welcome to Reowl!</h1>
        <p className="text-ink-muted mb-8 font-light leading-relaxed">
          How would you like us to address you? Please enter your preferred name below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Alex Johnson"
              className="w-full bg-white/50 border-2 border-white/80 focus:border-primary px-8 py-5 rounded-2xl outline-none text-lg font-bold text-ink transition-all shadow-sm focus:shadow-xl focus:shadow-primary/5"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl shadow-primary/30 tracking-tight"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue Studying <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[10px] font-black uppercase text-ink-muted tracking-[0.2em]">Unique identity for a unique scholar</p>
      </motion.div>
    </div>
  );
};
