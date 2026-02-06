import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map, ArrowRight, Clock, BookOpen, Users, Search, Filter, X, Timer,
  ArrowUpDown, Sprout, Flame, Diamond, TrendingUp, Sparkles, GitBranch,
  CheckCircle2, Lock, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { roadmapTrees, type RoadmapTree, type RoadmapTreeNode } from "@/data/roadmapTreesData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Helper to count total nodes in a tree
const countNodes = (nodes: RoadmapTreeNode[]): number => {
  return nodes.reduce((acc, node) => {
    const childCount = node.children ? countNodes(node.children) : 0;
    return acc + 1 + childCount;
  }, 0);
};

// Flatten all node IDs from a tree
const flattenNodeIds = (nodes: RoadmapTreeNode[]): string[] => {
  const ids: string[] = [];
  const processNode = (node: RoadmapTreeNode) => {
    ids.push(node.id);
    node.children?.forEach(processNode);
  };
  nodes.forEach(processNode);
  return ids;
};

// Helper to calculate estimated time from nodes (returns weeks for sorting)
const calculateEstimatedWeeks = (nodes: RoadmapTreeNode[]): number => {
  let totalWeeks = 0;
  
  const processNode = (node: RoadmapTreeNode) => {
    if (node.estimatedTime) {
      const match = node.estimatedTime.match(/(\d+)\s*(week|day|month)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.includes('week')) {
          totalWeeks += value;
        } else if (unit.includes('day')) {
          totalWeeks += value / 7;
        } else if (unit.includes('month')) {
          totalWeeks += value * 4;
        }
      }
    }
    node.children?.forEach(processNode);
  };
  
  nodes.forEach(processNode);
  return totalWeeks;
};

// Helper to format weeks to readable string
const formatEstimatedTime = (weeks: number): string => {
  if (weeks < 1) return "< 1 week";
  if (weeks < 4) return `${Math.round(weeks)} weeks`;
  const months = Math.round(weeks / 4);
  return `${months} ${months === 1 ? 'month' : 'months'}`;
};

// Calculate difficulty level based on roadmap content
const calculateDifficulty = (nodes: RoadmapTreeNode[]): 'beginner' | 'intermediate' | 'advanced' => {
  let hardCount = 0;
  let mediumCount = 0;
  let totalCount = 0;
  
  const processNode = (node: RoadmapTreeNode) => {
    totalCount++;
    if (node.difficulty === 'Hard') hardCount++;
    else if (node.difficulty === 'Medium') mediumCount++;
    node.children?.forEach(processNode);
  };
  
  nodes.forEach(processNode);
  
  const hardRatio = hardCount / totalCount;
  const mediumRatio = mediumCount / totalCount;
  
  if (hardRatio > 0.3) return 'advanced';
  if (mediumRatio > 0.4 || hardRatio > 0.15) return 'intermediate';
  return 'beginner';
};

