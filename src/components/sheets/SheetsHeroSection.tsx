import { motion } from "framer-motion";
import { FileSpreadsheet, Target, CheckCircle2, TrendingUp, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SheetsHeroSectionProps {
  totalSheets: number;
  totalProblems: number;
  completedProblems?: number;
  currentStreak?: number;
}

const SheetsHeroSection = ({ totalSheets, totalProblems, completedProblems = 0, currentStreak = 0 }: SheetsHeroSectionProps) => {
  const completionPercent = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-4 right-16 w-48 h-48 bg-primary/15 rounded-full blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-8 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl"
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative px-4 md:px-6 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-1"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Practice Sheets</h1>
                  <p className="text-muted-foreground text-sm">Curated problem sets for your preparation journey</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-3 flex-wrap"
            >
              {/* Compact stat pills */}
              {[
                { icon: FileSpreadsheet, label: "Sheets", value: totalSheets, color: "text-primary" },
                { icon: Target, label: "Problems", value: totalProblems.toLocaleString(), color: "text-blue-500" },
                { icon: CheckCircle2, label: "Done", value: completedProblems, color: "text-emerald-500" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50"
                >
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold leading-none">{stat.value}</span>
                    <span className="text-[11px] text-muted-foreground hidden sm:inline">{stat.label}</span>
                  </div>
                </motion.div>
              ))}

              {/* Overall progress ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/50"
              >
                <div className="relative h-8 w-8">
                  <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle
                      cx="16" cy="16" r="13" fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${completionPercent * 0.8168} 81.68`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                    {completionPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">Overall</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SheetsHeroSection;
