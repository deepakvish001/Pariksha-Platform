import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, RotateCcw, Circle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RoadmapProgressDashboardProps {
  completed: number;
  inProgress: number;
  total: number;
  className?: string;
}

// Animated Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
  progress,
  size = 120,
  strokeWidth = 10,
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(38, 100%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{animatedProgress}%</span>
        <span className="text-xs text-muted-foreground">Complete</span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
  delay: number;
}> = ({ icon, value, label, colorClass, delay }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(easeOut * value));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="glass-card rounded-xl p-4 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          colorClass
        )}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

const RoadmapProgressDashboard: React.FC<RoadmapProgressDashboardProps> = ({
  completed,
  inProgress,
  total,
  className,
}) => {
  const remaining = total - completed - inProgress;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Main Dashboard Card */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Progress Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="shrink-0"
            >
              <ProgressRing progress={progressPercent} size={140} strokeWidth={12} />
            </motion.div>

            {/* Stats Grid */}
            <div className="flex-1 w-full grid grid-cols-3 gap-3">
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5 text-white" />}
                value={completed}
                label="Completed"
                colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
                delay={300}
              />
              <StatCard
                icon={<RotateCcw className="h-5 w-5 text-white" />}
                value={inProgress}
                label="In Progress"
                colorClass="bg-gradient-to-br from-amber-500 to-orange-500"
                delay={450}
              />
              <StatCard
                icon={<Circle className="h-5 w-5 text-white" />}
                value={remaining}
                label="Remaining"
                colorClass="bg-gradient-to-br from-slate-400 to-slate-500"
                delay={600}
              />
            </div>
          </div>

          {/* Overall Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-6 pt-6 border-t border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Overall Progress</span>
              </div>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2.5" />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapProgressDashboard;
