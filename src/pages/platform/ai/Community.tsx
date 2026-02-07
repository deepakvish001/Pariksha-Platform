import { useNavigate } from "react-router-dom";
import { UsersRound, TrendingUp, Clock, BookOpen, FileText, Map, HelpCircle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicAIContent, AIContentType } from "@/hooks/useAIContent";
import { formatDistanceToNow } from "date-fns";
import { LikeButton } from "@/components/ai/LikeButton";

const typeIcons: Record<AIContentType, React.ComponentType<{ className?: string }>> = {
  plan: ClipboardList,
  course: BookOpen,
  guide: FileText,
  roadmap: Map,
  quiz: HelpCircle,
};

const Community = () => {
  const navigate = useNavigate();
  const { contents, isLoading } = usePublicAIContent();

  const sortedByLikes = [...contents].sort((a, b) => b.likes_count - a.likes_count);
  const sortedByRecent = [...contents].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const renderContentCard = (item: typeof contents[0]) => {
    const Icon = typeIcons[item.content_type as AIContentType] || BookOpen;
    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/platform/ai/content/${item.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">{item.title}</CardTitle>
            </div>
            <Badge variant="secondary" className="capitalize">{item.content_type}</Badge>
          </div>
          <CardDescription>Topic: {item.topic}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
            <LikeButton contentId={item.id} likesCount={item.likes_count} size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <UsersRound className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">No Public Content Yet</h2>
      <p className="text-muted-foreground max-w-md">
        Be the first to share your AI-generated learning content with the community!
      </p>
    </div>
  );

  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">Discover AI-generated learning content shared by others</p>
          </div>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-4">
            {isLoading ? (
              renderSkeletons()
            ) : sortedByLikes.length > 0 ? (
              sortedByLikes.map(renderContentCard)
            ) : (
              renderEmptyState()
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            {isLoading ? (
              renderSkeletons()
            ) : sortedByRecent.length > 0 ? (
              sortedByRecent.map(renderContentCard)
            ) : (
              renderEmptyState()
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
