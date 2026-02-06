import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Target, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RoadmapFloatingProgressProps {
  progressPercent: number;
  nextTopic?: string;
  className?: string;
}

const RoadmapFloatingProgress: React.FC<RoadmapFloatingProgressProps> = ({
  progressPercent,
  nextTopic,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Show floating widget after scrolling past first section
      setIsVisible(scrollY > 400);
      
      // Show back-to-top after scrolling significantly
      setShowBackToTop(scrollY > windowHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 18;
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
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed right-4 bottom-24 md:right-6 md:bottom-6 z-40",
              className
            )}
          >
            <div className="glass-card rounded-xl p-3 shadow-lg border border-border/50 backdrop-blur-xl bg-background/90">
              <div className="flex items-center gap-3">
                {/* Mini Progress Ring */}
                <div className="relative h-12 w-12">
                  <svg width="48" height="48" className="transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-muted/30"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      fill="none"
                      stroke="url(#floatGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      className="transition-all duration-500 ease-out"
                    />
                    <defs>
                      <linearGradient id="floatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(38, 100%, 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{progressPercent}%</span>
                  </div>
                </div>

                {/* Next Topic Preview */}
                <div className="hidden md:block max-w-[140px]">
                  <p className="text-xs text-muted-foreground">Up next</p>
                  <p className="text-sm font-medium truncate">
                    {nextTopic || "Keep learning!"}
                  </p>
                </div>

                {/* Target Icon for mobile */}
                <div className="md:hidden">
                  <Target className="h-4 w-4 text-primary" />
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
            className="fixed right-4 bottom-6 md:right-6 md:bottom-24 z-40"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={scrollToTop}
              className="h-10 w-10 rounded-full shadow-lg bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoadmapFloatingProgress;
