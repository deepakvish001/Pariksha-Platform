import React, { memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  Star,
  GitBranch,
  Bookmark,
  ExternalLink,
  Gauge,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";
import { getNodeStyle, badgeStyles } from "./RoadmapNodeStyles";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

// Shimmer effect component for recommended nodes
const ShimmerEffect = memo(() => (
  <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-white/10"
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        repeatDelay: 4,
        ease: "easeInOut",
      }}
    />
  </div>
));

ShimmerEffect.displayName = "ShimmerEffect";

// Floating particles for recommended nodes
const FloatingParticles = memo(() => (
  <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-amber-400/60 dark:bg-amber-300/50"
        initial={{ 
          x: `${25 + i * 25}%`, 
          y: "100%", 
          opacity: 0,
          scale: 0.5 
        }}
        animate={{ 
          y: "-10%", 
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: i * 0.8,
          ease: "easeOut",
        }}
      />
    ))}
  </div>
));

FloatingParticles.displayName = "FloatingParticles";

interface RoadmapNodeProps {
  node: NodeType;
  depth: number;
  isExpanded: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  isOnProgressPath: boolean;
  isHighlighted: boolean;
  hasNote?: boolean;
  completedChildren?: number;
  totalChildren?: number;
  isCompact?: boolean;
  onToggle: () => void;
  onClick: () => void;
  onComplete: () => void;
}

