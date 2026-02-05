import React, { memo } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  ChevronRight, 
  ExternalLink, 
  Sparkles, 
  Lock,
  Clock,
  BookOpen,
  Code,
  Database,
  Globe,
  Layers,
  Palette,
  Server,
  Shield,
  Terminal,
  Zap,
  FileCode,
  Braces,
  Container,
  GitBranch,
  Rocket,
  Star,
  Trophy,
  Target,
} from "lucide-react";
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

// Icon mapping based on node title keywords
const getNodeIcon = (title: string, type: string) => {
  const lowerTitle = title.toLowerCase();
  
  // Technology-specific icons
  if (lowerTitle.includes('html')) return { icon: Code, color: 'text-orange-500', bg: 'bg-orange-500/10' };
  if (lowerTitle.includes('css') || lowerTitle.includes('style') || lowerTitle.includes('tailwind')) return { icon: Palette, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (lowerTitle.includes('javascript') || lowerTitle.includes('js')) return { icon: Braces, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
  if (lowerTitle.includes('typescript')) return { icon: FileCode, color: 'text-blue-600', bg: 'bg-blue-600/10' };
  if (lowerTitle.includes('react') || lowerTitle.includes('vue') || lowerTitle.includes('angular')) return { icon: Layers, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
  if (lowerTitle.includes('node') || lowerTitle.includes('express')) return { icon: Server, color: 'text-green-500', bg: 'bg-green-500/10' };
  if (lowerTitle.includes('database') || lowerTitle.includes('sql') || lowerTitle.includes('postgres') || lowerTitle.includes('mongo')) return { icon: Database, color: 'text-purple-500', bg: 'bg-purple-500/10' };
  if (lowerTitle.includes('api') || lowerTitle.includes('rest') || lowerTitle.includes('graphql')) return { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
  if (lowerTitle.includes('git') || lowerTitle.includes('version')) return { icon: GitBranch, color: 'text-rose-500', bg: 'bg-rose-500/10' };
  if (lowerTitle.includes('docker') || lowerTitle.includes('container') || lowerTitle.includes('kubernetes')) return { icon: Container, color: 'text-sky-500', bg: 'bg-sky-500/10' };
  if (lowerTitle.includes('security') || lowerTitle.includes('auth') || lowerTitle.includes('jwt') || lowerTitle.includes('oauth')) return { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' };
  if (lowerTitle.includes('terminal') || lowerTitle.includes('cli') || lowerTitle.includes('command')) return { icon: Terminal, color: 'text-gray-500', bg: 'bg-gray-500/10' };
  if (lowerTitle.includes('deploy') || lowerTitle.includes('vercel') || lowerTitle.includes('netlify')) return { icon: Rocket, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' };
  if (lowerTitle.includes('test')) return { icon: Target, color: 'text-teal-500', bg: 'bg-teal-500/10' };
  if (lowerTitle.includes('internet') || lowerTitle.includes('http') || lowerTitle.includes('dns')) return { icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (lowerTitle.includes('build') || lowerTitle.includes('webpack') || lowerTitle.includes('vite')) return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  
  // Type-based fallbacks
  if (type === 'primary') return { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' };
  if (type === 'checkpoint') return { icon: Trophy, color: 'text-violet-500', bg: 'bg-violet-500/10' };
  if (type === 'resource') return { icon: ExternalLink, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (type === 'optional') return { icon: Star, color: 'text-muted-foreground', bg: 'bg-muted' };
  
  return { icon: BookOpen, color: 'text-muted-foreground', bg: 'bg-muted' };
};

const nodeTypeStyles = {
  primary: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600",
  secondary: "bg-card border-border hover:border-primary/50",
  checkpoint: "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border-violet-300 dark:border-violet-700 hover:border-violet-400",
  resource: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border-blue-300 dark:border-blue-700 hover:border-blue-400",
  optional: "border-dashed border-2 border-muted-foreground/30 bg-muted/30 hover:bg-muted/50",
};

const difficultyConfig = {
  Easy: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: "🟢" },
  Medium: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: "🟡" },
  Hard: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: "🔴" },
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
  const isPrimary = node.type === 'primary';
  const { icon: NodeIcon, color: iconColor, bg: iconBg } = getNodeIcon(node.title, node.type);
  const difficultyInfo = node.difficulty ? difficultyConfig[node.difficulty] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.02 }}
      className="relative"
    >
      {/* SVG Connector Line */}
      {depth > 0 && (
        <svg 
          className="absolute pointer-events-none" 
          style={{ 
            left: (depth - 1) * 28 + 14,
            top: -8,
            width: 40,
            height: 32,
          }}
        >
          {/* Vertical line from parent */}
          <motion.line
            x1="0"
            y1="0"
            x2="0"
            y2="24"
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
            d="M 0 24 Q 0 32, 10 32 L 28 32"
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
        className={cn(
          "group flex items-center gap-3 py-2 relative",
        )}
        style={{ marginLeft: depth * 28 }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className={cn(
              "flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-md transition-all z-10",
              "bg-muted/50 hover:bg-muted border border-border/50",
              isExpanded && "bg-primary/10 border-primary/30"
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
          <div className="w-6" />
        )}

        {/* Main Node Card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              onClick={onClick}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              animate={isHighlighted ? { 
                boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 0 4px hsl(var(--primary) / 0.2)", "0 0 0 0 hsl(var(--primary) / 0)"]
              } : {}}
              transition={isHighlighted ? { duration: 1.5, repeat: Infinity } : { duration: 0.15 }}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200",
                "shadow-sm hover:shadow-md",
                nodeTypeStyles[node.type],
                isCompleted && "opacity-75",
                isInProgress && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isOnProgressPath && !isCompleted && !isInProgress && "ring-1 ring-primary/40",
                hasLockedPrerequisites && !isCompleted && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Colorful Icon */}
              <div className={cn(
                "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-transform",
                iconBg,
                isCompleted && "opacity-60"
              )}>
                <NodeIcon className={cn("h-4.5 w-4.5", iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isCompleted && "line-through text-muted-foreground",
                    isPrimary && "font-semibold"
                  )}>
                    {node.title}
                  </span>

                  {/* Recommended Star */}
                  {node.isRecommended && (
                    <Sparkles className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                  )}

                  {/* Optional Tag */}
                  {isOptional && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                      Optional
                    </Badge>
                  )}
                </div>

                {/* Description (only for primary nodes) */}
                {node.description && isPrimary && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {node.description}
                  </p>
                )}
              </div>

              {/* Right Side Info */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Difficulty Indicator */}
                {difficultyInfo && (
                  <div className={cn(
                    "hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    difficultyInfo.bg, difficultyInfo.color
                  )}>
                    <span className="text-[10px]">{difficultyInfo.icon}</span>
                    <span className="hidden md:inline">{node.difficulty}</span>
                  </div>
                )}

                {/* Estimated Time */}
                {node.estimatedTime && (
                  <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}

                {/* Children Count Badge */}
                {hasChildren && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
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
                    "flex-shrink-0 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                      : isInProgress
                      ? "border-primary bg-primary/20"
                      : isOnProgressPath
                      ? "border-primary/50 bg-primary/10"
                      : hasLockedPrerequisites
                      ? "border-muted-foreground/20 bg-muted cursor-not-allowed"
                      : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
                  )}
                >
                  {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  {hasLockedPrerequisites && !isCompleted && <Lock className="h-3 w-3 text-muted-foreground" />}
                </button>
              </div>
            </motion.div>
          </TooltipTrigger>
          
          {/* Enhanced Tooltip */}
          <TooltipContent 
            side="right" 
            className="max-w-xs p-3 bg-popover/95 backdrop-blur-sm border shadow-xl"
            sideOffset={8}
          >
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
                  <NodeIcon className={cn("h-4 w-4", iconColor)} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{node.title}</p>
                  {node.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{node.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {difficultyInfo && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    difficultyInfo.bg, difficultyInfo.color
                  )}>
                    <span>{difficultyInfo.icon}</span>
                    <span>{node.difficulty}</span>
                  </div>
                )}
                {node.estimatedTime && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{node.estimatedTime}</span>
                  </div>
                )}
              </div>

              {hasChildren && (
                <p className="text-xs text-muted-foreground">
                  📚 {node.children!.length} subtopics to explore
                </p>
              )}
              
              {isOptional && (
                <p className="text-xs text-muted-foreground italic">
                  ✨ This is an optional topic for deeper learning
                </p>
              )}
              
              {node.isRecommended && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  ⭐ Recommended for your learning path
                </p>
              )}
              
              {isOnProgressPath && !isCompleted && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium pt-1 border-t">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Next recommended step
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Progress Path Indicator - Floating */}
        {isOnProgressPath && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg"
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

RoadmapTreeNode.displayName = "RoadmapTreeNode";

export default RoadmapTreeNode;
