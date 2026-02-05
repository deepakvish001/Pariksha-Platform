import React, { memo } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, ExternalLink, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface RoadmapTreeNodeProps {
  node: NodeType;
  depth: number;
  isExpanded: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  isOnProgressPath: boolean;
  isHighlighted: boolean;
  hasLockedPrerequisites: boolean;
  onToggle: () => void;
  onClick: () => void;
  onComplete: () => void;
}

const nodeTypeStyles = {
  primary: "bg-amber-400 dark:bg-amber-300 border-amber-500 dark:border-amber-400 text-amber-950",
  secondary: "bg-muted border-border text-foreground",
  checkpoint: "bg-violet-500 dark:bg-violet-400 border-violet-600 dark:border-violet-500 text-white",
  resource: "bg-blue-500 dark:bg-blue-400 border-blue-600 dark:border-blue-500 text-white",
  optional: "border-dashed border-2 border-muted-foreground/50 bg-transparent text-muted-foreground",
};

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const RoadmapTreeNode: React.FC<RoadmapTreeNodeProps> = memo(({
  node,
  depth,
  isExpanded,
  isCompleted,
  isInProgress,
  isOnProgressPath,
  isHighlighted,
  hasLockedPrerequisites,
  onToggle,
  onClick,
  onComplete,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isOptional = node.type === 'optional';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.03 }}
      className="relative"
    >
      {/* SVG Connector Line */}
      {depth > 0 && (
        <svg 
          className="absolute pointer-events-none" 
          style={{ 
            left: (depth - 1) * 24 + 12,
            top: -8,
            width: 36,
            height: 28,
          }}
        >
          {/* Vertical line from parent */}
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2="20"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              "stroke-border transition-colors duration-300",
              isCompleted && "stroke-emerald-500",
              isOnProgressPath && !isCompleted && "stroke-primary"
            )}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
          {/* Horizontal connector to node */}
          <motion.path
            d="M 0 20 Q 0 28, 8 28 L 24 28"
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            className={cn(
              "stroke-border transition-colors duration-300",
              isCompleted && "stroke-emerald-500",
              isOnProgressPath && !isCompleted && "stroke-primary"
            )}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </svg>
      )}

      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 relative",
          depth > 0 && "ml-6"
        )}
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors z-10"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Completion Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          disabled={hasLockedPrerequisites}
          className={cn(
            "flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all duration-200 z-10",
            isCompleted
              ? "bg-emerald-500 border-emerald-500 text-white"
              : isInProgress
              ? "border-primary bg-primary/10"
              : isOnProgressPath
              ? "border-primary/50 bg-primary/5"
              : hasLockedPrerequisites
              ? "border-muted-foreground/30 bg-muted cursor-not-allowed"
              : "border-muted-foreground/30 hover:border-primary"
          )}
        >
          {isCompleted && <Check className="h-3 w-3" />}
          {hasLockedPrerequisites && !isCompleted && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
        </button>

        {/* Node Content */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={onClick}
              animate={isHighlighted ? { 
                scale: [1, 1.02, 1],
                boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 0 4px hsl(var(--primary) / 0.3)", "0 0 0 0 hsl(var(--primary) / 0)"]
              } : {}}
              transition={isHighlighted ? { duration: 1.5, repeat: Infinity } : {}}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200",
                "hover:shadow-md cursor-pointer z-10",
                nodeTypeStyles[node.type],
                isCompleted && "opacity-70",
                isInProgress && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isOnProgressPath && !isCompleted && !isInProgress && "ring-1 ring-primary/50",
                isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                hasLockedPrerequisites && !isCompleted && "opacity-50"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isCompleted && "line-through"
              )}>
                {node.title}
              </span>

              {/* Badges */}
              {node.isRecommended && (
                <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              )}
              
              {node.type === 'resource' && (
                <ExternalLink className="h-3 w-3" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{node.title}</p>
              {node.description && (
                <p className="text-xs text-muted-foreground">{node.description}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                {node.difficulty && (
                  <Badge variant="secondary" className={cn("text-xs", difficultyColors[node.difficulty])}>
                    {node.difficulty}
                  </Badge>
                )}
                {node.estimatedTime && (
                  <span className="text-xs text-muted-foreground">{node.estimatedTime}</span>
                )}
              </div>
              {isOptional && (
                <p className="text-xs text-muted-foreground italic">Optional topic</p>
              )}
              {isOnProgressPath && !isCompleted && (
                <p className="text-xs text-primary font-medium">📍 Next recommended</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Difficulty Badge (visible on larger screens) */}
        {node.difficulty && (
          <Badge 
            variant="secondary" 
            className={cn(
              "hidden sm:inline-flex text-xs",
              difficultyColors[node.difficulty]
            )}
          >
            {node.difficulty}
          </Badge>
        )}

        {/* Estimated Time */}
        {node.estimatedTime && (
          <span className="hidden md:inline text-xs text-muted-foreground">
            {node.estimatedTime}
          </span>
        )}

        {/* Progress Path Indicator */}
        {isOnProgressPath && !isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="hidden sm:flex items-center gap-1 text-xs text-primary font-medium"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Next
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

RoadmapTreeNode.displayName = "RoadmapTreeNode";

export default RoadmapTreeNode;
