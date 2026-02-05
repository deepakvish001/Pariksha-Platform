 import { motion } from "framer-motion";
 import { 
   Clock, CheckCircle, SkipForward, Flag, 
   ChevronLeft, Trophy, AlertCircle, ListChecks, CircleDot 
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
 import { categoryConfig, formatTime, type QuizQuestion, type SummaryData } from "./types";
 
 interface QuizSummaryProps {
   questions: QuizQuestion[];
   answers: (number | null)[];
   totalTime: number;
   summaryData: SummaryData;
   skippedQuestions: Set<number>;
   markedForReview: Set<number>;
   onGoToQuestion: (index: number) => void;
   onBackToQuiz: () => void;
   onSubmit: () => void;
 }
 
 const QuizSummary = ({
   questions,
   answers,
   totalTime,
   summaryData,
   skippedQuestions,
   markedForReview,
   onGoToQuestion,
   onBackToQuiz,
   onSubmit,
 }: QuizSummaryProps) => {
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="space-y-6"
     >
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
             <ListChecks className="h-6 w-6 text-primary" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Quiz Summary</h2>
             <p className="text-muted-foreground">Review before submitting</p>
           </div>
         </div>
         <div className="flex items-center gap-2 text-sm">
           <Clock className="h-4 w-4 text-muted-foreground" />
           <span>{formatTime(totalTime)}</span>
         </div>
       </div>
 
       {/* Overview Cards */}
       <div className="grid grid-cols-3 gap-4">
         <Card className="border-green-500/30 bg-green-500/5">
           <CardContent className="p-4 text-center">
             <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
             <p className="text-2xl font-bold text-green-600">{summaryData.answered.length}</p>
             <p className="text-sm text-muted-foreground">Answered</p>
           </CardContent>
         </Card>
         <Card className="border-amber-500/30 bg-amber-500/5">
           <CardContent className="p-4 text-center">
             <SkipForward className="h-8 w-8 mx-auto text-amber-500 mb-2" />
             <p className="text-2xl font-bold text-amber-600">{summaryData.skipped.length}</p>
             <p className="text-sm text-muted-foreground">Skipped</p>
           </CardContent>
         </Card>
         <Card className="border-primary/30 bg-primary/5">
           <CardContent className="p-4 text-center">
             <Flag className="h-8 w-8 mx-auto text-primary mb-2" />
             <p className="text-2xl font-bold text-primary">{summaryData.flagged.length}</p>
             <p className="text-sm text-muted-foreground">Flagged</p>
           </CardContent>
         </Card>
       </div>
 
       {/* Question Grid */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg flex items-center gap-2">
             <CircleDot className="h-5 w-5" />
             Question Overview
           </CardTitle>
           <p className="text-sm text-muted-foreground">Click any question to review or change your answer</p>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
             {questions.map((q, idx) => {
               const hasAnswer = answers[idx] !== undefined && answers[idx] !== null;
               const isSkipped = skippedQuestions.has(idx) || !hasAnswer;
               const isFlagged = markedForReview.has(idx);
               
               return (
                 <button
                   key={idx}
                   onClick={() => onGoToQuestion(idx)}
                   className={cn(
                     "relative p-2 rounded-lg border text-sm font-medium transition-all hover:scale-105",
                     hasAnswer && !isSkipped && "border-green-500/50 bg-green-500/10 text-green-600",
                     isSkipped && "border-amber-500/50 bg-amber-500/10 text-amber-600",
                     isFlagged && "ring-2 ring-primary"
                   )}
                 >
                   <span>{idx + 1}</span>
                   {isFlagged && (
                     <Flag className="absolute -top-1 -right-1 h-3 w-3 text-primary fill-primary" />
                   )}
                 </button>
               );
             })}
           </div>
           
           {/* Legend */}
           <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
             <div className="flex items-center gap-1.5">
               <div className="w-4 h-4 rounded border border-green-500/50 bg-green-500/10" />
               <span>Answered</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-4 h-4 rounded border border-amber-500/50 bg-amber-500/10" />
               <span>Skipped</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-4 h-4 rounded border ring-2 ring-primary" />
               <span>Flagged</span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Flagged Questions List */}
       {summaryData.flagged.length > 0 && (
         <Card className="border-primary/30">
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2 text-primary">
               <Flag className="h-5 w-5" />
               Flagged for Review ({summaryData.flagged.length})
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ScrollArea className="max-h-[200px]">
               <div className="space-y-2">
                 {summaryData.flagged.map(idx => {
                   const q = questions[idx];
                   const config = categoryConfig[q.category];
                   const Icon = config.icon;
                   const hasAnswer = answers[idx] !== undefined && answers[idx] !== null;
                   
                   return (
                     <button
                       key={idx}
                       onClick={() => onGoToQuestion(idx)}
                       className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                     >
                       <span className="text-sm font-bold text-muted-foreground w-8">Q{idx + 1}</span>
                       <Badge className={cn(config.bgColor, config.color, "border-0 text-xs")}>
                         <Icon className="h-3 w-3 mr-1" />
                         {config.label}
                       </Badge>
                       <span className="flex-1 text-sm truncate">{q.title}</span>
                       {hasAnswer ? (
                         <Badge variant="outline" className="text-green-600 border-green-500/50">Answered</Badge>
                       ) : (
                         <Badge variant="outline" className="text-amber-600 border-amber-500/50">Skipped</Badge>
                       )}
                     </button>
                   );
                 })}
               </div>
             </ScrollArea>
           </CardContent>
         </Card>
       )}
 
       {/* Skipped Questions Warning */}
       {summaryData.skipped.length > 0 && (
         <Card className="border-amber-500/30 bg-amber-500/5">
           <CardContent className="p-4">
             <div className="flex items-start gap-3">
               <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
               <div>
                 <p className="font-medium text-amber-600">
                   You have {summaryData.skipped.length} unanswered question{summaryData.skipped.length !== 1 ? 's' : ''}
                 </p>
                 <p className="text-sm text-muted-foreground mt-1">
                   Click on a question number above to go back and answer it, or submit now to finish.
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Action Buttons */}
       <div className="flex gap-3">
         <Button 
           variant="outline" 
           onClick={onBackToQuiz}
           className="flex-1"
         >
           <ChevronLeft className="h-4 w-4 mr-2" />
           Back to Quiz
         </Button>
         <Button 
           onClick={onSubmit}
           className="flex-1"
           size="lg"
         >
           <Trophy className="h-4 w-4 mr-2" />
           Submit Quiz
         </Button>
       </div>
     </motion.div>
   );
 };
 
 export default QuizSummary;