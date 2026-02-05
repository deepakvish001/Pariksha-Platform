import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, ZoomIn, ZoomOut, Sparkles } from "lucide-react";
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
}

const flattenWithDepth = (nodes: RoadmapTreeNode[], depth = 0): FlatNode[] => {
  const result: FlatNode[] = [];
  nodes.forEach(node => {
    const { color } = getNodeIcon(node.title, node.type);
    result.push({
      id: node.id,
      title: node.title,
      depth,
      type: node.type,
      hasChildren: Boolean(node.children?.length),
      iconColor: color,
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

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Calculate minimap node size based on total nodes
  const nodeSize = Math.max(5, Math.min(10, 250 / flatNodes.length));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="sticky top-4 z-10">
        <div className="bg-card/95 backdrop-blur-md border rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Map className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold block">Overview</span>
                  <span className="text-[10px] text-muted-foreground">{stats.percentage}% complete</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">{stats.completed}</span>
                  <span className="text-xs text-muted-foreground">/{stats.total}</span>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-5 w-5 flex items-center justify-center rounded-md bg-muted/50"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 4L6 8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </div>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* Progress Bar */}
            <div className="px-3 py-2 border-t bg-muted/20">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/10">
              <span className="text-xs text-muted-foreground font-medium">
                {Math.round(scale * 100)}%
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md"
                  onClick={handleZoomIn}
                  disabled={scale >= 1.5}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Mini Map Content */}
            <div className="p-3 border-t max-h-80 overflow-auto">
              <div
                className="relative"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: `${100 / scale}%`,
                }}
              >
                {/* Progress line with gradient */}
                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-border rounded-full">
                  {/* Completed progress overlay */}
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-emerald-500 rounded-full"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(currentIndex / Math.max(flatNodes.length - 1, 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Nodes */}
                <div className="space-y-0.5 pl-4">
                  {flatNodes.map((node, index) => {
                    const nodeProgress = progress[node.id];
                    const isCompleted = nodeProgress?.completed;
                    const isInProgress = nodeProgress?.inProgress;
                    const isCurrent = node.id === nextRecommendedId;
                    const isExpanded = expandedNodes.has(node.id);

                    return (
                      <motion.button
                        key={node.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.008 }}
                        onClick={() => onNodeClick(node.id)}
                        className={cn(
                          "relative flex items-center gap-1.5 w-full text-left transition-all rounded-md px-1.5 py-1",
                          "hover:bg-muted/80",
                          isCurrent && "bg-primary/10"
                        )}
                        style={{ paddingLeft: node.depth * 10 + 6 }}
                      >
                        {/* Colored node dot */}
                        <div
                          className={cn(
                            "rounded-full flex-shrink-0 transition-all shadow-sm",
                            isCompleted && "ring-1 ring-emerald-500/50",
                            isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                          )}
                          style={{
                            width: nodeSize,
                            height: nodeSize,
                            backgroundColor: isCompleted 
                              ? '#22c55e' // emerald-500
                              : isInProgress 
                              ? 'hsl(var(--primary))'
                              : node.iconColor,
                            opacity: isCompleted || isInProgress || isCurrent ? 1 : 0.6,
                          }}
                        />

                        {/* Node label */}
                        <span
                          className={cn(
                            "text-[10px] truncate transition-opacity leading-tight",
                            isCurrent
                              ? "opacity-100 text-primary font-semibold"
                              : "opacity-70 hover:opacity-100",
                            isCompleted && "line-through text-muted-foreground opacity-60"
                          )}
                          style={{ maxWidth: 130 - node.depth * 10 }}
                        >
                          {node.title}
                        </span>

                        {/* Current indicator */}
                        {isCurrent && (
                          <Sparkles className="h-3 w-3 text-primary flex-shrink-0 ml-auto" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="px-3 py-2 border-t bg-muted/20 flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 shadow-sm" />
                <span>Pending</span>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
};

export default RoadmapMiniMap;
