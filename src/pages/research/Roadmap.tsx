import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map, ArrowRight, Clock, BookOpen, Users, Search, 
  PlayCircle, BarChart3, Trophy, Sparkles, Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { roadmapTrees, type RoadmapTree, type RoadmapTreeNode } from "@/data/roadmapTreesData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RoadmapCompletionCelebration from "@/components/roadmap/RoadmapCompletionCelebration";
import ProgressVelocitySection from "@/components/roadmap/ProgressVelocitySection";
import RoadmapHeroSection from "@/components/roadmap/RoadmapHeroSection";
import RoadmapFilterBar from "@/components/roadmap/RoadmapFilterBar";
import RoadmapCardEnhanced from "@/components/roadmap/RoadmapCardEnhanced";
import RoadmapSectionDivider from "@/components/roadmap/RoadmapSectionDivider";

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

const sortOptions = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'duration-asc', label: 'Duration (Shortest)' },
  { value: 'duration-desc', label: 'Duration (Longest)' },
];

// Get roadmap title by ID
const getRoadmapTitle = (id: string): string => {
  const roadmap = roadmapTrees.find(r => r.id === id);
  return roadmap?.title || id;
};

// Hook to fetch all roadmap progress at once and detect completions
const useAllRoadmapProgress = (onComplete?: (roadmapId: string, roadmapTitle: string) => void) => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [previousProgress, setPreviousProgress] = useState<Record<string, number>>({});

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

        // Check for newly completed roadmaps
        if (onComplete) {
          Object.entries(percentages).forEach(([roadmapId, progress]) => {
            const prevProgress = previousProgress[roadmapId] || 0;
            if (progress === 100 && prevProgress < 100 && prevProgress > 0) {
              const roadmap = roadmapTrees.find(r => r.id === roadmapId);
              if (roadmap) {
                onComplete(roadmapId, roadmap.title);
              }
            }
          });
        }

        setPreviousProgress(progressData);
        setProgressData(percentages);
      }
    };

    fetchProgress();
  }, [user, onComplete]);

  return progressData;
};

