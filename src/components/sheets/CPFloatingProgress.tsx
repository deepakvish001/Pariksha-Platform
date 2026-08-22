import React, { useEffect, useState, memo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowUp, Trophy, Target, Flame, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CPFloatingProgressProps {
  solvedCount: number;
  totalCount: number;
  revisionCount?: number;
  streak?: number;
  className?: string;
}

// Smooth animated number
function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: "easeOut",
    });
    
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionValue, rounded]);
  
  return <span className="tabular-nums">{display}</span>;
}

const CPFloatingProgress: React.FC<CPFloatingProgressProps> = memo(({
  solvedCount,
  totalCount,
  revisionCount = 0,
  streak = 0,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  const isComplete = progressPercent === 100;

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          
          setIsVisible(scrollY > 200);
          setShowBackToTop(scrollY > windowHeight * 0.5);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      {/* Enhanced Floating Progress Widget */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.8 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed right-4 bottom-24 md:right-6 md:bottom-6 z-40",
              className
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
          >
            <motion.div 
              className={cn(
                "rounded-2xl shadow-2xl border border-border/50 backdrop-blur-2xl",
                "bg-background/95 dark:bg-background/90",
                "transition-all duration-300"
              )}
              animate={{ 
                boxShadow: isComplete 
                  ? "0 0 40px 0 rgba(34, 197, 94, 0.2)" 
                  : "0 20px 40px -10px rgba(0,0,0,0.2)"
              }}
              layout
            >
              {/* Progress bar at top */}
              <div className="h-1 bg-muted/20 rounded-t-2xl overflow-hidden">
                <motion.div 
                  className={cn(
                    "h-full",
                    isComplete 
                      ? "bg-emerald-500" 
                      : "bg-gradient-to-r from-primary via-amber-500 to-orange-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative h-14 w-14">
                    <svg width="56" height="56" className="transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="hsl(var(--muted) / 0.3)"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="url(#cpFloatGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                      <defs>
                        <linearGradient id="cpFloatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={isComplete ? "hsl(142 76% 46%)" : "hsl(var(--primary))"} />
                          <stop offset="50%" stopColor={isComplete ? "hsl(142 76% 40%)" : "hsl(38, 100%, 50%)"} />
                          <stop offset="100%" stopColor={isComplete ? "hsl(142 76% 36%)" : "hsl(25, 100%, 50%)"} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span 
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          isComplete && "text-emerald-600 dark:text-emerald-400"
                        )}
                        key={progressPercent}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                      >
                        {progressPercent}%
                      </motion.span>
                    </div>
                    
                    {/* Celebration particles when complete */}
                    {isComplete && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-emerald-500"
                            style={{
                              left: "50%",
                              top: "50%",
                            }}
                            animate={{
                              x: [0, Math.cos(i * 60 * Math.PI / 180) * 20],
                              y: [0, Math.sin(i * 60 * Math.PI / 180) * 20],
                              opacity: [1, 0],
                              scale: [1, 0],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                              repeatDelay: 2,
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Stats - always show on desktop, expandable on mobile */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      className={cn(
                        "flex flex-col gap-1.5",
                        "hidden md:flex",
                        isExpanded && "!flex"
                      )}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className={cn(
                          "h-3.5 w-3.5",
                          isComplete ? "text-emerald-500" : "text-primary"
                        )} />
                        <span className="text-sm font-semibold">
                          <AnimatedNumber value={solvedCount} />
                          <span className="text-muted-foreground font-normal">/{totalCount}</span>
                        </span>
                      </div>
                      
                      {revisionCount > 0 && (
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs text-muted-foreground">
                            {revisionCount} for review
                          </span>
                        </motion.div>
                      )}
                      
                      {streak > 0 && (
                        <motion.div 
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <Flame className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-xs text-muted-foreground">
                            {streak} day streak
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Mobile compact view - tap to expand */}
                  <div className={cn(
                    "md:hidden flex flex-col items-center",
                    isExpanded && "hidden"
                  )}>
                    <Trophy className={cn(
                      "h-4 w-4",
                      isComplete ? "text-emerald-500" : "text-primary"
                    )} />
                    <span className="text-xs font-bold mt-0.5 tabular-nums">{solvedCount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 400 }}
            className="fixed right-4 bottom-6 md:right-6 md:bottom-28 z-40"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className={cn(
                "h-10 w-10 rounded-full shadow-lg",
                "bg-background/90 backdrop-blur-xl hover:bg-primary hover:text-primary-foreground",
                "transition-all duration-200 border-border/50",
                "hover:scale-110 hover:shadow-xl"
              )}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

CPFloatingProgress.displayName = "CPFloatingProgress";

export default CPFloatingProgress;
