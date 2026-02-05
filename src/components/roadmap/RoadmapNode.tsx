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

  // Calculate indent based on depth
  const indent = depth * 28;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.015 }}
      className="relative"
    >
      {/* Connecting Line */}
      {depth > 0 && (
        <div 
          className="absolute top-0 bottom-1/2"
          style={{ left: indent - 14 }}
        >
          <svg width="20" height="28" className="overflow-visible">
            <path
              d={`M 0 0 L 0 14 Q 0 20, 6 20 L 14 20`}
              fill="none"
              className={cn(
                "stroke-[2]",
                isCompleted ? "stroke-emerald-400 dark:stroke-emerald-500" :
                isOnProgressPath ? "stroke-amber-400 dark:stroke-amber-500" :
                "stroke-slate-300 dark:stroke-slate-600"
              )}
              strokeLinecap="round"
            />
            {isCompleted && (
              <circle cx="0" cy="7" r="2.5" className="fill-emerald-400 dark:fill-emerald-500" />
            )}
          </svg>
        </div>
      )}

      <div
        className="flex items-center gap-2 py-1.5"
        style={{ marginLeft: indent }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-md transition-all",
              "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
              "border border-slate-200 dark:border-slate-600",
              isExpanded && "bg-amber-100 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-150",
                isExpanded && "rotate-90 text-amber-600 dark:text-amber-400"
              )}
            />
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Node Card - Enhanced with refined styling */}
        <motion.div
          onClick={onClick}
          whileHover={{ scale: 1.005, x: 2 }}
          whileTap={{ scale: 0.995 }}
          className={cn(
            "relative flex-1 flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200",
            nodeStyle.bg,
            nodeStyle.border,
            nodeStyle.hoverBg,
            nodeStyle.text,
            `shadow-md ${nodeStyle.shadow}`,
            isHighlighted && "ring-2 ring-primary/70 ring-offset-2 dark:ring-offset-background",
            isInProgress && "ring-2 ring-amber-400/70 ring-offset-2 dark:ring-offset-background",
            isOptional && "border-dashed",
            showEffects && "shadow-lg shadow-amber-400/30 dark:shadow-amber-500/40"
          )}
        >
          {/* Shimmer and particle effects for recommended nodes */}
          {showEffects && (
            <>
              <ShimmerEffect />
              <FloatingParticles />
            </>
          )}
          
          {/* Icon - with enhanced visibility and refined styling */}
          <div className={cn(
            "relative z-10 flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center",
            `bg-gradient-to-br ${gradient}`,
            "shadow-md dark:shadow-lg ring-1 ring-white/20"
          )}>
            <NodeIcon className="h-4.5 w-4.5 text-white drop-shadow-sm" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-semibold text-sm leading-tight",
                isCompleted && "line-through opacity-70"
              )}>
                {node.title}
              </span>

              {/* Badges with enhanced styling */}
              {node.isRecommended && !isCompleted && (
                <motion.span 
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border shadow-sm",
                    badgeStyles.recommended
                  )}
                  animate={{ 
                    boxShadow: ["0 0 0 0 rgba(251, 191, 36, 0)", "0 0 8px 2px rgba(251, 191, 36, 0.4)", "0 0 0 0 rgba(251, 191, 36, 0)"]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="h-2.5 w-2.5 fill-current" />
                  Recommended
                </motion.span>
              )}
              
              {isOptional && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                  badgeStyles.optional
                )}>
                  <GitBranch className="h-2.5 w-2.5" />
                  Optional
                </span>
              )}

              {isCheckpoint && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                  badgeStyles.checkpoint
                )}>
                  <Bookmark className="h-2.5 w-2.5" />
                  Checkpoint
                </span>
              )}
            </div>

            {/* Description for primary nodes */}
            {node.description && isPrimary && (
              <p className="text-xs opacity-70 line-clamp-1 mt-0.5">
                {node.description}
              </p>
            )}
          </div>

          {/* Metadata Indicators - Enhanced visibility */}
          <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
            {/* Difficulty Badge */}
            {node.difficulty && (
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                node.difficulty === 'Easy' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                node.difficulty === 'Medium' && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                node.difficulty === 'Hard' && "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
              )}>
                <Gauge className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">{node.difficulty}</span>
              </div>
            )}

            {/* Time Estimate Badge */}
            {node.estimatedTime && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                <Timer className="h-2.5 w-2.5" />
                <span className="hidden sm:inline">{node.estimatedTime}</span>
              </div>
            )}

            {/* Resources count */}
            {resourceCount > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <ExternalLink className="h-2.5 w-2.5" />
                <span>{resourceCount}</span>
              </div>
            )}

            {/* Child progress count */}
            {hasChildren && (
              <div className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                completedChildren === totalChildren 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-muted/80 text-muted-foreground dark:bg-muted/60"
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
                "flex-shrink-0 h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : isInProgress
                  ? "border-amber-400 bg-amber-100 dark:bg-amber-900/30"
                  : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              )}
            >
              {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

RoadmapNode.displayName = "RoadmapNode";

export default RoadmapNode;
