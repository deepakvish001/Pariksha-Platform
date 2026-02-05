 import { motion } from "framer-motion";
 import { X, PauseCircle, PlayCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { formatTime } from "./types";
 
 interface QuizPausedProps {
   currentIndex: number;
   questionsLength: number;
   totalTime: number;
   timeLimit: number;
   onResume: () => void;
   onClose: () => void;
 }
 
 const QuizPaused = ({
   currentIndex,
   questionsLength,
   totalTime,
   timeLimit,
   onResume,
   onClose,
 }: QuizPausedProps) => {
   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
     >
       <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
         <PauseCircle className="h-12 w-12 text-primary" />
       </div>
       
       <div className="text-center space-y-2">
         <h2 className="text-2xl font-bold">Quiz Paused</h2>
         <p className="text-muted-foreground">
           Question {currentIndex + 1} of {questionsLength}
         </p>
         <p className="text-sm text-muted-foreground">
           Time elapsed: {formatTime(totalTime)}
           {timeLimit > 0 && ` / ${formatTime(timeLimit)}`}
         </p>
       </div>
 
       <div className="flex gap-3">
         <Button variant="outline" onClick={onClose}>
           <X className="h-4 w-4 mr-2" />
           Exit Quiz
         </Button>
         <Button onClick={onResume} size="lg">
           <PlayCircle className="h-5 w-5 mr-2" />
           Resume Quiz
         </Button>
       </div>
     </motion.div>
   );
 };
 
 export default QuizPaused;