// Difficulty configuration
const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    icon: Sprout,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  intermediate: {
    label: 'Intermediate',
    icon: Flame,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  advanced: {
    label: 'Advanced',
    icon: Diamond,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
};

// Popularity scores (simulated - in production this would come from analytics)
const popularityScores: Record<string, number> = {
  frontend: 95,
  backend: 88,
  fullstack: 92,
  devops: 75,
  'data-science': 82,
  'data-analyst': 70,
  android: 65,
  ios: 60,
  'react-native': 72,
};

// Prerequisite relationships
const roadmapPrerequisites: Record<string, { required: string[]; recommended: string[] }> = {
  frontend: { required: [], recommended: [] },
  backend: { required: [], recommended: ['frontend'] },
  fullstack: { required: ['frontend'], recommended: ['backend'] },
  devops: { required: [], recommended: ['backend'] },
  'data-science': { required: [], recommended: ['backend'] },
  'data-analyst': { required: [], recommended: [] },
  android: { required: [], recommended: ['frontend'] },
  ios: { required: [], recommended: ['frontend'] },
  'react-native': { required: ['frontend'], recommended: [] },
};

// Featured roadmaps (curated list)
const featuredRoadmapIds = ['frontend', 'fullstack', 'backend'];

// Category definitions for filtering
const categories = [
  { id: "all", label: "All Paths", color: "bg-primary" },
  { id: "frontend", label: "Frontend", color: "bg-cyan-500" },
  { id: "backend", label: "Backend", color: "bg-emerald-500" },
  { id: "fullstack", label: "Full Stack", color: "bg-purple-500" },
  { id: "devops", label: "DevOps", color: "bg-orange-500" },
  { id: "data", label: "Data", color: "bg-blue-500" },
  { id: "mobile", label: "Mobile", color: "bg-pink-500" },
];

// Map roadmap IDs to categories
const roadmapCategoryMap: Record<string, string> = {
  frontend: "frontend",
  backend: "backend",
  fullstack: "fullstack",
  devops: "devops",
  "data-science": "data",
  "data-analyst": "data",
  "android": "mobile",
  "ios": "mobile",
  "react-native": "mobile",
};

// Sorting options
type SortOption = 'name' | 'popularity' | 'duration-asc' | 'duration-desc';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'duration-asc', label: 'Duration (Shortest)' },
  { value: 'duration-desc', label: 'Duration (Longest)' },
];

// Hook to fetch all roadmap progress at once
const useAllRoadmapProgress = () => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setProgressData({});
        return;
      }

      const { data } = await supabase
        .from("user_topic_progress")
        .select("topic_id, completed, sheet_id")
        .eq("user_id", user.id)
        .like("sheet_id", "roadmap-tree-%")
        .eq("completed", true);

      if (data) {
        // Group completions by roadmap
        const roadmapCompletions: Record<string, Set<string>> = {};
        
        data.forEach((item) => {
          const roadmapId = item.sheet_id.replace("roadmap-tree-", "");
          if (!roadmapCompletions[roadmapId]) {
            roadmapCompletions[roadmapId] = new Set();
          }
          roadmapCompletions[roadmapId].add(item.topic_id);
        });

        // Calculate percentage for each roadmap
        const percentages: Record<string, number> = {};
        roadmapTrees.forEach((roadmap) => {
          const allNodeIds = flattenNodeIds(roadmap.nodes);
          const completedIds = roadmapCompletions[roadmap.id] || new Set();
          const completedCount = allNodeIds.filter(id => completedIds.has(id)).length;
          percentages[roadmap.id] = allNodeIds.length > 0 
            ? Math.round((completedCount / allNodeIds.length) * 100)
            : 0;
        });

        setProgressData(percentages);
      }
    };

    fetchProgress();
  }, [user]);

  return progressData;
};

