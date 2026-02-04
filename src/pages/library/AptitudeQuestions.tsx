import { motion } from "framer-motion";
import { HelpCircle, Search, Filter } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categories = [
  { title: "Quantitative Aptitude", count: 150, type: "Math" },
  { title: "Logical Reasoning", count: 120, type: "Logic" },
  { title: "Verbal Ability", count: 100, type: "Verbal" },
  { title: "Data Interpretation", count: 80, type: "Math" },
  { title: "Puzzles", count: 60, type: "Logic" },
  { title: "Pattern Recognition", count: 50, type: "Logic" },
];

const AptitudeQuestions = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Aptitude Questions</h1>
              <p className="text-sm text-muted-foreground">Quantitative and logical reasoning</p>
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
            <Input placeholder="Search aptitude topics..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.count} questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{category.type}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AptitudeQuestions;
