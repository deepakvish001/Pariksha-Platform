import React, { memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  Lock,
  Clock,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getNodeIcon } from "./RoadmapIconMapping";
import { DifficultyBadge, SubtopicProgress } from "./RoadmapNodeBadges";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface RoadmapTreeNodeEnhancedProps {
  node: NodeType;
  depth: number;
  isExpanded: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  isOnProgressPath: boolean;
  isHighlighted: boolean;
  hasLockedPrerequisites: boolean;
  completedChildren?: number;
  totalChildren?: number;
  onToggle: () => void;
  onClick: () => void;
  onComplete: () => void;
}

const nodeTypeStyles = {
  primary: "bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-300/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-600 shadow-amber-500/5",
  secondary: "bg-card/80 backdrop-blur-sm border-border/60 hover:border-primary/40 shadow-sm",
  checkpoint: "bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-300/50 dark:border-violet-700/50 hover:border-violet-400 shadow-violet-500/5",
  resource: "bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-300/50 dark:border-blue-700/50 hover:border-blue-400 shadow-blue-500/5",
  optional: "border-dashed border-2 border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-muted-foreground/40",
};

const RoadmapTreeNodeEnhanced: React.FC<RoadmapTreeNodeEnhancedProps> = memo(({
  node,
  depth,
  isExpanded,
  isCompleted,
  isInProgress,
  isOnProgressPath,
  isHighlighted,
  hasLockedPrerequisites,
  completedChildren = 0,
  totalChildren = 0,
  onToggle,
  onClick,
  onComplete,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOptional = node.type === 'optional';
  const isPrimary = node.type === 'primary';
  const { icon: NodeIcon, color: iconColor, bg: iconBg, gradient } = getNodeIcon(node.title, node.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.015 }}
      className="relative"
    >
      {/* SVG Connector Line */}
      {depth > 0 && (
        <svg 
          className="absolute pointer-events-none" 
          style={{ 
            left: (depth - 1) * 32 + 16,
            top: -8,
            width: 48,
            height: 36,
          }}
        >
          {/* Vertical line from parent */}
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2="28"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-300",
              isCompleted ? "stroke-emerald-500" : 
              isOnProgressPath ? "stroke-primary" : 
              "stroke-border"
            )}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
          {/* Curved connector to node */}
          <motion.path
            d="M 0 28 Q 0 36, 12 36 L 32 36"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-300",
              isCompleted ? "stroke-emerald-500" : 
              isOnProgressPath ? "stroke-primary" : 
              "stroke-border"
            )}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </svg>
      )}

      <div
        className={cn("group flex items-center gap-3 py-2.5 relative")}
        style={{ marginLeft: depth * 32 }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-lg transition-all z-10",
              "bg-muted/60 hover:bg-muted border border-border/50",
              isExpanded && "bg-primary/10 border-primary/30 rotate-0"
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90 text-primary"
              )}
            />
          </button>
        ) : (
          <div className="w-7" />
        )}

        {/* Main Node Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              onClick={onClick}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              animate={isHighlighted ? { 
                boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 0 4px hsl(var(--primary) / 0.15)", "0 0 0 0 hsl(var(--primary) / 0)"]
              } : {}}
              transition={isHighlighted ? { duration: 1.5, repeat: Infinity } : { duration: 0.15 }}
              className={cn(
                "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200",
                "hover:shadow-lg",
                nodeTypeStyles[node.type],
                isCompleted && "opacity-80",
                isInProgress && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isOnProgressPath && !isCompleted && !isInProgress && "ring-1 ring-primary/30",
                hasLockedPrerequisites && !isCompleted && "opacity-40 cursor-not-allowed grayscale"
              )}
            >
              {/* Colorful Gradient Icon Container */}
              <div className={cn(
                "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                `bg-gradient-to-br ${gradient}`,
                isCompleted && "opacity-70"
              )}>
                <NodeIcon className="h-5 w-5 text-white drop-shadow-sm" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "font-semibold text-sm leading-tight",
                    isCompleted && "line-through text-muted-foreground",
                    isPrimary && "text-base"
                  )}>
                    {node.title}
                  </span>

                  {/* Recommended Sparkle */}
                  {node.isRecommended && (
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  )}

                  {/* Optional Tag */}
                  {isOptional && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-dashed border-muted-foreground/40 text-muted-foreground">
                      Optional
                    </Badge>
                  )}
                </div>

                {/* Description (for primary nodes) */}
                {node.description && isPrimary && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {node.description}
                  </p>
                )}
              </div>

              {/* Right Side Metadata */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Difficulty Badge */}
                {node.difficulty && (
                  <div className="hidden sm:block">
                    <DifficultyBadge difficulty={node.difficulty} showLabel={false} />
                  </div>
                )}

                {/* Estimated Time */}
                {node.estimatedTime && (
                  <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    <Clock className="h-3 w-3" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}

                {/* Subtopic Progress Ring */}
                {hasChildren && totalChildren > 0 && (
                  <SubtopicProgress 
                    completed={completedChildren} 
                    total={totalChildren}
                    size={24}
                  />
                )}

                {/* Children Count (if no progress tracking) */}
                {hasChildren && totalChildren === 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-muted/60">
                    {node.children!.length}
                  </Badge>
                )}

                {/* Completion Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  disabled={hasLockedPrerequisites}
                  className={cn(
                    "flex-shrink-0 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                      : isInProgress
                      ? "border-primary bg-primary/15 border-2"
                      : isOnProgressPath
                      ? "border-primary/50 bg-primary/5"
                      : hasLockedPrerequisites
                      ? "border-muted-foreground/15 bg-muted cursor-not-allowed"
                      : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {isCompleted && <Check className="h-4 w-4" strokeWidth={3} />}
                  {hasLockedPrerequisites && !isCompleted && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </motion.div>
          </TooltipTrigger>
          
          {/* Enhanced Tooltip */}
          <TooltipContent 
            side="right" 
            className="max-w-sm p-4 bg-popover/98 backdrop-blur-md border shadow-2xl"
            sideOffset={12}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-md", gradient)}>
                  <NodeIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">{node.title}</p>
                  {node.description && (
                    <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
                  )}
                </div>
              </div>
              
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2">
                {node.difficulty && (
                  <DifficultyBadge difficulty={node.difficulty} />
                )}
                {node.estimatedTime && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              {hasChildren && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{node.children!.length} subtopics to explore</span>
                </div>
              )}
              
              {isOptional && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <span>✨</span> Optional topic for deeper learning
                </p>
              )}
              
              {node.isRecommended && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Recommended for your learning path
                </p>
              )}
              
              {isOnProgressPath && !isCompleted && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium pt-2 border-t">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  Next recommended step
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Next Step Floating Indicator */}
        {isOnProgressPath && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="absolute -right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow-lg shadow-primary/25"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-foreground" />
            </span>
            <span className="hidden sm:inline">Next</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

RoadmapTreeNodeEnhanced.displayName = "RoadmapTreeNodeEnhanced";

export default RoadmapTreeNodeEnhanced;
