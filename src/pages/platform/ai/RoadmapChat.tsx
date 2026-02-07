import { Route, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const RoadmapChat = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Roadmap Chat</h1>
            <p className="text-muted-foreground mt-1">Get personalized roadmap guidance from AI</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Route className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Chat with AI to get personalized career and learning roadmap recommendations based on your goals and experience.
          </p>
          <Button asChild variant="outline">
            <Link to="/platform/ai">
              <MessageCircle className="h-4 w-4 mr-2" />
              Try AI Tutor Instead
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapChat;
