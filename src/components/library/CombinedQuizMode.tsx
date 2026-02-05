 import { useState, useMemo, useEffect, useRef } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, 
   Shuffle, Zap, Target, Settings, Play, Pause, RotateCcw,
  Code, Cpu, Database, Calculator, Brain, BookOpen, ChevronLeft, ChevronRight, Eye, Flag, PauseCircle, PlayCircle, SkipForward, AlertCircle
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Slider } from "@/components/ui/slider";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { cn } from "@/lib/utils";
 import { dsaQuestions, type DSAQuestion } from "@/data/dsaQuestionsData";
 import { csQuestions, type CSQuestion } from "@/data/csSubjectsData";
 import { sqlQuestions, type SQLQuestion } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions, type AptitudeQuestion } from "@/data/aptitudeQuestionsData";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
import { useQuizSpacedRepetition } from "@/hooks/useQuizSpacedRepetition";
import { useXPSystem, XP_VALUES } from "@/hooks/useXPSystem";
 
 interface CombinedQuizModeProps {
   onClose: () => void;
 }
 
 interface QuizQuestion {
   id: number;
   category: "dsa" | "cs" | "sql" | "aptitude";
   title: string;
   text: string;
   options: { text: string; isCorrect: boolean }[];
   difficulty: string;
  answer?: string;
 }
 
