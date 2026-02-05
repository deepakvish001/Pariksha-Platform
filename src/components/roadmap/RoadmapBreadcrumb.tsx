import React from "react";
import { ChevronRight, Home, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  id: string;
  label: string;
  isActive?: boolean;
  isComplete?: boolean;
}

interface RoadmapBreadcrumbProps {
  items: BreadcrumbItem[];
  currentPhase: number;
  totalPhases: number;
  onNavigate?: (id: string) => void;
  className?: string;
}

const RoadmapBreadcrumb: React.FC<RoadmapBreadcrumbProps> = ({
  items,
  currentPhase,
  totalPhases,
  onNavigate,
  className,
}) => {
  // Show only relevant breadcrumbs (max 3 items for mobile)
  const visibleItems = items.slice(-3);
  const hasHiddenItems = items.length > 3;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg",
        "bg-muted/30 border border-border/50 backdrop-blur-sm",
        "text-xs font-medium overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {/* Home/start indicator */}
      <button
        onClick={() => onNavigate?.(items[0]?.id)}
        className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Home className="h-3 w-3" />
        <span className="hidden sm:inline">Start</span>
      </button>

      {hasHiddenItems && (
        <>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <span className="text-muted-foreground/60">...</span>
        </>
      )}

      {visibleItems.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          <button
            onClick={() => onNavigate?.(item.id)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md transition-colors whitespace-nowrap",
              item.isActive 
                ? "bg-primary/10 text-primary font-semibold" 
                : item.isComplete
                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.isActive && <MapPin className="h-3 w-3" />}
            <span className="truncate max-w-[120px]">{item.label}</span>
          </button>
        </React.Fragment>
      ))}

      {/* Phase indicator */}
      <div className="ml-auto flex items-center gap-1.5 text-muted-foreground pl-2 border-l border-border/50">
        <span className="text-[10px] uppercase tracking-wide">Phase</span>
        <span className="text-sm font-bold text-foreground tabular-nums">
          {currentPhase}/{totalPhases}
        </span>
      </div>
    </motion.nav>
  );
};

export default RoadmapBreadcrumb;
