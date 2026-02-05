import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  GitBranch, 
  Bookmark, 
  Check,
  Circle,
  Clock,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
  borderStyle?: string;
}

const nodeTypes: LegendItem[] = [
  {
    label: "Primary Topic",
    description: "Main learning section",
    color: "bg-amber-400 dark:bg-amber-500",
    borderStyle: "border-amber-500",
  },
  {
    label: "Secondary Topic",
    description: "Regular subtopic",
    color: "bg-slate-200 dark:bg-slate-700",
    borderStyle: "border-slate-300 dark:border-slate-600",
  },
  {
    label: "Checkpoint",
    description: "Important milestone",
    color: "bg-fuchsia-200 dark:bg-fuchsia-900/50",
    borderStyle: "border-fuchsia-400",
  },
  {
    label: "Optional",
    description: "Extra learning",
    color: "bg-slate-100 dark:bg-slate-800",
    borderStyle: "border-dashed border-slate-400",
  },
  {
    label: "Completed",
    description: "Done ✓",
    color: "bg-emerald-200 dark:bg-emerald-900/50",
    borderStyle: "border-emerald-500",
    icon: <Check className="h-3 w-3 text-emerald-600" />,
  },
];

const badges: LegendItem[] = [
  {
    label: "Recommended",
    description: "Suggested path",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Star className="h-3 w-3" />,
  },
  {
    label: "Optional",
    description: "Can skip",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: <GitBranch className="h-3 w-3" />,
  },
  {
    label: "Checkpoint",
    description: "Milestone",
    color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
    icon: <Bookmark className="h-3 w-3" />,
  },
];

const metadata: LegendItem[] = [
  {
    label: "Time Estimate",
    description: "Est. completion time",
    color: "text-muted-foreground",
    icon: <Clock className="h-3 w-3" />,
  },
  {
    label: "Resources",
    description: "Learning materials",
    color: "text-muted-foreground",
    icon: <ExternalLink className="h-3 w-3" />,
  },
  {
    label: "Progress",
    description: "Subtopics done",
    color: "bg-muted text-muted-foreground",
    icon: <span className="text-[10px] font-medium">2/5</span>,
  },
];

const RoadmapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          "bg-muted/50 hover:bg-muted border border-border/50",
          "text-sm font-medium text-muted-foreground hover:text-foreground"
        )}
      >
        <Info className="h-4 w-4" />
        <span>Legend</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Node Types */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Node Types
                  </h4>
                  <div className="space-y-2">
                    {nodeTypes.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-5 w-8 rounded border-2 flex items-center justify-center",
                            item.color,
                            item.borderStyle
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            — {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Badges
                  </h4>
                  <div className="space-y-2">
                    {badges.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border",
                            item.color
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Metadata
                  </h4>
                  <div className="space-y-2">
                    {metadata.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                            item.color
                          )}
                        >
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            — {item.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Connection Lines */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Connection Lines
                </h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-slate-300 dark:bg-slate-600 rounded" />
                    <span className="text-[10px] text-muted-foreground">Default path</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-amber-400 dark:bg-amber-500 rounded" />
                    <span className="text-[10px] text-muted-foreground">Active path</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-emerald-400 dark:bg-emerald-500 rounded" />
                    <span className="text-[10px] text-muted-foreground">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapLegend;
