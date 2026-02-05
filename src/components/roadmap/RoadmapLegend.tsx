import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  GitBranch, 
  Bookmark, 
  Check,
  Clock,
  ExternalLink,
  Info,
  Sparkles,
  Zap,
  Target,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LegendItem {
  label: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
  borderStyle?: string;
  gradient?: string;
}

const nodeTypes: LegendItem[] = [
  {
    label: "Primary Topic",
    description: "Main learning milestone",
    color: "bg-gradient-to-r from-amber-400 to-orange-500",
    borderStyle: "border-amber-500/50",
    gradient: "from-amber-500/20 to-orange-500/10",
  },
  {
    label: "Secondary Topic",
    description: "Regular subtopic",
    color: "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700",
    borderStyle: "border-slate-400/50 dark:border-slate-600/50",
    gradient: "from-slate-500/10 to-slate-500/5",
  },
  {
    label: "Checkpoint",
    description: "Important milestone",
    color: "bg-gradient-to-r from-violet-400 to-purple-500",
    borderStyle: "border-violet-500/50",
    gradient: "from-violet-500/20 to-purple-500/10",
  },
  {
    label: "Optional",
    description: "Extra learning path",
    color: "bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
    borderStyle: "border-dashed border-slate-400/50",
    gradient: "from-slate-500/5 to-transparent",
  },
  {
    label: "Completed",
    description: "You've mastered this!",
    color: "bg-gradient-to-r from-emerald-400 to-teal-500",
    borderStyle: "border-emerald-500/50",
    gradient: "from-emerald-500/20 to-teal-500/10",
    icon: <Check className="h-3 w-3 text-white" strokeWidth={3} />,
  },
];

const badges: LegendItem[] = [
  {
    label: "Recommended",
    description: "AI suggested path",
    color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    icon: <Sparkles className="h-3 w-3" />,
  },
  {
    label: "Optional",
    description: "Flexible learning",
    color: "bg-muted/80 text-muted-foreground border border-dashed border-muted-foreground/30",
    icon: <GitBranch className="h-3 w-3" />,
  },
  {
    label: "Checkpoint",
    description: "Key milestone",
    color: "bg-gradient-to-r from-violet-500 to-purple-500 text-white",
    icon: <Bookmark className="h-3 w-3" />,
  },
];

const statuses: LegendItem[] = [
  {
    label: "Not Started",
    description: "Ready to begin",
    color: "bg-muted-foreground/30",
  },
  {
    label: "In Progress",
    description: "Currently learning",
    color: "bg-primary",
  },
  {
    label: "Completed",
    description: "Well done!",
    color: "bg-emerald-500",
  },
];

const RoadmapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all",
          "bg-gradient-to-r from-muted/80 to-muted/60 hover:from-muted hover:to-muted/80",
          "border border-border/60 hover:border-primary/30",
          "text-sm font-medium text-muted-foreground hover:text-foreground",
          "shadow-sm hover:shadow-md"
        )}
      >
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Info className="h-3.5 w-3.5 text-primary" />
        </div>
        <span>Understanding the Map</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-5 rounded-2xl border-2 border-border/50 bg-gradient-to-br from-card via-card/98 to-card/95 backdrop-blur-sm shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Node Types */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center">
                      <Layers className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Node Types
                    </h4>
                  </div>
                  <div className="space-y-2.5 pl-1">
                    {nodeTypes.map((item, idx) => (
                      <motion.div 
                        key={item.label} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 group"
                      >
                        <div
                          className={cn(
                            "h-7 w-10 rounded-lg border-2 flex items-center justify-center shadow-sm",
                            item.color,
                            item.borderStyle
                          )}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center">
                      <Star className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Badges & Labels
                    </h4>
                  </div>
                  <div className="space-y-2.5 pl-1">
                    {badges.map((item, idx) => (
                      <motion.div 
                        key={item.label} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-sm",
                            item.color
                          )}
                        >
                          {item.icon}
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-1">
                          {item.description}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Metadata section */}
                  <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Time estimates show learning duration</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      <span>Resources link to learning materials</span>
                    </div>
                  </div>
                </div>

                {/* Progress States & Connection Lines */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center">
                      <Target className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Progress States
                    </h4>
                  </div>
                  <div className="space-y-2.5 pl-1">
                    {statuses.map((item, idx) => (
                      <motion.div 
                        key={item.label} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-full shadow-sm",
                          item.color,
                          item.label === "In Progress" && "animate-pulse"
                        )} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Connection Lines */}
                  <div className="pt-3 mt-3 border-t border-border/50 space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Connections</p>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700" />
                        <span className="text-[10px] text-muted-foreground">Default</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-primary to-violet-500" />
                        <span className="text-[10px] text-muted-foreground">Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                        <span className="text-[10px] text-muted-foreground">Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro tip */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-5 pt-4 border-t border-border/50 flex items-start gap-3"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Pro Tip</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Click any node to view details, resources, and mark as complete. Use drag & drop to customize your learning order!
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapLegend;
