import { Link } from "react-router-dom";
import { Map, Plus, Trash2, Globe, Lock, MoreVertical, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAIContent } from "@/hooks/useAIContent";
import { formatDistanceToNow } from "date-fns";

interface RoadmapContent {
  overview?: string;
  totalDuration?: string;
  stages?: Array<{ title: string; topics: Array<unknown> }>;
}

const MyRoadmaps = () => {
  const { contents, isLoading, deleteContent, togglePublic } = useAIContent("roadmap");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Roadmaps</h1>
            <p className="text-muted-foreground mt-1">Visual learning journeys created by AI</p>
          </div>
          <Button asChild>
            <Link to="/platform/ai/generate?type=roadmap">
              <Plus className="h-4 w-4 mr-2" />
              Create Roadmap
            </Link>
          </Button>
        </div>

        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Map className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No roadmaps yet</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Create your first AI-powered roadmap to visualize your learning journey.
            </p>
            <Button asChild>
              <Link to="/platform/ai/generate?type=roadmap">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Roadmap
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((roadmap) => {
              const content = roadmap.content as RoadmapContent;
              return (
                <Card key={roadmap.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{roadmap.title}</CardTitle>
                          {roadmap.is_public ? (
                            <Badge variant="secondary" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {content.overview || `A roadmap about ${roadmap.topic}`}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => togglePublic.mutate({ id: roadmap.id, isPublic: !roadmap.is_public })}
                          >
                            {roadmap.is_public ? (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Globe className="h-4 w-4 mr-2" />
                                Make Public
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteContent.mutate(roadmap.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {content.totalDuration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {content.totalDuration}
                          </span>
                        )}
                        {content.stages && (
                          <span className="flex items-center gap-1">
                            <Layers className="h-4 w-4" />
                            {content.stages.length} stages
                          </span>
                        )}
                      </div>
                      <span>
                        Created {formatDistanceToNow(new Date(roadmap.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoadmaps;