// Prerequisite indicator component
const PrerequisiteIndicator = ({ 
  roadmapId, 
  userProgress 
}: { 
  roadmapId: string; 
  userProgress: Record<string, number>;
}) => {
  const prereqs = roadmapPrerequisites[roadmapId];
  if (!prereqs || (prereqs.required.length === 0 && prereqs.recommended.length === 0)) {
    return null;
  }

  const requiredComplete = prereqs.required.every(id => (userProgress[id] || 0) >= 50);
  const recommendedComplete = prereqs.recommended.every(id => (userProgress[id] || 0) >= 30);

  const getRoadmapTitle = (id: string) => {
    const roadmap = roadmapTrees.find(r => r.id === id);
    return roadmap?.title || id;
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
      {prereqs.required.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              requiredComplete 
                ? "bg-emerald-500/10 text-emerald-600" 
                : "bg-amber-500/10 text-amber-600"
            )}>
              {requiredComplete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              <span>{prereqs.required.length} Required</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium mb-1">Required Prerequisites:</p>
            <ul className="space-y-1">
              {prereqs.required.map(id => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  {(userProgress[id] || 0) >= 50 ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  {getRoadmapTitle(id)}
                  <span className="text-muted-foreground">({userProgress[id] || 0}%)</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
      
      {prereqs.recommended.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              recommendedComplete 
                ? "bg-blue-500/10 text-blue-600" 
                : "bg-muted text-muted-foreground"
            )}>
              <GitBranch className="h-3 w-3" />
              <span>{prereqs.recommended.length} Suggested</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium mb-1">Suggested Prerequisites:</p>
            <ul className="space-y-1">
              {prereqs.recommended.map(id => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  {(userProgress[id] || 0) >= 30 ? (
                    <CheckCircle2 className="h-3 w-3 text-blue-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  {getRoadmapTitle(id)}
                  <span className="text-muted-foreground">({userProgress[id] || 0}%)</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

// Individual roadmap card component
const RoadmapCard = ({ 
  roadmap, 
  estimatedWeeks, 
  isFeatured = false,
  userProgress = {},
  cardProgress = 0
}: { 
  roadmap: RoadmapTree; 
  estimatedWeeks: number;
  isFeatured?: boolean;
  userProgress?: Record<string, number>;
  cardProgress?: number;
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const totalTopics = countNodes(roadmap.nodes);
  const estimatedTime = formatEstimatedTime(estimatedWeeks);
  const difficulty = calculateDifficulty(roadmap.nodes);
  const diffConfig = difficultyConfig[difficulty];
  const DifficultyIcon = diffConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "group cursor-pointer overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full",
          isFeatured && "ring-2 ring-primary/20"
        )}
        onClick={() => navigate(`/research/roadmap/${roadmap.id}`)}
      >
        {/* Gradient header */}
        <div className={cn(
          "h-32 relative bg-gradient-to-br flex items-center justify-center",
          roadmap.color
        )}>
          <Map className="h-16 w-16 text-white/80" />
          
          {/* Featured badge */}
          {isFeatured && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground gap-1.5 shadow-lg">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            </div>
          )}
          
          {/* Top badges row */}
          <div className={cn(
            "absolute left-3 right-3 flex items-center justify-between",
            isFeatured ? "top-10" : "top-3"
          )}>
            {/* Estimated time badge */}
            <Badge variant="secondary" className="bg-black/40 text-white border-0 backdrop-blur-sm gap-1.5">
              <Timer className="h-3 w-3" />
              {estimatedTime}
            </Badge>
            
            {/* Difficulty badge */}
            <Badge 
              variant="secondary" 
              className={cn(
                "border backdrop-blur-sm gap-1.5",
                diffConfig.bgColor,
                diffConfig.color,
                diffConfig.borderColor
              )}
            >
              <DifficultyIcon className="h-3 w-3" />
              {diffConfig.label}
            </Badge>
          </div>
          
          {/* Progress overlay */}
          {user && cardProgress > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-foreground font-semibold">
                {cardProgress}% Complete
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center justify-between">
            {roadmap.title}
            <ArrowRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {roadmap.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{totalTopics} topics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{roadmap.nodes.length} sections</span>
            </div>
            {popularityScores[roadmap.id] && (
              <div className="flex items-center gap-1.5 ml-auto">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">{popularityScores[roadmap.id]}%</span>
              </div>
            )}
          </div>
          
          {/* Prerequisite Indicator */}
          <PrerequisiteIndicator roadmapId={roadmap.id} userProgress={userProgress} />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Featured section component
const FeaturedSection = ({ 
  roadmapData, 
  userProgress 
}: { 
  roadmapData: { roadmap: RoadmapTree; estimatedWeeks: number }[];
  userProgress: Record<string, number>;
}) => {
  const featuredRoadmaps = roadmapData.filter(
    ({ roadmap }) => featuredRoadmapIds.includes(roadmap.id)
  );

  if (featuredRoadmaps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="max-w-6xl mx-auto mb-10"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Recommended for You</h3>
          <p className="text-sm text-muted-foreground">Popular paths to kickstart your journey</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredRoadmaps.map(({ roadmap, estimatedWeeks }, index) => (
          <motion.div
            key={roadmap.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <RoadmapCard 
              roadmap={roadmap} 
              estimatedWeeks={estimatedWeeks} 
              isFeatured 
              userProgress={userProgress}
              cardProgress={userProgress[roadmap.id] || 0}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const Roadmap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  // Fetch all roadmap progress in a single query
  const userProgressData = useAllRoadmapProgress();

  // Pre-calculate estimated weeks for all roadmaps
  const roadmapData = useMemo(() => {
    return roadmapTrees.map(roadmap => ({
      roadmap,
      estimatedWeeks: calculateEstimatedWeeks(roadmap.nodes),
      popularity: popularityScores[roadmap.id] || 50,
    }));
  }, []);

  // Filter and sort roadmaps (excluding featured from main grid when no filters)
  const filteredAndSortedRoadmaps = useMemo(() => {
    const hasFilters = searchQuery !== "" || selectedCategory !== "all";
    
    // First filter
    const filtered = roadmapData.filter(({ roadmap }) => {
      // Search filter
      const searchMatch = searchQuery === "" || 
        roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        roadmap.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const categoryMatch = selectedCategory === "all" || 
        roadmapCategoryMap[roadmap.id] === selectedCategory ||
        roadmap.id === selectedCategory;
      
      // Exclude featured from main grid when no filters are active
      const notFeatured = hasFilters || !featuredRoadmapIds.includes(roadmap.id);
      
      return searchMatch && categoryMatch && notFeatured;
    });

    // Then sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.roadmap.title.localeCompare(b.roadmap.title);
        case 'popularity':
          return b.popularity - a.popularity;
        case 'duration-asc':
          return a.estimatedWeeks - b.estimatedWeeks;
        case 'duration-desc':
          return b.estimatedWeeks - a.estimatedWeeks;
        default:
          return 0;
      }
    });
  }, [roadmapData, searchQuery, selectedCategory, sortBy]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all";
  const showFeatured = !hasActiveFilters;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Map className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Career Roadmaps</h1>
              <p className="text-sm text-muted-foreground">Navigate your tech career path</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Choose Your Path
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore comprehensive visual roadmaps designed to guide you through your tech career journey. 
            Track your progress and master each skill step by step.
          </p>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-6xl mx-auto mb-8 space-y-4"
        >
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roadmaps..."
                className="pl-10 pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "transition-all",
                  selectedCategory === category.id && "shadow-md"
                )}
              >
                {category.id !== "all" && (
                  <span className={cn("h-2 w-2 rounded-full mr-2", category.color)} />
                )}
                {category.label}
              </Button>
            ))}
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                Showing {filteredAndSortedRoadmaps.length} of {roadmapTrees.length} roadmaps
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-auto py-1 px-2 text-xs"
              >
                Clear filters
              </Button>
            </div>
          )}
        </motion.div>

        {/* Featured Section */}
        {showFeatured && (
          <FeaturedSection roadmapData={roadmapData} userProgress={userProgressData} />
        )}

        {/* All Roadmaps Section Header */}
        {showFeatured && filteredAndSortedRoadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-6xl mx-auto mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                <Map className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">All Roadmaps</h3>
                <p className="text-sm text-muted-foreground">Explore more career paths</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Roadmap Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedRoadmaps.map(({ roadmap, estimatedWeeks }, index) => (
              <motion.div
                key={roadmap.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (showFeatured ? 0.35 : 0) + index * 0.05 }}
              >
                <RoadmapCard 
                  roadmap={roadmap} 
                  estimatedWeeks={estimatedWeeks} 
                  userProgress={userProgressData}
                  cardProgress={userProgressData[roadmap.id] || 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results Message */}
        {filteredAndSortedRoadmaps.length === 0 && !showFeatured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roadmaps found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </motion.div>
        )}

        {/* Coming Soon Placeholder */}
        {(filteredAndSortedRoadmaps.length > 0 || showFeatured) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12 p-8 border-2 border-dashed border-border rounded-2xl max-w-md mx-auto"
          >
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">More Roadmaps Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              We're actively adding new career paths. Stay tuned for more!
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Roadmap;
