 import { motion } from "framer-motion";
 import { Clock, Trophy, Target, Flag, Eye, RotateCcw } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { cn } from "@/lib/utils";
 import { categoryConfig, formatTime, type QuizQuestion } from "./types";
 
 interface QuizResultsProps {
   questions: QuizQuestion[];
   answers: (number | null)[];
   totalTime: number;
   markedForReview: Set<number>;
   onClose: () => void;
   onReview: () => void;
   onNewQuiz: () => void;
 }
 
 const QuizResults = ({
   questions,
   answers,
   totalTime,
   markedForReview,
   onClose,
   onReview,
   onNewQuiz,
 }: QuizResultsProps) => {
   const score = answers.reduce((acc, ans, idx) => {
     if (ans === null) return acc;
     return questions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
   }, 0);
   
   const accuracy = Math.round((score / questions.length) * 100);
   const markedCount = markedForReview.size;
   const incorrectCount = questions.filter((q, idx) => 
     answers[idx] === null || !q.options[answers[idx]!]?.isCorrect
   ).length;
 
   const categoryStats = questions.reduce((acc, q, idx) => {
     if (!acc[q.category]) acc[q.category] = { correct: 0, total: 0 };
     acc[q.category].total++;
     if (answers[idx] !== null && q.options[answers[idx]!]?.isCorrect) {
       acc[q.category].correct++;
     }
     return acc;
   }, {} as Record<string, { correct: number; total: number }>);
 
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       className="space-y-6"
     >
       <Card className="text-center">
         <CardContent className="pt-8 pb-6">
           <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
             <Trophy className={cn(
               "h-10 w-10",
               accuracy >= 80 ? "text-yellow-500" : accuracy >= 60 ? "text-blue-500" : "text-muted-foreground"
             )} />
           </div>
           <h2 className="text-3xl font-bold mb-2">{score}/{questions.length}</h2>
           <p className="text-xl text-muted-foreground mb-4">{accuracy}% Accuracy</p>
           
           {/* Marked for review indicator */}
           {markedCount > 0 && (
             <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mb-4">
               <Flag className="h-4 w-4" />
               <span>{markedCount} flagged for review</span>
             </div>
           )}
 
           <div className="flex justify-center gap-4 text-sm text-muted-foreground">
             <span className="flex items-center gap-1">
               <Clock className="h-4 w-4" />
               {formatTime(totalTime)}
             </span>
             <span className="flex items-center gap-1">
               <Target className="h-4 w-4" />
               {Math.round(totalTime / questions.length)}s avg
             </span>
           </div>
         </CardContent>
       </Card>
 
       {/* Category breakdown */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Category Breakdown</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 gap-4">
             {Object.entries(categoryStats).map(([cat, stats]) => {
               const config = categoryConfig[cat as keyof typeof categoryConfig];
               const Icon = config.icon;
               const pct = Math.round((stats.correct / stats.total) * 100);
               return (
                 <div key={cat} className={cn("p-4 rounded-lg", config.bgColor)}>
                   <div className="flex items-center gap-2 mb-2">
                     <Icon className={cn("h-5 w-5", config.color)} />
                     <span className="font-medium">{config.label}</span>
                   </div>
                   <p className="text-2xl font-bold">{stats.correct}/{stats.total}</p>
                   <Progress value={pct} className="h-1.5 mt-2" />
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
 
       <div className="flex gap-3">
         <Button variant="outline" onClick={onClose} className="flex-1">
           Exit
         </Button>
         {(incorrectCount > 0 || markedCount > 0) && (
           <Button 
             variant="outline" 
             onClick={onReview}
             className="flex-1"
           >
             <Eye className="h-4 w-4 mr-2" />
             Review ({markedCount > 0 ? `${markedCount} flagged` : incorrectCount})
           </Button>
         )}
         <Button onClick={onNewQuiz} className="flex-1">
           <RotateCcw className="h-4 w-4 mr-2" />
           New Quiz
         </Button>
       </div>
     </motion.div>
   );
 };
 
 export default QuizResults;