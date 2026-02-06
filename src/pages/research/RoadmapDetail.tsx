import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRoadmapTreeById } from "@/data/roadmapTreesData";
import RoadmapTree from "@/components/roadmap/RoadmapTree";
import RoadmapStreakCard from "@/components/roadmap/RoadmapStreakCard";
import RoadmapFAQ from "@/components/roadmap/RoadmapFAQ";
import LearningGoalCard from "@/components/roadmap/LearningGoalCard";
import { useRoadmapTreeProgress } from "@/hooks/useRoadmapTreeProgress";

const RoadmapDetail: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("Learner");

  // Get the selected tree for visual roadmap
  const selectedTree = getRoadmapTreeById(roadmapId || "frontend");
  
  // Tree progress hook
  const { 
    progress: treeProgress, 
    toggleNodeComplete,
    stats: treeStats,
  } = useRoadmapTreeProgress(roadmapId || "frontend", selectedTree?.nodes || []);

  // Fetch user profile name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.full_name) {
        setUserName(data.full_name);
      }
    };
    
    fetchUserName();
  }, [user]);

  // Handle invalid roadmap
  if (!selectedTree) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Roadmap Not Found</h1>
          <p className="text-muted-foreground">The roadmap you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/research/roadmap")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  const progressPercent = treeStats.total > 0 
    ? Math.round((treeStats.completed / treeStats.total) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/research/roadmap")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All Roadmaps
          </Button>
          <div className="flex items-center gap-3 ml-2">
            <div className={cn(
              "h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              selectedTree.color
            )}>
              <Map className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{selectedTree.title}</h1>
              <p className="text-sm text-muted-foreground">{selectedTree.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{treeStats.completed}/{treeStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-xl font-bold">{treeStats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4 md:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Card and Learning Goal */}
        <div className="grid gap-4 md:grid-cols-2">
          <RoadmapStreakCard compact />
          <LearningGoalCard
            roadmapId={roadmapId || "frontend"}
            roadmapTitle={selectedTree.title}
            totalTopics={treeStats.total}
            completedTopics={treeStats.completed}
          />
        </div>

        {/* Visual Roadmap Tree */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RoadmapTree
            tree={selectedTree}
            progress={treeProgress}
            onNodeComplete={toggleNodeComplete}
            userName={userName}
          />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <RoadmapFAQ faqs={selectedTree.faqs} />
        </motion.div>
      </main>
    </div>
  );
};

export default RoadmapDetail;