// Continue Learning section component
const ContinueLearningSection = ({ 
  roadmapData, 
  userProgress 
}: { 
  roadmapData: { roadmap: RoadmapTree; estimatedWeeks: number }[];
  userProgress: Record<string, number>;
}) => {
  const navigate = useNavigate();
  
  // Get roadmaps that are in progress (1-99%)
  const inProgressRoadmaps = roadmapData
    .filter(({ roadmap }) => {
      const progress = userProgress[roadmap.id] || 0;
      return progress > 0 && progress < 100;
    })
    .sort((a, b) => (userProgress[b.roadmap.id] || 0) - (userProgress[a.roadmap.id] || 0));

  if (inProgressRoadmaps.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <RoadmapSectionDivider
        icon={PlayCircle}
        title="Continue Learning"
        subtitle="Pick up where you left off"
        count={inProgressRoadmaps.length}
        countLabel="in progress"
        gradientFrom="from-amber-500"
        gradientTo="to-orange-500"
        delay={0.12}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inProgressRoadmaps.slice(0, 3).map(({ roadmap }, index) => {
          const progress = userProgress[roadmap.id] || 0;
          const totalTopics = countNodes(roadmap.nodes);
          const completedTopics = Math.round((progress / 100) * totalTopics);
          
          return (
            <motion.div
              key={roadmap.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer border-2 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 h-full"
                onClick={() => navigate(`/research/roadmap/${roadmap.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Progress ring */}
                    <div className="relative flex-shrink-0">
                      <svg className="h-14 w-14 -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          strokeWidth="4"
                          fill="none"
                          className="stroke-muted"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          strokeWidth="4"
                          fill="none"
                          className="stroke-primary"
                          strokeDasharray={`${progress * 1.51} 151`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{progress}%</span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{roadmap.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {completedTopics} of {totalTopics} topics
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 h-8 text-xs gap-1"
                      >
                        Resume
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Progress Comparison component
const ProgressComparisonSection = ({ 
  roadmapData, 
  userProgress 
}: { 
  roadmapData: { roadmap: RoadmapTree; estimatedWeeks: number }[];
  userProgress: Record<string, number>;
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get all roadmaps with progress, sorted by progress
  const roadmapsWithProgress = roadmapData
    .map(({ roadmap, estimatedWeeks }) => ({
      roadmap,
      estimatedWeeks,
      progress: userProgress[roadmap.id] || 0,
      totalTopics: countNodes(roadmap.nodes),
    }))
    .filter(item => item.progress > 0)
    .sort((a, b) => b.progress - a.progress);

  if (!user || roadmapsWithProgress.length < 2) return null;

  const maxProgress = Math.max(...roadmapsWithProgress.map(r => r.progress));

  return (
    <div className="max-w-6xl mx-auto mb-10">
      <RoadmapSectionDivider
        icon={BarChart3}
        title="Your Progress Overview"
        subtitle="Compare your progress across all roadmaps"
        gradientFrom="from-blue-500"
        gradientTo="to-indigo-500"
        delay={0.18}
      />
      
      <Card className="border-2 overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {roadmapsWithProgress.map(({ roadmap, progress, totalTopics }, index) => {
              const completedTopics = Math.round((progress / 100) * totalTopics);
              const isLeading = progress === maxProgress;
              
              return (
                <motion.div
                  key={roadmap.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/research/roadmap/${roadmap.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank indicator */}
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      index === 0 && "bg-amber-500/20 text-amber-600",
                      index === 1 && "bg-slate-400/20 text-slate-600",
                      index === 2 && "bg-orange-600/20 text-orange-700",
                      index > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index === 0 ? <Trophy className="h-4 w-4" /> : index + 1}
                    </div>
                    
                    {/* Roadmap info */}
                    <div className={cn(
                      "h-10 w-10 rounded-lg bg-gradient-to-br flex-shrink-0 flex items-center justify-center",
                      roadmap.color
                    )}>
                      <Map className="h-5 w-5 text-white/90" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                          {roadmap.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {completedTopics}/{totalTopics} topics
                          </span>
                          <Badge 
                            variant={progress === 100 ? "default" : "secondary"}
                            className={cn(
                              "font-bold",
                              progress === 100 && "bg-emerald-500"
                            )}
                          >
                            {progress}%
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Progress bar with comparison indicator */}
                      <div className="relative">
                        <Progress value={progress} className="h-2.5" />
                        {isLeading && progress < 100 && (
                          <div className="absolute -top-1 -right-1">
                            <span className="flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Summary stats */}
          <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div className="glass-card rounded-lg p-3">
              <p className="text-2xl font-bold text-primary">{roadmapsWithProgress.length}</p>
              <p className="text-xs text-muted-foreground">Paths Started</p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-500">
                {roadmapsWithProgress.filter(r => r.progress === 100).length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-500">
                {Math.round(roadmapsWithProgress.reduce((acc, r) => acc + r.progress, 0) / roadmapsWithProgress.length)}%
              </p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
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
    <div className="max-w-6xl mx-auto mb-10">
      <RoadmapSectionDivider
        icon={Sparkles}
        title="Recommended for You"
        subtitle="Popular paths to kickstart your journey"
        count={featuredRoadmaps.length}
        countLabel="featured"
        gradientFrom="from-primary"
        gradientTo="to-primary/60"
        delay={0.15}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredRoadmaps.map(({ roadmap, estimatedWeeks }, index) => (
          <RoadmapCardEnhanced
            key={roadmap.id}
            roadmap={roadmap}
            estimatedTime={formatEstimatedTime(estimatedWeeks)}
            difficulty={calculateDifficulty(roadmap.nodes)}
            totalTopics={countNodes(roadmap.nodes)}
            isFeatured
            userProgress={userProgress}
            cardProgress={userProgress[roadmap.id] || 0}
            popularityScore={popularityScores[roadmap.id]}
            roadmapPrerequisites={roadmapPrerequisites}
            getRoadmapTitle={getRoadmapTitle}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

// Coming Soon placeholder
const ComingSoonSection = () => {
  const [email, setEmail] = useState("");
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center mt-12 max-w-md mx-auto"
    >
      <div className="relative p-8 rounded-2xl border-2 border-dashed border-border overflow-hidden glow-border">
        {/* Animated gradient border effect */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-gradient-conic from-primary via-transparent to-primary"
          style={{ borderRadius: 'inherit' }}
        />
        
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        </motion.div>
        
        <h3 className="text-lg font-semibold mb-2">More Roadmaps Coming Soon</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We're actively adding new career paths. Stay tuned for more!
        </p>
        
        {/* Notify me input */}
        <div className="flex gap-2 max-w-xs mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Button size="sm" className="h-9 gap-1">
            <Bell className="h-3 w-3" />
            Notify
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const Roadmap: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  
  // Celebration state for completed roadmaps
  const [celebrationData, setCelebrationData] = useState<{
    roadmapId: string;
    roadmapTitle: string;
  } | null>(null);

  // Handle roadmap completion
  const handleRoadmapComplete = useCallback((roadmapId: string, roadmapTitle: string) => {
    setCelebrationData({ roadmapId, roadmapTitle });
  }, []);

  // Fetch all roadmap progress in a single query
  const userProgressData = useAllRoadmapProgress(handleRoadmapComplete);

  // Pre-calculate estimated weeks for all roadmaps
  const roadmapData = useMemo(() => {
    return roadmapTrees.map(roadmap => ({
      roadmap,
      estimatedWeeks: calculateEstimatedWeeks(roadmap.nodes),
      popularity: popularityScores[roadmap.id] || 50,
    }));
  }, []);

  // Calculate total topics across all roadmaps
  const totalTopics = useMemo(() => {
    return roadmapData.reduce((acc, { roadmap }) => acc + countNodes(roadmap.nodes), 0);
  }, [roadmapData]);

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
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Map className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Career Roadmaps</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Navigate your tech career path</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        {/* Enhanced Hero Section */}
        <RoadmapHeroSection
          totalRoadmaps={roadmapTrees.length}
          totalTopics={totalTopics}
        />

        {/* Glassmorphism Filter Bar */}
        <RoadmapFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={(v) => setSortBy(v as SortOption)}
          categories={categories}
          sortOptions={sortOptions}
          totalRoadmaps={roadmapTrees.length}
          filteredCount={filteredAndSortedRoadmaps.length + (showFeatured ? featuredRoadmapIds.length : 0)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Continue Learning Section - shown first for returning users */}
        {showFeatured && (
          <ContinueLearningSection roadmapData={roadmapData} userProgress={userProgressData} />
        )}

        {/* Progress Velocity Section */}
        {showFeatured && (
          <ProgressVelocitySection />
        )}

        {/* Progress Comparison Section */}
        {showFeatured && (
          <ProgressComparisonSection roadmapData={roadmapData} userProgress={userProgressData} />
        )}

        {/* Featured Section */}
        {showFeatured && (
          <FeaturedSection roadmapData={roadmapData} userProgress={userProgressData} />
        )}

        {/* All Roadmaps Section Header */}
        {showFeatured && filteredAndSortedRoadmaps.length > 0 && (
          <RoadmapSectionDivider
            icon={Map}
            title="All Roadmaps"
            subtitle="Explore more career paths"
            count={filteredAndSortedRoadmaps.length}
            countLabel="paths"
            gradientFrom="from-muted-foreground/50"
            gradientTo="to-muted-foreground/30"
            delay={0.3}
          />
        )}

        {/* Roadmap Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedRoadmaps.map(({ roadmap, estimatedWeeks }, index) => (
              <RoadmapCardEnhanced
                key={roadmap.id}
                roadmap={roadmap}
                estimatedTime={formatEstimatedTime(estimatedWeeks)}
                difficulty={calculateDifficulty(roadmap.nodes)}
                totalTopics={countNodes(roadmap.nodes)}
                userProgress={userProgressData}
                cardProgress={userProgressData[roadmap.id] || 0}
                popularityScore={popularityScores[roadmap.id]}
                roadmapPrerequisites={roadmapPrerequisites}
                getRoadmapTitle={getRoadmapTitle}
                index={showFeatured ? index : index}
              />
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
          <ComingSoonSection />
        )}
      </main>

      {/* Roadmap Completion Celebration Modal */}
      {celebrationData && (
        <RoadmapCompletionCelebration
          roadmapId={celebrationData.roadmapId}
          roadmapTitle={celebrationData.roadmapTitle}
          onClose={() => setCelebrationData(null)}
        />
      )}
    </div>
  );
};

export default Roadmap;
