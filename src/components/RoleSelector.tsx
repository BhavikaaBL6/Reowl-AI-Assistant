import React from "react";
import { motion } from "motion/react";
import { GraduationCap, BookOpen, ChevronRight, UserCircle, Sparkles } from "lucide-react";
import { useFirebase } from "../contexts/FirebaseContext";

export const RoleSelector = () => {
  const { updateProfile } = useFirebase();

  const handleSelectRole = async (role: "student" | "teacher") => {
    try {
      await updateProfile({ role });
    } catch (error) {
      console.error("Failed to set role:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#F0F4FF] via-[#FAF9FF] to-[#F5F9FF]">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 text-center mb-4"
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-primary/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-ink mb-2 tracking-tight">Choose Your Path</h1>
          <p className="text-ink-muted font-light">Select your role to personalize your Reowl experience.</p>
        </motion.div>

        {/* Student Role */}
        <motion.button
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectRole("student")}
          className="glass p-10 rounded-[3rem] text-left border-white/60 shadow-xl space-y-6 group transition-all"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-lg shadow-primary/5">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-ink mb-2">I am a Student</h3>
            <p className="text-sm text-ink-muted font-medium leading-relaxed">
              Access smart notes, quiz generators, focus rooms, and AI study assistants tailored for your learning journey.
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm pt-4">
            Enter Student Hub <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* Teacher Role */}
        <motion.button
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleSelectRole("teacher")}
          className="glass p-10 rounded-[3rem] text-left border-white/60 shadow-xl space-y-6 group transition-all bg-white/40"
        >
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-indigo-500/5">
            <UserCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-ink mb-2">I am a Teacher</h3>
            <p className="text-sm text-ink-muted font-medium leading-relaxed">
              Manage classrooms, track student progress, architect syllabi, and deploy AI-generated content to your students.
            </p>
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm pt-4">
            Enter Teacher Portal <ChevronRight className="w-4 h-4" />
          </div>
        </motion.button>
      </div>
    </div>
  );
};
