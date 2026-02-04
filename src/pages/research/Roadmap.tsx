import { motion } from "framer-motion";
import { Map, Search, Filter, CheckCircle, Circle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const roadmaps = [
  { title: "Frontend Developer", steps: 12, completed: 8, duration: "6 months" },
  { title: "Backend Developer", steps: 14, completed: 5, duration: "8 months" },
  { title: "Full Stack Developer", steps: 20, completed: 10, duration: "12 months" },
  { title: "DevOps Engineer", steps: 15, completed: 3, duration: "10 months" },
  { title: "Data Scientist", steps: 16, completed: 0, duration: "12 months" },
  { title: "Mobile Developer", steps: 10, completed: 2, duration: "6 months" },
];

const Roadmap = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Map className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Career Roadmaps</h1>
              <p className="text-sm text-muted-foreground">Structured learning paths</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search roadmaps..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap, index) => (
            <motion.div
              key={roadmap.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg">{roadmap.title}</CardTitle>
                  <CardDescription>Est. {roadmap.duration}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    {roadmap.completed > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{roadmap.completed}/{roadmap.steps} steps completed</span>
                  </div>
                  <Badge variant={roadmap.completed === roadmap.steps ? "default" : "secondary"}>
                    {Math.round((roadmap.completed / roadmap.steps) * 100)}% Complete
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Roadmap;
