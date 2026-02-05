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
  Minimize2,
  LayoutGrid,
  List,
  RotateCcw,
  Undo2,
  Share2,
  FolderOpen,
  Navigation,
  ChevronDown,
  Check,
  ArrowUp,
} from "lucide-react";
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import RoadmapNode from "./RoadmapNode";
import DraggableNode from "./DraggableNode";
import RoadmapNodeDetail from "./RoadmapNodeDetail";
import RoadmapToolbar from "./RoadmapToolbar";
import RoadmapMiniMap from "./RoadmapMiniMap";
import RoadmapSectionContainer from "./RoadmapSectionContainer";
import RoadmapCertificate from "./RoadmapCertificate";
import RoadmapSectionHeader from "./RoadmapSectionHeader";
import RoadmapLegend from "./RoadmapLegend";
import HorizontalBranch from "./HorizontalBranch";
import SharePathDialog from "./SharePathDialog";
import SavedPathsManager from "./SavedPathsManager";
import PathComparisonDialog from "./PathComparisonDialog";
import MergePathsDialog from "./MergePathsDialog";
import PathHistoryPanel from "./PathHistoryPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRoadmapConfetti } from "@/hooks/useRoadmapConfetti";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapNodeOrder } from "@/hooks/useRoadmapNodeOrder";
import { useSavedPaths } from "@/hooks/useSavedPaths";
import { useImportPathFromURL } from "@/hooks/useImportPathFromURL";
import { useRoadmapNotes } from "@/hooks/useRoadmapNotes";
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
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('roadmap-compact-mode');
    return saved === 'true';
  });
  
  // Persist compact mode preference
  useEffect(() => {
    localStorage.setItem('roadmap-compact-mode', String(isCompactMode));
  }, [isCompactMode]);
  const treeRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { celebrateTopic, celebrateSection, trackProgress, resetCelebrations } = useRoadmapConfetti();
  const { customOrders, hasCustomOrder, isSaving, canUndo, saveOrder, resetToDefault, getOrderedNodes, undoLastAction, importOrders } = useRoadmapNodeOrder(tree.id);
  const { 
    savedPaths, 
    activePath, 
    isSaving: isSavingPath, 
    savePath, 
    activatePath, 
    deletePath, 
    updatePath,
    duplicatePath,
    mergePaths,
    canUndoMerge,
    canRedoMerge,
    undoMerge,
    redoMerge,
    operationHistory,
    clearHistory,
  } = useSavedPaths(tree.id);
  const { 
    getNoteForNode, 
    hasNote,
    saveNote, 
    deleteNote, 
    isSaving: isSavingNote, 
    isDeleting: isDeletingNote 
  } = useRoadmapNotes(tree.id);
  const prevProgressRef = useRef<Record<string, { completed: boolean; inProgress: boolean }>>({});
  const prevSectionStatsRef = useRef<Record<string, number>>({});
  
  // URL import handler
  const handleImportFromURL = useCallback(async (orders: Record<string, string[]>) => {
    await importOrders(orders);
    setLocalNodeOrder({});
  }, [importOrders]);
  
  // Auto-import from URL parameter
  useImportPathFromURL(tree.id, handleImportFromURL);
  
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

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Jump to section handler
  const handleJumpToSection = useCallback((sectionId: string) => {
    // Expand the section if collapsed
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.delete(sectionId);
      saveCollapsedSections(tree.id, next);
      return next;
    });
    
    // Scroll to section after a short delay
    setTimeout(() => {
      const sectionElement = sectionRefs.current.get(sectionId);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
        // Brief highlight effect
        sectionElement.classList.add("ring-2", "ring-primary", "ring-offset-4", "rounded-2xl");
        setTimeout(() => {
          sectionElement.classList.remove("ring-2", "ring-primary", "ring-offset-4", "rounded-2xl");
        }, 2000);
      }
    }, 100);
  }, [tree.id]);

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
          hasNote={hasNote(node.id)}
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
  }, [expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, isNodeVisible, getChildProgress, hasNote]);

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
      <motion.div 
        key={node.id}
        ref={(el) => {
          if (el) sectionRefs.current.set(node.id, el);
        }}
        initial={{ opacity: 0, y: isCompactMode ? 10 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: phaseIndex * (isCompactMode ? 0.05 : 0.1) }}
        className={cn("scroll-mt-24", isCompactMode ? "mb-3" : "mb-6")}
      >
        {/* Section Header */}
        <RoadmapSectionHeader
          phase={phaseIndex + 1}
          title={node.title}
          description={node.description}
          completed={sectionStats.completed}
          total={sectionStats.total}
          isCollapsed={isCollapsed}
          isCompact={isCompactMode}
          onToggle={() => toggleSection(node.id)}
        />
        
        {/* Section Content - Enhanced Container */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <RoadmapSectionContainer isExpanded={!isCollapsed} sectionIndex={phaseIndex} isCompact={isCompactMode}>
              {/* Section main node */}
              <RoadmapNode
                node={node}
                depth={0}
                isExpanded={expandedNodes.has(node.id)}
                isCompleted={progress[node.id]?.completed || false}
                isInProgress={progress[node.id]?.inProgress || false}
                isOnProgressPath={progressPath.has(node.id) && node.id === nextRecommendedId}
                isHighlighted={Boolean(filteredNodeIds.has(node.id) && (searchQuery || difficultyFilter !== "all" || statusFilter !== "all"))}
                hasNote={hasNote(node.id)}
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
                    className="overflow-hidden relative mt-3 pt-3 border-t border-border/30"
                  >
                    {/* Vertical continuation line for children */}
                    <div 
                      className="absolute w-0.5 rounded-full bg-gradient-to-b from-border via-border/60 to-transparent"
                      style={{
                        left: 20,
                        top: 12,
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
                              hasNote={hasNote(child.id)}
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
            </RoadmapSectionContainer>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [collapsedSections, getSectionStats, isNodeVisible, renderNode, toggleSection, expandedNodes, progress, progressPath, nextRecommendedId, filteredNodeIds, searchQuery, difficultyFilter, statusFilter, toggleExpand, handleNodeClick, handleComplete, getChildProgress, isDragEnabled, user, sensors, handleDragEnd, getDisplayNodes, isCompactMode, hasNote]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex gap-4 lg:gap-6", isCompactMode && "gap-2 lg:gap-4")}>
        {/* Main Content */}
        <div className={cn("flex-1 min-w-0", isCompactMode ? "space-y-4" : "space-y-8")} ref={treeRef}>
          {/* Compact Progress Header Card - Enhanced */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative overflow-hidden rounded-2xl border-2",
              "bg-card/95 backdrop-blur-xl",
              "shadow-lg dark:shadow-xl",
              stats.percentage === 100 && "border-emerald-500/40"
            )}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            <div className={cn("relative", isCompactMode ? "p-3 sm:p-4 space-y-3" : "p-5 sm:p-6 space-y-5")}>
              {/* Title Row with Progress Circle */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  {/* Icon Badge */}
                  <div className={cn(
                    "rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0",
                    `bg-gradient-to-br ${tree.color}`,
                    isCompactMode ? "h-10 w-10" : "h-12 w-12 sm:h-14 sm:w-14"
                  )}>
                    {(() => {
                      const IconComponent = roadmapIcons[tree.icon] || Layout;
                      return <IconComponent className={cn("text-white drop-shadow-sm", isCompactMode ? "h-5 w-5" : "h-6 w-6 sm:h-7 sm:w-7")} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h3 className={cn("font-bold truncate", isCompactMode ? "text-base" : "text-lg sm:text-xl")}>{tree.title}</h3>
                    {!isCompactMode && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{tree.description}</p>
                    )}
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                  <svg className={cn("-rotate-90", isCompactMode ? "h-12 w-12" : "h-14 w-14 sm:h-16 sm:w-16")}>
                    <circle
                      cx="50%" cy="50%" r="42%"
                      className="fill-none stroke-muted/40 stroke-[4]"
                    />
                    <motion.circle
                      cx="50%" cy="50%" r="42%"
                      className="fill-none stroke-[4]"
                      stroke={stats.percentage === 100 ? "#22c55e" : "hsl(var(--primary))"}
                      strokeLinecap="round"
                      strokeDasharray={176}
                      initial={{ strokeDashoffset: 176 }}
                      animate={{ strokeDashoffset: 176 - (176 * stats.percentage) / 100 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn(
                      "font-bold",
                      isCompactMode ? "text-sm" : "text-base sm:text-lg",
                      stats.percentage === 100 && "text-emerald-500"
                    )}>{stats.percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid - Clean 4-column (hidden in compact mode) */}
              {!isCompactMode && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { icon: Trophy, label: "Done", value: stats.completed, color: "emerald" },
                    { icon: Target, label: "Left", value: stats.total - stats.completed, color: "primary" },
                    { icon: Clock, label: "Est.", value: `${Math.ceil((stats.total - stats.completed) * 0.5)}w`, color: "amber" },
                    { icon: TrendingUp, label: "Total", value: stats.total, color: "violet" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className={cn(
                        "relative flex flex-col items-center p-2 sm:p-3 rounded-xl text-center",
                        "bg-muted/30 dark:bg-muted/20 border border-border/50",
                        "transition-colors hover:bg-muted/50"
                      )}
                    >
                      <stat.icon className={cn(
                        "h-4 w-4 sm:h-5 sm:w-5 mb-1",
                        stat.color === "emerald" && "text-emerald-500",
                        stat.color === "primary" && "text-primary",
                        stat.color === "amber" && "text-amber-500",
                        stat.color === "violet" && "text-violet-500"
                      )} />
                      <span className={cn(
                        "text-base sm:text-lg font-bold",
                        stat.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                        stat.color === "primary" && "text-primary",
                        stat.color === "amber" && "text-amber-600 dark:text-amber-400",
                        stat.color === "violet" && "text-violet-600 dark:text-violet-400"
                      )}>{stat.value}</span>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">{stat.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Compact stats row for compact mode */}
              {isCompactMode && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.completed}</span> done
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-primary">{stats.total - stats.completed}</span> left
                    </span>
                  </div>
                  <RoadmapCertificate
                    roadmapTitle={tree.title}
                    roadmapIcon={tree.icon === "Layout" ? "📐" : tree.icon === "Server" ? "🖥️" : tree.icon === "Layers" ? "📚" : "🎯"}
                    completedCount={stats.completed}
                    totalCount={stats.total}
                    percentage={stats.percentage}
                    userName={userName}
                    trigger={
                      <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <Award className="h-3 w-3" />
                        Certificate
                      </button>
                    }
                  />
                </div>
              )}

              {/* Progress Bar + Certificate */}
              {!isCompactMode && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-medium">Progress</span>
                    <div className="flex items-center gap-3">
                      <span>{stats.completed}/{stats.total} topics</span>
                      <RoadmapCertificate
                        roadmapTitle={tree.title}
                        roadmapIcon={tree.icon === "Layout" ? "📐" : tree.icon === "Server" ? "🖥️" : tree.icon === "Layers" ? "📚" : "🎯"}
                        completedCount={stats.completed}
                        totalCount={stats.total}
                        percentage={stats.percentage}
                        userName={userName}
                        trigger={
                          <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            <Award className="h-3.5 w-3.5" />
                            Certificate
                          </button>
                        }
                      />
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                    <motion.div 
                      className={cn(
                        "h-full rounded-full",
                        stats.percentage === 100 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500" 
                          : "bg-gradient-to-r from-primary via-primary to-primary/80"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Next Step Hint - Compact (hidden in compact mode) */}
              {nextRecommendedId && stats.percentage < 100 && !isCompactMode && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Next recommended</p>
                    <p className="text-sm font-semibold text-primary truncate">
                      {allNodes.find(n => n.id === nextRecommendedId)?.title}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Collapsible Legend - hidden in compact mode */}
          {!isCompactMode && <RoadmapLegend />}

          {/* Unified Controls Bar - Refined Organization */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="sticky top-0 z-20 rounded-2xl bg-background/98 backdrop-blur-xl border-2 border-border/60 shadow-lg"
          >
            {/* Main controls row */}
            <div className="p-3 sm:p-4">
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                {/* Search & Filters */}
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
                
                {/* View Controls - Better Grouped */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Layout Mode Toggle - Pill Style */}
                  <div className="flex items-center p-0.5 rounded-lg bg-muted/70 border border-border/50">
                    <button
                      onClick={() => setLayoutMode('vertical')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                        layoutMode === 'vertical' 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">List</span>
                    </button>
                    <button
                      onClick={() => setLayoutMode('horizontal')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                        layoutMode === 'horizontal' 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Cards view"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-5 bg-border/60" />

                  {/* View Mode Controls */}
                  <div className="flex items-center gap-1">
                    {/* Compact Mode Toggle */}
                    <button
                      onClick={() => setIsCompactMode(!isCompactMode)}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                        isCompactMode 
                          ? "bg-primary/15 text-primary border border-primary/30" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                      title={isCompactMode ? "Switch to normal view" : "Switch to compact view"}
                    >
                      <Minimize2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{isCompactMode ? "Normal" : "Compact"}</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px h-5 bg-border/60" />

                  {/* Drag Reorder Toggle */}
                  <button
                    onClick={() => setIsDragEnabled(!isDragEnabled)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
                      isDragEnabled 
                        ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                    title={isDragEnabled ? "Done reordering" : "Reorder topics"}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isDragEnabled ? "Done" : "Reorder"}</span>
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

              {/* Saved Paths Manager */}
              {user && (
                <SavedPathsManager
                  savedPaths={savedPaths}
                  activePath={activePath}
                  currentOrders={customOrders}
                  hasCustomOrder={hasCustomOrder}
                  isSaving={isSavingPath}
                  onSavePath={savePath}
                  onActivatePath={async (pathId) => {
                    const orders = await activatePath(pathId);
                    if (orders) {
                      await importOrders(orders);
                      setLocalNodeOrder({});
                    }
                    return orders;
                  }}
                  onDeletePath={deletePath}
                  onUpdatePath={updatePath}
                  onDuplicatePath={duplicatePath}
                />
              )}

              {/* Compare Paths Button */}
              {user && savedPaths.length >= 2 && (
                <PathComparisonDialog savedPaths={savedPaths} />
              )}

              {/* Merge Paths Button */}
              {user && savedPaths.length >= 2 && (
                <MergePathsDialog 
                  savedPaths={savedPaths}
                  roadmapId={tree.id}
                  roadmapTitle={tree.title}
                  onMerge={mergePaths}
                  canUndo={canUndoMerge}
                  canRedo={canRedoMerge}
                  onUndo={undoMerge}
                  onRedo={redoMerge}
                />
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

              {/* Path History Panel */}
              {user && (
                <PathHistoryPanel
                  operations={operationHistory}
                  onClear={clearHistory}
                />
              )}

              {/* Quick Jump Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    "bg-muted/50 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted"
                  )}>
                    <Navigation className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Jump to</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto bg-popover z-50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Quick Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tree.nodes.map((node, index) => {
                    const sectionStats = getSectionStats(node);
                    const percentage = Math.round((sectionStats.completed / sectionStats.total) * 100) || 0;
                    const isComplete = percentage === 100;
                    
                    return (
                      <DropdownMenuItem 
                        key={node.id}
                        onClick={() => handleJumpToSection(node.id)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className={cn(
                          "flex-shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                          isComplete 
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            isComplete && "text-emerald-600 dark:text-emerald-400"
                          )}>
                            {node.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {sectionStats.completed}/{sectionStats.total} topics • {percentage}%
                          </p>
                        </div>
                        <div className="flex-shrink-0 w-10">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                isComplete ? "bg-emerald-500" : "bg-primary"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

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
            </div>
          </motion.div>

          {/* Tree Visualization - Layout Mode Dependent */}
          <div className="relative py-4">
            {/* Subtle dot pattern background for visual depth */}
            <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none">
              <div className="h-full w-full" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
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
                            {/* Main node as card */}
                            <HorizontalBranch
                              nodes={[node]}
                              progress={progress}
                              onNodeClick={handleNodeClick}
                              onNodeComplete={handleComplete}
                              hasNoteCheck={hasNote}
                            />
                            
                            {/* Children as responsive grid cards */}
                            {node.children && node.children.length > 0 && (
                              <HorizontalBranch
                                nodes={node.children}
                                progress={progress}
                                onNodeClick={handleNodeClick}
                                onNodeComplete={handleComplete}
                                title="Topics"
                                hasNoteCheck={hasNote}
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
            initialNote={selectedNode ? getNoteForNode(selectedNode.id) : ""}
            onSaveNote={user && selectedNode ? (note) => saveNote({ nodeId: selectedNode.id, note }) : undefined}
            onDeleteNote={user && selectedNode ? () => deleteNote(selectedNode.id) : undefined}
            isSavingNote={isSavingNote}
            isDeletingNote={isDeletingNote}
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

      {/* Floating Buttons Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
        {/* Back to Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={() => {
                treeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "flex items-center justify-center h-12 w-12 rounded-full",
                "bg-muted/90 backdrop-blur-sm text-foreground shadow-lg",
                "hover:bg-muted hover:shadow-xl hover:scale-105 transition-all duration-200",
                "border border-border"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Back to top"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Jump to Next Button */}
        {nextRecommendedId && stats.percentage < 100 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => handleMiniMapNodeClick(nextRecommendedId)}
            className={cn(
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
      </div>
    </TooltipProvider>
  );
};

export default RoadmapTree;
