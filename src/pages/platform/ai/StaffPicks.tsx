import { useNavigate } from "react-router-dom";
import { Star, Sparkles, BookOpen, FileText, Map, HelpCircle, ClipboardList, Clock, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicAIContent, AIContentType } from "@/hooks/useAIContent";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<AIContentType, React.ComponentType<{ className?: string }>> = {
  plan: ClipboardList,
  course: BookOpen,
  guide: FileText,
  roadmap: Map,
  quiz: HelpCircle,
};

const StaffPicks = () => {
  const navigate = useNavigate();
  const { contents, isLoading } = usePublicAIContent();
  
  // Staff picks are the top 5 most liked public content
  const staffPicks = [...contents]
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Star className="h-7 w-7 text-amber-500 fill-amber-500" />
              Staff Picks
            </h1>
            <p className="text-muted-foreground mt-1">Curated top-quality AI-generated content</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : staffPicks.length > 0 ? (
          <div className="grid gap-4">
            {staffPicks.map((item, index) => {
              const Icon = typeIcons[item.content_type as AIContentType] || BookOpen;
              return (
                <Card 
                  key={item.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/platform/ai/content/${item.id}`)}
                >
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Top Pick
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="capitalize">{item.content_type}</Badge>
                    </div>
                    <CardDescription>Topic: {item.topic}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {item.likes_count} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Staff Picks Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create and share your AI-generated content to be featured here!
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            <Sparkles className="h-4 w-4 inline mr-1" />
            Staff picks are updated based on community engagement
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffPicks;
