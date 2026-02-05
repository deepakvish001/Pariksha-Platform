import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, ZoomIn, ZoomOut, Sparkles, Check, Target, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getNodeIcon } from "./RoadmapIconMapping";
import type { RoadmapTreeNode } from "@/data/roadmapTreesData";

interface RoadmapMiniMapProps {
  nodes: RoadmapTreeNode[];
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  nextRecommendedId: string | null;
  expandedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  className?: string;
}

// Flatten nodes with depth info and color
interface FlatNode {
  id: string;
  title: string;
  depth: number;
  type: RoadmapTreeNode["type"];
  hasChildren: boolean;
  iconColor: string;
  gradient: string;
}

const flattenWithDepth = (nodes: RoadmapTreeNode[], depth = 0): FlatNode[] => {
  const result: FlatNode[] = [];
  nodes.forEach(node => {
    const { color, gradient } = getNodeIcon(node.title, node.type);
    result.push({
      id: node.id,
      title: node.title,
      depth,
      type: node.type,
      hasChildren: Boolean(node.children?.length),
      iconColor: color,
      gradient,
    });
    if (node.children) {
      result.push(...flattenWithDepth(node.children, depth + 1));
    }
  });
  return result;
};

const RoadmapMiniMap: React.FC<RoadmapMiniMapProps> = ({
  nodes,
  progress,
  nextRecommendedId,
  expandedNodes,
  onNodeClick,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [scale, setScale] = React.useState(1);

  const flatNodes = useMemo(() => flattenWithDepth(nodes), [nodes]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = flatNodes.filter(n => progress[n.id]?.completed).length;
    const inProgress = flatNodes.filter(n => progress[n.id]?.inProgress).length;
    const percentage = flatNodes.length > 0 ? Math.round((completed / flatNodes.length) * 100) : 0;
    return { completed, inProgress, total: flatNodes.length, percentage };
  }, [flatNodes, progress]);

  // Find current position index
  const currentIndex = useMemo(() => {
    if (!nextRecommendedId) return flatNodes.length - 1;
    return flatNodes.findIndex(n => n.id === nextRecommendedId);
  }, [flatNodes, nextRecommendedId]);

  // Identify section headers (primary nodes at depth 0)
  const sectionIndices = useMemo(() => {
    return flatNodes
      .map((n, i) => (n.type === 'primary' && n.depth === 0 ? i : -1))
      .filter(i => i >= 0);
  }, [flatNodes]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Calculate minimap node size based on total nodes
  const nodeSize = Math.max(6, Math.min(10, 250 / flatNodes.length));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="sticky top-4 z-10">
        <div className="bg-card/98 backdrop-blur-xl border-2 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <Map className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block">Overview Map</span>
                  <span className="text-[10px] text-muted-foreground">{stats.percentage}% complete</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{stats.completed}</span>
                  <span className="text-xs text-muted-foreground">/{stats.total}</span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg bg-muted/60"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* Enhanced Progress Bar */}
            <div className="px-4 py-3 border-t bg-gradient-to-r from-muted/30 to-transparent">
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                <span>{stats.completed} completed</span>
                <span>{stats.total - stats.completed} remaining</span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/10">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(scale * 100)}% zoom
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={handleZoomIn}
                  disabled={scale >= 1.5}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Mini Map Content */}
            <div className="p-4 border-t max-h-96 overflow-auto">
              <div
                className="relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: `${100 / scale}%`,
                }}
              >
                {/* Progress line with enhanced gradient */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 rounded-full overflow-hidden bg-border">
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary to-emerald-500 rounded-full"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(currentIndex / Math.max(flatNodes.length - 1, 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Nodes */}
                <div className="space-y-0.5 pl-5">
                  {flatNodes.map((node, index) => {
                    const nodeProgress = progress[node.id];
                    const isCompleted = nodeProgress?.completed;
                    const isInProgress = nodeProgress?.inProgress;
                    const isCurrent = node.id === nextRecommendedId;
                    const isPrimarySection = node.type === 'primary' && node.depth === 0;

                    return (
                      <React.Fragment key={node.id}>
                        {/* Section divider for primary nodes */}
                        {isPrimarySection && index > 0 && (
                          <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent my-2 ml-1" />
                        )}
                        
                        <motion.button
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.006 }}
                          onClick={() => onNodeClick(node.id)}
                          className={cn(
                            "relative flex items-center gap-2 w-full text-left transition-all rounded-lg px-2 py-1.5",
                            "hover:bg-muted/80",
                            isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                            isPrimarySection && "font-semibold"
                          )}
                          style={{ paddingLeft: node.depth * 12 + 8 }}
                        >
                          {/* Colored node indicator */}
                          <div
                            className={cn(
                              "rounded-lg flex-shrink-0 transition-all flex items-center justify-center",
                              isCompleted && "ring-1 ring-offset-1 ring-offset-background ring-emerald-500",
                              isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            )}
                            style={{
                              width: isPrimarySection ? nodeSize + 4 : nodeSize,
                              height: isPrimarySection ? nodeSize + 4 : nodeSize,
                              backgroundColor: isCompleted 
                                ? '#22c55e' 
                                : isInProgress 
                                ? 'hsl(var(--primary))'
                                : node.iconColor,
                              opacity: isCompleted || isInProgress || isCurrent ? 1 : 0.65,
                            }}
                          >
                            {isCompleted && (
                              <Check 
                                className="text-white" 
                                style={{ 
                                  width: (isPrimarySection ? nodeSize + 4 : nodeSize) * 0.6,
                                  height: (isPrimarySection ? nodeSize + 4 : nodeSize) * 0.6,
                                }} 
                              />
                            )}
                          </div>

                          {/* Node label */}
                          <span
                            className={cn(
                              "text-[10px] truncate transition-opacity leading-tight",
                              isCurrent
                                ? "opacity-100 text-primary font-bold"
                                : "opacity-75 hover:opacity-100",
                              isCompleted && "line-through text-muted-foreground opacity-50",
                              isPrimarySection && !isCompleted && "opacity-100 text-foreground"
                            )}
                            style={{ maxWidth: 140 - node.depth * 12 }}
                          >
                            {node.title}
                          </span>

                          {/* Current/Next indicator */}
                          {isCurrent && (
                            <div className="flex items-center gap-1 ml-auto">
                              <Target className="h-3 w-3 text-primary flex-shrink-0" />
                            </div>
                          )}
                        </motion.button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Legend */}
            <div className="px-4 py-3 border-t bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-sm flex items-center justify-center">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                  <span>Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-primary shadow-sm" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-md bg-muted-foreground/50 shadow-sm" />
                  <span>Todo</span>
                </div>
              </div>
              <span className="text-[9px] opacity-60">Click to jump</span>
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
};

export default RoadmapMiniMap;
