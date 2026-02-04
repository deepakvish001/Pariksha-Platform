import { motion } from "framer-motion";
import { Code2, Search, Filter } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const languages = [
  { name: "Java", topics: 45, completed: 30, popularity: "High" },
  { name: "Python", topics: 40, completed: 25, popularity: "High" },
  { name: "C++", topics: 50, completed: 20, popularity: "High" },
  { name: "JavaScript", topics: 35, completed: 28, popularity: "Medium" },
  { name: "Go", topics: 25, completed: 10, popularity: "Medium" },
  { name: "Rust", topics: 30, completed: 5, popularity: "Low" },
];

const Language = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Programming Languages</h1>
              <p className="text-sm text-muted-foreground">Master programming fundamentals</p>
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
            <Input placeholder="Search languages..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {languages.map((lang, index) => (
            <motion.div
              key={lang.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{lang.name}</CardTitle>
                    <Badge variant={lang.popularity === "High" ? "default" : lang.popularity === "Medium" ? "secondary" : "outline"}>
                      {lang.popularity}
                    </Badge>
                  </div>
                  <CardDescription>{lang.completed}/{lang.topics} topics completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={(lang.completed / lang.topics) * 100} className="h-2" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Language;
