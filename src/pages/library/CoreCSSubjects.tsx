import { motion } from "framer-motion";
import { Cpu, Search, Filter } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const subjects = [
  { title: "Operating Systems", topics: 25, importance: "High" },
  { title: "Database Management", topics: 20, importance: "High" },
  { title: "Computer Networks", topics: 22, importance: "High" },
  { title: "Data Structures", topics: 30, importance: "Critical" },
  { title: "Algorithms", topics: 28, importance: "Critical" },
  { title: "System Design", topics: 15, importance: "Medium" },
];

const CoreCSSubjects = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Cpu className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Core CS Subjects</h1>
              <p className="text-sm text-muted-foreground">Fundamental computer science topics</p>
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
            <Input placeholder="Search subjects..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg">{subject.title}</CardTitle>
                  <CardDescription>{subject.topics} topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant={subject.importance === "Critical" ? "destructive" : subject.importance === "High" ? "default" : "secondary"}>
                    {subject.importance} Priority
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

export default CoreCSSubjects;
