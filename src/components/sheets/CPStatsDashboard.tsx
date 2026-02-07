import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useEffect } from "react";
import { Trophy, Flame, Layers, Target, TrendingUp, CheckCircle2, Sparkles, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CPStatsDashboardProps {
  totalProblems: number;
  solvedCount: number;
  progressPercent: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  tracksCompleted: number;
  totalTracks: number;
  streak?: number;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

// Smooth animated counter
function AnimatedValue({ value, duration = 1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  
  useEffect(() => {
    let start: number;
    const startValue = display;
    
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValue + eased * (value - startValue)));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span className="tabular-nums">{display}</span>;
}

// Enhanced Circular Progress Ring Component
function ProgressRing({ 
  progress, 
  size = 80, 
  strokeWidth = 8,
  className
}: { 
  progress: number; 
  size?: number; 
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress === 100;
  
  return (
    <div className={cn("relative group", className)} style={{ width: size, height: size }}>
      {/* Glow effect on hover */}
      <motion.div 
        className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isComplete ? "bg-emerald-500/20" : "bg-primary/20"
        )}
      />
      
      <svg width={size} height={size} className="rotate-[-90deg] relative z-10">
        {/* Background circle with subtle pattern */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted) / 0.4)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with animated gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? "url(#completeGradient)" : "url(#progressGradient)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="hsl(38 92% 50%)" />
            <stop offset="100%" stopColor="hsl(25 95% 53%)" />
          </linearGradient>
          <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142 76% 46%)" />
            <stop offset="100%" stopColor="hsl(142 76% 36%)" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.span 
          className={cn(
            "text-lg font-bold tabular-nums",
            isComplete && "text-emerald-600 dark:text-emerald-400"
          )}
          key={progress}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
        >
          {progress}%
        </motion.span>
      </div>
      
      {/* Celebration effect when complete */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-1 -right-1 z-20"
          >
            <div className="p-1 rounded-full bg-emerald-500 shadow-lg">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Stat Card Component with better hover effects
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  colorClass,
  delay = 0,
  trend
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
  delay?: number;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, type: "spring", stiffness: 200 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="group cursor-default"
    >
      <div className={cn(
        "relative overflow-hidden flex items-center gap-3 p-3 sm:p-4 rounded-xl",
        "bg-background/60 backdrop-blur-sm border border-border/50",
        "hover:border-border hover:shadow-xl transition-all duration-300"
      )}>
        {/* Subtle gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/0 to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <motion.div 
          className={cn(
            "relative z-10 p-2.5 rounded-xl transition-all duration-300",
            "group-hover:scale-110 group-hover:rotate-3",
            colorClass
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.div>
        
        <div className="relative z-10 flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 truncate">{label}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-xl font-bold tabular-nums">{value}</span>
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            )}
          </div>
          {subValue && (
            <span className="text-[10px] text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Enhanced Difficulty Distribution Bar with interactive tooltips
function DifficultyBar({
  easy,
  medium,
  hard,
  easySolved,
  mediumSolved,
  hardSolved
}: {
  easy: number;
  medium: number;
  hard: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
}) {
  const total = easy + medium + hard;
  const easyPercent = total > 0 ? (easy / total) * 100 : 0;
  const mediumPercent = total > 0 ? (medium / total) * 100 : 0;
  const hardPercent = total > 0 ? (hard / total) * 100 : 0;
  
  const easyProgress = easy > 0 ? Math.round((easySolved / easy) * 100) : 0;
  const mediumProgress = medium > 0 ? Math.round((mediumSolved / medium) * 100) : 0;
  const hardProgress = hard > 0 ? Math.round((hardSolved / hard) * 100) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">Difficulty Distribution</span>
        <span className="text-muted-foreground">{total} problems</span>
      </div>
      
      {/* Stacked bar with improved aesthetics */}
      <div className="h-3 rounded-full overflow-hidden bg-muted/30 flex shadow-inner">
        {easyPercent > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${easyPercent}%` }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
            className="relative group bg-gradient-to-b from-emerald-400 to-emerald-500"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
        {mediumPercent > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${mediumPercent}%` }}
            transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
            className="relative group bg-gradient-to-b from-amber-400 to-amber-500"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
        {hardPercent > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hardPercent}%` }}
            transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
            className="relative group bg-gradient-to-b from-red-400 to-red-500"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
      </div>
      
      {/* Enhanced Legend with progress indicators */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div 
          className="flex flex-col gap-1 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Easy</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{easySolved}/{easy}</span>
            <span className="text-[10px] text-muted-foreground">{easyProgress}%</span>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col gap-1 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Medium</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{mediumSolved}/{medium}</span>
            <span className="text-[10px] text-muted-foreground">{mediumProgress}%</span>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col gap-1 p-2 rounded-lg bg-red-500/5 border border-red-500/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-400 to-red-500" />
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Hard</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{hardSolved}/{hard}</span>
            <span className="text-[10px] text-muted-foreground">{hardProgress}%</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const CPStatsDashboard = memo(function CPStatsDashboard({
  totalProblems,
  solvedCount,
  progressPercent,
  easyCount,
  mediumCount,
  hardCount,
  easySolved,
  mediumSolved,
  hardSolved,
  tracksCompleted,
  totalTracks,
  streak = 0,
  weeklyGoal = 0,
  weeklyProgress = 0
}: CPStatsDashboardProps) {
  return (
    <Card className="overflow-hidden border-border/40 bg-gradient-to-br from-card via-card to-muted/10 shadow-lg">
      {/* Animated gradient border */}
      <motion.div 
        className="h-1"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)), hsl(38 92% 50%), hsl(25 95% 53%), hsl(var(--primary)))",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left - Progress Ring with enhanced styling */}
          <div className="flex items-center gap-5">
            <ProgressRing progress={progressPercent} size={88} strokeWidth={8} />
            <div>
              <p className="font-bold text-base sm:text-lg">Overall Progress</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{solvedCount.toLocaleString()}</span> of {totalProblems.toLocaleString()} solved
              </p>
              {streak > 0 && (
                <motion.div 
                  className="flex items-center gap-1.5 mt-1.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                    {streak} day streak!
                  </span>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-border/50 to-transparent" />
          
          {/* Middle - Stat Cards Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={CheckCircle2}
              label="Solved"
              value={solvedCount}
              colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              delay={0.1}
            />
            <StatCard
              icon={Layers}
              label="Tracks"
              value={`${tracksCompleted}/${totalTracks}`}
              colorClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
              delay={0.2}
            />
            <StatCard
              icon={Target}
              label="Completion"
              value={`${progressPercent}%`}
              colorClass="bg-primary/15 text-primary"
              delay={0.3}
            />
          </div>
        </div>
        
        {/* Bottom - Difficulty Distribution */}
        <div className="mt-6 pt-5 border-t border-border/30">
          <DifficultyBar
            easy={easyCount}
            medium={mediumCount}
            hard={hardCount}
            easySolved={easySolved}
            mediumSolved={mediumSolved}
            hardSolved={hardSolved}
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default CPStatsDashboard;