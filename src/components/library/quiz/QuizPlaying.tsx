 import { motion, AnimatePresence } from "framer-motion";
 import { 
   X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, 
   Pause, Flag, SkipForward, AlertCircle 
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { cn } from "@/lib/utils";
 import { categoryConfig, formatTime, type QuizQuestion } from "./types";
 
 interface QuizPlayingProps {
   questions: QuizQuestion[];
   currentIndex: number;
   selectedAnswer: number | null;
   answers: (number | null)[];
   totalTime: number;
   timeLimit: number;
   markedForReview: Set<number>;
   skippedQuestions: Set<number>;
   onAnswerSelect: (index: number) => void;
   onNext: () => void;
   onSkip: () => void;
   onPause: () => void;
   onClose: () => void;
   onToggleFlag: (index: number) => void;
   onReturnToSkipped: (index: number) => void;
 }
 
 const QuizPlaying = ({
   questions,
   currentIndex,
   selectedAnswer,
   answers,
   totalTime,
   timeLimit,
   markedForReview,
   skippedQuestions,
   onAnswerSelect,
   onNext,
   onSkip,
   onPause,
   onClose,
   onToggleFlag,
   onReturnToSkipped,
 }: QuizPlayingProps) => {
   const currentQuestion = questions[currentIndex];
   const CategoryIcon = categoryConfig[currentQuestion.category].icon;
   const remainingSkipped = Array.from(skippedQuestions).filter(i => answers[i] === null);
 
   return (
     <div className="space-y-4">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Badge className={cn(categoryConfig[currentQuestion.category].bgColor, categoryConfig[currentQuestion.category].color, "border-0")}>
             <CategoryIcon className="h-3 w-3 mr-1" />
             {categoryConfig[currentQuestion.category].label}
           </Badge>
           <Badge variant="outline">{currentQuestion.difficulty}</Badge>
           {markedForReview.has(currentIndex) && (
             <Badge className="bg-amber-500/10 text-amber-600 border-0">
               <Flag className="h-3 w-3 mr-1" />
               Flagged
             </Badge>
           )}
         </div>
         <div className="flex items-center gap-3">
           <span className="text-sm font-medium">
             {currentIndex + 1}/{questions.length}
           </span>
           <span className={cn(
             "flex items-center gap-1 text-sm font-medium",
             timeLimit > 0 && totalTime > timeLimit * 0.8 ? "text-destructive" : ""
           )}>
             <Clock className="h-4 w-4" />
             {formatTime(timeLimit > 0 ? Math.max(0, timeLimit - totalTime) : totalTime)}
           </span>
           <Button variant="ghost" size="icon" onClick={onPause} title="Pause quiz">
             <Pause className="h-5 w-5" />
           </Button>
           <Button variant="ghost" size="icon" aria-label="Close quiz" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Progress */}
       <div className="space-y-1">
         <Progress value={(currentIndex / questions.length) * 100} className="h-1.5" />
         {/* Question indicators */}
         <div className="flex gap-1 flex-wrap">
           {questions.map((_, idx) => (
             <button
               key={idx}
               className={cn(
                 "w-2 h-2 rounded-full transition-all",
                 idx < currentIndex && answers[idx] !== null && questions[idx].options[answers[idx]!]?.isCorrect && "bg-green-500",
                 idx < currentIndex && answers[idx] !== null && !questions[idx].options[answers[idx]!]?.isCorrect && "bg-destructive",
                 idx < currentIndex && answers[idx] === null && "bg-muted-foreground/50",
                 idx === currentIndex && "bg-primary ring-2 ring-primary/30",
                 idx > currentIndex && "bg-muted",
                 markedForReview.has(idx) && "ring-2 ring-amber-500"
               )}
             />
           ))}
         </div>
       </div>
 
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
                       onClick={() => onAnswerSelect(idx)}
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
             </CardContent>
           </Card>
         </motion.div>
       </AnimatePresence>
 
       {/* Action buttons */}
       <div className="flex gap-3">
         <Button
           variant="outline"
           onClick={() => onToggleFlag(currentIndex)}
           className={cn(
             "flex-shrink-0",
             markedForReview.has(currentIndex) && "border-amber-500 bg-amber-500/10 text-amber-600"
           )}
         >
           <Flag className={cn("h-4 w-4", markedForReview.has(currentIndex) ? "fill-amber-500" : "")} />
         </Button>
         <Button
           variant="outline"
           onClick={onSkip}
           disabled={selectedAnswer !== null}
           className="flex-shrink-0"
           title="Skip and answer later"
         >
           <SkipForward className="h-4 w-4" />
         </Button>
         <Button
           onClick={onNext}
           disabled={selectedAnswer === null}
           className="flex-1"
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
 
       {/* Skipped questions indicator */}
       {remainingSkipped.length > 0 && (
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5"
         >
           <div className="flex items-center gap-2 mb-2">
             <AlertCircle className="h-4 w-4 text-amber-500" />
             <span className="text-sm font-medium">{remainingSkipped.length} skipped question{remainingSkipped.length !== 1 ? 's' : ''}</span>
           </div>
           <div className="flex gap-2 flex-wrap">
             {remainingSkipped.map(idx => (
               <Button
                 key={idx}
                 variant="outline"
                 size="sm"
                 className="h-7 text-xs"
                 onClick={() => onReturnToSkipped(idx)}
               >
                 Q{idx + 1}
               </Button>
             ))}
           </div>
         </motion.div>
       )}
     </div>
   );
 };
 
 export default QuizPlaying;