import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Layers,
  Server,
  Brain,
  Layout,
  LineChart,
  Network,
  Cloud,
  Coffee,
  BarChart,
  Briefcase,
  Palette,
  Megaphone,
  TrendingUp,
  Rocket,
  Blocks,
  Globe,
  Search,
  X,
  Star,
  Target,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  roles,
  categories,
  getQuestions,
  getAllQuestionsForRole,
  getQuestionCountsByDifficulty,
} from "@/data/positionResourcesData";

// Icon mapping for roles
const iconMap: Record<string, React.ElementType> = {
  Server,
  Brain,
  Layout,
  LineChart,
  Network,
  Cloud,
  Coffee,
  BarChart,
  Briefcase,
  Palette,
  Megaphone,
  TrendingUp,
  Rocket,
  Blocks,
  Globe,
};

// Local storage keys
const STORAGE_KEY = "position-resources-progress";
const FAVORITES_KEY = "position-resources-favorites";

interface ProgressState {
  [roleId: string]: {
    [categoryId: string]: {
      [questionId: number]: {
        solved: boolean;
        revision: boolean;
        note?: string;
      };
    };
  };
}

const PositionResources = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [progress, setProgress] = useState<ProgressState>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "starred">("all");

  // Load progress from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch {
        console.error("Failed to parse progress from local storage");
      }
    }
  }, []);

  // Load favorites from local storage
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        console.error("Failed to parse favorites from local storage");
      }
    }
  }, []);

  // Save favorites to local storage
  const toggleFavorite = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newFavorites = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Calculate stats for each role
  const roleStats = useMemo(() => {
    return roles.map((role) => {
      const allQuestions = getAllQuestionsForRole(role.id);
      const counts = getQuestionCountsByDifficulty(allQuestions);

      let totalSolved = 0;
      categories.forEach((cat) => {
        const catQuestions = getQuestions(role.id, cat.id);
        catQuestions.forEach((q) => {
          if (progress[role.id]?.[cat.id]?.[q.id]?.solved) {
            totalSolved++;
          }
        });
      });

      const percentage =
        counts.total > 0 ? Math.round((totalSolved / counts.total) * 100) : 0;

      return {
        ...role,
        totalQuestions: counts.total,
        solvedQuestions: totalSolved,
        percentage,
        easy: counts.easy,
        medium: counts.medium,
        hard: counts.hard,
        isFavorite: favorites.includes(role.id),
      };
    });
  }, [progress, favorites]);

  // Calculate global stats
  const globalStats = useMemo(() => {
    const totals = roleStats.reduce(
      (acc, role) => ({
        totalQuestions: acc.totalQuestions + role.totalQuestions,
        solvedQuestions: acc.solvedQuestions + role.solvedQuestions,
        easy: acc.easy + role.easy,
        medium: acc.medium + role.medium,
        hard: acc.hard + role.hard,
      }),
      { totalQuestions: 0, solvedQuestions: 0, easy: 0, medium: 0, hard: 0 }
    );

    const percentage =
      totals.totalQuestions > 0
        ? Math.round((totals.solvedQuestions / totals.totalQuestions) * 100)
        : 0;

    const rolesStarted = roleStats.filter((r) => r.solvedQuestions > 0).length;
    const rolesCompleted = roleStats.filter((r) => r.percentage === 100).length;

    return {
      ...totals,
      percentage,
      rolesStarted,
      rolesCompleted,
      totalRoles: roles.length,
    };
  }, [roleStats]);

  // Filter and sort roles (favorites first when on "all" tab)
  const filteredRoles = useMemo(() => {
    let filtered = roleStats;
    
    // Filter by starred tab
    if (activeTab === "starred") {
      filtered = filtered.filter((role) => role.isFavorite);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((role) =>
        role.name.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first (only on "all" tab), then by name
    if (activeTab === "all") {
      return [...filtered].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return 0;
      });
    }
    
    return filtered;
  }, [roleStats, searchQuery, activeTab]);

  const favoriteCount = favorites.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Position Wise Resources</h1>
              <p className="text-sm text-muted-foreground">
                Prepare for your dream job with position-specific resources
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Global Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4 md:p-6"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Progress */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Overall Progress</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Questions Completed</span>
                  <span className="font-medium">
                    {globalStats.solvedQuestions}/{globalStats.totalQuestions} ({globalStats.percentage}%)
                  </span>
                </div>
                <Progress value={globalStats.percentage} className="h-3" />
              </div>
              
              {/* Difficulty Breakdown */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-500 border-green-500/20"
                >
                  Easy: {globalStats.easy}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-orange-500/10 text-orange-500 border-orange-500/20"
                >
                  Medium: {globalStats.medium}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-500 border-red-500/20"
                >
                  Hard: {globalStats.hard}
                </Badge>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{globalStats.totalRoles}</p>
                <p className="text-xs text-muted-foreground">Positions</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{globalStats.rolesStarted}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{globalStats.rolesCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs and Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-4"
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "starred")}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Layers className="h-4 w-4" />
                All Positions
                <Badge variant="secondary" className="ml-1 text-xs">
                  {roleStats.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="starred" className="gap-2">
                <Star className="h-4 w-4" />
                Starred
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "ml-1 text-xs",
                    favoriteCount > 0 && "bg-yellow-500/20 text-yellow-600"
                  )}
                >
                  {favoriteCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Role Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((role, index) => {
              const IconComponent = iconMap[role.icon] || Layers;
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <Card
                    className={cn(
                      "hover:shadow-lg transition-all cursor-pointer group h-full relative",
                      role.isFavorite && "ring-1 ring-yellow-500/30"
                    )}
                    onClick={() => navigate(`/library/positions/${role.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={role.isFavorite ? "Remove from starred" : "Add to starred"}
                            className={cn(
                              "h-8 w-8 transition-colors",
                              role.isFavorite
                                ? "text-yellow-500 hover:text-yellow-600"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => toggleFavorite(role.id, e)}
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                role.isFavorite && "fill-current"
                              )}
                            />
                          </Button>
                          <Badge variant="secondary" className="text-xs">
                            {role.totalQuestions} questions
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-4">{role.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {role.solvedQuestions}/{role.totalQuestions} ({role.percentage}%)
                          </span>
                        </div>
                        <Progress value={role.percentage} className="h-2" />
                      </div>

                      {/* Difficulty Breakdown */}
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                        >
                          Easy: {role.easy}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-xs"
                        >
                          Medium: {role.medium}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-red-500/10 text-red-500 border-red-500/20 text-xs"
                        >
                          Hard: {role.hard}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              {activeTab === "starred" ? (
                <>
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No starred positions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Click the star icon on any position to add it here</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("all")}
                    className="mt-4"
                  >
                    View All Positions
                  </Button>
                </>
              ) : (
                <>
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No positions found matching your search</p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PositionResources;
