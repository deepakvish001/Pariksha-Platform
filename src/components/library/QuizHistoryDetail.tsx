 import { useState, useMemo } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { format } from "date-fns";
 import {
   CheckCircle,
   XCircle,
   ChevronLeft,
   ChevronRight,
   Flag,
   BookOpen,
   Clock,
   Target,
   Trophy,
   AlertCircle,
   X,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { cn } from "@/lib/utils";
 import { useQuizHistoryDetail, type ReconstructedQuestion } from "@/hooks/useQuizHistoryDetail";
 import { categoryConfig, formatTime } from "./quiz/types";
 
 type ReviewFilter = "all" | "incorrect" | "skipped" | "flagged";
 
 interface QuizHistoryDetailProps {
   quizResultId: string | null;
   isOpen: boolean;
   onClose: () => void;
 }
 
 const QuizHistoryDetail = ({ quizResultId, isOpen, onClose }: QuizHistoryDetailProps) => {
   const { quizResult, questions, isLoading, error, hasResponses } = useQuizHistoryDetail(quizResultId);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
 
   // Filter questions based on selected filter
   const filteredQuestions = useMemo(() => {
     return questions.filter(q => {
       if (reviewFilter === "all") return true;
       if (reviewFilter === "incorrect") return !q.isCorrect && q.selectedAnswerIndex !== null;
       if (reviewFilter === "skipped") return q.selectedAnswerIndex === null;
       if (reviewFilter === "flagged") return q.wasFlagged;
       return true;
     });
   }, [questions, reviewFilter]);
 
   // Reset index when filter changes
   const handleFilterChange = (filter: ReviewFilter) => {
     setReviewFilter(filter);
     setCurrentIndex(0);
   };
 
   // Calculate stats
   const stats = useMemo(() => {
     const correct = questions.filter(q => q.isCorrect).length;
     const incorrect = questions.filter(q => !q.isCorrect && q.selectedAnswerIndex !== null).length;
     const skipped = questions.filter(q => q.selectedAnswerIndex === null).length;
     const flagged = questions.filter(q => q.wasFlagged).length;
     return { correct, incorrect, skipped, flagged };
   }, [questions]);
 
   if (!isOpen) return null;
 
   return (
     <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
         <DialogHeader className="p-6 pb-0">
           <DialogTitle className="flex items-center gap-2">
             <BookOpen className="h-5 w-5 text-primary" />
             Quiz Review
             {quizResult && (
               <span className="text-sm font-normal text-muted-foreground ml-2">
                 {format(new Date(quizResult.completed_at), "MMM d, yyyy 'at' h:mm a")}
               </span>
             )}
           </DialogTitle>
         </DialogHeader>
 
         {isLoading ? (
           <div className="flex items-center justify-center p-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
           </div>
         ) : error ? (
           <div className="flex flex-col items-center justify-center p-12 text-center">
             <AlertCircle className="h-12 w-12 text-destructive mb-4" />
             <p className="text-muted-foreground">{error}</p>
           </div>
         ) : !hasResponses ? (
           <div className="flex flex-col items-center justify-center p-12 text-center">
             <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
             <p className="text-lg font-medium mb-2">Detailed review not available</p>
             <p className="text-muted-foreground">
               This quiz was completed before detailed tracking was enabled.
             </p>
           </div>
         ) : (
           <div className="flex-1 overflow-hidden flex flex-col p-6 pt-4">
             {/* Stats Row */}
             <div className="grid grid-cols-4 gap-3 mb-4">
               <Card className="bg-card/50">
                 <CardContent className="p-3 flex items-center gap-3">
                   <Trophy className="h-5 w-5 text-amber-500" />
                   <div>
                     <p className="text-lg font-bold">{quizResult?.score}/{quizResult?.total_questions}</p>
                     <p className="text-xs text-muted-foreground">Score</p>
                   </div>
                 </CardContent>
               </Card>
               <Card className="bg-card/50">
                 <CardContent className="p-3 flex items-center gap-3">
                   <Target className="h-5 w-5 text-primary" />
                   <div>
                     <p className="text-lg font-bold">{quizResult?.accuracy}%</p>
                     <p className="text-xs text-muted-foreground">Accuracy</p>
                   </div>
                 </CardContent>
               </Card>
               <Card className="bg-card/50">
                 <CardContent className="p-3 flex items-center gap-3">
                   <Clock className="h-5 w-5 text-blue-500" />
                   <div>
                     <p className="text-lg font-bold">{formatTime(quizResult?.total_time_seconds || 0)}</p>
                     <p className="text-xs text-muted-foreground">Total Time</p>
                   </div>
                 </CardContent>
               </Card>
               <Card className="bg-card/50">
                 <CardContent className="p-3 flex items-center gap-3">
                   <Clock className="h-5 w-5 text-muted-foreground" />
                   <div>
                     <p className="text-lg font-bold">{quizResult?.avg_time_seconds}s</p>
                     <p className="text-xs text-muted-foreground">Avg/Question</p>
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Question Grid Navigator */}
             <div className="mb-4">
               <div className="flex flex-wrap gap-1.5">
                 {questions.map((q, idx) => (
                   <button
                     key={idx}
                     onClick={() => {
                       setReviewFilter("all");
                       setCurrentIndex(idx);
                     }}
                     className={cn(
                       "w-8 h-8 rounded text-xs font-medium transition-all",
                       currentIndex === idx && reviewFilter === "all" && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                       q.isCorrect
                         ? "bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30"
                         : q.selectedAnswerIndex === null
                           ? "bg-muted text-muted-foreground hover:bg-muted/80"
                           : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                     )}
                   >
                     {idx + 1}
                     {q.wasFlagged && (
                       <Flag className="h-2 w-2 absolute top-0 right-0 text-amber-500" />
                     )}
                   </button>
                 ))}
               </div>
               <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                 <span className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded bg-emerald-500/20" /> Correct ({stats.correct})
                 </span>
                 <span className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded bg-destructive/20" /> Incorrect ({stats.incorrect})
                 </span>
                 <span className="flex items-center gap-1">
                   <div className="w-3 h-3 rounded bg-muted" /> Skipped ({stats.skipped})
                 </span>
               </div>
             </div>
 
             {/* Filter Tabs */}
             <div className="flex items-center justify-between mb-4">
               <Tabs value={reviewFilter} onValueChange={(v) => handleFilterChange(v as ReviewFilter)}>
                 <TabsList className="h-8">
                   <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                   <TabsTrigger value="incorrect" className="text-xs px-3">
                     Incorrect ({stats.incorrect})
                   </TabsTrigger>
                   <TabsTrigger value="skipped" className="text-xs px-3">
                     Skipped ({stats.skipped})
                   </TabsTrigger>
                   <TabsTrigger value="flagged" className="text-xs px-3">
                     <Flag className="h-3 w-3 mr-1" />
                     Flagged ({stats.flagged})
                   </TabsTrigger>
                 </TabsList>
               </Tabs>
               {filteredQuestions.length > 0 && (
                 <span className="text-sm text-muted-foreground">
                   Q {currentIndex + 1} of {filteredQuestions.length}
                 </span>
               )}
             </div>
 
             {/* Question Detail */}
             <ScrollArea className="flex-1">
               {filteredQuestions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12">
                   <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
                   <p className="text-lg font-medium">No questions in this category</p>
                   <p className="text-muted-foreground">Try selecting a different filter.</p>
                 </div>
               ) : (
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={`${reviewFilter}-${currentIndex}`}
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.2 }}
                   >
                     <QuestionCard
                       item={filteredQuestions[currentIndex]}
                       originalIndex={
                         reviewFilter === "all"
                           ? currentIndex
                           : questions.findIndex(q => q === filteredQuestions[currentIndex])
                       }
                     />
                   </motion.div>
                 </AnimatePresence>
               )}
             </ScrollArea>
 
             {/* Navigation */}
             {filteredQuestions.length > 0 && (
               <div className="flex gap-3 mt-4 pt-4 border-t">
                 <Button
                   variant="outline"
                   onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                   disabled={currentIndex === 0}
                   className="flex-1"
                 >
                   <ChevronLeft className="h-4 w-4 mr-2" />
                   Previous
                 </Button>
                 <Button
                   onClick={() => setCurrentIndex(Math.min(filteredQuestions.length - 1, currentIndex + 1))}
                   disabled={currentIndex === filteredQuestions.length - 1}
                   className="flex-1"
                 >
                   Next
                   <ChevronRight className="h-4 w-4 ml-2" />
                 </Button>
               </div>
             )}
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 };
 
 // Question Card Component
 interface QuestionCardProps {
   item: ReconstructedQuestion;
   originalIndex: number;
 }
 
 const QuestionCard = ({ item, originalIndex }: QuestionCardProps) => {
   const { question, selectedAnswerIndex, isCorrect, timeTakenSeconds, wasFlagged, isUnavailable } = item;
 
   if (isUnavailable || !question) {
     return (
       <Card className="border-dashed">
         <CardContent className="py-8 text-center">
           <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
           <p className="font-medium">Question no longer available</p>
           <p className="text-sm text-muted-foreground">
             This question may have been removed or updated.
           </p>
         </CardContent>
       </Card>
     );
   }
 
   const CategoryIcon = categoryConfig[question.category].icon;
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center gap-2 flex-wrap mb-2">
           <Badge className={cn(categoryConfig[question.category].bgColor, categoryConfig[question.category].color, "border-0")}>
             <CategoryIcon className="h-3 w-3 mr-1" />
             {categoryConfig[question.category].label}
           </Badge>
           <Badge variant="outline">{question.difficulty}</Badge>
           {selectedAnswerIndex === null ? (
             <Badge variant="secondary">Skipped</Badge>
           ) : isCorrect ? (
             <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
               <CheckCircle className="h-3 w-3 mr-1" />
               Correct
             </Badge>
           ) : (
             <Badge variant="destructive">
               <XCircle className="h-3 w-3 mr-1" />
               Incorrect
             </Badge>
           )}
           {wasFlagged && (
             <Badge className="bg-amber-500/10 text-amber-600 border-0">
               <Flag className="h-3 w-3 mr-1" />
               Flagged
             </Badge>
           )}
           <Badge variant="outline" className="ml-auto">
             <Clock className="h-3 w-3 mr-1" />
             {timeTakenSeconds}s
           </Badge>
         </div>
         <CardTitle className="text-lg">
           <span className="text-muted-foreground mr-2">#{originalIndex + 1}</span>
           {question.title}
         </CardTitle>
         <p className="text-muted-foreground text-sm mt-1">{question.text}</p>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Options */}
         <div className="space-y-2">
           {question.options.map((option, idx) => {
             const isUserAnswer = selectedAnswerIndex === idx;
             const isCorrectOption = option.isCorrect;
             return (
               <div
                 key={idx}
                 className={cn(
                   "p-3 rounded-lg border text-sm",
                   isCorrectOption && "border-emerald-500 bg-emerald-500/10",
                   isUserAnswer && !isCorrectOption && "border-destructive bg-destructive/10"
                 )}
               >
                 <div className="flex items-center justify-between gap-2">
                   <span className="flex-1">{option.text}</span>
                   <div className="flex items-center gap-2 flex-shrink-0">
                     {isUserAnswer && !isCorrectOption && (
                       <span className="text-xs text-destructive flex items-center gap-1">
                         <XCircle className="h-4 w-4" />
                         Your answer
                       </span>
                     )}
                     {isCorrectOption && (
                       <span className="text-xs text-emerald-600 flex items-center gap-1">
                         <CheckCircle className="h-4 w-4" />
                         Correct
                       </span>
                     )}
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
 
         {/* Explanation */}
         {question.answer && (
           <div className="border-t pt-4">
             <div className="flex items-center gap-2 mb-3">
               <BookOpen className="h-4 w-4 text-primary" />
               <span className="font-medium text-sm">Explanation</span>
             </div>
             <ScrollArea className="max-h-[200px]">
               <div className="prose prose-sm dark:prose-invert max-w-none">
                 <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-muted/50 p-4 rounded-lg">
                   {question.answer.replace(/```[\s\S]*?```/g, (match) => {
                     return match.replace(/```\w*\n?/g, '').trim();
                   }).replace(/##\s*/g, '').replace(/\*\*/g, '').replace(/`/g, '')}
                 </pre>
               </div>
             </ScrollArea>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default QuizHistoryDetail;