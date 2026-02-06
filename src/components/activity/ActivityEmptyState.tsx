import { motion } from "framer-motion";
import { Activity, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ActivityEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col items-center justify-center py-24 px-6"
    >
      {/* Decorative background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/10 via-purple-600/5 to-transparent blur-3xl opacity-60" />
      </div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative"
      >
        <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-white/[0.05] shadow-2xl shadow-primary/10 backdrop-blur-xl">
          <Activity className="h-14 w-14 text-primary/80" />
        </div>
        
        {/* Floating sparkle badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
          className="absolute -top-2 -right-2 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-xl shadow-primary/30 ring-2 ring-black"
        >
          <Sparkles className="h-4 w-4 text-white" />
        </motion.div>

        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-3xl border border-primary/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-3xl border border-primary/10"
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
        />
        <motion.div
          className="absolute inset-0 rounded-3xl border border-primary/5"
          animate={{ scale: [1, 1.7, 1], opacity: [0.1, 0, 0.1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
        />
      </motion.div>
      
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-10 text-2xl font-bold text-white"
      >
        No activity yet
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-sm text-white/40 text-center max-w-sm leading-relaxed"
      >
        Start learning to see your activity here! Complete quizzes, solve problems, 
        and track your progress in real-time.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 flex items-center gap-3"
      >
        <Button 
          onClick={() => navigate("/library/quiz")}
          className="gap-2.5 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 border-0"
          size="lg"
        >
          <Zap className="h-4 w-4" />
          Start a Quiz
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
