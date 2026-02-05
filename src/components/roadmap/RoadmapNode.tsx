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
  onToggle,
  onClick,
  onComplete,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const { icon: NodeIcon, color: iconColor, gradient } = getNodeIcon(node.title, node.type);
  const nodeStyle = getNodeStyle(node.type, isCompleted, node.isRecommended);
  const isOptional = node.type === 'optional';
  const isPrimary = node.type === 'primary';
  const isCheckpoint = node.type === 'checkpoint';
  const resourceCount = node.resources?.length || 0;
  const showEffects = node.isRecommended && !isCompleted;

  // Calculate indent based on depth - refined spacing
  const indent = depth * 24;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.02 }}
      className="relative"
    >
      {/* Connecting Line - refined bezier curve */}
      {depth > 0 && (
        <div 
          className="absolute top-0 bottom-1/2"
          style={{ left: indent - 12 }}
        >
          <svg width="16" height="24" className="overflow-visible">
            <path
              d={`M 0 0 L 0 12 Q 0 16, 4 16 L 12 16`}
              fill="none"
              className={cn(
                "stroke-[1.5]",
                isCompleted ? "stroke-emerald-400 dark:stroke-emerald-500" :
                isOnProgressPath ? "stroke-primary/60 dark:stroke-primary/50" :
                "stroke-border dark:stroke-border/60"
              )}
              strokeLinecap="round"
            />
            {isCompleted && (
              <circle cx="0" cy="6" r="2" className="fill-emerald-400 dark:fill-emerald-500" />
            )}
          </svg>
        </div>
      )}

      <div
        className="flex items-center gap-2 py-1"
        style={{ marginLeft: indent }}
      >
        {/* Expand/Collapse Button - refined */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-lg transition-all duration-200",
              "bg-muted/60 hover:bg-muted border border-border/60",
              isExpanded && "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                isExpanded ? "rotate-90" : "text-muted-foreground"
              )}
            />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Node Card - refined styling */}
        <motion.div
          onClick={onClick}
          whileHover={{ scale: 1.003, x: 1 }}
          whileTap={{ scale: 0.998 }}
          className={cn(
            "relative flex-1 flex items-center gap-3 px-3 py-2 rounded-xl border-2 cursor-pointer",
            "transition-all duration-200",
            nodeStyle.bg,
            nodeStyle.border,
            nodeStyle.hoverBg,
            nodeStyle.text,
            "shadow-sm hover:shadow-md",
            nodeStyle.shadow,
            isHighlighted && "ring-2 ring-primary/60 ring-offset-1 dark:ring-offset-background",
            isInProgress && "ring-2 ring-amber-400/60 ring-offset-1 dark:ring-offset-background",
            isOptional && "border-dashed",
            showEffects && "shadow-lg shadow-amber-400/25 dark:shadow-amber-500/30"
          )}
        >
          {/* Effects for recommended nodes */}
          {showEffects && (
            <>
              <ShimmerEffect />
              <FloatingParticles />
            </>
          )}
          
          {/* Icon container - refined size */}
          <div className={cn(
            "relative z-10 flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
            `bg-gradient-to-br ${gradient}`,
            "shadow-sm ring-1 ring-white/20"
          )}>
            <NodeIcon className="h-4 w-4 text-white drop-shadow-sm" />
          </div>

          {/* Content area */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                "font-semibold text-[13px] leading-tight",
                isCompleted && "line-through opacity-60"
              )}>
                {node.title}
              </span>

              {/* Status badges - inline with title */}
              {node.isRecommended && !isCompleted && (
                <motion.span 
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
                    badgeStyles.recommended
                  )}
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(251, 191, 36, 0)", "0 0 6px 1px rgba(251, 191, 36, 0.3)", "0 0 0 0 rgba(251, 191, 36, 0)"]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  <span className="hidden sm:inline">Next</span>
                </motion.span>
              )}
              
              {isOptional && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                  badgeStyles.optional
                )}>
                  <GitBranch className="h-2 w-2" />
                  <span className="hidden sm:inline">Optional</span>
                </span>
              )}

              {isCheckpoint && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                  badgeStyles.checkpoint
                )}>
                  <Bookmark className="h-2 w-2" />
                  <span className="hidden sm:inline">Checkpoint</span>
                </span>
              )}
            </div>

            {/* Description - only for primary nodes */}
            {node.description && isPrimary && (
              <p className="text-[11px] opacity-60 line-clamp-1 mt-0.5">
                {node.description}
              </p>
            )}
          </div>

          {/* Metadata pills - compact row */}
          <div className="relative z-10 flex items-center gap-1 flex-shrink-0">
            {/* Difficulty indicator */}
            {node.difficulty && (
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium",
                node.difficulty === 'Easy' && "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                node.difficulty === 'Medium' && "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                node.difficulty === 'Hard' && "bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
              )}>
                <Gauge className="h-2.5 w-2.5" />
                <span className="hidden md:inline">{node.difficulty}</span>
              </div>
            )}

            {/* Time estimate */}
            {node.estimatedTime && (
              <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-sky-100/80 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Timer className="h-2.5 w-2.5" />
                <span className="hidden lg:inline">{node.estimatedTime}</span>
              </div>
            )}

            {/* Resource count */}
            {resourceCount > 0 && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-violet-100/80 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <ExternalLink className="h-2.5 w-2.5" />
                <span>{resourceCount}</span>
              </div>
            )}

            {/* Notes indicator */}
            {hasNote && (
              <div 
                className="flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" 
                title="Has personal note"
              >
                <StickyNote className="h-2.5 w-2.5" />
              </div>
            )}

            {/* Child progress */}
            {hasChildren && (
              <div className={cn(
                "text-[9px] font-semibold px-1.5 py-0.5 rounded-md",
                completedChildren === totalChildren 
                  ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-muted/70 text-muted-foreground"
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
                "flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                  : isInProgress
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30"
                  : "border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              )}
            >
              {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RoadmapNode.displayName = "RoadmapNode";

export default RoadmapNode;
