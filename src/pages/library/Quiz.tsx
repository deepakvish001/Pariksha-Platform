import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Trophy, Search, Filter, Clock, Users, History, Code, Cpu, Database, Brain, Calculator, X, Shuffle, Sparkles, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DSAQuizMode from "@/components/library/DSAQuizMode";
import CSQuizMode from "@/components/library/CSQuizMode";
import AptitudeQuizMode from "@/components/library/AptitudeQuizMode";
import SQLQuizMode from "@/components/library/SQLQuizMode";
import CombinedQuizMode from "@/components/library/CombinedQuizMode";
import QuizSpacedRepetitionPanel from "@/components/library/QuizSpacedRepetitionPanel";
import ReviewQuizMode from "@/components/library/ReviewQuizMode";
import SRSStatsDashboard from "@/components/library/SRSStatsDashboard";
 import XPLevelBadge from "@/components/XPLevelBadge";
 import XPGoalsCard from "@/components/XPGoalsCard";
 import XPLeaderboard from "@/components/XPLeaderboard";
import { type QuizReviewItem } from "@/hooks/useQuizSpacedRepetition";
import { dsaQuestions } from "@/data/dsaQuestionsData";
import { csQuestions } from "@/data/csSubjectsData";
import { aptitudeQuestions } from "@/data/aptitudeQuestionsData";
import { sqlQuestions } from "@/data/sqlQuestionsData";

type QuizType = "dsa" | "cs" | "aptitude" | "sql" | "combined" | "review" | null;

const quizCategories = [
  {
    id: "dsa",
    title: "DSA Quiz",
    description: "Data Structures & Algorithms",
    icon: <Code className="h-6 w-6" />,
    questions: dsaQuestions.length,
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    iconBg: "bg-blue-500/20 text-blue-500",
  },
  {
    id: "cs",
    title: "CS Core Quiz",
    description: "OS, DBMS, CN, OOPs, TOC, Compiler",
    icon: <Cpu className="h-6 w-6" />,
    questions: csQuestions.length,
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    iconBg: "bg-purple-500/20 text-purple-500",
  },
  {
    id: "aptitude",
    title: "Aptitude Quiz",
    description: "Quantitative & Logical Reasoning",
    icon: <Calculator className="h-6 w-6" />,
    questions: aptitudeQuestions.length,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    iconBg: "bg-amber-500/20 text-amber-500",
  },
  {
    id: "sql",
    title: "SQL Quiz",
    description: "Database Queries & Concepts",
    icon: <Database className="h-6 w-6" />,
    questions: sqlQuestions.length,
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-500",
  },
];

