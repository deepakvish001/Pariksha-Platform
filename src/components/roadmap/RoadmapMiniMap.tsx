import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Map, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { RoadmapTreeNode } from "@/data/roadmapTreesData";

interface RoadmapMiniMapProps {
  nodes: RoadmapTreeNode[];
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  nextRecommendedId: string | null;
  expandedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  className?: string;
}

// Flatten nodes with depth info
interface FlatNode {
  id: string;
  title: string;
  depth: number;
  type: RoadmapTreeNode["type"];
  hasChildren: boolean;
}

const flattenWithDepth = (nodes: RoadmapTreeNode[], depth = 0): FlatNode[] => {
  const result: FlatNode[] = [];
  nodes.forEach(node => {
    result.push({
      id: node.id,
      title: node.title,
      depth,
      type: node.type,
      hasChildren: Boolean(node.children?.length),
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
    return { completed, inProgress, total: flatNodes.length };
  }, [flatNodes, progress]);

  // Find current position index
  const currentIndex = useMemo(() => {
    if (!nextRecommendedId) return flatNodes.length - 1;
    return flatNodes.findIndex(n => n.id === nextRecommendedId);
  }, [flatNodes, nextRecommendedId]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Calculate minimap node size based on total nodes
  const nodeSize = Math.max(4, Math.min(8, 200 / flatNodes.length));
  const maxDepth = Math.max(...flatNodes.map(n => n.depth));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="sticky top-4 z-10">
        <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Overview</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {stats.completed}/{stats.total}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-4 w-4 flex items-center justify-center"
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
            {/* Zoom Controls */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
              <span className="text-xs text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
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
                {/* Progress line */}
                <div className="absolute left-1 top-0 bottom-0 w-0.5 bg-border">
                  {/* Completed progress overlay */}
                  <motion.div
                    className="absolute top-0 left-0 w-full bg-primary"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(currentIndex / Math.max(flatNodes.length - 1, 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                {/* Nodes */}
                <div className="space-y-0.5 pl-3">
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
                        transition={{ delay: index * 0.01 }}
                        onClick={() => onNodeClick(node.id)}
                        className={cn(
                          "relative flex items-center gap-1 w-full text-left transition-all rounded-sm px-1 py-0.5",
                          "hover:bg-muted/80",
                          isCurrent && "bg-primary/10"
                        )}
                        style={{ paddingLeft: node.depth * 8 + 4 }}
                      >
                        {/* Node dot */}
                        <div
                          className={cn(
                            "rounded-full flex-shrink-0 transition-all",
                            isCompleted && "bg-emerald-500",
                            isInProgress && !isCompleted && "bg-primary",
                            !isCompleted && !isInProgress && "bg-muted-foreground/30",
                            isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                          )}
                          style={{
                            width: nodeSize,
                            height: nodeSize,
                          }}
                        />

                        {/* Node label (only show on hover or if current) */}
                        <span
                          className={cn(
                            "text-[10px] truncate transition-opacity",
                            isCurrent
                              ? "opacity-100 text-primary font-medium"
                              : "opacity-60 hover:opacity-100",
                            isCompleted && "line-through text-muted-foreground"
                          )}
                          style={{ maxWidth: 120 - node.depth * 8 }}
                        >
                          {node.title}
                        </span>

                        {/* Current indicator */}
                        {isCurrent && (
                          <motion.div
                            className="absolute -left-1 w-1 h-full bg-primary rounded-full"
                            layoutId="current-indicator"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="px-3 py-2 border-t bg-muted/30 flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                <span>Not Started</span>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  );
};

export default RoadmapMiniMap;
