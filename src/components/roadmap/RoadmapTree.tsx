import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import RoadmapTreeNode from "./RoadmapTreeNode";
import RoadmapNodeDetail from "./RoadmapNodeDetail";
import RoadmapToolbar from "./RoadmapToolbar";
import type { RoadmapTree as TreeType, RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface RoadmapTreeProps {
  tree: TreeType;
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeComplete: (nodeId: string) => void;
  onNodeInProgress?: (nodeId: string) => void;
}

// Flatten tree nodes helper
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

// Find next recommended node (first incomplete node on the main path)
const findNextRecommendedNode = (
  nodes: NodeType[],
  progress: Record<string, { completed: boolean; inProgress: boolean }>
): string | null => {
  for (const node of nodes) {
    if (!progress[node.id]?.completed) {
      return node.id;
    }
    if (node.children) {
      const childResult = findNextRecommendedNode(node.children, progress);
      if (childResult) return childResult;
    }
  }
  return null;
};

// Build progress path (all nodes leading to the next recommended)
const buildProgressPath = (
  nodes: NodeType[],
  targetId: string,
  progress: Record<string, { completed: boolean; inProgress: boolean }>
): Set<string> => {
  const path = new Set<string>();
  
  const traverse = (nodeList: NodeType[], ancestors: string[]): boolean => {
    for (const node of nodeList) {
      const currentPath = [...ancestors, node.id];
      
      // Include all completed nodes and nodes leading to target
      if (progress[node.id]?.completed) {
        currentPath.forEach(id => path.add(id));
      }
      
      if (node.id === targetId) {
        currentPath.forEach(id => path.add(id));
        return true;
      }
      
      if (node.children) {
        if (traverse(node.children, currentPath)) {
          return true;
        }
      }
    }
    return false;
  };
  
  traverse(nodes, []);
  return path;
};

const RoadmapTree: React.FC<RoadmapTreeProps> = ({
  tree,
  progress,
  onNodeComplete,
  onNodeInProgress,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Auto-expand first level on mount
  React.useEffect(() => {
    const firstLevelIds = tree.nodes.map(n => n.id);
    setExpandedNodes(new Set(firstLevelIds));
  }, [tree.id]);

  // Calculate all flattened nodes
  const allNodes = useMemo(() => flattenNodes(tree.nodes), [tree.nodes]);

  // Find next recommended node and build progress path
  const { nextRecommendedId, progressPath } = useMemo(() => {
    const nextId = findNextRecommendedNode(tree.nodes, progress);
    const path = nextId ? buildProgressPath(tree.nodes, nextId, progress) : new Set<string>();
    return { nextRecommendedId: nextId, progressPath: path };
  }, [tree.nodes, progress]);

  // Filter nodes based on search and filters
  const { filteredNodeIds, matchCount } = useMemo(() => {
    if (!searchQuery && difficultyFilter === "all" && statusFilter === "all") {
      return { filteredNodeIds: new Set(allNodes.map(n => n.id)), matchCount: allNodes.length };
    }

    const matchingIds = new Set<string>();
    
    allNodes.forEach(node => {
      const matchesSearch = !searchQuery || 
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === "all" || node.difficulty === difficultyFilter;
      
      const nodeProgress = progress[node.id];
      let matchesStatus = true;
      if (statusFilter === "completed") matchesStatus = nodeProgress?.completed || false;
      else if (statusFilter === "in-progress") matchesStatus = nodeProgress?.inProgress || false;
      else if (statusFilter === "not-started") matchesStatus = !nodeProgress?.completed && !nodeProgress?.inProgress;
      
      if (matchesSearch && matchesDifficulty && matchesStatus) {
        matchingIds.add(node.id);
      }
    });

    return { filteredNodeIds: matchingIds, matchCount: matchingIds.size };
  }, [allNodes, searchQuery, difficultyFilter, statusFilter, progress]);

  // Auto-expand to show matching nodes
  React.useEffect(() => {
    if (searchQuery || difficultyFilter !== "all" || statusFilter !== "all") {
      // Find parent nodes that need to be expanded to show matches
      const nodesToExpand = new Set<string>();
      
      const findParents = (nodes: NodeType[], parents: string[] = []) => {
        nodes.forEach(node => {
          if (filteredNodeIds.has(node.id)) {
            parents.forEach(p => nodesToExpand.add(p));
          }
          if (node.children) {
            findParents(node.children, [...parents, node.id]);
          }
        });
      };
      
      findParents(tree.nodes);
      setExpandedNodes(prev => new Set([...prev, ...nodesToExpand]));
    }
  }, [searchQuery, difficultyFilter, statusFilter, filteredNodeIds, tree.nodes]);

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

  // Check if node should be visible based on filters
  const isNodeVisible = useCallback((node: NodeType): boolean => {
    if (!searchQuery && difficultyFilter === "all" && statusFilter === "all") return true;
    
    // Node is visible if it matches OR any of its descendants match
    if (filteredNodeIds.has(node.id)) return true;
    
    if (node.children) {
      return node.children.some(child => isNodeVisible(child));
    }
    
    return false;
  }, [filteredNodeIds, searchQuery, difficultyFilter, statusFilter]);

  // Render tree recursively
  const renderNode = useCallback((node: NodeType, depth: number = 0, isLastChild: boolean = false): React.ReactNode => {
    if (!isNodeVisible(node)) return null;

    const isExpanded = expandedNodes.has(node.id);
    const nodeProgress = progress[node.id] || { completed: false, inProgress: false };
    const isOnProgressPath = progressPath.has(node.id);
    const isHighlighted = filteredNodeIds.has(node.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all");
    
    const visibleChildren = node.children?.filter(child => isNodeVisible(child)) || [];
    
    return (
      <div key={node.id} className="relative">
        <RoadmapTreeNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isCompleted={nodeProgress.completed}
          isInProgress={nodeProgress.inProgress}
          isOnProgressPath={isOnProgressPath && node.id === nextRecommendedId}
          isHighlighted={Boolean(isHighlighted)}
          hasLockedPrerequisites={false}
          onToggle={() => toggleExpand(node.id)}
          onClick={() => handleNodeClick(node)}
          onComplete={() => handleComplete(node.id)}
        />
        
        <AnimatePresence>
          {isExpanded && visibleChildren.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden relative"
            >
              {/* Vertical continuation line for children */}
              <div 
                className="absolute w-0.5 bg-border"
                style={{
                  left: depth * 24 + 12,
                  top: 0,
                  bottom: 20,
                }}
              />
              {visibleChildren.map((child, index) => 
                renderNode(child, depth + 1, index === visibleChildren.length - 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, isNodeVisible]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = allNodes.filter(n => progress[n.id]?.completed).length;
    
    return {
      total: allNodes.length,
      completed,
      percentage: Math.round((completed / allNodes.length) * 100) || 0,
    };
  }, [allNodes, progress]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
          <div className="flex items-center justify-between">
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
          <Progress value={stats.percentage} className="h-2" />
        </div>

        {/* Search & Filter Toolbar */}
        <RoadmapToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          matchCount={matchCount}
          totalCount={allNodes.length}
        />

        {/* Tree Visualization */}
        <div className="relative pl-2">
          {/* Nodes */}
          <div className="space-y-1">
            {tree.nodes.map((node, index) => renderNode(node, 0, index === tree.nodes.length - 1))}
          </div>
        </div>

        {/* No Results */}
        {matchCount === 0 && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all") && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No topics found matching your filters.</p>
            <button 
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("all");
                setStatusFilter("all");
              }}
              className="text-primary hover:underline mt-2"
            >
              Clear filters
            </button>
          </div>
        )}

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
