import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Clock, 
  Sparkles,
  TrendingUp,
  Layout,
  Server,
  Layers,
  Container,
  Smartphone,
  Brain,
  BarChart3,
  Flame,
  Award,
  ChevronUp,
  Zap,
  GripVertical,
  LayoutGrid,
  List,
  RotateCcw,
  Undo2,
  Share2,
} from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import RoadmapNode from "./RoadmapNode";
import DraggableNode from "./DraggableNode";
import RoadmapNodeDetail from "./RoadmapNodeDetail";
import RoadmapToolbar from "./RoadmapToolbar";
import RoadmapMiniMap from "./RoadmapMiniMap";
import RoadmapCertificate from "./RoadmapCertificate";
import RoadmapSectionHeader from "./RoadmapSectionHeader";
import RoadmapLegend from "./RoadmapLegend";
import HorizontalBranch from "./HorizontalBranch";
import SharePathDialog from "./SharePathDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoadmapConfetti } from "@/hooks/useRoadmapConfetti";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapNodeOrder } from "@/hooks/useRoadmapNodeOrder";
import type { RoadmapTree as TreeType, RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

// Icon mapping for roadmap types
const roadmapIcons: Record<string, React.ElementType> = {
  Layout, Server, Layers, Container, Smartphone, Brain, BarChart3,
};

interface RoadmapTreeProps {
  tree: TreeType;
  progress: Record<string, { completed: boolean; inProgress: boolean }>;
  onNodeComplete: (nodeId: string) => void;
  onNodeInProgress?: (nodeId: string) => void;
  userName?: string;
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

// LocalStorage key for collapsed sections
const getCollapsedSectionsKey = (treeId: string) => `roadmap-collapsed-sections-${treeId}`;

// Load collapsed sections from localStorage
const loadCollapsedSections = (treeId: string): Set<string> => {
  try {
    const stored = localStorage.getItem(getCollapsedSectionsKey(treeId));
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (e) {
    console.error("Failed to load collapsed sections:", e);
  }
  return new Set();
};

// Save collapsed sections to localStorage
const saveCollapsedSections = (treeId: string, sections: Set<string>) => {
  try {
    localStorage.setItem(getCollapsedSectionsKey(treeId), JSON.stringify([...sections]));
  } catch (e) {
    console.error("Failed to save collapsed sections:", e);
  }
};

const RoadmapTree: React.FC<RoadmapTreeProps> = ({
  tree,
  progress,
  onNodeComplete,
  onNodeInProgress,
  userName = "Learner",
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => loadCollapsedSections(tree.id));
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [localNodeOrder, setLocalNodeOrder] = useState<Record<string, NodeType[]>>({});
  const treeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { celebrateTopic, celebrateSection, trackProgress, resetCelebrations } = useRoadmapConfetti();
  const { customOrders, hasCustomOrder, isSaving, canUndo, saveOrder, resetToDefault, getOrderedNodes, undoLastAction, importOrders } = useRoadmapNodeOrder(tree.id);
  const prevProgressRef = useRef<Record<string, { completed: boolean; inProgress: boolean }>>({});
  const prevSectionStatsRef = useRef<Record<string, number>>({});
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent, sectionId: string, nodes: NodeType[]) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = nodes.findIndex(n => n.id === active.id);
    const newIndex = nodes.findIndex(n => n.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const reorderedNodes = arrayMove(nodes, oldIndex, newIndex);
    
    // Update local state immediately for responsive UI
    setLocalNodeOrder(prev => ({
      ...prev,
      [sectionId]: reorderedNodes
    }));
    
    // Persist to database
    const nodeIds = reorderedNodes.map(n => n.id);
    saveOrder(sectionId, nodeIds);
    
    toast({
      title: "Order saved",
      description: "Your custom learning path has been saved.",
    });
  }, [saveOrder]);

  // Reset order handler
  const handleResetOrder = useCallback(async () => {
    await resetToDefault();
    setLocalNodeOrder({});
    toast({
      title: "Order reset",
      description: "Topics are now in default order.",
    });
  }, [resetToDefault]);

  // Get nodes with custom order applied
  const getDisplayNodes = useCallback((sectionId: string, nodes: NodeType[]): NodeType[] => {
    // First check local state (for immediate UI updates)
    if (localNodeOrder[sectionId]) {
      return localNodeOrder[sectionId];
    }
    // Then check database order
    return getOrderedNodes(sectionId, nodes);
  }, [localNodeOrder, getOrderedNodes]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Toggle section collapse with localStorage persistence
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      saveCollapsedSections(tree.id, next);
      return next;
    });
  }, [tree.id]);

  // Load collapsed sections when tree changes
  useEffect(() => {
    setCollapsedSections(loadCollapsedSections(tree.id));
  }, [tree.id]);

  // Auto-expand first level on mount and reset confetti celebrations
  useEffect(() => {
    const firstLevelIds = tree.nodes.map(n => n.id);
    setExpandedNodes(new Set(firstLevelIds));
    resetCelebrations();
    // Initialize section stats
    const initialStats: Record<string, number> = {};
    tree.nodes.forEach(node => {
      const nodeList = flattenNodes([node]);
      const completed = nodeList.filter(n => progress[n.id]?.completed).length;
      initialStats[node.id] = Math.round((completed / nodeList.length) * 100) || 0;
    });
    prevSectionStatsRef.current = initialStats;
  }, [tree.id, resetCelebrations]);

  // Calculate section percentage
  const getSectionPercentage = useCallback((node: NodeType): number => {
    const nodeList = flattenNodes([node]);
    const completed = nodeList.filter(n => progress[n.id]?.completed).length;
    return Math.round((completed / nodeList.length) * 100) || 0;
  }, [progress]);

  // Track progress changes and trigger confetti (including section milestones)
  useEffect(() => {
    const prevProgress = prevProgressRef.current;
    const allNodesList = flattenNodes(tree.nodes);
    
    // Check if any node was newly completed
    let wasCompleted = false;
    for (const node of allNodesList) {
      const wasCompletedBefore = prevProgress[node.id]?.completed;
      const isCompletedNow = progress[node.id]?.completed;
      if (!wasCompletedBefore && isCompletedNow) {
        wasCompleted = true;
        break;
      }
    }

    // Calculate current percentage for overall roadmap
    const completedCount = allNodesList.filter(n => progress[n.id]?.completed).length;
    const currentPercentage = Math.round((completedCount / allNodesList.length) * 100) || 0;

    // Check section milestones (25%, 50%, 75%, 100%)
    const sectionMilestones = [25, 50, 75, 100];
    let celebratedSectionMilestone = false;
    let shownNearMilestoneToast = false;

    if (wasCompleted) {
      for (const sectionNode of tree.nodes) {
        const sectionNodes = flattenNodes([sectionNode]);
        const sectionTotal = sectionNodes.length;
        const sectionCompleted = sectionNodes.filter(n => progress[n.id]?.completed).length;
        const prevSectionPercentage = prevSectionStatsRef.current[sectionNode.id] || 0;
        const newSectionPercentage = Math.round((sectionCompleted / sectionTotal) * 100) || 0;
        
        // Check if we hit a milestone
        for (const milestone of sectionMilestones) {
          if (prevSectionPercentage < milestone && newSectionPercentage >= milestone) {
            // Celebrate section milestone!
            celebrateSection(milestone);
            celebratedSectionMilestone = true;
            toast({
              title: `🎉 ${milestone}% Complete!`,
              description: `You've reached ${milestone}% in "${sectionNode.title}"!`,
            });
            break;
          }
        }
        
        // Check if we're close to a milestone (1-3 topics away)
        if (!celebratedSectionMilestone && !shownNearMilestoneToast) {
          for (const milestone of sectionMilestones) {
            if (newSectionPercentage < milestone) {
              const topicsNeededForMilestone = Math.ceil((milestone / 100) * sectionTotal);
              const topicsAway = topicsNeededForMilestone - sectionCompleted;
              
              if (topicsAway >= 1 && topicsAway <= 3) {
                toast({
                  title: `🔥 Almost there!`,
                  description: `${topicsAway} topic${topicsAway > 1 ? 's' : ''} away from ${milestone}% in "${sectionNode.title}"!`,
                });
                shownNearMilestoneToast = true;
              }
              break; // Only check the next milestone
            }
          }
        }
        
        // Update section stats
        prevSectionStatsRef.current[sectionNode.id] = newSectionPercentage;
        
        if (celebratedSectionMilestone) break;
      }
    }

    // If a node was completed but no section milestone was hit, check overall or individual
    if (wasCompleted && !celebratedSectionMilestone) {
      const celebrated = trackProgress(currentPercentage);
      if (!celebrated) {
        // Small celebration for individual topic
        celebrateTopic();
      }
    }

    // Update ref
    prevProgressRef.current = progress;
  }, [progress, tree.nodes, trackProgress, celebrateTopic, celebrateSection, getSectionPercentage]);

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

  // Handle mini-map node click - scroll to and expand node
  const handleMiniMapNodeClick = useCallback((nodeId: string) => {
    // Find node and its ancestors to expand
    const findAncestors = (nodes: NodeType[], targetId: string, ancestors: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return ancestors;
        }
        if (node.children) {
          const result = findAncestors(node.children, targetId, [...ancestors, node.id]);
          if (result) return result;
        }
      }
      return null;
    };

    const ancestors = findAncestors(tree.nodes, nodeId, []);
    if (ancestors) {
      // Expand all ancestors
      setExpandedNodes(prev => {
        const next = new Set(prev);
        ancestors.forEach(id => next.add(id));
        next.add(nodeId);
        return next;
      });

      // Scroll to node after a short delay to allow expansion
      setTimeout(() => {
        const nodeElement = nodeRefs.current.get(nodeId);
        if (nodeElement) {
          nodeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight effect
          nodeElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            nodeElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 1500);
        }
      }, 100);
    }
  }, [tree.nodes]);

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

  // Calculate completed children for a node
  const getChildProgress = useCallback((node: NodeType): { completed: number; total: number } => {
    if (!node.children) return { completed: 0, total: 0 };
    let completed = 0;
    let total = 0;
    const countRecursive = (nodes: NodeType[]) => {
      for (const n of nodes) {
        total++;
        if (progress[n.id]?.completed) completed++;
        if (n.children) countRecursive(n.children);
      }
    };
    countRecursive(node.children);
    return { completed, total };
  }, [progress]);

  // Render tree recursively
  const renderNode = useCallback((node: NodeType, depth: number = 0, isLastChild: boolean = false): React.ReactNode => {
    if (!isNodeVisible(node)) return null;

    const isExpanded = expandedNodes.has(node.id);
    const nodeProgress = progress[node.id] || { completed: false, inProgress: false };
    const isOnProgressPath = progressPath.has(node.id);
    const isHighlighted = filteredNodeIds.has(node.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all");
    
    const visibleChildren = node.children?.filter(child => isNodeVisible(child)) || [];
    const childProgress = getChildProgress(node);
    
    return (
      <div 
        key={node.id} 
        className="relative"
        ref={(el) => {
          if (el) nodeRefs.current.set(node.id, el);
        }}
      >
        <RoadmapNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isCompleted={nodeProgress.completed}
          isInProgress={nodeProgress.inProgress}
          isOnProgressPath={isOnProgressPath && node.id === nextRecommendedId}
          isHighlighted={Boolean(isHighlighted)}
          completedChildren={childProgress.completed}
          totalChildren={childProgress.total}
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
                className="absolute w-0.5 bg-slate-300 dark:bg-slate-600"
                style={{
                  left: depth * 28 + 20,
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
  }, [expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, isNodeVisible, getChildProgress]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = allNodes.filter(n => progress[n.id]?.completed).length;
    
    return {
      total: allNodes.length,
      completed,
      percentage: Math.round((completed / allNodes.length) * 100) || 0,
    };
  }, [allNodes, progress]);

  // Calculate section stats for each primary node
  const getSectionStats = useCallback((node: NodeType): { completed: number; total: number } => {
    let completed = 0;
    let total = 1; // Include the section itself
    
    if (progress[node.id]?.completed) completed++;
    
    const countChildren = (nodes: NodeType[] | undefined) => {
      if (!nodes) return;
      for (const child of nodes) {
        total++;
        if (progress[child.id]?.completed) completed++;
        countChildren(child.children);
      }
    };
    
    countChildren(node.children);
    return { completed, total };
  }, [progress]);

  // Render section with header, collapsible content, and DnD support
  const renderSection = useCallback((node: NodeType, phaseIndex: number): React.ReactNode => {
    if (!isNodeVisible(node)) return null;
    
    const isCollapsed = collapsedSections.has(node.id);
    const sectionStats = getSectionStats(node);
    
    // Get children with custom ordering applied
    const orderedChildren = node.children 
      ? getDisplayNodes(node.id, node.children)
      : [];
    
    return (
      <div key={node.id} className="mb-4">
        {/* Section Header */}
        <RoadmapSectionHeader
          phase={phaseIndex + 1}
          title={node.title}
          description={node.description}
          completed={sectionStats.completed}
          total={sectionStats.total}
          isCollapsed={isCollapsed}
          onToggle={() => toggleSection(node.id)}
        />
        
        {/* Section Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-4 pl-2">
                {/* Section main node */}
                <RoadmapNode
                  node={node}
                  depth={0}
                  isExpanded={expandedNodes.has(node.id)}
                  isCompleted={progress[node.id]?.completed || false}
                  isInProgress={progress[node.id]?.inProgress || false}
                  isOnProgressPath={progressPath.has(node.id) && node.id === nextRecommendedId}
                  isHighlighted={Boolean(filteredNodeIds.has(node.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all"))}
                  completedChildren={getChildProgress(node).completed}
                  totalChildren={getChildProgress(node).total}
                  onToggle={() => toggleExpand(node.id)}
                  onClick={() => handleNodeClick(node)}
                  onComplete={() => handleComplete(node.id)}
                />
                
                {/* Children with DnD support when enabled */}
                <AnimatePresence>
                  {expandedNodes.has(node.id) && orderedChildren.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden relative"
                    >
                      {/* Vertical continuation line for children */}
                      <div 
                        className="absolute w-0.5 bg-slate-300 dark:bg-slate-600"
                        style={{
                          left: 20,
                          top: 0,
                          bottom: 20,
                        }}
                      />
                      
                      {isDragEnabled && user ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleDragEnd(event, node.id, orderedChildren)}
                        >
                          <SortableContext
                            items={orderedChildren.map(n => n.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {orderedChildren.map((child) => (
                              <DraggableNode
                                key={child.id}
                                node={child}
                                depth={1}
                                isExpanded={expandedNodes.has(child.id)}
                                isCompleted={progress[child.id]?.completed || false}
                                isInProgress={progress[child.id]?.inProgress || false}
                                isOnProgressPath={progressPath.has(child.id) && child.id === nextRecommendedId}
                                isHighlighted={Boolean(filteredNodeIds.has(child.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all"))}
                                completedChildren={getChildProgress(child).completed}
                                totalChildren={getChildProgress(child).total}
                                onToggle={() => toggleExpand(child.id)}
                                onClick={() => handleNodeClick(child)}
                                onComplete={() => handleComplete(child.id)}
                                isDragEnabled={isDragEnabled}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      ) : (
                        orderedChildren.map((child, index) => 
                          renderNode(child, 1, index === orderedChildren.length - 1)
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [collapsedSections, getSectionStats, isNodeVisible, renderNode, toggleSection, expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, getChildProgress, isDragEnabled, user, sensors, handleDragEnd, getDisplayNodes]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0" ref={treeRef}>
          {/* Enhanced Progress Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2",
              "bg-gradient-to-br from-card via-card to-muted/30"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>

            <div className="relative p-5 space-y-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Colorful Icon */}
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center shadow-lg",
                    `bg-gradient-to-br ${tree.color}`
                  )}>
                    {(() => {
                      const IconComponent = roadmapIcons[tree.icon] || Layout;
                      return <IconComponent className="h-7 w-7 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tree.title}</h3>
                    <p className="text-sm text-muted-foreground">{tree.description}</p>
                  </div>
                </div>

                {/* Progress Circle */}
                <div className="text-center">
                  <div className="relative">
                    <svg className="h-16 w-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        className="fill-none stroke-muted stroke-[4]"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        className="fill-none stroke-primary stroke-[4]"
                        strokeLinecap="round"
                        strokeDasharray={176}
                        initial={{ strokeDashoffset: 176 }}
                        animate={{ strokeDashoffset: 176 - (176 * stats.percentage) / 100 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{stats.percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Trophy className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold text-primary">{stats.total - stats.completed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      {Math.ceil((stats.total - stats.completed) * 0.5)}w
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Topics</p>
                    <p className="font-semibold text-violet-600 dark:text-violet-400">{stats.total}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar + Certificate Button */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Learning Progress</span>
                  <div className="flex items-center gap-3">
                    <span>{stats.completed} of {stats.total} topics mastered</span>
                    <RoadmapCertificate
                      roadmapTitle={tree.title}
                      roadmapIcon={tree.icon === "Layout" ? "📐" : tree.icon === "Server" ? "🖥️" : tree.icon === "Layers" ? "📚" : "🎯"}
                      completedCount={stats.completed}
                      totalCount={stats.total}
                      percentage={stats.percentage}
                      userName={userName}
                      trigger={
                        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <Award className="h-3.5 w-3.5" />
                          Certificate
                        </button>
                      }
                    />
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Next Step Hint */}
              {nextRecommendedId && stats.percentage < 100 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-sm">
                    <span className="text-muted-foreground">Next up: </span>
                    <span className="font-medium text-primary">
                      {allNodes.find(n => n.id === nextRecommendedId)?.title}
                    </span>
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Legend */}
          <RoadmapLegend />

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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
            
            {/* View Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout Mode Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
                <button
                  onClick={() => setLayoutMode('vertical')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    layoutMode === 'vertical' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setLayoutMode('horizontal')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                    layoutMode === 'horizontal' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
              </div>

              {/* Drag Reorder Toggle */}
              <button
                onClick={() => setIsDragEnabled(!isDragEnabled)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  isDragEnabled 
                    ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" 
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted"
                )}
              >
                <GripVertical className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isDragEnabled ? "Done Reordering" : "Reorder"}</span>
              </button>

              {/* Undo Button - Only visible in drag mode and when undo is available */}
              {isDragEnabled && canUndo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await undoLastAction();
                    setLocalNodeOrder({});
                    toast({
                      title: "Undone!",
                      description: "Your last reorder has been reversed.",
                    });
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 h-7 text-xs text-muted-foreground hover:text-primary"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
              )}

              {/* Reset to Default Order Button - Only visible in drag mode and when custom order exists */}
              {isDragEnabled && hasCustomOrder && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetOrder}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className={cn("h-3.5 w-3.5", isSaving && "animate-spin")} />
                  <span className="hidden sm:inline">Reset Order</span>
                </Button>
              )}

              {/* Share Path Button */}
              <SharePathDialog
                roadmapId={tree.id}
                roadmapTitle={tree.title}
                customOrders={customOrders}
                hasCustomOrder={hasCustomOrder}
                onImportOrder={async (orders) => {
                  await importOrders(orders);
                  setLocalNodeOrder({});
                }}
              />

              <span className="text-muted-foreground/30 hidden sm:inline">|</span>

              {/* Expand/Collapse All Sections */}
              <button
                onClick={() => setCollapsedSections(new Set())}
                className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
              >
                Expand All
              </button>
              <span className="text-muted-foreground/30">|</span>
              <button
                onClick={() => setCollapsedSections(new Set(tree.nodes.map(n => n.id)))}
                className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Tree Visualization - Layout Mode Dependent */}
          <div className="relative py-2">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
              <div className="h-full w-full" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            {layoutMode === 'horizontal' ? (
              /* Horizontal Card Layout */
              <div className="space-y-6 relative">
                {tree.nodes.map((node, index) => {
                  if (!isNodeVisible(node)) return null;
                  const isCollapsed = collapsedSections.has(node.id);
                  const sectionStats = getSectionStats(node);
                  
                  return (
                    <div key={node.id}>
                      <RoadmapSectionHeader
                        phase={index + 1}
                        title={node.title}
                        description={node.description}
                        completed={sectionStats.completed}
                        total={sectionStats.total}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleSection(node.id)}
                      />
                      
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            {/* Main node as horizontal card */}
                            <HorizontalBranch
                              nodes={[node]}
                              progress={progress}
                              onNodeClick={handleNodeClick}
                              onNodeComplete={handleComplete}
                            />
                            
                            {/* Children as horizontal scrollable cards */}
                            {node.children && node.children.length > 0 && (
                              <HorizontalBranch
                                nodes={node.children}
                                progress={progress}
                                onNodeClick={handleNodeClick}
                                onNodeComplete={handleComplete}
                                title="Topics"
                              />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Vertical List Layout */
              <div className="space-y-2 relative">
                {tree.nodes.map((node, index) => renderSection(node, index))}
              </div>
            )}
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

        {/* Mini Map - Hidden on mobile */}
        {!isMobile && (
          <div className="w-56 flex-shrink-0">
            <RoadmapMiniMap
              nodes={tree.nodes}
              progress={progress}
              nextRecommendedId={nextRecommendedId}
              expandedNodes={expandedNodes}
              onNodeClick={handleMiniMapNodeClick}
            />
          </div>
        )}
      </div>

      {/* Floating Jump to Next Button */}
      {nextRecommendedId && stats.percentage < 100 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => handleMiniMapNodeClick(nextRecommendedId)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "flex items-center gap-2 px-4 py-3 rounded-full",
            "bg-primary text-primary-foreground shadow-lg",
            "hover:shadow-xl hover:scale-105 transition-all duration-200",
            "border border-primary-foreground/20"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className="h-5 w-5" />
          <span className="font-medium text-sm">Jump to Next</span>
          <ChevronUp className="h-4 w-4 animate-bounce" />
        </motion.button>
      )}
    </TooltipProvider>
  );
};

export default RoadmapTree;