const Quiz = () => {
  const [activeQuiz, setActiveQuiz] = useState<QuizType>(null);
  const [reviewItems, setReviewItems] = useState<QuizReviewItem[]>([]);
  const [showStats, setShowStats] = useState(false);

  const handleStartReviewQuiz = (reviews: QuizReviewItem[]) => {
    setReviewItems(reviews);
    setActiveQuiz("review");
  };

  const renderQuizMode = () => {
    switch (activeQuiz) {
      case "dsa":
        return <DSAQuizMode questions={dsaQuestions} onClose={() => setActiveQuiz(null)} />;
      case "cs":
        return <CSQuizMode questions={csQuestions} onClose={() => setActiveQuiz(null)} />;
      case "aptitude":
        return <AptitudeQuizMode questions={aptitudeQuestions} onClose={() => setActiveQuiz(null)} />;
      case "sql":
        return <SQLQuizMode questions={sqlQuestions} onClose={() => setActiveQuiz(null)} />;
      case "combined":
        return <CombinedQuizMode onClose={() => setActiveQuiz(null)} />;
      case "review":
        return <ReviewQuizMode reviews={reviewItems} onClose={() => setActiveQuiz(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Quiz</h1>
              <p className="text-sm text-muted-foreground">Test your knowledge</p>
            </div>
          </div>
          {activeQuiz && (
            <Button variant="ghost" size="icon" aria-label="Close quiz" onClick={() => setActiveQuiz(null)}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        {activeQuiz ? (
          renderQuizMode()
        ) : (
          <>
             <div className="flex flex-col lg:flex-row gap-6">
               {/* Main Content */}
               <div className="flex-1 space-y-6">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col sm:flex-row gap-4"
                 >
                   <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input placeholder="Search quizzes..." className="pl-10" />
                   </div>
                   <Link to="/library/quiz-history">
                     <Button variant="outline" className="gap-2">
                       <History className="h-4 w-4" />
                       History
                     </Button>
                   </Link>
                   <Button 
                     variant={showStats ? "default" : "outline"} 
                     className="gap-2"
                     onClick={() => setShowStats(!showStats)}
                   >
                     <BarChart3 className="h-4 w-4" />
                     Stats
                   </Button>
                 </motion.div>

                 {/* Stats Dashboard */}
                 {showStats && (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                   >
                     <SRSStatsDashboard />
                   </motion.div>
                 )}

                 {/* Spaced Repetition Panel */}
                 {!showStats && (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 }}
                   >
                     <QuizSpacedRepetitionPanel onStartReviewQuiz={handleStartReviewQuiz} />
                   </motion.div>
                 )}

                 {/* Featured Combined Quiz */}
                 {!showStats && (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                   >
                     <Card 
                       className="cursor-pointer hover:shadow-lg transition-all group border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5"
                       onClick={() => setActiveQuiz("combined")}
                     >
                       <CardContent className="p-6">
                         <div className="flex items-center gap-4">
                           <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                             <Shuffle className="h-7 w-7 text-primary" />
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center gap-2">
                               <h3 className="text-lg font-bold">Combined Quiz</h3>
                               <Badge className="bg-gradient-to-r from-primary to-accent text-white border-0">
                                 <Sparkles className="h-3 w-3 mr-1" />
                                 New
                               </Badge>
                             </div>
                             <p className="text-sm text-muted-foreground">Mix questions from DSA, CS Core, SQL & Aptitude</p>
                           </div>
                           <Button className="group-hover:bg-primary/90">
                             Start Mixed Quiz
                           </Button>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>
                 )}

                 {!showStats && (
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.25 }}
                   >
                     <h2 className="text-lg font-semibold mb-4">Choose a Quiz Category</h2>
                     <div className="grid gap-6 md:grid-cols-2">
                       {quizCategories.map((category, index) => (
                         <motion.div
                           key={category.id}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ delay: 0.25 + index * 0.1 }}
                         >
                           <Card
                             className={`hover:shadow-lg transition-all cursor-pointer group border bg-gradient-to-br ${category.color}`}
                             onClick={() => setActiveQuiz(category.id as QuizType)}
                           >
                             <CardHeader>
                               <div className="flex items-center gap-4">
                                 <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${category.iconBg}`}>
                                   {category.icon}
                                 </div>
                                 <div>
                                   <CardTitle className="text-lg">{category.title}</CardTitle>
                                   <CardDescription>{category.description}</CardDescription>
                                 </div>
                               </div>
                             </CardHeader>
                             <CardContent className="space-y-3">
                               <div className="flex items-center justify-between text-sm text-muted-foreground">
                                 <span className="flex items-center gap-1">
                                   <Brain className="h-4 w-4" />
                                   {category.questions} questions
                                 </span>
                                 <Badge variant="secondary">Multiple Modes</Badge>
                               </div>
                               <Button className="w-full group-hover:bg-primary/90">Start Quiz</Button>
                             </CardContent>
                           </Card>
                         </motion.div>
                       ))}
                      </div>
                  </motion.div>
                 )}
              </div>

               {/* Sidebar - XP Goals & Leaderboard */}
               <div className="lg:w-80 space-y-6">
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 }}
                 >
                   <XPLevelBadge />
                 </motion.div>
                 
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2 }}
                 >
                   <XPGoalsCard />
                 </motion.div>
                 
                 <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.3 }}
                 >
                   <XPLeaderboard compact />
                 </motion.div>
               </div>
             </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Quiz;
