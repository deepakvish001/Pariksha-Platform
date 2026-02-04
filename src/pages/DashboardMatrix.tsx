import { motion } from "framer-motion";
import { LayoutGrid, CheckCircle2, Clock, Target, Zap } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const categories = [
  {
    name: "DSA",
    total: 150,
    completed: 45,
    topics: ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "DP"],
  },
  {
    name: "System Design",
    total: 30,
    completed: 8,
    topics: ["HLD", "LLD", "Databases", "Caching", "Load Balancing"],
  },
  {
    name: "SQL",
    total: 50,
    completed: 22,
    topics: ["Basics", "Joins", "Subqueries", "Window Functions"],
  },
  {
    name: "CS Fundamentals",
    total: 40,
    completed: 15,
    topics: ["OS", "DBMS", "Networks", "OOPs"],
  },
  {
    name: "Aptitude",
    total: 100,
    completed: 35,
    topics: ["Quantitative", "Logical", "Verbal"],
  },
  {
    name: "Behavioral",
    total: 25,
    completed: 10,
    topics: ["Leadership", "Teamwork", "Problem Solving"],
  },
];

const DashboardMatrix = () => {
  const totalQuestions = categories.reduce((acc, cat) => acc + cat.total, 0);
  const totalCompleted = categories.reduce((acc, cat) => acc + cat.completed, 0);
  const overallProgress = Math.round((totalCompleted / totalQuestions) * 100);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                  <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Progress Matrix</h1>
                  <p className="text-sm text-muted-foreground">Track your preparation across topics</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6 md:p-8 space-y-8">
            {/* Overview Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 md:grid-cols-4"
            >
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Questions</p>
                      <p className="text-2xl font-bold">{totalQuestions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{totalCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold">{totalQuestions - totalCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Progress</p>
                      <p className="text-2xl font-bold">{overallProgress}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => {
                const progress = Math.round((category.completed / category.total) * 100);
                return (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant={progress >= 50 ? "default" : "secondary"}>
                            {progress}%
                          </Badge>
                        </div>
                        <CardDescription>
                          {category.completed} of {category.total} completed
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Progress value={progress} className="h-2" />
                        <div className="flex flex-wrap gap-2">
                          {category.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardMatrix;
