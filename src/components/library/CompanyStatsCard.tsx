import { motion } from "framer-motion";
import { Building2, Briefcase, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyStatsCardProps {
  totalCompanies: number;
  productCount: number;
  serviceCount: number;
  startupCount: number;
  hiringCount: number;
  favoritesCount: number;
}

const CompanyStatsCard = ({
  totalCompanies,
  productCount,
  serviceCount,
  startupCount,
  hiringCount,
  favoritesCount,
}: CompanyStatsCardProps) => {
  const stats = [
    {
      label: "Total Companies",
      value: totalCompanies,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Product Based",
      value: productCount,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Service Based",
      value: serviceCount,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Startups",
      value: startupCount,
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Currently Hiring",
      value: hiringCount,
      icon: Briefcase,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Favorites",
      value: favoritesCount,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors"
        >
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-2", stat.bgColor)}>
            <stat.icon className={cn("h-4 w-4", stat.color)} />
          </div>
          <span className="text-2xl font-bold text-foreground">{stat.value}</span>
          <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CompanyStatsCard;
