import { motion } from "framer-motion";
import { Trophy, Search, Filter, Clock, Users } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const quizzes = [
  { title: "DSA Fundamentals", questions: 30, time: "30 min", participants: 1520, difficulty: "Easy" },
  { title: "Advanced Algorithms", questions: 25, time: "45 min", participants: 890, difficulty: "Hard" },
  { title: "SQL Mastery", questions: 20, time: "25 min", participants: 1100, difficulty: "Medium" },
  { title: "System Design Basics", questions: 15, time: "40 min", participants: 750, difficulty: "Medium" },
  { title: "OOPs Concepts", questions: 25, time: "30 min", participants: 1350, difficulty: "Easy" },
  { title: "Aptitude Test", questions: 40, time: "60 min", participants: 2100, difficulty: "Mixed" },
];

const Quiz = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Quiz</h1>
              <p className="text-sm text-muted-foreground">Test your knowledge</p>
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
            <Input placeholder="Search quizzes..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge variant={quiz.difficulty === "Easy" ? "secondary" : quiz.difficulty === "Hard" ? "destructive" : "default"}>
                      {quiz.difficulty}
                    </Badge>
                  </div>
                  <CardDescription>{quiz.questions} questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {quiz.participants.toLocaleString()}
                    </span>
                  </div>
                  <Button className="w-full">Start Quiz</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Quiz;
