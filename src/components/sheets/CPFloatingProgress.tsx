import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CPFloatingProgressProps {
  solvedCount: number;
  totalCount: number;
  revisionCount?: number;
  className?: string;
}

const CPFloatingProgress: React.FC<CPFloatingProgressProps> = ({
  solvedCount,
  totalCount,
  revisionCount = 0,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      setIsVisible(scrollY > 300);
      setShowBackToTop(scrollY > windowHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      {/* Floating Progress Widget */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed right-4 bottom-24 md:right-6 md:bottom-6 z-40",
              className
            )}
          >
            <div className="glass-card rounded-2xl p-4 shadow-xl border border-border/50 backdrop-blur-xl bg-background/95">
              <div className="flex items-center gap-4">
                {/* Progress Ring */}
                <div className="relative h-14 w-14">
                  <svg width="56" height="56" className="transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted/30"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="20"
                      fill="none"
                      stroke="url(#cpFloatGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient id="cpFloatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="50%" stopColor="hsl(38, 100%, 50%)" />
                        <stop offset="100%" stopColor="hsl(25, 100%, 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold tabular-nums">{progressPercent}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">
                      <span className="text-foreground font-bold">{solvedCount}</span>
                      <span className="text-muted-foreground">/{totalCount}</span>
                    </span>
                  </div>
                  {revisionCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs text-muted-foreground">
                        {revisionCount} in revision
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile compact view */}
                <div className="md:hidden flex flex-col items-center">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium mt-0.5">{solvedCount}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 bottom-6 md:right-6 md:bottom-28 z-40"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={scrollToTop}
              className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200 border-border/50"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CPFloatingProgress;
