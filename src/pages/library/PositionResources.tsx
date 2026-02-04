import { motion } from "framer-motion";
import { Layers, Search, Filter } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const positions = [
  { title: "Software Engineer", count: 45, difficulty: "Medium" },
  { title: "Frontend Developer", count: 32, difficulty: "Easy" },
  { title: "Backend Developer", count: 38, difficulty: "Medium" },
  { title: "Full Stack Developer", count: 52, difficulty: "Hard" },
  { title: "DevOps Engineer", count: 28, difficulty: "Hard" },
  { title: "Data Scientist", count: 35, difficulty: "Hard" },
];

const PositionResources = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Position Wise Resources</h1>
              <p className="text-sm text-muted-foreground">Resources organized by job positions</p>
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
            <Input placeholder="Search positions..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {positions.map((position, index) => (
            <motion.div
              key={position.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg">{position.title}</CardTitle>
                  <CardDescription>{position.count} resources available</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{position.difficulty}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default PositionResources;
