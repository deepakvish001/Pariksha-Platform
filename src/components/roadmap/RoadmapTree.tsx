import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import RoadmapTreeNode from "./RoadmapTreeNode";
import RoadmapNodeDetail from "./RoadmapNodeDetail";
import type { RoadmapTree as TreeType, RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface RoadmapTreeProps {
  tree: TreeType;
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeComplete: (nodeId: string) => void;
  onNodeInProgress?: (nodeId: string) => void;
}

const RoadmapTree: React.FC<RoadmapTreeProps> = ({
  tree,
  progress,
  onNodeComplete,
  onNodeInProgress,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Auto-expand first level on mount
  React.useEffect(() => {
    const firstLevelIds = tree.nodes.map(n => n.id);
    setExpandedNodes(new Set(firstLevelIds));
  }, [tree.id]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((node: NodeType) => {
    setSelectedNode(node);
    setDetailOpen(true);
  }, []);

  const handleComplete = useCallback((nodeId: string) => {
    onNodeComplete(nodeId);
  }, [onNodeComplete]);

  // Render tree recursively
  const renderNode = useCallback((node: NodeType, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const nodeProgress = progress[node.id] || { completed: false, inProgress: false };
    
    return (
      <div key={node.id}>
        <RoadmapTreeNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isCompleted={nodeProgress.completed}
          isInProgress={nodeProgress.inProgress}
          hasLockedPrerequisites={false}
          onToggle={() => toggleExpand(node.id)}
          onClick={() => handleNodeClick(node)}
          onComplete={() => handleComplete(node.id)}
        />
        
        <AnimatePresence>
          {isExpanded && node.children && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map(child => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [expandedNodes, progress, toggleExpand, handleNodeClick, handleComplete]);

  // Calculate stats
  const stats = useMemo(() => {
    const flattenNodes = (nodes: NodeType[]): NodeType[] => {
      const result: NodeType[] = [];
      const traverse = (nodeList: NodeType[]) => {
        for (const node of nodeList) {
          result.push(node);
          if (node.children) traverse(node.children);
        }
      };
      traverse(nodes);
      return result;
    };

    const allNodes = flattenNodes(tree.nodes);
    const completed = allNodes.filter(n => progress[n.id]?.completed).length;
    
    return {
      total: allNodes.length,
      completed,
      percentage: Math.round((completed / allNodes.length) * 100) || 0,
    };
  }, [tree.nodes, progress]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div>
            <h3 className="font-semibold">{tree.title}</h3>
            <p className="text-sm text-muted-foreground">{tree.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.percentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} / {stats.total} topics
            </p>
          </div>
        </div>

        {/* Tree Visualization */}
        <div className="relative pl-2">
          {/* Vertical guide line */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-border via-border to-transparent" />
          
          {/* Nodes */}
          <div className="space-y-1">
            {tree.nodes.map(node => renderNode(node, 0))}
          </div>
        </div>

        {/* Node Detail Panel */}
        <RoadmapNodeDetail
          node={selectedNode}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          isCompleted={selectedNode ? progress[selectedNode.id]?.completed || false : false}
          onComplete={() => selectedNode && handleComplete(selectedNode.id)}
        />
      </div>
    </TooltipProvider>
  );
};

export default RoadmapTree;
