import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Code, Swords, Database, ServerCog, Network, HardDrive, Cpu, LucideIcon,
} from "lucide-react";

interface CategoryProgress {
  category: string;
  total: number;
  completed: number;
}

interface CategoryProgressBarProps {
  categories: CategoryProgress[];
  totalProblems: number;
  totalCompleted: number;
}

const catConfig: Record<string, { icon: LucideIcon; color: string; bar: string }> = {
  DSA:            { icon: Code,      color: "text-blue-500",   bar: "bg-blue-500" },
  CP:             { icon: Swords,    color: "text-orange-500", bar: "bg-orange-500" },
  SQL:            { icon: Database,  color: "text-emerald-500",bar: "bg-emerald-500" },
  DBMS:           { icon: ServerCog, color: "text-violet-500", bar: "bg-violet-500" },
  CN:             { icon: Network,   color: "text-cyan-500",   bar: "bg-cyan-500" },
  OS:             { icon: HardDrive, color: "text-rose-500",   bar: "bg-rose-500" },
  "System Design":{ icon: Cpu,       color: "text-purple-500", bar: "bg-purple-500" },
};

const CategoryProgressBar = ({ categories, totalProblems, totalCompleted }: CategoryProgressBarProps) => {
  const overallPercent = totalProblems > 0 ? Math.round((totalCompleted / totalProblems) * 100) : 0;

  // Build segments for the stacked bar
  const segments = categories
    .filter(c => c.completed > 0)
    .map(c => ({
      ...c,
      percent: totalProblems > 0 ? (c.completed / totalProblems) * 100 : 0,
      config: catConfig[c.category],
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-4 md:p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Overall Progress</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCompleted.toLocaleString()} of {totalProblems.toLocaleString()} problems completed
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{overallPercent}%</span>
            </div>
          </div>

          {/* Stacked progress bar */}
          <div className="relative h-3 w-full rounded-full bg-muted/60 overflow-hidden">
            <div className="absolute inset-0 flex">
              {segments.map((seg, i) => (
                <motion.div
                  key={seg.category}
                  className={cn("h-full", seg.config?.bar || "bg-primary", i === 0 && "rounded-l-full", i === segments.length - 1 && "rounded-r-full")}
                  initial={{ width: 0 }}
                  animate={{ width: `${seg.percent}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                />
              ))}
            </div>
          </div>

          {/* Category breakdown grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat, i) => {
              const cfg = catConfig[cat.category];
              const Icon = cfg?.icon || Code;
              const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;

              return (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className={cn("shrink-0", cfg?.color || "text-primary")}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{cat.category}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold">{pct}%</span>
                      <span className="text-[10px] text-muted-foreground">{cat.completed}/{cat.total}</span>
                    </div>
                    {/* Mini bar */}
                    <div className="h-1 w-full rounded-full bg-muted/60 mt-1 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", cfg?.bar || "bg-primary")}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.04 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CategoryProgressBar;