type QuizState = "setup" | "playing" | "paused" | "results" | "review";
 
 const categoryConfig = {
   dsa: { 
     label: "DSA", 
     icon: Code, 
     color: "text-blue-500", 
     bgColor: "bg-blue-500/10",
     borderColor: "border-blue-500/30"
   },
   cs: { 
     label: "CS Core", 
     icon: Cpu, 
     color: "text-purple-500", 
     bgColor: "bg-purple-500/10",
     borderColor: "border-purple-500/30"
   },
   sql: { 
     label: "SQL", 
     icon: Database, 
     color: "text-emerald-500", 
     bgColor: "bg-emerald-500/10",
     borderColor: "border-emerald-500/30"
   },
   aptitude: { 
     label: "Aptitude", 
     icon: Calculator, 
     color: "text-amber-500", 
     bgColor: "bg-amber-500/10",
     borderColor: "border-amber-500/30"
   },
 };
 
 const presets = [
   { name: "Quick Mix", questions: 10, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 0 },
   { name: "DSA Focus", questions: 15, categories: ["dsa", "cs"] as const, timeLimit: 0 },
   { name: "Database Master", questions: 15, categories: ["sql", "cs"] as const, timeLimit: 0 },
   { name: "Sprint (5 min)", questions: 10, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 300 },
   { name: "Blitz (10 min)", questions: 20, categories: ["dsa", "cs", "sql", "aptitude"] as const, timeLimit: 600 },
 ];
 
 const CombinedQuizMode = ({ onClose }: CombinedQuizModeProps) => {
   const { user } = useAuth();
   const { toast } = useToast();
  const { scheduleForReview } = useQuizSpacedRepetition();
  const { awardXP } = useXPSystem();
   const [quizState, setQuizState] = useState<QuizState>("setup");
   const [questions, setQuestions] = useState<QuizQuestion[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
   const [answers, setAnswers] = useState<(number | null)[]>([]);
   const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
   const [questionStartTime, setQuestionStartTime] = useState(0);
   const [totalTime, setTotalTime] = useState(0);
   const [timeLimit, setTimeLimit] = useState(0);
   const timerRef = useRef<NodeJS.Timeout | null>(null);
   
   // Setup state
   const [questionCount, setQuestionCount] = useState(10);
   const [enabledCategories, setEnabledCategories] = useState({
     dsa: true,
     cs: true,
     sql: true,
     aptitude: true,
   });
   const [timedMode, setTimedMode] = useState(false);
   const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);

  // Pause state
  const [pausedTime, setPausedTime] = useState(0);

  // Review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect" | "unanswered" | "flagged">("incorrect");
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());

  // Skip tracking
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
 
   // Prepare questions pool
   const allQuestions = useMemo(() => {
     const pool: QuizQuestion[] = [];
     
     if (enabledCategories.dsa) {
       dsaQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "dsa",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.cs) {
       csQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "cs",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.sql) {
       sqlQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "sql",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     if (enabledCategories.aptitude) {
       aptitudeQuestions.filter(q => q.options?.length).forEach(q => {
         pool.push({
           id: q.id,
           category: "aptitude",
           title: q.title,
           text: q.text,
           options: q.options!,
           difficulty: q.difficulty,
            answer: q.answer,
         });
       });
     }
     
     return pool;
   }, [enabledCategories]);
 
   // Timer effect
   useEffect(() => {
     if (quizState === "playing") {
       timerRef.current = setInterval(() => {
         setTotalTime(prev => {
           const newTime = prev + 1;
           if (timeLimit > 0 && newTime >= timeLimit) {
             handleTimeUp();
             return prev;
           }
           return newTime;
         });
       }, 1000);
     } else {
       if (timerRef.current) clearInterval(timerRef.current);
     }
     return () => {
       if (timerRef.current) clearInterval(timerRef.current);
     };
   }, [quizState, timeLimit]);
 
   const handleTimeUp = () => {
     if (timerRef.current) clearInterval(timerRef.current);
     // Auto-submit remaining as null
     const remaining = questions.length - currentIndex;
     const newAnswers = [...answers];
     for (let i = 0; i < remaining; i++) {
       newAnswers.push(null);
     }
     setAnswers(newAnswers);
     setQuizState("results");
     saveResults(newAnswers);
   };
 
   const startQuiz = (preset?: typeof presets[0]) => {
     let count = questionCount;
     let cats = { ...enabledCategories };
     let limit = timedMode ? timeLimitMinutes * 60 : 0;
     
     if (preset) {
       count = preset.questions;
       cats = { dsa: false, cs: false, sql: false, aptitude: false };
       preset.categories.forEach(c => cats[c] = true);
       limit = preset.timeLimit;
     }
     
     // Shuffle and pick questions
     const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
     const selected = shuffled.slice(0, Math.min(count, shuffled.length));
     
     setQuestions(selected);
     setAnswers([]);
     setTimePerQuestion([]);
     setCurrentIndex(0);
     setSelectedAnswer(null);
     setTotalTime(0);
     setTimeLimit(limit);
     setQuestionStartTime(Date.now());
      setMarkedForReview(new Set());
      setSkippedQuestions(new Set());
     setQuizState("playing");
   };
 
  const handlePause = () => {
    setPausedTime(Date.now());
    setQuizState("paused");
  };

  const handleResume = () => {
    // Adjust question start time to account for pause duration
    const pauseDuration = Date.now() - pausedTime;
    setQuestionStartTime(prev => prev + pauseDuration);
    setQuizState("playing");
  };

  const toggleMarkForReview = (index: number) => {
    setMarkedForReview(prev => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
      }
      return updated;
    });
  };

  const handleSkip = () => {
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    setTimePerQuestion(prev => [...prev, timeTaken]);
    setAnswers(prev => [...prev, null]); // Mark as unanswered
    setSkippedQuestions(prev => new Set(prev).add(currentIndex));
    
    // Find the next unanswered question or go to results
    const nextUnanswered = findNextUnanswered(currentIndex + 1);
    
    if (nextUnanswered !== -1) {
      setCurrentIndex(nextUnanswered);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      // Check if there are any skipped questions to revisit
      const firstSkipped = findFirstSkipped();
      if (firstSkipped !== -1) {
        setCurrentIndex(firstSkipped);
        setSelectedAnswer(null);
        setQuestionStartTime(Date.now());
      } else {
        // All questions answered, go to results
        const finalAnswers = [...answers, null];
        setQuizState("results");
        saveResults(finalAnswers);
      }
    }
  };

  const findNextUnanswered = (startFrom: number): number => {
    for (let i = startFrom; i < questions.length; i++) {
      if (answers[i] === undefined) {
        return i;
      }
    }
    return -1;
  };

  const findFirstSkipped = (): number => {
    for (let i = 0; i < questions.length; i++) {
      if (skippedQuestions.has(i) && answers[i] === null) {
        return i;
      }
    }
    return -1;
  };

  const handleReturnToSkipped = (index: number) => {
    // Save current answer state if needed
    if (selectedAnswer !== null && answers[currentIndex] === undefined) {
      const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
      setTimePerQuestion(prev => {
        const updated = [...prev];
        updated[currentIndex] = timeTaken;
        return updated;
      });
      setAnswers(prev => {
        const updated = [...prev];
        updated[currentIndex] = selectedAnswer;
        return updated;
      });
    }
    
    setCurrentIndex(index);
    setSelectedAnswer(null);
    setQuestionStartTime(Date.now());
    // Remove from skipped when returning
    setSkippedQuestions(prev => {
      const updated = new Set(prev);
      updated.delete(index);
      return updated;
    });
  };

   const handleAnswerSelect = (index: number) => {
     if (selectedAnswer !== null) return;
     setSelectedAnswer(index);
   };
 
   const handleNext = () => {
     const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
     setTimePerQuestion(prev => [...prev, timeTaken]);
     setAnswers(prev => [...prev, selectedAnswer]);
     
     if (currentIndex < questions.length - 1) {
       setCurrentIndex(prev => prev + 1);
       setSelectedAnswer(null);
       setQuestionStartTime(Date.now());
     } else {
       const finalAnswers = [...answers, selectedAnswer];
       setQuizState("results");
       saveResults(finalAnswers);
     }
   };
 
   const saveResults = async (finalAnswers: (number | null)[]) => {
     if (!user) return;
     
     const score = finalAnswers.reduce((acc, ans, idx) => {
       if (ans === null) return acc;
       return questions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
     }, 0);

      const accuracy = Math.round((score / questions.length) * 100);
     
     try {
       await supabase.from("quiz_results").insert({
         user_id: user.id,
         quiz_type: "combined",
         score,
         total_questions: questions.length,
          accuracy,
         total_time_seconds: totalTime,
         avg_time_seconds: Math.round(totalTime / questions.length),
         category: "all",
         difficulty: "all",
       });

        // Award XP for quiz completion
        const quizXP = XP_VALUES.QUIZ_COMPLETE + (score * XP_VALUES.QUESTION_CORRECT);
        const isPerfect = score === questions.length;
        const totalXP = isPerfect ? quizXP + XP_VALUES.QUIZ_PERFECT : quizXP;
        
        await awardXP(
          totalXP, 
          "quiz_complete", 
          isPerfect 
            ? `🎯 Perfect score! ${score}/${questions.length}` 
            : `Quiz completed: ${score}/${questions.length} (${accuracy}%)`
        );

       // Schedule incorrect questions for spaced repetition review
       const incorrectQuestions = questions
         .map((q, idx) => ({ question: q, answer: finalAnswers[idx], idx }))
         .filter(item => {
           if (item.answer === null) return true; // Unanswered
           return !item.question.options[item.answer]?.isCorrect;
         })
         .map(item => ({
           questionId: item.question.id,
           category: item.question.category,
           title: item.question.title,
         }));

       if (incorrectQuestions.length > 0) {
         await scheduleForReview(incorrectQuestions);
         toast({
           title: "Questions scheduled for review",
           description: `${incorrectQuestions.length} question(s) added to your spaced repetition queue`,
           duration: 4000,
         });
       }
     } catch (error) {
       console.error("Error saving quiz results:", error);
     }
   };
 
   const calculateScore = () => {
     return answers.reduce((acc, ans, idx) => {
       if (ans === null) return acc;
       return questions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
     }, 0);
   };
 
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}:${secs.toString().padStart(2, '0')}`;
   };
 
   const currentQuestion = questions[currentIndex];
   const CategoryIcon = currentQuestion ? categoryConfig[currentQuestion.category].icon : Brain;
  
  const filteredReviewQuestions = useMemo(() => {
    return questions.map((q, idx) => ({
      question: q,
      userAnswer: answers[idx],
      index: idx,
      isCorrect: answers[idx] !== null && q.options[answers[idx]!]?.isCorrect,
      isUnanswered: answers[idx] === null,
      isMarked: markedForReview.has(idx),
    })).filter(item => {
      if (reviewFilter === "all") return true;
      if (reviewFilter === "incorrect") return !item.isCorrect;
      if (reviewFilter === "unanswered") return item.isUnanswered;
      if (reviewFilter === "flagged") return item.isMarked;
      return true;
    });
  }, [questions, answers, reviewFilter, markedForReview]);

  const skippedCount = skippedQuestions.size;
  const remainingSkipped = Array.from(skippedQuestions).filter(i => answers[i] === null);

  const currentReviewItem = filteredReviewQuestions[reviewIndex];
 
   // Setup screen
   if (quizState === "setup") {
     return (
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
               <Shuffle className="h-6 w-6 text-primary" />
             </div>
             <div>
               <h2 className="text-2xl font-bold">Combined Quiz</h2>
               <p className="text-muted-foreground">Mix questions from all categories</p>
             </div>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
 
         {/* Quick Presets */}
         <div>
           <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             {presets.map((preset) => (
               <Card 
                 key={preset.name}
                 className="cursor-pointer hover:border-primary/50 transition-colors"
                 onClick={() => startQuiz(preset)}
               >
                 <CardContent className="p-4 text-center">
                   <div className="flex items-center justify-center gap-1 mb-2">
                     {preset.timeLimit > 0 ? (
                       <Clock className="h-4 w-4 text-orange-500" />
                     ) : (
                       <Zap className="h-4 w-4 text-primary" />
                     )}
                   </div>
                   <p className="font-medium text-sm">{preset.name}</p>
                   <p className="text-xs text-muted-foreground">{preset.questions} questions</p>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
 
         {/* Custom Setup */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Settings className="h-5 w-5" />
               Custom Quiz
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             {/* Categories */}
             <div>
               <Label className="text-sm font-medium mb-3 block">Categories</Label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map((cat) => {
                   const config = categoryConfig[cat];
                   const Icon = config.icon;
                   return (
                     <div
                       key={cat}
                       onClick={() => setEnabledCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
                       className={cn(
                         "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                         enabledCategories[cat] 
                           ? `${config.bgColor} ${config.borderColor}` 
                           : "bg-muted/50 opacity-50"
                       )}
                     >
                       <Icon className={cn("h-5 w-5", config.color)} />
                       <span className="font-medium text-sm">{config.label}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
 
             {/* Question Count */}
             <div>
               <Label className="text-sm font-medium mb-3 block">
                 Questions: {questionCount} (Available: {allQuestions.length})
               </Label>
               <Slider
                 value={[questionCount]}
                 onValueChange={([v]) => setQuestionCount(v)}
                 min={5}
                 max={Math.min(50, allQuestions.length)}
                 step={5}
               />
             </div>
 
             {/* Timed Mode */}
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Clock className="h-4 w-4 text-muted-foreground" />
                 <Label>Timed Mode</Label>
               </div>
               <Switch checked={timedMode} onCheckedChange={setTimedMode} />
             </div>
 
             {timedMode && (
               <div>
                 <Label className="text-sm font-medium mb-3 block">
                   Time Limit: {timeLimitMinutes} minutes
                 </Label>
                 <Slider
                   value={[timeLimitMinutes]}
                   onValueChange={([v]) => setTimeLimitMinutes(v)}
                   min={5}
                   max={60}
                   step={5}
                 />
               </div>
             )}
 
             <Button 
               className="w-full" 
               size="lg"
               onClick={() => startQuiz()}
               disabled={Object.values(enabledCategories).every(v => !v) || allQuestions.length === 0}
             >
               <Play className="h-5 w-5 mr-2" />
               Start Quiz
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
  // Paused screen
  if (quizState === "paused") {
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
            Question {currentIndex + 1} of {questions.length}
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
          <Button onClick={handleResume} size="lg">
            <PlayCircle className="h-5 w-5 mr-2" />
            Resume Quiz
          </Button>
        </div>
      </motion.div>
    );
  }

    // Review screen
    if (quizState === "review") {
      if (filteredReviewQuestions.length === 0) {
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setQuizState("results")}>
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
            <Button variant="ghost" onClick={() => setQuizState("results")}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <div className="flex items-center gap-2">
              <Tabs value={reviewFilter} onValueChange={(v) => { setReviewFilter(v as typeof reviewFilter); setReviewIndex(0); }}>
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
              onClick={() => setReviewIndex(prev => Math.max(0, prev - 1))}
              disabled={reviewIndex === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setReviewIndex(prev => Math.min(filteredReviewQuestions.length - 1, prev + 1))}
              disabled={reviewIndex === filteredReviewQuestions.length - 1}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      );
    }

   // Results screen
   if (quizState === "results") {
      const markedCount = markedForReview.size;

      const incorrectCount = questions.filter((q, idx) => 
        answers[idx] === null || !q.options[answers[idx]!]?.isCorrect
      ).length;

     const score = calculateScore();
     const accuracy = Math.round((score / questions.length) * 100);
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
              <div className="flex items-center gap-2 text-sm text-amber-600">
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
                onClick={() => { 
                  setReviewIndex(0); 
                  setReviewFilter(markedCount > 0 ? "flagged" : "incorrect"); 
                  setQuizState("review"); 
                }}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review ({markedCount > 0 ? `${markedCount} flagged` : incorrectCount})
              </Button>
            )}
           <Button onClick={() => setQuizState("setup")} className="flex-1">
             <RotateCcw className="h-4 w-4 mr-2" />
             New Quiz
           </Button>
         </div>
       </motion.div>
     );
   }
 
   // Playing state
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
          <Button variant="ghost" size="icon" onClick={handlePause} title="Pause quiz">
            <Pause className="h-5 w-5" />
          </Button>
           <Button variant="ghost" size="icon" onClick={onClose}>
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
                onClick={() => {
                  if (idx < currentIndex || (idx === currentIndex && selectedAnswer !== null)) {
                    // Allow navigating to answered questions only
                  }
                }}
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
             </CardContent>
           </Card>
         </motion.div>
       </AnimatePresence>
 
        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => toggleMarkForReview(currentIndex)}
            className={cn(
              "flex-shrink-0",
              markedForReview.has(currentIndex) && "border-amber-500 bg-amber-500/10 text-amber-600"
            )}
          >
            <Flag className={cn("h-4 w-4", markedForReview.has(currentIndex) ? "fill-amber-500" : "")} />
          </Button>
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={selectedAnswer !== null}
            className="flex-shrink-0"
            title="Skip and answer later"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleNext}
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
                  onClick={() => handleReturnToSkipped(idx)}
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
 
 export default CombinedQuizMode;