import { motion } from "framer-motion";
import { Code2, Brain, FileDown, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    suffix: "",
  },
  {
    key: "quizzesCompleted" as const,
    changeKey: "quizzesChange" as const,
    label: "Quizzes Completed",
    icon: Brain,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    suffix: "",
  },
  {
    key: "templatesUsed" as const,
    changeKey: "templatesChange" as const,
    label: "Templates Used",
    icon: FileDown,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    suffix: "",
  },
  {
    key: "weeklyXP" as const,
    changeKey: "xpChange" as const,
    label: "Weekly XP",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    suffix: " XP",
  },
];

export function ActivityStats({ stats, loading }: ActivityStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statConfig.map((config, index) => {
        const value = stats[config.key];
        const change = stats[config.changeKey];
        const isPositive = change >= 0;
        const Icon = config.icon;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="font-medium">
                    {config.label}
                  </CardDescription>
                  <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                </div>
                <CardTitle className="text-3xl tabular-nums">
                  {value.toLocaleString()}{config.suffix}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium">
                    {isPositive ? "+" : ""}{change}
                  </span>
                  <span className="text-muted-foreground ml-0.5">this week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
