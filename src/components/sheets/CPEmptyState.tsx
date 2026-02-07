import { motion } from "framer-motion";
import { Search, Star, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateType = "no-results" | "no-revision" | "no-data";

interface CPEmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  defaultAction: string;
}> = {
  "no-results": {
    icon: Search,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted/50",
    title: "No problems found",
    description: "Try adjusting your search query or filters to find what you're looking for.",
    defaultAction: "Clear Filters"
  },
  "no-revision": {
    icon: Star,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    title: "No revision items yet",
    description: "Star problems you want to revisit later. They'll appear here for easy access.",
    defaultAction: "Browse Problems"
  },
  "no-data": {
    icon: RefreshCw,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Unable to load data",
    description: "There was an issue loading the problem sets. Please try again.",
    defaultAction: "Retry"
  }
};

const CPEmptyState = ({ type, onAction, actionLabel }: CPEmptyStateProps) => {
  const config = emptyStateConfig[type];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 px-4"
    >
      {/* Animated background decoration */}
      <div className="relative mb-6">
        {/* Animated rings */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            config.iconBg
          )}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 96, height: 96, margin: '-8px' }}
        />
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            config.iconBg
          )}
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          style={{ width: 96, height: 96, margin: '-8px' }}
        />
        
        {/* Main icon container */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className={cn(
            "relative z-10 p-5 rounded-full",
            config.iconBg
          )}
        >
          <Icon className={cn("h-10 w-10", config.iconColor)} />
        </motion.div>
      </div>
      
      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-lg font-semibold mb-2 text-center"
      >
        {config.title}
      </motion.h3>
      
      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-muted-foreground text-center max-w-sm mb-6"
      >
        {config.description}
      </motion.p>
      
      {/* Action button */}
      {onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onAction}
            variant={type === "no-revision" ? "default" : "outline"}
            className={cn(
              type === "no-revision" && "bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
            )}
          >
            {actionLabel || config.defaultAction}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CPEmptyState;
