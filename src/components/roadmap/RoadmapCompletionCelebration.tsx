import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Star, Sparkles, X, Award, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoadmapCompletionCelebrationProps {
  roadmapTitle: string;
  roadmapId: string;
  onClose: () => void;
}

const RoadmapCompletionCelebration: React.FC<RoadmapCompletionCelebrationProps> = ({
  roadmapTitle,
  roadmapId,
  onClose,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Grand celebration confetti
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 100, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 80 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e", "#10b981", "#8b5cf6", "#ec4899"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e", "#10b981", "#8b5cf6", "#ec4899"],
      });
    }, 200);

    // Initial center burst
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#fbbf24", "#f59e0b", "#22c55e", "#8b5cf6"],
      });
    }, 100);

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 80,
        origin: { x: 0 },
        colors: ["#ec4899", "#a855f7"],
      });
    }, 300);

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 80,
        origin: { x: 1 },
        colors: ["#ec4899", "#a855f7"],
      });
      setShowDetails(true);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 10 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-lg w-full mx-4 p-8 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-primary/20 to-amber-500/20 border border-emerald-500/30 shadow-2xl"
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center space-y-6">
            {/* Animated trophy */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-24 w-24 text-amber-400/50" />
                </div>
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Trophy className="h-12 w-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Congratulations text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium text-emerald-500 uppercase tracking-wider">
                🎉 Congratulations! 🎉
              </p>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-primary to-amber-500 bg-clip-text text-transparent mt-2">
                Roadmap Complete!
              </h2>
            </motion.div>

            {/* Roadmap title */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-xl font-semibold">{roadmapTitle}</span>
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-amber-500" />
                      <span>100% Complete</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Rocket className="h-4 w-4 text-primary" />
                      <span>All Topics Mastered</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground max-w-sm mx-auto">
                    You've mastered every topic in this roadmap! 
                    Keep the momentum going with another learning path.
                  </p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
                  >
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                    >
                      Stay Here
                    </Button>
                    <Button
                      onClick={() => {
                        onClose();
                        navigate("/research/roadmap");
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-600 hover:to-primary/90"
                    >
                      Explore More Roadmaps
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RoadmapCompletionCelebration;
