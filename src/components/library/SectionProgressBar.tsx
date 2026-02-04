import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionProgressBarProps {
  value: number;
  total: number;
  className?: string;
}

const SectionProgressBar = ({ value, total, className }: SectionProgressBarProps) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  // Color based on percentage
  const getProgressColor = () => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 75) return "bg-emerald-400";
    if (percentage >= 50) return "bg-amber-500";
    if (percentage >= 25) return "bg-amber-400";
    return "bg-primary";
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-2 flex-1 min-w-[80px] md:min-w-[120px] overflow-hidden rounded-full bg-secondary">
        {/* Progress indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", getProgressColor())}
        />
        
        {/* Shimmer overlay */}
        {percentage > 0 && percentage < 100 && (
          <motion.div
            className="absolute inset-0 -translate-x-full"
            animate={{ translateX: ["0%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 1,
            }}
          >
            <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>
        )}
      </div>
      
      {/* Count badge */}
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {value}/{total}
      </span>
    </div>
  );
};

export default SectionProgressBar;
