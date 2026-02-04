import { motion } from "framer-motion";
import { TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import StreakCounter from "@/components/StreakCounter";

interface ProgressStats {
  total: number;
  totalSolved: number;
  percentage: number;
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
}

interface ProgressSummaryCardProps {
  stats: ProgressStats;
  className?: string;
}

const ProgressSummaryCard = ({ stats, className }: ProgressSummaryCardProps) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (stats.percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border border-border bg-card p-4 md:p-6",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular Progress + Streak */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <svg className="w-24 h-24 md:w-28 md:h-28 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50%"
                cy="50%"
                r="40"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50%"
                cy="50%"
                r="40"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="text-2xl md:text-3xl font-bold"
              >
                {stats.percentage}%
              </motion.span>
              <span className="text-xs text-muted-foreground">Complete</span>
            </div>
          </div>
          
          {/* Streak Counter */}
          <StreakCounter variant="compact" />
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4 w-full sm:w-auto">
          {/* Total Progress */}
          <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Progress</span>
            </div>
            <span className="text-sm font-bold">
              {stats.totalSolved}/{stats.total}
            </span>
          </div>

          {/* Easy */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs md:text-sm font-medium text-emerald-600 dark:text-emerald-400">Easy</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {stats.easy.solved}/{stats.easy.total}
            </span>
          </div>

          {/* Medium */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs md:text-sm font-medium text-amber-600 dark:text-amber-400">Medium</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
              {stats.medium.solved}/{stats.medium.total}
            </span>
          </div>

          {/* Hard */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs md:text-sm font-medium text-red-600 dark:text-red-400">Hard</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-red-600 dark:text-red-400">
              {stats.hard.solved}/{stats.hard.total}
            </span>
          </div>

          {/* Pending */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <span className="text-xs md:text-sm font-bold text-muted-foreground">
              {stats.total - stats.totalSolved}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressSummaryCard;
