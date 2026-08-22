 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   Clock, AlertCircle, CheckCircle, XCircle, Brain, 
   ChevronRight, Trash2, Play, Code, Cpu, Database, Calculator
 } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
import { useQuizSpacedRepetition, type QuizReviewItem } from "@/hooks/useQuizSpacedRepetition";
 import { dsaQuestions } from "@/data/dsaQuestionsData";
 import { csQuestions } from "@/data/csSubjectsData";
 import { sqlQuestions } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions } from "@/data/aptitudeQuestionsData";
 
 interface QuizSpacedRepetitionPanelProps {
   onStartReviewQuiz: (reviews: QuizReviewItem[]) => void;
 }
 
 const categoryConfig = {
   dsa: { label: "DSA", icon: Code, color: "text-blue-500", bgColor: "bg-blue-500/10" },
   cs: { label: "CS", icon: Cpu, color: "text-purple-500", bgColor: "bg-purple-500/10" },
   sql: { label: "SQL", icon: Database, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
   aptitude: { label: "Aptitude", icon: Calculator, color: "text-amber-500", bgColor: "bg-amber-500/10" },
 };
 
 function formatDueTime(hoursUntilDue: number): string {
   if (hoursUntilDue < -24) {
     const days = Math.abs(Math.floor(hoursUntilDue / 24));
     return `${days}d overdue`;
   }
   if (hoursUntilDue < 0) {
     return `${Math.abs(Math.floor(hoursUntilDue))}h overdue`;
   }
   if (hoursUntilDue < 1) {
     return "Due now";
   }
   if (hoursUntilDue < 24) {
     return `in ${Math.floor(hoursUntilDue)}h`;
   }
   const days = Math.floor(hoursUntilDue / 24);
   return `in ${days}d`;
 }
 
 const QuizSpacedRepetitionPanel = ({ onStartReviewQuiz }: QuizSpacedRepetitionPanelProps) => {
  const { reviews, stats, isLoading, removeFromReview, masteryThreshold } = useQuizSpacedRepetition();
   const [expandedId, setExpandedId] = useState<string | null>(null);
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           
         </CardContent>
       </Card>
     );
   }
 
   if (reviews.length === 0) {
     return null;
   }
 
   const dueNow = reviews.filter(r => r.urgency === "critical" || r.urgency === "due");
 
   return (
     <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Brain className="h-5 w-5 text-amber-500" />
             Spaced Repetition
             {stats.critical > 0 && (
               <Badge variant="destructive" className="ml-2">
                 {stats.critical} overdue
               </Badge>
             )}
           </CardTitle>
           {dueNow.length > 0 && (
             <Button 
               size="sm" 
               onClick={() => onStartReviewQuiz(dueNow)}
               className="gap-2"
             >
               <Play className="h-4 w-4" />
               Review Now ({dueNow.length})
             </Button>
           )}
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Stats */}
         <div className="grid grid-cols-3 gap-3 text-center">
           <div className={cn("p-3 rounded-lg", stats.critical > 0 ? "bg-destructive/10" : "bg-muted/50")}>
             <AlertCircle className={cn("h-5 w-5 mx-auto mb-1", stats.critical > 0 ? "text-destructive" : "text-muted-foreground")} />
             <p className="text-2xl font-bold">{stats.critical}</p>
             <p className="text-xs text-muted-foreground">Overdue</p>
           </div>
           <div className={cn("p-3 rounded-lg", stats.due > 0 ? "bg-amber-500/10" : "bg-muted/50")}>
             <Clock className={cn("h-5 w-5 mx-auto mb-1", stats.due > 0 ? "text-amber-500" : "text-muted-foreground")} />
             <p className="text-2xl font-bold">{stats.due}</p>
             <p className="text-xs text-muted-foreground">Due Today</p>
           </div>
           <div className="p-3 rounded-lg bg-muted/50">
             <ChevronRight className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
             <p className="text-2xl font-bold">{stats.upcoming}</p>
             <p className="text-xs text-muted-foreground">Upcoming</p>
           </div>
         </div>
 
         {/* Question list */}
         <ScrollArea className="h-[200px]">
           <div className="space-y-2">
             {reviews.slice(0, 10).map((review) => {
               const config = categoryConfig[review.category as keyof typeof categoryConfig] || categoryConfig.dsa;
               const Icon = config.icon;
               
               return (
                 <motion.div
                   key={review.id}
                   layout
                   className={cn(
                     "p-3 rounded-lg border transition-all cursor-pointer",
                     review.urgency === "critical" && "border-destructive/50 bg-destructive/5",
                     review.urgency === "due" && "border-amber-500/50 bg-amber-500/5",
                     review.urgency === "upcoming" && "border-border",
                     expandedId === review.id && "ring-2 ring-primary/20"
                   )}
                   role="button"
                   tabIndex={0}
                   aria-expanded={expandedId === review.id}
                   onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                   onKeyDown={(e) => {
                     if (e.key === "Enter" || e.key === " ") {
                       e.preventDefault();
                       setExpandedId(expandedId === review.id ? null : review.id);
                     }
                   }}
                 >
                   <div className="flex items-start justify-between gap-2">
                     <div className="flex items-start gap-2 flex-1 min-w-0">
                       <div className={cn("p-1.5 rounded", config.bgColor)}>
                         <Icon className={cn("h-3.5 w-3.5", config.color)} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium text-sm truncate">{review.title}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-xs">
                             {config.label}
                           </Badge>
                           <span className={cn(
                             "text-xs",
                             review.urgency === "critical" && "text-destructive",
                             review.urgency === "due" && "text-amber-600",
                             review.urgency === "upcoming" && "text-muted-foreground"
                           )}>
                             {formatDueTime(review.hoursUntilDue)}
                           </span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <span className="text-xs text-muted-foreground">
                        {review.correctStreak}/{masteryThreshold}
                       </span>
                      <Progress value={(review.correctStreak / masteryThreshold) * 100} className="w-8 h-1.5" />
                     </div>
                   </div>
 
                   <AnimatePresence>
                     {expandedId === review.id && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <div className="pt-3 mt-3 border-t flex items-center justify-between">
                           <p className="text-xs text-muted-foreground">
                            Reviewed {review.reviewCount} time(s) • Streak: {review.correctStreak}/{masteryThreshold}
                           </p>
                           <Button 
                             size="sm" 
                             variant="ghost" 
                             className="h-7 text-destructive hover:text-destructive"
                             onClick={(e) => {
                               e.stopPropagation();
                               removeFromReview(review.id);
                             }}
                           >
                             <Trash2 className="h-3.5 w-3.5 mr-1" />
                             Remove
                           </Button>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               );
             })}
           </div>
         </ScrollArea>
 
         {reviews.length > 10 && (
           <p className="text-xs text-center text-muted-foreground">
             +{reviews.length - 10} more questions in queue
           </p>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default QuizSpacedRepetitionPanel;