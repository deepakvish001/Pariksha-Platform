import { motion } from "framer-motion";
import { Trophy, Flame, Layers, Target, TrendingUp, CheckCircle2 } from "lucide-react";
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
}

// Circular Progress Ring Component
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
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle with gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
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
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{progress}%</span>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  colorClass,
  delay = 0 
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group"
    >
      <div className={cn(
        "flex items-center gap-3 p-3 sm:p-4 rounded-xl",
        "bg-background/60 backdrop-blur-sm border border-border/50",
        "hover:border-border hover:shadow-lg transition-all duration-300"
      )}>
        <div className={cn(
          "p-2.5 rounded-lg transition-transform group-hover:scale-110",
          colorClass
        )}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-muted-foreground truncate">{label}</span>
          <span className="text-lg sm:text-xl font-bold tabular-nums">{value}</span>
          {subValue && (
            <span className="text-[10px] text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Difficulty Distribution Bar
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
  
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Difficulty Distribution</span>
        <span>{total} total</span>
      </div>
      
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden bg-muted flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${easyPercent}%` }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-emerald-500 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mediumPercent}%` }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-amber-500 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hardPercent}%` }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="bg-red-500 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Easy</span>
          <span className="font-medium">{easySolved}/{easy}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Medium</span>
          <span className="font-medium">{mediumSolved}/{medium}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Hard</span>
          <span className="font-medium">{hardSolved}/{hard}</span>
        </div>
      </div>
    </motion.div>
  );
}

const CPStatsDashboard = ({
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
  totalTracks
}: CPStatsDashboardProps) => {
  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
      {/* Subtle gradient border */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left - Progress Ring */}
          <div className="flex items-center gap-4 sm:gap-6">
            <ProgressRing progress={progressPercent} size={80} strokeWidth={8} />
            <div>
              <p className="font-semibold text-base sm:text-lg">Overall Progress</p>
              <p className="text-sm text-muted-foreground">
                {solvedCount.toLocaleString()} of {totalProblems.toLocaleString()} solved
              </p>
            </div>
          </div>
          
          {/* Divider */}
          <div className="hidden lg:block w-px bg-border/50" />
          
          {/* Middle - Stat Cards Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={CheckCircle2}
              label="Problems Solved"
              value={solvedCount}
              colorClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              delay={0.1}
            />
            <StatCard
              icon={Layers}
              label="Tracks Progress"
              value={`${tracksCompleted}/${totalTracks}`}
              colorClass="bg-blue-500/20 text-blue-600 dark:text-blue-400"
              delay={0.2}
            />
            <StatCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${progressPercent}%`}
              colorClass="bg-primary/20 text-primary"
              delay={0.3}
            />
          </div>
        </div>
        
        {/* Bottom - Difficulty Distribution */}
        <div className="mt-6 pt-6 border-t border-border/50">
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
};

export default CPStatsDashboard;
