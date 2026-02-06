import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getRoadmapTreeById } from "@/data/roadmapTreesData";
import RoadmapTree from "@/components/roadmap/RoadmapTree";
import RoadmapStreakCard from "@/components/roadmap/RoadmapStreakCard";
import RoadmapFAQ from "@/components/roadmap/RoadmapFAQ";
import LearningGoalCard from "@/components/roadmap/LearningGoalCard";
import RoadmapDetailHero from "@/components/roadmap/RoadmapDetailHero";
import RoadmapProgressDashboard from "@/components/roadmap/RoadmapProgressDashboard";
import RoadmapFloatingProgress from "@/components/roadmap/RoadmapFloatingProgress";
import RoadmapScrollProgress from "@/components/roadmap/RoadmapScrollProgress";
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

  // Find next incomplete topic
  const nextTopic = useMemo(() => {
    if (!selectedTree?.nodes) return undefined;
    for (const node of selectedTree.nodes) {
      if (!treeProgress[node.id]?.completed) {
        return node.title;
      }
    }
    return undefined;
  }, [selectedTree?.nodes, treeProgress]);

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
      {/* Branded Hero Header */}
      <RoadmapDetailHero
        title={selectedTree.title}
        description={selectedTree.description}
        colorClass={selectedTree.color}
        completedTopics={treeStats.completed}
        totalTopics={treeStats.total}
        progressPercent={progressPercent}
      />

      {/* Scroll Progress Bar */}
      <RoadmapScrollProgress />

      <main className="p-4 md:p-6 space-y-6">
        {/* Progress Dashboard */}
        <RoadmapProgressDashboard
          completed={treeStats.completed}
          inProgress={treeStats.inProgress}
          total={treeStats.total}
        />

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
        <RoadmapFAQ faqs={selectedTree.faqs} />
      </main>

      {/* Floating Progress Widget & Back to Top */}
      <RoadmapFloatingProgress
        progressPercent={progressPercent}
        nextTopic={nextTopic}
      />
    </div>
  );
};

export default RoadmapDetail;
