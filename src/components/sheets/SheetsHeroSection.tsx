import { motion } from "framer-motion";
import { FileSpreadsheet, TrendingUp, Target, Zap } from "lucide-react";

interface SheetsHeroSectionProps {
  totalSheets: number;
  totalProblems: number;
}

const SheetsHeroSection = ({ totalSheets, totalProblems }: SheetsHeroSectionProps) => {
  const stats = [
    { label: "Practice Sheets", value: totalSheets, icon: FileSpreadsheet, color: "text-primary" },
    { label: "Total Problems", value: totalProblems, icon: Target, color: "text-emerald-500" },
    { label: "Categories", value: 5, icon: Zap, color: "text-amber-500" },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-10 right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative px-6 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          {/* Header Content */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileSpreadsheet className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Practice Sheets
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Curated problem sets for your preparation journey
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex gap-3 md:gap-4"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm"
                >
                  <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SheetsHeroSection;
