import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AchievementBadge, { type Achievement } from "@/components/AchievementBadge";

interface QuizAchievementToastProps {
  achievements: Achievement[];
  onClose: () => void;
}

const QuizAchievementToast: React.FC<QuizAchievementToastProps> = ({
  achievements,
  onClose,
}) => {
  useEffect(() => {
    if (achievements.length > 0) {
      // Trigger confetti for achievements
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#d97706", "#10b981", "#3b82f6"],
      });
    }
  }, [achievements.length]);

  if (achievements.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
      >
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-amber-500">
                {achievements.length === 1 ? "Achievement Unlocked!" : `${achievements.length} Achievements Unlocked!`}
              </span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Dismiss" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                <AchievementBadge
                  achievement={achievement}
                  earned={true}
                  size="md"
                  showName={true}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuizAchievementToast;