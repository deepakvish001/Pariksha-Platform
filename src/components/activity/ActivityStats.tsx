import { motion } from "framer-motion";
import { Code2, Brain, FileDown, Zap, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityStats as StatsType } from "@/hooks/useActivityStats";

interface ActivityStatsProps {
  stats: StatsType;
  loading: boolean;
}

const statConfig = [
  {
    key: "problemsSolved" as const,
    changeKey: "problemsChange" as const,
    label: "Problems Solved",
    icon: Code2,
    gradient: "from-emerald-500 to-emerald-600",
    bgGlow: "shadow-emerald-500/20 dark:shadow-emerald-500/30",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    textColor: "text-emerald-600 dark:text-emerald-400",
    suffix: "",
  },
  {
    key: "quizzesCompleted" as const,
    changeKey: "quizzesChange" as const,
    label: "Quizzes Completed",
    icon: Brain,
    gradient: "from-blue-500 to-blue-600",
    bgGlow: "shadow-blue-500/20 dark:shadow-blue-500/30",
    lightBg: "bg-blue-50 dark:bg-blue-950/50",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    textColor: "text-blue-600 dark:text-blue-400",
    suffix: "",
  },
  {
    key: "templatesUsed" as const,
    changeKey: "templatesChange" as const,
    label: "Templates Used",
    icon: FileDown,
    gradient: "from-violet-500 to-violet-600",
    bgGlow: "shadow-violet-500/20 dark:shadow-violet-500/30",
    lightBg: "bg-violet-50 dark:bg-violet-950/50",
    iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
    textColor: "text-violet-600 dark:text-violet-400",
    suffix: "",
  },
  {
    key: "weeklyXP" as const,
    changeKey: "xpChange" as const,
    label: "Weekly XP",
    icon: Zap,
    gradient: "from-primary to-primary/80",
    bgGlow: "shadow-primary/20 dark:shadow-primary/30",
    lightBg: "bg-primary/5 dark:bg-primary/10",
    iconBg: "bg-gradient-to-br from-primary to-primary/80",
    textColor: "text-primary",
    suffix: " XP",
  },
];

export function ActivityStats({ stats, loading }: ActivityStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-9 w-20 bg-white/10" />
                  <Skeleton className="h-3 w-16 bg-white/10" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfig.map((config, index) => {
        const value = stats[config.key];
        const change = stats[config.changeKey];
        const isPositive = change >= 0;
        const Icon = config.icon;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 400,
              damping: 25
            }}
          >
            <Card className={`
              relative overflow-hidden group cursor-default
              border-white/5 bg-white/[0.02] backdrop-blur-xl ring-1 ring-white/5
              hover:shadow-2xl hover:shadow-${config.key === 'weeklyXP' ? 'primary' : config.key === 'problemsSolved' ? 'emerald-500' : config.key === 'quizzesCompleted' ? 'blue-500' : 'violet-500'}/20
              transition-all duration-500 ease-out
              hover:-translate-y-1 hover:bg-white/[0.04]
            `}>
              {/* Decorative gradient line */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} opacity-80`} />
              
              {/* Subtle background glow on hover */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                bg-gradient-to-br from-white/[0.02] to-transparent
              `} />

              <CardContent className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white/50">
                      {config.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <motion.span 
                        className="text-3xl font-bold tabular-nums text-white"
                        key={value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {value.toLocaleString()}
                      </motion.span>
                      {config.suffix && (
                        <span className="text-lg font-medium text-white/40">
                          {config.suffix}
                        </span>
                      )}
                    </div>
                    <div className={`
                      flex items-center gap-1.5 text-sm font-medium
                      ${isPositive ? "text-emerald-400" : "text-red-400"}
                    `}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{isPositive ? "+" : ""}{change}</span>
                      <span className="text-white/40 font-normal">this week</span>
                    </div>
                  </div>

                  {/* Icon container */}
                  <motion.div 
                    className={`
                      h-12 w-12 rounded-xl ${config.iconBg}
                      flex items-center justify-center
                      shadow-lg transition-transform duration-300
                      group-hover:scale-110 group-hover:rotate-3
                    `}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </motion.div>
                </div>

                {/* Sparkle effect on hover */}
                <motion.div
                  className="absolute top-3 right-14 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{ rotate: [0, 180] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className={`h-3 w-3 ${config.textColor}`} />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
