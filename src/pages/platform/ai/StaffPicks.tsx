import { Star, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const staffPicksData = [
  {
    title: "Master Data Structures & Algorithms",
    type: "Course",
    description: "A comprehensive course covering all essential DSA concepts for interviews",
    author: "Byteskill Team",
    category: "DSA",
  },
  {
    title: "System Design Interview Prep",
    type: "Roadmap",
    description: "Step-by-step roadmap to ace system design interviews",
    author: "Byteskill Team",
    category: "System Design",
  },
  {
    title: "Frontend Developer Career Path",
    type: "Plan",
    description: "Complete learning plan from beginner to senior frontend developer",
    author: "Byteskill Team",
    category: "Career",
  },
];

const StaffPicks = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Staff Picks</h1>
            <p className="text-muted-foreground mt-1">Curated AI-generated content by our team</p>
          </div>
        </div>

        <div className="grid gap-4">
          {staffPicksData.map((item, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <Badge variant="secondary">{item.type}</Badge>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>By {item.author}</span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">
            <Sparkles className="h-4 w-4 inline mr-1" />
            More staff picks coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffPicks;
