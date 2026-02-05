import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Star, GitBranch, Bookmark, Clock, ExternalLink } from "lucide-react";
import { getNodeIcon } from "./RoadmapIconMapping";
import { getNodeStyle, badgeStyles } from "./RoadmapNodeStyles";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface HorizontalBranchProps {
  nodes: NodeType[];
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeClick: (node: NodeType) => void;
  onNodeComplete: (nodeId: string) => void;
  title?: string;
}

const HorizontalBranch: React.FC<HorizontalBranchProps> = ({
  nodes,
  progress,
  onNodeClick,
  onNodeComplete,
  title,
}) => {
  if (nodes.length === 0) return null;

  return (
    <div className="my-4">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
            {title}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* Horizontal scrollable container */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {nodes.map((node, index) => {
            const isCompleted = progress[node.id]?.completed;
            const isInProgress = progress[node.id]?.inProgress;
            const { icon: NodeIcon, gradient } = getNodeIcon(node.title, node.type);
            const nodeStyle = getNodeStyle(node.type, isCompleted, node.isRecommended);
            const isOptional = node.type === 'optional';
            const isCheckpoint = node.type === 'checkpoint';
            const resourceCount = node.resources?.length || 0;

            return (
              <React.Fragment key={node.id}>
                {/* Horizontal connector line */}
                {index > 0 && (
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "h-0.5 w-8",
                        isCompleted
                          ? "bg-emerald-400 dark:bg-emerald-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      )}
                    />
                  </div>
                )}

                {/* Node Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onNodeClick(node)}
                  className={cn(
                    "relative flex flex-col min-w-[160px] max-w-[200px] p-3 rounded-xl border-2 cursor-pointer transition-all",
                    nodeStyle.bg,
                    nodeStyle.border,
                    nodeStyle.hoverBg,
                    nodeStyle.text,
                    `shadow-sm ${nodeStyle.shadow}`,
                    isOptional && "border-dashed",
                    "hover:scale-105 hover:shadow-md"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center mb-2",
                    `bg-gradient-to-br ${gradient}`,
                    "shadow-sm"
                  )}>
                    <NodeIcon className="h-5 w-5 text-white" />
                  </div>

                  {/* Title */}
                  <span className={cn(
                    "font-semibold text-sm leading-tight mb-1",
                    isCompleted && "line-through opacity-70"
                  )}>
                    {node.title}
                  </span>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {node.isRecommended && !isCompleted && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded",
                        badgeStyles.recommended
                      )}>
                        <Star className="h-2 w-2" />
                        Pick
                      </span>
                    )}
                    {isOptional && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded border",
                        badgeStyles.optional
                      )}>
                        <GitBranch className="h-2 w-2" />
                        Skip OK
                      </span>
                    )}
                    {isCheckpoint && (
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[9px] font-medium px-1 py-0.5 rounded border",
                        badgeStyles.checkpoint
                      )}>
                        <Bookmark className="h-2 w-2" />
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-[10px] opacity-60 mt-auto">
                    {node.estimatedTime && (
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {node.estimatedTime}
                      </div>
                    )}
                    {resourceCount > 0 && (
                      <div className="flex items-center gap-0.5">
                        <ExternalLink className="h-2.5 w-2.5" />
                        {resourceCount}
                      </div>
                    )}
                  </div>

                  {/* Completion button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeComplete(node.id);
                    }}
                    className={cn(
                      "absolute top-2 right-2 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isInProgress
                        ? "border-amber-400 bg-amber-100 dark:bg-amber-900/30"
                        : "border-slate-300 dark:border-slate-500 hover:border-emerald-400"
                    )}
                  >
                    {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
                  </button>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HorizontalBranch;
