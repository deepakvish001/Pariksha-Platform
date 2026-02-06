import React, { memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  Star,
  Sparkles,
  GitBranch,
  Bookmark,
  Clock,
  ExternalLink,
  Zap,
  Gauge,
  Timer,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";
import { getNodeStyle, badgeStyles } from "./RoadmapNodeStyles";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

// Shimmer effect component for recommended nodes
const ShimmerEffect = () => (
  <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent dark:via-white/20"
      initial={{ x: "-100%" }}
      animate={{ x: "200%" }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatDelay: 3,
        ease: "easeInOut",
      }}
    />
  </div>
);

// Floating particles for recommended nodes
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-amber-300 dark:bg-amber-200"
        initial={{ 
          x: `${20 + i * 20}%`, 
          y: "100%", 
          opacity: 0,
          scale: 0.5 
        }}
        animate={{ 
          y: "-20%", 
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: i * 0.6,
          ease: "easeOut",
        }}
      />
    ))}
  </div>
);

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

  // Calculate indent based on depth and compact mode - refined spacing
  const indent = isCompact ? depth * 14 : depth * 20;
  
  // Determine if we should show expanded metadata
  const showExpandedMeta = !isCompact && depth === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12, delay: depth * 0.015 }}
      className="relative"
    >
      {/* Connecting Line - refined */}
      {depth > 0 && (
        <div 
          className="absolute top-0 bottom-1/2"
          style={{ left: indent - 8 }}
        >
          <svg width="12" height="18" className="overflow-visible">
            <path
              d={`M 0 0 L 0 9 Q 0 12, 3 12 L 8 12`}
              fill="none"
              className={cn(
                "stroke-[1.5]",
                isCompleted ? "stroke-emerald-400 dark:stroke-emerald-500" :
                isOnProgressPath ? "stroke-primary/50" :
                "stroke-border/60"
              )}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div
        className={cn(
          "flex items-center",
          isCompact ? "gap-1.5 py-1" : "gap-2 py-1.5"
        )}
        style={{ marginLeft: indent }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-150",
              "bg-muted/60 hover:bg-muted border-2 border-border/60",
              isExpanded && "bg-primary/15 border-primary/40 text-primary",
              isCompact ? "h-6 w-6" : "h-7 w-7"
            )}
          >
            <ChevronRight
              className={cn(
                "transition-transform duration-150",
                isExpanded ? "rotate-90" : "text-muted-foreground",
                isCompact ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
            />
          </button>
        ) : (
          <div className={isCompact ? "w-6" : "w-7"} />
        )}

        {/* Node Card */}
        <motion.div
          onClick={onClick}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.998 }}
          className={cn(
            "relative flex-1 flex items-center border-2 cursor-pointer",
            "transition-all duration-150",
            nodeStyle.bg,
            nodeStyle.border,
            nodeStyle.text,
            "shadow-sm hover:shadow-lg",
            isHighlighted && "ring-2 ring-primary/50 ring-offset-2 dark:ring-offset-background",
            isInProgress && "ring-2 ring-amber-400/50 ring-offset-2 dark:ring-offset-background",
            isOptional && "border-dashed",
            showEffects && "shadow-lg shadow-amber-400/25 dark:shadow-amber-500/30",
            isCompact 
              ? "gap-2.5 px-3 py-2 rounded-xl" 
              : "gap-3 px-4 py-3 rounded-xl"
          )}
        >
          {/* Effects for recommended nodes */}
          {showEffects && (
            <>
              <ShimmerEffect />
              <FloatingParticles />
            </>
          )}
          
          {/* Icon container - larger sizing */}
          <div className={cn(
            "relative z-10 flex-shrink-0 rounded-lg flex items-center justify-center",
            `bg-gradient-to-br ${gradient}`,
            "shadow-md",
            isCompact ? "h-7 w-7" : "h-9 w-9"
          )}>
            <NodeIcon className={cn(
              "text-white drop-shadow-sm",
              isCompact ? "h-3.5 w-3.5" : "h-4.5 w-4.5"
            )} />
          </div>

          {/* Content area */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "font-semibold leading-tight",
                isCompact ? "text-sm" : "text-base",
                isCompleted && "line-through opacity-50"
              )}>
                {node.title}
              </span>

              {/* Inline badges */}
              {node.isRecommended && !isCompleted && (
                <motion.span 
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                    badgeStyles.recommended
                  )}
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(251, 191, 36, 0)", "0 0 4px 2px rgba(251, 191, 36, 0.25)", "0 0 0 0 rgba(251, 191, 36, 0)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                </motion.span>
              )}
              
              {isOptional && (
                <span className={cn(
                  "inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md",
                  badgeStyles.optional
                )}>
                  <GitBranch className="h-2.5 w-2.5" />
                </span>
              )}

              {isCheckpoint && (
                <span className={cn(
                  "inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-md",
                  badgeStyles.checkpoint
                )}>
                  <Bookmark className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          </div>

          {/* Metadata pills */}
          <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
            {/* Difficulty indicator */}
            {node.difficulty && (
              <div className={cn(
                "flex items-center px-1.5 py-1 rounded-lg text-[10px] font-semibold",
                node.difficulty === 'Easy' && "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                node.difficulty === 'Medium' && "bg-amber-100/70 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                node.difficulty === 'Hard' && "bg-rose-100/70 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              )}>
                <Gauge className="h-3 w-3" />
              </div>
            )}

            {/* Combined resource + notes count */}
            {(resourceCount > 0 || hasNote) && (
              <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-semibold bg-muted/60 text-muted-foreground">
                {resourceCount > 0 && (
                  <span className="flex items-center gap-0.5">
                    <ExternalLink className="h-3 w-3" />
                    <span className="tabular-nums">{resourceCount}</span>
                  </span>
                )}
                {hasNote && <StickyNote className="h-3 w-3 text-amber-500" />}
              </div>
            )}

            {/* Child progress - only show if has children */}
            {hasChildren && (
              <div className={cn(
                "text-[10px] font-bold px-1.5 py-1 rounded-lg tabular-nums",
                completedChildren === totalChildren 
                  ? "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-muted/60 text-muted-foreground"
              )}>
                {completedChildren}/{totalChildren}
              </div>
            )}

            {/* Completion checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className={cn(
                "flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-all duration-150",
                isCompact ? "h-6 w-6" : "h-7 w-7",
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md"
                  : isInProgress
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30"
                  : "border-border/80 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              )}
            >
              {isCompleted && <Check className={cn(isCompact ? "h-3.5 w-3.5" : "h-4 w-4")} strokeWidth={3} />}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RoadmapNode.displayName = "RoadmapNode";

export default RoadmapNode;
