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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";
import { getNodeStyle, badgeStyles } from "./RoadmapNodeStyles";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

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

        {/* Node Card - Cleaner roadmap.sh style */}
        <motion.div
          onClick={onClick}
          whileHover={{ scale: 1.01, x: 2 }}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "flex-1 flex items-center gap-3 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all",
            nodeStyle.bg,
            nodeStyle.border,
            nodeStyle.hoverBg,
            nodeStyle.text,
            `shadow-sm ${nodeStyle.shadow}`,
            isHighlighted && "ring-2 ring-primary ring-offset-1",
            isInProgress && "ring-2 ring-amber-400 ring-offset-1",
            isOptional && "border-dashed"
          )}
        >
          {/* Icon - Smaller, cleaner */}
          <div className={cn(
            "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center",
            `bg-gradient-to-br ${gradient}`,
            "shadow-sm"
          )}>
            <NodeIcon className="h-4 w-4 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-semibold text-sm leading-tight",
                isCompleted && "line-through opacity-70"
              )}>
                {node.title}
              </span>

              {/* Badges */}
              {node.isRecommended && !isCompleted && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
                  badgeStyles.recommended
                )}>
                  <Star className="h-2.5 w-2.5" />
                  Recommended
                </span>
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

          {/* Metadata - Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Time estimate */}
            {node.estimatedTime && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] opacity-60">
                <Clock className="h-3 w-3" />
                {node.estimatedTime}
              </div>
            )}

            {/* Resources count */}
            {resourceCount > 0 && (
              <div className="flex items-center gap-1 text-[10px] opacity-60">
                <ExternalLink className="h-3 w-3" />
                {resourceCount}
              </div>
            )}

            {/* Child count */}
            {hasChildren && (
              <div className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                "bg-black/10 dark:bg-white/10"
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
