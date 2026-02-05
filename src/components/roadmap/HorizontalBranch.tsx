import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Star, GitBranch, Bookmark, Clock, ExternalLink, Gauge, StickyNote } from "lucide-react";
import { getNodeIcon } from "./RoadmapIconMapping";
import { getNodeStyle, badgeStyles } from "./RoadmapNodeStyles";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface HorizontalBranchProps {
  nodes: NodeType[];
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeClick: (node: NodeType) => void;
  onNodeComplete: (nodeId: string) => void;
  title?: string;
  hasNoteCheck?: (nodeId: string) => boolean;
}

const HorizontalBranch: React.FC<HorizontalBranchProps> = ({
  nodes,
  progress,
  onNodeClick,
  onNodeComplete,
  title,
  hasNoteCheck,
}) => {
  if (nodes.length === 0) return null;

  return (
    <div className="my-3">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1 rounded-full bg-muted/40 border border-border/50">
            {title} ({nodes.length})
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border via-border to-transparent" />
        </div>
      )}

      {/* Responsive grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {nodes.map((node, index) => {
          const isCompleted = progress[node.id]?.completed;
          const isInProgress = progress[node.id]?.inProgress;
          const { icon: NodeIcon, gradient } = getNodeIcon(node.title, node.type);
          const nodeStyle = getNodeStyle(node.type, isCompleted, node.isRecommended);
          const isOptional = node.type === 'optional';
          const isCheckpoint = node.type === 'checkpoint';
          const resourceCount = node.resources?.length || 0;
          const hasNote = hasNoteCheck?.(node.id);

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              onClick={() => onNodeClick(node)}
              className={cn(
                "group relative flex flex-col p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200",
                nodeStyle.bg,
                nodeStyle.border,
                nodeStyle.text,
                "shadow-sm hover:shadow-lg",
                nodeStyle.shadow,
                isOptional && "border-dashed",
                "hover:scale-[1.02] hover:-translate-y-0.5",
                node.isRecommended && !isCompleted && "ring-2 ring-amber-400/40 ring-offset-1 dark:ring-offset-background"
              )}
            >
              {/* Top row: Icon + Checkbox */}
              <div className="flex items-start justify-between mb-2.5">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  `bg-gradient-to-br ${gradient}`,
                  "shadow-md group-hover:shadow-lg transition-shadow"
                )}>
                  <NodeIcon className="h-5 w-5 text-white drop-shadow-sm" />
                </div>

                {/* Completion button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeComplete(node.id);
                  }}
                  className={cn(
                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : isInProgress
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30"
                      : "border-border hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
              </div>

              {/* Title */}
              <h4 className={cn(
                "font-semibold text-sm leading-snug mb-1.5",
                isCompleted && "line-through opacity-60"
              )}>
                {node.title}
              </h4>

              {/* Description preview */}
              {node.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 opacity-70">
                  {node.description}
                </p>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-1 mb-2">
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
                    Next
                  </motion.span>
                )}
                {isOptional && (
                  <span className={cn(
                    "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                    badgeStyles.optional
                  )}>
                    <GitBranch className="h-2 w-2" />
                    Optional
                  </span>
                )}
                {isCheckpoint && (
                  <span className={cn(
                    "inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-md",
                    badgeStyles.checkpoint
                  )}>
                    <Bookmark className="h-2 w-2" />
                    Checkpoint
                  </span>
                )}
              </div>

              {/* Metadata footer */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/30">
                {node.difficulty && (
                  <div className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium",
                    node.difficulty === 'Easy' && "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                    node.difficulty === 'Medium' && "bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    node.difficulty === 'Hard' && "bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                  )}>
                    <Gauge className="h-2.5 w-2.5" />
                    <span>{node.difficulty}</span>
                  </div>
                )}
                {node.estimatedTime && (
                  <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {node.estimatedTime}
                  </div>
                )}
                {resourceCount > 0 && (
                  <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <ExternalLink className="h-2.5 w-2.5" />
                    {resourceCount}
                  </div>
                )}
                {hasNote && (
                  <div className="flex items-center text-[9px] text-amber-600 dark:text-amber-400">
                    <StickyNote className="h-2.5 w-2.5" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalBranch;
