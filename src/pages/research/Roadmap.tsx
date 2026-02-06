import React from "react";
import { motion } from "framer-motion";
import { Map, ArrowRight, Clock, BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { roadmapTrees } from "@/data/roadmapTreesData";
import { useAuth } from "@/contexts/AuthContext";
import { useRoadmapTreeProgress } from "@/hooks/useRoadmapTreeProgress";

// Helper to count total nodes in a tree
const countNodes = (nodes: any[]): number => {
  return nodes.reduce((acc, node) => {
    const childCount = node.children ? countNodes(node.children) : 0;
    return acc + 1 + childCount;
  }, 0);
};

// Individual roadmap card component
const RoadmapCard = ({ roadmap }: { roadmap: typeof roadmapTrees[0] }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats } = useRoadmapTreeProgress(roadmap.id, roadmap.nodes);
  
  const totalTopics = countNodes(roadmap.nodes);
  const progressPercent = user && stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="group cursor-pointer overflow-hidden border-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
        onClick={() => navigate(`/research/roadmap/${roadmap.id}`)}
      >
        {/* Gradient header */}
        <div className={cn(
          "h-32 relative bg-gradient-to-br flex items-center justify-center",
          roadmap.color
        )}>
          <Map className="h-16 w-16 text-white/80" />
          
          {/* Progress overlay */}
          {user && progressPercent > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-foreground font-semibold">
                {progressPercent}% Complete
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Roadmap: React.FC = () => {
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
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Choose Your Path
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore comprehensive visual roadmaps designed to guide you through your tech career journey. 
            Track your progress and master each skill step by step.
          </p>
        </motion.div>

        {/* Roadmap Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roadmapTrees.map((roadmap, index) => (
            <motion.div
              key={roadmap.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RoadmapCard roadmap={roadmap} />
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Placeholder */}
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
      </main>
    </div>
  );
};

export default Roadmap;
