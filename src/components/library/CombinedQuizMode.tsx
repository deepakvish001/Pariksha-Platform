 import { useState, useMemo, useEffect, useRef } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, 
   Shuffle, Zap, Target, Settings, Play, Pause, RotateCcw,
   Code, Cpu, Database, Calculator, Brain
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Slider } from "@/components/ui/slider";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { cn } from "@/lib/utils";
 import { dsaQuestions, type DSAQuestion } from "@/data/dsaQuestionsData";
 import { csQuestions, type CSQuestion } from "@/data/csSubjectsData";
 import { sqlQuestions, type SQLQuestion } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions, type AptitudeQuestion } from "@/data/aptitudeQuestionsData";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
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
 }
 
 type QuizState = "setup" | "playing" | "paused" | "results";
 
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
     setQuizState("playing");
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
     
     try {
       await supabase.from("quiz_results").insert({
         user_id: user.id,
         quiz_type: "combined",
         score,
         total_questions: questions.length,
         accuracy: Math.round((score / questions.length) * 100),
         total_time_seconds: totalTime,
         avg_time_seconds: Math.round(totalTime / questions.length),
         category: "all",
         difficulty: "all",
       });
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
 
   // Results screen
   if (quizState === "results") {
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
           <Button variant="ghost" size="icon" onClick={onClose}>
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Progress */}
       <Progress value={(currentIndex / questions.length) * 100} className="h-1.5" />
 
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
 
 export default CombinedQuizMode;