 import { motion, AnimatePresence } from "framer-motion";
 import { 
   CheckCircle, XCircle, ChevronLeft, ChevronRight, 
   Flag, BookOpen 
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { cn } from "@/lib/utils";
 import { categoryConfig, type ReviewItem, type ReviewFilter } from "./types";
 
 interface QuizReviewProps {
   filteredReviewQuestions: ReviewItem[];
   reviewIndex: number;
   reviewFilter: ReviewFilter;
   onSetReviewIndex: (index: number) => void;
   onSetReviewFilter: (filter: ReviewFilter) => void;
   onBackToResults: () => void;
 }
 
 const QuizReview = ({
   filteredReviewQuestions,
   reviewIndex,
   reviewFilter,
   onSetReviewIndex,
   onSetReviewFilter,
   onBackToResults,
 }: QuizReviewProps) => {
   if (filteredReviewQuestions.length === 0) {
     return (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="space-y-6"
       >
         <div className="flex items-center justify-between">
           <Button variant="ghost" onClick={onBackToResults}>
             <ChevronLeft className="h-4 w-4 mr-2" />
             Back to Results
           </Button>
         </div>
         <Card className="text-center py-12">
           <CardContent>
             <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
             <h3 className="text-xl font-bold mb-2">Perfect Score!</h3>
             <p className="text-muted-foreground">You answered all questions correctly. Nothing to review!</p>
           </CardContent>
         </Card>
       </motion.div>
     );
   }
 
   const currentReviewItem = filteredReviewQuestions[reviewIndex];
   const reviewQuestion = currentReviewItem.question;
   const userAnswer = currentReviewItem.userAnswer;
   const ReviewCategoryIcon = categoryConfig[reviewQuestion.category].icon;
 
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="space-y-4"
     >
       {/* Header */}
       <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={onBackToResults}>
           <ChevronLeft className="h-4 w-4 mr-2" />
           Back to Results
         </Button>
         <div className="flex items-center gap-2">
           <Tabs value={reviewFilter} onValueChange={(v) => { onSetReviewFilter(v as ReviewFilter); onSetReviewIndex(0); }}>
             <TabsList className="h-8">
               <TabsTrigger value="incorrect" className="text-xs px-2">Incorrect</TabsTrigger>
               <TabsTrigger value="unanswered" className="text-xs px-2">Skipped</TabsTrigger>
               <TabsTrigger value="flagged" className="text-xs px-2">
                 <Flag className="h-3 w-3 mr-1" />
                 Flagged
               </TabsTrigger>
               <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
       </div>
 
       {/* Progress */}
       <div className="flex items-center justify-between text-sm text-muted-foreground">
         <span>Question {reviewIndex + 1} of {filteredReviewQuestions.length}</span>
         <span>Original #{currentReviewItem.index + 1}</span>
       </div>
       <Progress value={((reviewIndex + 1) / filteredReviewQuestions.length) * 100} className="h-1.5" />
 
       {/* Question Card */}
       <AnimatePresence mode="wait">
         <motion.div
           key={reviewIndex}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
         >
           <Card>
             <CardHeader className="pb-3">
               <div className="flex items-center gap-2 mb-2">
                 <Badge className={cn(categoryConfig[reviewQuestion.category].bgColor, categoryConfig[reviewQuestion.category].color, "border-0")}>
                   <ReviewCategoryIcon className="h-3 w-3 mr-1" />
                   {categoryConfig[reviewQuestion.category].label}
                 </Badge>
                 <Badge variant="outline">{reviewQuestion.difficulty}</Badge>
                 {currentReviewItem.isUnanswered ? (
                   <Badge variant="secondary">Skipped</Badge>
                 ) : !currentReviewItem.isCorrect ? (
                   <Badge variant="destructive">Incorrect</Badge>
                 ) : (
                   <Badge className="bg-green-500/10 text-green-600 border-0">Correct</Badge>
                 )}
                 {currentReviewItem.isMarked && (
                   <Badge className="bg-amber-500/10 text-amber-600 border-0">
                     <Flag className="h-3 w-3 mr-1" />
                     Flagged
                   </Badge>
                 )}
               </div>
               <CardTitle className="text-lg">{reviewQuestion.title}</CardTitle>
               <p className="text-muted-foreground text-sm">{reviewQuestion.text}</p>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Options with correct/incorrect highlighting */}
               <div className="space-y-2">
                 {reviewQuestion.options.map((option, idx) => {
                   const isUserAnswer = userAnswer === idx;
                   const isCorrect = option.isCorrect;
                   return (
                     <div
                       key={idx}
                       className={cn(
                         "p-3 rounded-lg border text-sm",
                         isCorrect && "border-green-500 bg-green-500/10",
                         isUserAnswer && !isCorrect && "border-destructive bg-destructive/10"
                       )}
                     >
                       <div className="flex items-center justify-between">
                         <span>{option.text}</span>
                         <div className="flex items-center gap-2">
                           {isUserAnswer && !isCorrect && (
                             <span className="text-xs text-destructive flex items-center gap-1">
                               <XCircle className="h-4 w-4" />
                               Your answer
                             </span>
                           )}
                           {isCorrect && (
                             <span className="text-xs text-green-600 flex items-center gap-1">
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
               {reviewQuestion.answer && (
                 <div className="border-t pt-4">
                   <div className="flex items-center gap-2 mb-3">
                     <BookOpen className="h-4 w-4 text-primary" />
                     <span className="font-medium text-sm">Explanation</span>
                   </div>
                   <ScrollArea className="h-[200px]">
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                       <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans bg-muted/50 p-4 rounded-lg">
                         {reviewQuestion.answer.replace(/```[\s\S]*?```/g, (match) => {
                           return match.replace(/```\w*\n?/g, '').trim();
                         }).replace(/##\s*/g, '').replace(/\*\*/g, '').replace(/`/g, '')}
                       </pre>
                     </div>
                   </ScrollArea>
                 </div>
               )}
             </CardContent>
           </Card>
         </motion.div>
       </AnimatePresence>
 
       {/* Navigation */}
       <div className="flex gap-3">
         <Button
           variant="outline"
           onClick={() => onSetReviewIndex(Math.max(0, reviewIndex - 1))}
           disabled={reviewIndex === 0}
           className="flex-1"
         >
           <ChevronLeft className="h-4 w-4 mr-2" />
           Previous
         </Button>
         <Button
           onClick={() => onSetReviewIndex(Math.min(filteredReviewQuestions.length - 1, reviewIndex + 1))}
           disabled={reviewIndex === filteredReviewQuestions.length - 1}
           className="flex-1"
         >
           Next
           <ChevronRight className="h-4 w-4 ml-2" />
         </Button>
       </div>
     </motion.div>
   );
 };
 
 export default QuizReview;