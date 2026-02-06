import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md";
}

const StreakBadge = ({ streak, size = "sm" }: StreakBadgeProps) => {
  if (streak === 0) return null;

  const isHot = streak >= 7;
  const isOnFire = streak >= 14;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "flex items-center gap-1 rounded-full font-medium",
              size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
              isOnFire 
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white" 
                : isHot 
                  ? "bg-orange-500/20 text-orange-500" 
                  : "bg-amber-500/10 text-amber-500"
            )}
          >
            <motion.div
              animate={isHot ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Flame className={cn(
                size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
                isOnFire && "fill-current"
              )} />
            </motion.div>
            <span>{streak}</span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {streak} day{streak !== 1 ? 's' : ''} streak!
            {isOnFire && " 🔥 On fire!"}
            {isHot && !isOnFire && " Keep it going!"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StreakBadge;
