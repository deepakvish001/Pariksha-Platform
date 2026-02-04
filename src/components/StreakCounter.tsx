import { Flame, Zap, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakCounterProps {
  variant?: "compact" | "full" | "mini";
  className?: string;
}

const StreakCounter = ({ variant = "full", className }: StreakCounterProps) => {
  const { currentStreak, longestStreak, todayCompleted, isLoading } = useStreak();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-6 w-16" />
      </div>
    );
  }

  // Mini variant - just the flame and number
  if (variant === "mini") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full cursor-default",
                currentStreak > 0 
                  ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30" 
                  : "bg-muted/50 border border-border",
                className
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={currentStreak > 0 ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Flame className={cn(
                  "w-4 h-4",
                  currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
                )} />
              </motion.div>
              <span className={cn(
                "text-sm font-bold",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
              )}>
                {currentStreak}
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentStreak > 0 ? `${currentStreak} day streak! Keep it going!` : "Complete a topic to start your streak!"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant - flame with number and today status
  if (variant === "compact") {
    return (
      <motion.div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border",
          currentStreak > 0 
            ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20" 
            : "bg-card border-border",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          currentStreak > 0 ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-muted"
        )}>
          <motion.div
            animate={currentStreak > 0 ? {
              scale: [1, 1.15, 1],
            } : {}}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <Flame className={cn(
              "w-5 h-5",
              currentStreak > 0 ? "text-white" : "text-muted-foreground"
            )} />
          </motion.div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <motion.span 
              className={cn(
                "text-2xl font-bold",
                currentStreak > 0 ? "text-orange-500" : "text-muted-foreground"
              )}
              key={currentStreak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentStreak}
            </motion.span>
            <span className="text-xs text-muted-foreground">day{currentStreak !== 1 ? "s" : ""}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {todayCompleted ? "✓ Today done!" : "Complete a topic today!"}
          </span>
        </div>
      </motion.div>
    );
  }

  // Full variant - complete card with stats
  return (
    <motion.div 
      className={cn(
        "p-4 rounded-2xl border bg-card",
        currentStreak > 0 && "ring-2 ring-orange-500/20",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            currentStreak > 0 
              ? "bg-gradient-to-br from-orange-500 to-red-500" 
              : "bg-muted"
          )}>
            <motion.div
              animate={currentStreak > 0 ? {
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              } : {}}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
            >
              <Flame className={cn(
                "w-5 h-5",
                currentStreak > 0 ? "text-white" : "text-muted-foreground"
              )} />
            </motion.div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Current Streak</h3>
            <p className="text-xs text-muted-foreground">Keep the fire burning!</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {currentStreak > 0 && (
            <motion.div 
              className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-500 text-xs font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              🔥 On Fire
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Big Streak Number */}
      <div className="text-center py-4">
        <motion.div 
          className={cn(
            "text-6xl font-bold mb-1",
            currentStreak > 0 
              ? "bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent" 
              : "text-muted-foreground"
          )}
          key={currentStreak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {currentStreak}
        </motion.div>
        <p className="text-muted-foreground text-sm">consecutive day{currentStreak !== 1 ? "s" : ""}</p>
      </div>

      {/* Today's Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Today's progress</span>
          <span className={cn(
            "text-xs font-medium",
            todayCompleted ? "text-green-500" : "text-muted-foreground"
          )}>
            {todayCompleted ? "✓ Completed" : "Not yet"}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              todayCompleted 
                ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                : "bg-muted-foreground/30"
            )}
            initial={{ width: 0 }}
            animate={{ width: todayCompleted ? "100%" : "0%" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {currentStreak > 0 ? Math.round((currentStreak / Math.max(longestStreak, 1)) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Of best</p>
          </div>
        </div>
      </div>

      {/* Motivational message */}
      <AnimatePresence mode="wait">
        <motion.p 
          className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border"
          key={currentStreak > 0 ? "active" : "inactive"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {currentStreak === 0 && "Complete a topic today to start your streak! 🚀"}
          {currentStreak === 1 && "Great start! Keep it going tomorrow! 💪"}
          {currentStreak >= 2 && currentStreak < 7 && "You're building momentum! Don't break the chain! 🔥"}
          {currentStreak >= 7 && currentStreak < 30 && "One week strong! You're on fire! 🌟"}
          {currentStreak >= 30 && "Legendary dedication! You're unstoppable! 🏆"}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};

export default StreakCounter;
