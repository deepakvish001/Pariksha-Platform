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
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
      };
    });
  }, [progress]);

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roleStats;
    const query = searchQuery.toLowerCase();
    return roleStats.filter((role) =>
      role.name.toLowerCase().includes(query)
    );
  }, [roleStats, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
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
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
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
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="hover:shadow-lg transition-all cursor-pointer group h-full"
                    onClick={() => navigate(`/library/positions/${role.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {role.totalQuestions} questions
                        </Badge>
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
              <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No positions found matching your search</p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default PositionResources;
