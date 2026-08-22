 import { useState, useMemo, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, Brain,
   Code, Cpu, Database, Calculator, BookOpen, RotateCcw
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
 import { dsaQuestions } from "@/data/dsaQuestionsData";
 import { csQuestions } from "@/data/csSubjectsData";
 import { sqlQuestions } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions } from "@/data/aptitudeQuestionsData";
 import { useQuizSpacedRepetition, type QuizReviewItem } from "@/hooks/useQuizSpacedRepetition";
import { useXPSystem, XP_VALUES } from "@/hooks/useXPSystem";
import { useToast } from "@/hooks/use-toast";
 
 interface ReviewQuizModeProps {
   reviews: QuizReviewItem[];
   onClose: () => void;
 }
 
 interface ReviewQuestion {
   reviewId: string;
   id: number;
   category: string;
   title: string;
   text: string;
   options: { text: string; isCorrect: boolean }[];
   answer?: string;
   difficulty: string;
 }
 
 const categoryConfig = {
   dsa: { label: "DSA", icon: Code, color: "text-blue-500", bgColor: "bg-blue-500/10" },
   cs: { label: "CS", icon: Cpu, color: "text-purple-500", bgColor: "bg-purple-500/10" },
   sql: { label: "SQL", icon: Database, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
   aptitude: { label: "Aptitude", icon: Calculator, color: "text-amber-500", bgColor: "bg-amber-500/10" },
 };
 
 const ReviewQuizMode = ({ reviews, onClose }: ReviewQuizModeProps) => {
  const { completeReview, refetch, masteryThreshold } = useQuizSpacedRepetition();
  const { awardXP } = useXPSystem();
  const { toast } = useToast();
   const [currentIndex, setCurrentIndex] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
   const [results, setResults] = useState<{ correct: boolean; reviewId: string }[]>([]);
   const [showResults, setShowResults] = useState(false);
 
   // Build questions from reviews
   const questions = useMemo(() => {
     const allQuestions = [
       ...dsaQuestions.map(q => ({ ...q, category: "dsa" })),
       ...csQuestions.map(q => ({ ...q, category: "cs" })),
       ...sqlQuestions.map(q => ({ ...q, category: "sql" })),
       ...aptitudeQuestions.map(q => ({ ...q, category: "aptitude" })),
     ];
 
     return reviews.map(review => {
       const question = allQuestions.find(
         q => q.id === review.questionId && q.category === review.category
       );
       if (!question || !question.options) return null;
       return {
         reviewId: review.id,
         id: question.id,
         category: review.category,
         title: question.title,
         text: question.text,
         options: question.options,
         answer: question.answer,
         difficulty: question.difficulty,
       } as ReviewQuestion;
     }).filter(Boolean) as ReviewQuestion[];
   }, [reviews]);
 
   const currentQuestion = questions[currentIndex];
   const config = currentQuestion 
     ? categoryConfig[currentQuestion.category as keyof typeof categoryConfig] || categoryConfig.dsa
     : categoryConfig.dsa;
   const CategoryIcon = config.icon;
 
   const handleAnswerSelect = (index: number) => {
     if (selectedAnswer !== null) return;
     setSelectedAnswer(index);
   };
 
   const handleNext = async () => {
     if (!currentQuestion || selectedAnswer === null) return;
 
     const isCorrect = currentQuestion.options[selectedAnswer]?.isCorrect || false;
     
     // Record result
     setResults(prev => [...prev, { correct: isCorrect, reviewId: currentQuestion.reviewId }]);
     
     // Update spaced repetition
    const review = reviews.find(r => r.id === currentQuestion.reviewId);
    const willMaster = review && isCorrect && (review.correctStreak + 1) >= masteryThreshold;

    await completeReview(currentQuestion.reviewId, isCorrect);

    // Award XP for correct SRS review answers
    if (isCorrect) {
      if (willMaster) {
        await awardXP(XP_VALUES.SRS_MASTERED, "srs_mastered", `🎓 Mastered: ${currentQuestion.title}`);
      } else {
        await awardXP(XP_VALUES.SRS_REVIEW_CORRECT, "srs_review", `✓ Review correct: ${currentQuestion.title}`, false);
      }
    }
 
     if (currentIndex < questions.length - 1) {
       setCurrentIndex(prev => prev + 1);
       setSelectedAnswer(null);
     } else {
       setShowResults(true);
      const correctCount = results.filter(r => r.correct).length + (isCorrect ? 1 : 0);
      if (correctCount > 0) {
        toast({
          title: `+${correctCount * XP_VALUES.SRS_REVIEW_CORRECT} XP earned`,
          description: `${correctCount} review${correctCount !== 1 ? 's' : ''} completed correctly`,
          duration: 3000,
        });
      }
       await refetch();
     }
   };
 
   if (questions.length === 0) {
     return (
       <Card className="text-center py-12">
         <CardContent>
           <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
           <h3 className="text-xl font-bold mb-2">No Questions Found</h3>
           <p className="text-muted-foreground mb-4">The review questions could not be loaded.</p>
           <Button onClick={onClose}>Go Back</Button>
         </CardContent>
       </Card>
     );
   }
 
   // Results screen
   if (showResults) {
     const correctCount = results.filter(r => r.correct).length;
     const accuracy = Math.round((correctCount / results.length) * 100);
 
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
             <h2 className="text-3xl font-bold mb-2">{correctCount}/{results.length}</h2>
             <p className="text-xl text-muted-foreground mb-4">{accuracy}% Accuracy</p>
             <p className="text-sm text-muted-foreground">
               {correctCount === results.length 
                 ? "Perfect! Keep up the great work!" 
                 : "Incorrect questions will be scheduled for another review."}
             </p>
           </CardContent>
         </Card>
 
         <div className="flex gap-3">
           <Button variant="outline" onClick={onClose} className="flex-1">
             Exit
           </Button>
           <Button onClick={() => {
             setCurrentIndex(0);
             setSelectedAnswer(null);
             setResults([]);
             setShowResults(false);
           }} className="flex-1">
             <RotateCcw className="h-4 w-4 mr-2" />
             Review Again
           </Button>
         </div>
       </motion.div>
     );
   }
 
   return (
     <div className="space-y-4">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Badge className={cn(config.bgColor, config.color, "border-0")}>
             <CategoryIcon className="h-3 w-3 mr-1" />
             {config.label}
           </Badge>
           <Badge variant="outline">{currentQuestion.difficulty}</Badge>
           <Badge variant="secondary">Review</Badge>
         </div>
         <div className="flex items-center gap-3">
           <span className="text-sm font-medium">
             {currentIndex + 1}/{questions.length}
           </span>
           <Button variant="ghost" size="icon" aria-label="Close review" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Progress */}
       <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-1.5" />
 
       {/* Question */}
       <AnimatePresence mode="wait">
         <motion.div
           key={currentIndex}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
         >
           <Card>
             <CardContent className="pt-6">
               <h3 className="text-lg font-semibold mb-2">{currentQuestion.title}</h3>
               <p className="text-muted-foreground mb-6">{currentQuestion.text}</p>
 
               <div className="space-y-3">
                 {currentQuestion.options.map((option, idx) => {
                   const isSelected = selectedAnswer === idx;
                   const isCorrect = option.isCorrect;
                   const showResult = selectedAnswer !== null;
 
                   return (
                     <button
                       key={idx}
                       onClick={() => handleAnswerSelect(idx)}
                       disabled={selectedAnswer !== null}
                       className={cn(
                         "w-full p-4 rounded-lg border text-left transition-all",
                         !showResult && "hover:border-primary/50 hover:bg-accent/50",
                         isSelected && isCorrect && "border-green-500 bg-green-500/10",
                         isSelected && !isCorrect && "border-destructive bg-destructive/10",
                         !isSelected && showResult && isCorrect && "border-green-500/50 bg-green-500/5"
                       )}
                     >
                       <div className="flex items-center justify-between">
                         <span>{option.text}</span>
                         {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                         {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive" />}
                       </div>
                     </button>
                   );
                 })}
               </div>
 
               {/* Show explanation after answering */}
               {selectedAnswer !== null && currentQuestion.answer && (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   className="mt-4 pt-4 border-t"
                 >
                   <div className="flex items-center gap-2 mb-2">
                     <BookOpen className="h-4 w-4 text-primary" />
                     <span className="font-medium text-sm">Explanation</span>
                   </div>
                   <ScrollArea className="h-[150px]">
                     <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-muted/50 p-4 rounded-lg">
                       {currentQuestion.answer.replace(/```[\s\S]*?```/g, (match) => {
                         return match.replace(/```\w*\n?/g, '').trim();
                       }).replace(/##\s*/g, '').replace(/\*\*/g, '').replace(/`/g, '')}
                     </pre>
                   </ScrollArea>
                 </motion.div>
               )}
             </CardContent>
           </Card>
         </motion.div>
       </AnimatePresence>
 
       {/* Next button */}
       <Button
         onClick={handleNext}
         disabled={selectedAnswer === null}
         className="w-full"
         size="lg"
       >
         {currentIndex < questions.length - 1 ? (
           <>
             Next Question
             <ArrowRight className="h-4 w-4 ml-2" />
           </>
         ) : (
           <>
             View Results
             <Trophy className="h-4 w-4 ml-2" />
           </>
         )}
       </Button>
     </div>
   );
 };
 
 export default ReviewQuizMode;