import { UsersRound, Plus, TrendingUp, Clock, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const communityContent = [
  {
    title: "Complete React Learning Path",
    type: "Roadmap",
    author: "devmaster42",
    likes: 234,
    category: "Frontend",
  },
  {
    title: "Python for Data Science",
    type: "Course",
    author: "dataninja",
    likes: 189,
    category: "Data Science",
  },
  {
    title: "Cracking the Coding Interview",
    type: "Plan",
    author: "interviewpro",
    likes: 156,
    category: "Interview Prep",
  },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground mt-1">Discover and share AI-generated learning content</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Share Content
          </Button>
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
            {communityContent.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                  <CardDescription>Created by @{item.author}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{item.likes} likes</span>
                    </div>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UsersRound className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Community Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">
                Soon you'll be able to browse, share, and discover learning content created by the community.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