const RoadmapNode: React.FC<RoadmapNodeProps> = memo(({
  node,
  depth,
  isExpanded,
  isCompleted,
  isInProgress,
  isOnProgressPath,
  isHighlighted,
  hasNote = false,
  completedChildren = 0,
  totalChildren = 0,
  isCompact = false,
  onToggle,
  onClick,
  onComplete,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const { icon: NodeIcon, gradient } = getNodeIcon(node.title, node.type);
  const nodeStyle = getNodeStyle(node.type, isCompleted, node.isRecommended);
  const isOptional = node.type === 'optional';
  const isCheckpoint = node.type === 'checkpoint';
  const resourceCount = node.resources?.length || 0;
  const showEffects = node.isRecommended && !isCompleted;

  // Calculate indent based on depth - refined for better hierarchy
  const indent = isCompact ? depth * 16 : depth * 24;
  
  // Determine node sizing based on depth for visual hierarchy
  const isRootNode = depth === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.15, 
        delay: depth * 0.02,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className="relative"
    >
      {/* Hierarchy Indicator Line - Improved */}
      {depth > 0 && (
        <div 
          className="absolute top-0 bottom-1/2"
          style={{ left: indent - 12 }}
        >
          <svg width="16" height="20" className="overflow-visible">
            <path
              d={`M 0 0 L 0 10 Q 0 14, 4 14 L 12 14`}
              fill="none"
              className={cn(
                "stroke-[2]",
                isCompleted ? "stroke-emerald-400 dark:stroke-emerald-500" :
                isOnProgressPath ? "stroke-primary/60" :
                "stroke-border/50"
              )}
              strokeLinecap="round"
            />
            {/* Progress dot indicator */}
            <circle
              cx="0"
              cy="0"
              r="3"
              className={cn(
                isCompleted ? "fill-emerald-500" :
                isOnProgressPath ? "fill-primary" :
                "fill-border/60"
              )}
            />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "flex items-center",
          isCompact ? "gap-2 py-1.5" : "gap-3 py-2",
          isRootNode && !isCompact && "py-2.5"
        )}
        style={{ marginLeft: indent }}
      >
        {/* Expand/Collapse Button - Enhanced */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200",
              "bg-muted/50 hover:bg-muted border border-border/50 hover:border-border",
              isExpanded && "bg-primary/10 border-primary/30 text-primary shadow-sm",
              isCompact ? "h-7 w-7" : "h-8 w-8"
            )}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronRight
              className={cn(
                "transition-transform duration-200",
                isExpanded ? "rotate-90" : "text-muted-foreground",
                isCompact ? "h-4 w-4" : "h-4.5 w-4.5"
              )}
            />
          </button>
        ) : (
          <div className={isCompact ? "w-7" : "w-8"} />
        )}

        {/* Node Card - Refined Design with Enhanced Hover */}
        <motion.div
          onClick={onClick}
          whileHover={{ 
            scale: 1.012, 
            y: -2,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          whileTap={{ scale: 0.995 }}
          className={cn(
            "relative flex-1 flex items-center cursor-pointer",
            "border-2 transition-all duration-300",
            nodeStyle.bg,
            nodeStyle.border,
            nodeStyle.text,
            "shadow-sm",
            // Enhanced hover shadow
            "hover:shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/5",
            "hover:border-primary/40 dark:hover:border-primary/30",
            isHighlighted && "ring-2 ring-primary/40 ring-offset-2 dark:ring-offset-background",
            isInProgress && "ring-2 ring-amber-400/40 ring-offset-2 dark:ring-offset-background",
            isOptional && "border-dashed",
            showEffects && "shadow-md shadow-amber-400/15 dark:shadow-amber-500/20",
            // Sizing based on depth for visual hierarchy
            isCompact 
              ? cn("gap-3 px-3.5 py-2.5 rounded-xl", isRootNode && "py-3")
              : cn("gap-4 px-4 py-3 rounded-2xl", isRootNode && "py-4")
          )}
        >
          {/* Effects for recommended nodes */}
          {showEffects && (
            <>
              <ShimmerEffect />
              <FloatingParticles />
            </>
          )}
          
          {/* Icon container - Enhanced with hover glow */}
          <motion.div 
            className={cn(
              "relative z-10 flex-shrink-0 rounded-xl flex items-center justify-center",
              `bg-gradient-to-br ${gradient}`,
              "shadow-md transition-shadow duration-300",
              "group-hover:shadow-lg",
              isCompact 
                ? cn("h-8 w-8", isRootNode && "h-9 w-9")
                : cn("h-10 w-10", isRootNode && "h-11 w-11")
            )}
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <NodeIcon className={cn(
              "text-white drop-shadow-sm",
              isCompact 
                ? cn("h-4 w-4", isRootNode && "h-4.5 w-4.5")
                : cn("h-5 w-5", isRootNode && "h-5.5 w-5.5")
            )} />
          </motion.div>

          {/* Content area - Better typography */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-semibold leading-snug tracking-tight",
                isCompact 
                  ? cn("text-sm", isRootNode && "text-base font-bold")
                  : cn("text-base", isRootNode && "text-lg font-bold"),
                isCompleted && "line-through opacity-50"
              )}>
                {node.title}
              </span>

              {/* Inline badges - Streamlined */}
              <div className="flex items-center gap-1">
                {node.isRecommended && !isCompleted && (
                  <motion.span 
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      badgeStyles.recommended
                    )}
                    animate={{ 
                      boxShadow: ["0 0 0 0 rgba(251, 191, 36, 0)", "0 0 6px 2px rgba(251, 191, 36, 0.2)", "0 0 0 0 rgba(251, 191, 36, 0)"]
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <Star className="h-3 w-3 fill-current" />
                  </motion.span>
                )}
                
                {isOptional && (
                  <span className={cn(
                    "inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md",
                    badgeStyles.optional
                  )}>
                    <GitBranch className="h-3 w-3" />
                  </span>
                )}

                {isCheckpoint && (
                  <span className={cn(
                    "inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md",
                    badgeStyles.checkpoint
                  )}>
                    <Bookmark className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata pills - Consolidated and cleaner */}
          <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
            {/* Combined info pill */}
            <div className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg",
              "bg-background/60 dark:bg-background/40",
              "text-xs font-medium text-muted-foreground"
            )}>
              {/* Difficulty */}
              {node.difficulty && (
                <span className={cn(
                  "flex items-center gap-1",
                  node.difficulty === 'Easy' && "text-emerald-600 dark:text-emerald-400",
                  node.difficulty === 'Medium' && "text-amber-600 dark:text-amber-400",
                  node.difficulty === 'Hard' && "text-rose-600 dark:text-rose-400"
                )}>
                  <Gauge className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Resources */}
              {resourceCount > 0 && (
                <span className="flex items-center gap-0.5 tabular-nums">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{resourceCount}</span>
                </span>
              )}
              
              {/* Note indicator */}
              {hasNote && <StickyNote className="h-3.5 w-3.5 text-amber-500" />}

              {/* Child progress */}
              {hasChildren && (
                <span className={cn(
                  "font-bold tabular-nums",
                  completedChildren === totalChildren && "text-emerald-600 dark:text-emerald-400"
                )}>
                  {completedChildren}/{totalChildren}
                </span>
              )}
            </div>

            {/* Completion checkbox - Refined with hover animation */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex-shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200",
                isCompact ? "h-7 w-7" : "h-8 w-8",
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                  : isInProgress
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  : "border-border/60 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:shadow-sm"
              )}
              aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              {isCompleted && <Check className={cn(isCompact ? "h-4 w-4" : "h-4.5 w-4.5")} strokeWidth={3} />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RoadmapNode.displayName = "RoadmapNode";

export default RoadmapNode;
