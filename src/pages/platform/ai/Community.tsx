import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { UsersRound, TrendingUp, Clock, BookOpen, FileText, HelpCircle, ClipboardList, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePublicAIContent, AIContentType, PublicAIContent } from "@/hooks/useAIContent";
import { formatDistanceToNow } from "date-fns";
import { LikeButton } from "@/components/ai/LikeButton";
import { CreatorCard } from "@/components/ai/CreatorCard";

const typeIcons: Record<AIContentType, React.ComponentType<{ className?: string }>> = {
  plan: ClipboardList,
  course: BookOpen,
  guide: FileText,
  quiz: HelpCircle,
};

const contentTypes: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "plan", label: "Plans" },
  { value: "course", label: "Courses" },
  { value: "guide", label: "Guides" },
  { value: "quiz", label: "Quizzes" },
];

const Community = () => {
  const navigate = useNavigate();
  const { contents, isLoading } = usePublicAIContent();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const matchesSearch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.topic.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || item.content_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [contents, searchQuery, typeFilter]);

  const sortedByLikes = useMemo(() => 
    [...filteredContents].sort((a, b) => b.likes_count - a.likes_count),
    [filteredContents]
  );

  const sortedByRecent = useMemo(() => 
    [...filteredContents].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    [filteredContents]
  );

  const renderContentCard = (item: PublicAIContent) => {
    const Icon = typeIcons[item.content_type as AIContentType] || BookOpen;
    return (
      <Card
        key={item.id}
        className="hover:shadow-md transition-shadow cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/platform/ai/content/${item.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/platform/ai/content/${item.id}`);
          }
        }}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {item.creator && (
                <CreatorCard 
                  name={item.creator.full_name} 
                  avatarUrl={item.creator.avatar_url}
                  size="sm"
                />
              )}
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            </div>
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
      <h2 className="text-xl font-semibold text-foreground mb-2">
        {searchQuery || typeFilter !== "all" ? "No matching content" : "No Public Content Yet"}
      </h2>
      <p className="text-muted-foreground max-w-md">
        {searchQuery || typeFilter !== "all" 
          ? "Try adjusting your search or filter criteria."
          : "Be the first to share your AI-generated learning content with the community!"}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">Discover AI-generated learning content shared by others</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {contentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
