import React, { memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  Lock,
  Clock,
  BookOpen,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getNodeIcon } from "./RoadmapIconMapping";
import { DifficultyBadge, SubtopicProgress, ResourceBadge } from "./RoadmapNodeBadges";
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

// Enhanced node type styles with glassmorphism and richer gradients
const nodeTypeStyles = {
  primary: "bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-yellow-50/70 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 border-amber-300/60 dark:border-amber-700/40 hover:border-amber-400 dark:hover:border-amber-600 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/15",
  secondary: "bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/40 shadow-md hover:shadow-lg",
  checkpoint: "bg-gradient-to-br from-violet-50/90 via-purple-50/80 to-fuchsia-50/70 dark:from-violet-950/40 dark:via-purple-950/30 dark:to-fuchsia-950/20 border-violet-300/60 dark:border-violet-700/40 hover:border-violet-400 shadow-lg shadow-violet-500/10",
  resource: "bg-gradient-to-br from-blue-50/90 via-cyan-50/80 to-sky-50/70 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-sky-950/20 border-blue-300/60 dark:border-blue-700/40 hover:border-blue-400 shadow-lg shadow-blue-500/10",
  optional: "border-dashed border-2 border-muted-foreground/30 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/50 backdrop-blur-sm",
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
  const isCheckpoint = node.type === 'checkpoint';
  const { icon: NodeIcon, color: iconColor, bg: iconBg, gradient } = getNodeIcon(node.title, node.type);
  const resourceCount = node.resources?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: depth * 0.02 }}
      className="relative"
    >
      {/* Enhanced SVG Connector Lines */}
      {depth > 0 && (
        <svg 
          className="absolute pointer-events-none" 
          style={{ 
            left: (depth - 1) * 32 + 16,
            top: -10,
            width: 52,
            height: 40,
          }}
        >
          {/* Vertical line from parent with gradient */}
          <defs>
            <linearGradient id={`lineGrad-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isCompleted ? '#22c55e' : isOnProgressPath ? 'hsl(var(--primary))' : 'hsl(var(--border))'} />
              <stop offset="100%" stopColor={isCompleted ? '#10b981' : isOnProgressPath ? 'hsl(var(--primary))' : 'hsl(var(--border))'} />
            </linearGradient>
          </defs>
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2="32"
            strokeWidth={2.5}
            strokeLinecap="round"
            stroke={`url(#lineGrad-${node.id})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35 }}
          />
          {/* Curved connector to node */}
          <motion.path
            d="M 0 32 Q 0 40, 14 40 L 36 40"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            stroke={`url(#lineGrad-${node.id})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          />
          {/* Connection dot */}
          {isCompleted && (
            <motion.circle
              cx="0"
              cy="16"
              r="3"
              fill="#22c55e"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}
        </svg>
      )}

      <div
        className={cn("group flex items-center gap-3 py-3 relative")}
        style={{ marginLeft: depth * 32 }}
      >
        {/* Expand/Collapse Button - Enhanced */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-xl transition-all z-10",
              "bg-gradient-to-br from-muted/80 to-muted/40 hover:from-muted hover:to-muted/60",
              "border border-border/60 shadow-sm hover:shadow-md",
              isExpanded && "bg-gradient-to-br from-primary/15 to-primary/5 border-primary/40"
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
          <div className="w-8" />
        )}

        {/* Main Node Card - Significantly Enhanced */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              onClick={onClick}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.995 }}
              animate={isHighlighted ? { 
                boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 0 6px hsl(var(--primary) / 0.15)", "0 0 0 0 hsl(var(--primary) / 0)"]
              } : {}}
              transition={isHighlighted ? { duration: 1.5, repeat: Infinity } : { duration: 0.15 }}
              className={cn(
                "flex-1 flex items-center gap-4 px-4 py-3.5 rounded-2xl border cursor-pointer transition-all duration-200",
                "backdrop-blur-sm",
                nodeTypeStyles[node.type],
                isCompleted && "opacity-85",
                isInProgress && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isOnProgressPath && !isCompleted && !isInProgress && "ring-1 ring-primary/40",
                hasLockedPrerequisites && !isCompleted && "opacity-40 cursor-not-allowed grayscale"
              )}
            >
              {/* Colorful Gradient Icon Container - Larger with Glow */}
              <div className={cn(
                "relative flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                `bg-gradient-to-br ${gradient}`,
                "shadow-lg",
                isCompleted && "opacity-75"
              )}
              style={{
                boxShadow: `0 4px 20px -4px ${iconColor}40`
              }}
              >
                <NodeIcon className="h-6 w-6 text-white drop-shadow-md" />
                
                {/* Shimmer effect for recommended nodes */}
                {node.isRecommended && !isCompleted && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "font-bold leading-tight",
                    isCompleted && "line-through text-muted-foreground",
                    isPrimary ? "text-base" : isCheckpoint ? "text-sm" : "text-sm"
                  )}>
                    {node.title}
                  </span>

                  {/* Recommended Sparkle */}
                  {node.isRecommended && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </motion.div>
                  )}

                  {/* Optional Tag */}
                  {isOptional && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-dashed border-muted-foreground/40 text-muted-foreground font-medium">
                      Optional
                    </Badge>
                  )}
                  
                  {/* Checkpoint Badge */}
                  {isCheckpoint && (
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30">
                      Checkpoint
                    </Badge>
                  )}
                </div>

                {/* Description with better typography */}
                {node.description && (isPrimary || node.type === 'resource') && (
                  <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                    {node.description}
                  </p>
                )}

                {/* Inline metadata row for primary nodes */}
                {isPrimary && (
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {node.difficulty && (
                      <DifficultyBadge difficulty={node.difficulty} showLabel={false} />
                    )}
                    {node.estimatedTime && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/50">
                        <Clock className="h-3 w-3" />
                        <span>{node.estimatedTime}</span>
                      </div>
                    )}
                    {resourceCount > 0 && (
                      <ResourceBadge count={resourceCount} />
                    )}
                  </div>
                )}
              </div>

              {/* Right Side Metadata - Enhanced */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {/* Difficulty Badge for non-primary */}
                {node.difficulty && !isPrimary && (
                  <div className="hidden sm:block">
                    <DifficultyBadge difficulty={node.difficulty} showLabel={false} />
                  </div>
                )}

                {/* Estimated Time for non-primary */}
                {node.estimatedTime && !isPrimary && (
                  <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg border border-border/50">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}

                {/* Subtopic Progress Ring - Enhanced */}
                {hasChildren && totalChildren > 0 && (
                  <div className="flex items-center gap-1.5 bg-muted/40 px-2 py-1 rounded-lg border border-border/30">
                    <SubtopicProgress 
                      completed={completedChildren} 
                      total={totalChildren}
                      size={26}
                    />
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-[10px] font-medium leading-none">{completedChildren}/{totalChildren}</span>
                      <span className="text-[9px] text-muted-foreground">topics</span>
                    </div>
                  </div>
                )}

                {/* Children Count (if no progress tracking) */}
                {hasChildren && totalChildren === 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/40 border border-border/30">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{node.children!.length}</span>
                  </div>
                )}

                {/* Completion Checkbox - Enhanced */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  disabled={hasLockedPrerequisites}
                  className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : isInProgress
                      ? "border-primary bg-primary/20 border-2"
                      : isOnProgressPath
                      ? "border-primary/50 bg-primary/10"
                      : hasLockedPrerequisites
                      ? "border-muted-foreground/15 bg-muted cursor-not-allowed"
                      : "border-muted-foreground/30 hover:border-primary hover:bg-primary/10 hover:scale-105"
                  )}
                >
                  {isCompleted && <Check className="h-4.5 w-4.5" strokeWidth={3} />}
                  {hasLockedPrerequisites && !isCompleted && <Lock className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </motion.div>
          </TooltipTrigger>
          
          {/* Enhanced Tooltip with Rich Content */}
          <TooltipContent 
            side="right" 
            className="max-w-sm p-0 bg-popover/98 backdrop-blur-xl border-2 shadow-2xl rounded-xl overflow-hidden"
            sideOffset={16}
          >
            {/* Header with gradient */}
            <div className={cn("p-4 bg-gradient-to-br", gradient.replace('from-', 'from-').replace('to-', 'to-'))}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <NodeIcon className="h-6 w-6 text-white drop-shadow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white leading-tight drop-shadow">{node.title}</p>
                  {node.description && (
                    <p className="text-xs text-white/80 mt-1 line-clamp-2">{node.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2">
                {node.difficulty && (
                  <DifficultyBadge difficulty={node.difficulty} />
                )}
                {node.estimatedTime && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs text-muted-foreground border">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}
                {resourceCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-xs text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{resourceCount} resources</span>
                  </div>
                )}
              </div>

              {/* Children info */}
              {hasChildren && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <Layers className="h-4 w-4" />
                  <span>{node.children!.length} subtopics to explore</span>
                </div>
              )}

              {/* Resources preview */}
              {node.resources && node.resources.length > 0 && (
                <div className="pt-2 border-t space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resources</p>
                  {node.resources.slice(0, 2).map((resource, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <ExternalLink className="h-3 w-3 text-blue-500" />
                      <span className="truncate">{resource.title}</span>
                    </div>
                  ))}
                  {node.resources.length > 2 && (
                    <p className="text-[10px] text-muted-foreground">+{node.resources.length - 2} more</p>
                  )}
                </div>
              )}
              
              {isOptional && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1.5 pt-2 border-t">
                  <span>✨</span> Optional topic for deeper learning
                </p>
              )}
              
              {node.isRecommended && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 pt-2 border-t">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended for your learning path
                </p>
              )}
              
              {isOnProgressPath && !isCompleted && (
                <div className="flex items-center gap-2 text-xs text-primary font-semibold pt-2 border-t">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                  Next recommended step
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Next Step Floating Indicator - Enhanced */}
        {isOnProgressPath && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[11px] font-bold shadow-xl shadow-primary/30"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
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
