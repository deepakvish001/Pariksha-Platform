import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, CheckCircle2, Clock, Target, Zap, Star, Loader2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Sheet definitions with total counts
const sheetDefinitions = [
  {
    id: "machine-learning",
    name: "Machine Learning",
    total: 26,
    topics: ["Linear Algebra", "Calculus", "Probability", "ML Fundamentals"],
    route: "/dashboard/sheets/machine-learning",
  },
  {
    id: "strivers-sde-sheet",
    name: "Striver's SDE Sheet",
    total: 191,
    topics: ["Arrays", "Linked Lists", "Trees", "Graphs", "DP"],
    route: "/dashboard/sheets/strivers-sde-sheet",
  },
  {
    id: "love-babbar-450",
    name: "Love Babbar 450",
    total: 450,
    topics: ["Arrays", "Strings", "Trees", "Graphs", "DP"],
    route: "/dashboard/sheets/love-babbar-450",
  },
  {
    id: "neetcode-150",
    name: "Neetcode 150",
    total: 150,
    topics: ["Arrays", "Two Pointers", "Stack", "Binary Search"],
    route: "/dashboard/sheets/neetcode-150",
  },
  {
    id: "sql-practice",
    name: "SQL Practice",
    total: 75,
    topics: ["Basics", "Joins", "Subqueries", "Window Functions"],
    route: "/dashboard/sheets/sql-practice",
  },
  {
    id: "system-design",
    name: "System Design",
    total: 25,
    topics: ["HLD", "LLD", "Databases", "Caching"],
    route: "/dashboard/sheets/system-design",
  },
];

interface SheetProgress {
  sheetId: string;
  completed: number;
  revision: number;
}

const DashboardMatrix = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<Map<string, SheetProgress>>(new Map());

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_topic_progress")
          .select("sheet_id, completed, is_revision")
          .eq("user_id", user.id);

        if (error) throw error;

        // Aggregate progress by sheet
        const progressMap = new Map<string, SheetProgress>();
        
        if (data) {
          data.forEach((row) => {
            const existing = progressMap.get(row.sheet_id) || { 
              sheetId: row.sheet_id, 
              completed: 0, 
              revision: 0 
            };
            
            if (row.completed) {
              existing.completed += 1;
            }
            if (row.is_revision) {
              existing.revision += 1;
            }
            
            progressMap.set(row.sheet_id, existing);
          });
        }

        setProgressData(progressMap);
      } catch (error) {
        console.error("Failed to load progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  // Calculate totals
  const totalQuestions = sheetDefinitions.reduce((acc, sheet) => acc + sheet.total, 0);
  const totalCompleted = Array.from(progressData.values()).reduce((acc, p) => acc + p.completed, 0);
  const totalRevision = Array.from(progressData.values()).reduce((acc, p) => acc + p.revision, 0);
  const overallProgress = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Progress Matrix</h1>
              <p className="text-sm text-muted-foreground">Track your preparation across topics</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 md:p-8 space-y-8">
        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{totalCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">For Revision</p>
                  <p className="text-2xl font-bold">{totalRevision}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sheetDefinitions.map((sheet, index) => {
            const sheetProgress = progressData.get(sheet.id);
            const completed = sheetProgress?.completed || 0;
            const revision = sheetProgress?.revision || 0;
            const progress = sheet.total > 0 ? Math.round((completed / sheet.total) * 100) : 0;
            
            return (
              <motion.div
                key={sheet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(sheet.route)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{sheet.name}</CardTitle>
                      <Badge variant={progress >= 50 ? "default" : "secondary"}>
                        {progress}%
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{completed} of {sheet.total} completed</span>
                      {revision > 0 && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          {revision}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progress} className="h-2" />
                    <div className="flex flex-wrap gap-2">
                      {sheet.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default DashboardMatrix;
