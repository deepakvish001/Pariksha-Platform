import { motion } from "framer-motion";
import { Activity, Sparkles } from "lucide-react";

export function ActivityEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Activity className="h-10 w-10 text-primary" />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Sparkles className="h-3 w-3 text-primary" />
        </motion.div>
      </div>
      
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        No activity yet
      </h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Start learning to see your activity here! Complete quizzes, solve problems, 
        and track your progress in real-time.
      </p>
    </motion.div>
  );
}
