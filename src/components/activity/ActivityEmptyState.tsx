import { motion } from "framer-motion";
import { Activity, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ActivityEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-gradient-to-br from-primary to-purple-500 blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative"
      >
        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center border border-white/10 shadow-2xl shadow-primary/20 ring-1 ring-white/10">
          <Activity className="h-12 w-12 text-primary" />
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/40"
        >
          <Sparkles className="h-4 w-4 text-white" />
        </motion.div>

        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-primary/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-primary/20"
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
      </motion.div>
      
      <motion.h3 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-xl font-bold text-white"
      >
        No activity yet
      </motion.h3>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-sm text-white/50 text-center max-w-sm leading-relaxed"
      >
        Start learning to see your activity here! Complete quizzes, solve problems, 
        and track your progress in real-time.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Button 
          onClick={() => navigate("/library/quiz")}
          className="gap-2 shadow-lg shadow-primary/20"
        >
          Start a Quiz
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
