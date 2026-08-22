 import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Clock,
   CheckCircle2,
   XCircle,
   Trophy,
   RotateCcw,
   Play,
   Pause,
   ChevronRight,
   Target,
   Zap,
   Award,
   Flame,
   Brain,
   Sparkles,
   Medal,
  History,
  Timer,
  Swords,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { cn } from "@/lib/utils";
 import {
   type AptitudeQuestion,
   aptitudeCategories,
 } from "@/data/aptitudeQuestionsData";
 import { useAuth } from "@/contexts/AuthContext";
 import { useQuizResults } from "@/hooks/useQuizResults";
import { useQuizAchievements } from "@/hooks/useQuizAchievements";
 import QuizLeaderboard from "./QuizLeaderboard";
import QuizAchievementToast from "./QuizAchievementToast";
 
 // Generate options for questions that don't have predefined options
 const generateOptionsForQuestion = (question: AptitudeQuestion): { text: string; isCorrect: boolean }[] => {
   if (question.options && question.options.length > 0) {
     return question.options;
   }
   // Default options for questions without predefined options
   return [
     { text: "Option A", isCorrect: false },
     { text: "Option B", isCorrect: false },
     { text: "Correct Answer", isCorrect: true },
     { text: "Option D", isCorrect: false },
   ];
 };
 
 interface QuizConfig {
   questionCount: number;
   timePerQuestion: number; // seconds
   category: string;
   difficulty: string;
 }
 
 interface QuizResult {
   questionId: number;
   selectedAnswer: string | null;
   correctAnswer: string;
   isCorrect: boolean;
   timeTaken: number;
 }
 
 interface AptitudeQuizModeProps {
   questions: AptitudeQuestion[];
   onClose: () => void;
 }
 
 interface QuizPreset {
   id: string;
   name: string;
   description: string;
   icon: React.ReactNode;
   config: QuizConfig;
   color: string;
  isChallenge?: boolean;
 }
 
 const QUIZ_PRESETS: QuizPreset[] = [
   {
     id: "quick-easy",
     name: "Quick Easy Quiz",
     description: "5 easy questions, 45 seconds each",
     icon: <Sparkles className="h-5 w-5" />,
     config: { questionCount: 5, timePerQuestion: 45, category: "all", difficulty: "Easy" },
     color: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
   },
   {
     id: "balanced",
     name: "Balanced Challenge",
     description: "10 mixed questions, 60 seconds each",
     icon: <Target className="h-5 w-5" />,
     config: { questionCount: 10, timePerQuestion: 60, category: "all", difficulty: "all" },
     color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
   },
   {
     id: "brain-teaser",
     name: "Brain Teaser Challenge",
     description: "10 hard puzzles, 90 seconds each",
     icon: <Brain className="h-5 w-5" />,
     config: { questionCount: 10, timePerQuestion: 90, category: "puzzles", difficulty: "Hard" },
     color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
   },
   {
     id: "speed-run",
     name: "Speed Run",
     description: "15 questions, 30 seconds each",
     icon: <Flame className="h-5 w-5" />,
     config: { questionCount: 15, timePerQuestion: 30, category: "all", difficulty: "all" },
     color: "from-orange-500/20 to-red-500/20 border-orange-500/30",
   },
   {
     id: "marathon",
     name: "Marathon Mode",
     description: "30 questions, comprehensive test",
     icon: <Medal className="h-5 w-5" />,
     config: { questionCount: 30, timePerQuestion: 60, category: "all", difficulty: "all" },
     color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
   },
 ];
 
const TIMED_CHALLENGES: QuizPreset[] = [
  {
    id: "easy-sprint",
    name: "Easy Sprint Challenge",
    description: "10 easy questions, race against time!",
    icon: <Timer className="h-5 w-5" />,
    config: { questionCount: 10, timePerQuestion: 20, category: "all", difficulty: "Easy" },
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    isChallenge: true,
  },
  {
    id: "medium-blitz",
    name: "Medium Blitz",
    description: "15 medium questions, 25s each - compete globally!",
    icon: <Swords className="h-5 w-5" />,
    config: { questionCount: 15, timePerQuestion: 25, category: "all", difficulty: "Medium" },
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    isChallenge: true,
  },
  {
    id: "hard-gauntlet",
    name: "Hard Gauntlet",
    description: "20 hard questions - ultimate leaderboard challenge!",
    icon: <Trophy className="h-5 w-5" />,
    config: { questionCount: 20, timePerQuestion: 45, category: "all", difficulty: "Hard" },
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
    isChallenge: true,
  },
];

 const AptitudeQuizMode: React.FC<AptitudeQuizModeProps> = ({
   questions,
   onClose,
 }) => {
   const { user } = useAuth();
   const { saveQuizResult } = useQuizResults();
  const { checkAndAwardAchievements, newlyEarned, clearNewlyEarned } = useQuizAchievements();
   const [phase, setPhase] = useState<"config" | "quiz" | "results">("config");
   const [showLeaderboard, setShowLeaderboard] = useState(false);
   const [config, setConfig] = useState<QuizConfig>({
     questionCount: 10,
     timePerQuestion: 60,
     category: "all",
     difficulty: "all",
   });
   const [quizQuestions, setQuizQuestions] = useState<AptitudeQuestion[]>([]);
   const [currentIndex, setCurrentIndex] = useState(0);
   const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
   const [timeLeft, setTimeLeft] = useState(0);
   const [isPaused, setIsPaused] = useState(false);
   const [results, setResults] = useState<QuizResult[]>([]);
   const [questionStartTime, setQuestionStartTime] = useState(0);
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
 
   // Filter and shuffle questions based on config
   const prepareQuiz = useCallback(() => {
     let filtered = [...questions];
 
     if (config.category !== "all") {
       filtered = filtered.filter((q) => q.categoryId === config.category);
     }
     if (config.difficulty !== "all") {
       filtered = filtered.filter((q) => q.difficulty === config.difficulty);
     }
 
     // Shuffle and take requested count
     const shuffled = filtered.sort(() => Math.random() - 0.5);
     const selected = shuffled.slice(
       0,
       Math.min(config.questionCount, shuffled.length)
     );
 
     setQuizQuestions(selected);
     setCurrentIndex(0);
     setResults([]);
     setTimeLeft(config.timePerQuestion);
     setQuestionStartTime(Date.now());
     setPhase("quiz");
   }, [questions, config]);
 
   // Timer effect
   useEffect(() => {
     if (phase !== "quiz" || isPaused || timeLeft <= 0) return;
 
     const timer = setInterval(() => {
       setTimeLeft((prev) => {
         if (prev <= 1) {
           handleSubmitAnswer();
           return 0;
         }
         return prev - 1;
       });
     }, 1000);
 
     return () => clearInterval(timer);
   }, [phase, isPaused, timeLeft]);
 
   const handleSubmitAnswer = useCallback(() => {
     const currentQuestion = quizQuestions[currentIndex];
     if (!currentQuestion) return;
 
     const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
     const options = generateOptionsForQuestion(currentQuestion);
     const correctAnswer = options.find((o) => o.isCorrect)?.text || "";
     const isCorrect = selectedAnswer === correctAnswer;
 
     const result: QuizResult = {
       questionId: currentQuestion.id,
       selectedAnswer,
       correctAnswer,
       isCorrect,
       timeTaken: Math.min(timeTaken, config.timePerQuestion),
     };
 
     setResults((prev) => [...prev, result]);
 
     if (currentIndex < quizQuestions.length - 1) {
       setCurrentIndex((prev) => prev + 1);
       setSelectedAnswer(null);
       setTimeLeft(config.timePerQuestion);
       setQuestionStartTime(Date.now());
     } else {
       setPhase("results");
     }
   }, [currentIndex, quizQuestions, selectedAnswer, questionStartTime, config.timePerQuestion]);
 
   const currentQuestion = quizQuestions[currentIndex];
   const progressPercent = ((currentIndex + 1) / quizQuestions.length) * 100;
 
   // Results calculations
   const correctCount = results.filter((r) => r.isCorrect).length;
   const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
   const avgTime = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length) : 0;
   const totalTime = results.reduce((sum, r) => sum + r.timeTaken, 0);
 
   // Save results when quiz completes
   useEffect(() => {
     if (phase === "results" && results.length > 0 && user) {
       saveQuizResult({
         quizType: "aptitude",
         category: config.category,
         difficulty: config.difficulty,
         score: correctCount,
         totalQuestions: results.length,
         accuracy,
         avgTimeSeconds: avgTime,
         totalTimeSeconds: totalTime,
       });

      // Check for quiz achievements
      checkAndAwardAchievements({
        accuracy,
        avgTimeSeconds: avgTime,
        totalTimeSeconds: totalTime,
        difficulty: config.difficulty,
        isChallenge: isChallengeMode,
        quizType: "aptitude",
      });
     }
   }, [phase, results.length]);
 
   const startPreset = (preset: QuizPreset) => {
     setConfig(preset.config);
    setIsChallengeMode(preset.isChallenge || false);
    setChallengeId(preset.isChallenge ? preset.id : null);
     setTimeout(() => prepareQuiz(), 0);
   };
 
   const getTimeColor = () => {
     const ratio = timeLeft / config.timePerQuestion;
     if (ratio > 0.5) return "text-emerald-500";
     if (ratio > 0.25) return "text-amber-500";
     return "text-red-500";
   };
 
   if (phase === "config") {
     return (
       <div className="space-y-6">
        {/* Timed Challenges Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              Timed Challenges
              <Badge variant="secondary" className="ml-2">Global Leaderboard</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Compete against other players! Your total time and accuracy determine your rank.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIMED_CHALLENGES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => startPreset(preset)}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                    "bg-gradient-to-br relative overflow-hidden",
                    preset.color
                  )}
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                      Ranked
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {preset.icon}
                    <span className="font-semibold">{preset.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

         <Card className="border-primary/20 bg-card/80 backdrop-blur">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Zap className="h-5 w-5 text-primary" />
              Practice Quizzes
           </CardTitle>
         </CardHeader>
           <CardContent>
             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
               {QUIZ_PRESETS.map((preset) => (
                 <button
                   key={preset.id}
                   onClick={() => startPreset(preset)}
                   className={cn(
                     "p-4 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                     "bg-gradient-to-br",
                     preset.color
                   )}
                 >
                   <div className="flex items-center gap-2 mb-2">
                     {preset.icon}
                     <span className="font-semibold">{preset.name}</span>
                   </div>
                   <p className="text-sm text-muted-foreground">{preset.description}</p>
                 </button>
               ))}
             </div>
           </CardContent>
         </Card>
 
         <Card className="border-primary/20 bg-card/80 backdrop-blur">
           <CardHeader>
             <CardTitle className="text-base">Custom Configuration</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
             <div className="space-y-2">
               <Label>Number of Questions</Label>
               <Select
                 value={config.questionCount.toString()}
                 onValueChange={(v) =>
                   setConfig((prev) => ({ ...prev, questionCount: parseInt(v) }))
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="5">5 Questions</SelectItem>
                   <SelectItem value="10">10 Questions</SelectItem>
                   <SelectItem value="15">15 Questions</SelectItem>
                   <SelectItem value="20">20 Questions</SelectItem>
                   <SelectItem value="30">30 Questions</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label>Time per Question</Label>
               <Select
                 value={config.timePerQuestion.toString()}
                 onValueChange={(v) =>
                   setConfig((prev) => ({ ...prev, timePerQuestion: parseInt(v) }))
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="30">30 seconds</SelectItem>
                   <SelectItem value="45">45 seconds</SelectItem>
                   <SelectItem value="60">60 seconds</SelectItem>
                   <SelectItem value="90">90 seconds</SelectItem>
                   <SelectItem value="120">2 minutes</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label>Category</Label>
               <Select
                 value={config.category}
                 onValueChange={(v) =>
                   setConfig((prev) => ({ ...prev, category: v }))
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Categories</SelectItem>
                   {aptitudeCategories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       {cat.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-2">
               <Label>Difficulty</Label>
               <Select
                 value={config.difficulty}
                 onValueChange={(v) =>
                   setConfig((prev) => ({ ...prev, difficulty: v }))
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Levels</SelectItem>
                   <SelectItem value="Easy">Easy</SelectItem>
                   <SelectItem value="Medium">Medium</SelectItem>
                   <SelectItem value="Hard">Hard</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
 
             <div className="flex gap-3">
             <Button variant="outline" onClick={onClose} className="flex-1">
               Cancel
             </Button>
               <Button onClick={() => prepareQuiz()} className="flex-1 gap-2">
               <Play className="h-4 w-4" />
                 Start Custom Quiz
             </Button>
           </div>
         </CardContent>
       </Card>
 
         {user && (
          <QuizLeaderboard quizType="aptitude" currentUserId={user.id} challengeId={challengeId} />
         )}
       </div>
     );
   }
 
   if (phase === "results") {
     return (
       <Card className="border-primary/20 bg-card/80 backdrop-blur">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Trophy className="h-5 w-5 text-amber-500" />
             Quiz Results
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="grid gap-4 sm:grid-cols-3">
             <Card className="bg-muted/50">
               <CardContent className="p-4 text-center">
                 <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                 <div className="text-3xl font-bold">{accuracy}%</div>
                 <div className="text-sm text-muted-foreground">Accuracy</div>
               </CardContent>
             </Card>
             <Card className="bg-muted/50">
               <CardContent className="p-4 text-center">
                 <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                 <div className="text-3xl font-bold">
                   {correctCount}/{results.length}
                 </div>
                 <div className="text-sm text-muted-foreground">Correct</div>
               </CardContent>
             </Card>
             <Card className="bg-muted/50">
               <CardContent className="p-4 text-center">
                 <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                 <div className="text-3xl font-bold">{avgTime}s</div>
                 <div className="text-sm text-muted-foreground">Avg Time</div>
               </CardContent>
             </Card>
           </div>
 
           {accuracy >= 80 && (
             <motion.div
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="flex items-center justify-center gap-2 p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
             >
               <Award className="h-6 w-6 text-amber-500" />
               <span className="font-semibold text-amber-500">
                 Excellent Performance!
               </span>
             </motion.div>
           )}
 
           <div className="space-y-2 max-h-64 overflow-y-auto">
             <h4 className="font-semibold text-sm text-muted-foreground mb-3">
               Question Summary
             </h4>
             {results.map((result, idx) => {
               const question = quizQuestions.find(
                 (q) => q.id === result.questionId
               );
               return (
                 <div
                   key={idx}
                   className={cn(
                     "flex items-center gap-3 p-3 rounded-lg border",
                     result.isCorrect
                       ? "bg-emerald-500/10 border-emerald-500/30"
                       : "bg-red-500/10 border-red-500/30"
                   )}
                 >
                   {result.isCorrect ? (
                     <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                   ) : (
                     <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                   )}
                   <span className="text-sm flex-1 line-clamp-1">
                     {question?.title}
                   </span>
                   <Badge variant="outline" className="shrink-0">
                     {result.timeTaken}s
                   </Badge>
                 </div>
               );
             })}
           </div>
 
           <div className="flex gap-3 pt-4">
             <Button variant="outline" onClick={onClose} className="flex-1">
               Close
             </Button>
             <Button
               onClick={() => {
                 setPhase("config");
                 setResults([]);
                 setShowLeaderboard(false);
              setIsChallengeMode(false);
              setChallengeId(null);
             clearNewlyEarned();
               }}
               className="flex-1 gap-2"
             >
               <RotateCcw className="h-4 w-4" />
               New Quiz
             </Button>
              <Link to="/library/quiz-history">
                <Button variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  History
                </Button>
              </Link>
             {user && (
               <Button
                 variant={showLeaderboard ? "secondary" : "outline"}
                 onClick={() => setShowLeaderboard(!showLeaderboard)}
                 className="gap-2"
               >
                 <Trophy className="h-4 w-4" />
                 Leaderboard
               </Button>
             )}
           </div>
           
           {showLeaderboard && user && (
          <QuizLeaderboard quizType="aptitude" currentUserId={user.id} challengeId={challengeId} />
           )}

          {/* Achievement Toast */}
          <QuizAchievementToast achievements={newlyEarned} onClose={clearNewlyEarned} />
         </CardContent>
       </Card>
     );
   }
 
   // Quiz phase
   return (
     <Card className="border-primary/20 bg-card/80 backdrop-blur">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Badge variant="outline">
               {currentIndex + 1} / {quizQuestions.length}
             </Badge>
             <Badge
               variant="outline"
               className={cn(
                 currentQuestion?.difficulty === "Easy" &&
                   "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
                 currentQuestion?.difficulty === "Medium" &&
                   "bg-amber-500/20 text-amber-500 border-amber-500/30",
                 currentQuestion?.difficulty === "Hard" &&
                   "bg-red-500/20 text-red-500 border-red-500/30"
               )}
             >
               {currentQuestion?.difficulty}
             </Badge>
           </div>
           <div className="flex items-center gap-2">
             <Button
               variant="ghost"
               size="icon"
               aria-label={isPaused ? "Resume quiz" : "Pause quiz"}
               onClick={() => setIsPaused(!isPaused)}
             >
               {isPaused ? (
                 <Play className="h-4 w-4" />
               ) : (
                 <Pause className="h-4 w-4" />
               )}
             </Button>
             <div className={cn("flex items-center gap-1 font-mono text-lg", getTimeColor())}>
               <Clock className="h-4 w-4" />
               {timeLeft}s
             </div>
           </div>
         </div>
         <Progress value={progressPercent} className="h-1 mt-3" />
       </CardHeader>
       <CardContent className="space-y-6">
         <AnimatePresence mode="wait">
           <motion.div
             key={currentIndex}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="space-y-6"
           >
             <h3 className="text-lg font-medium">{currentQuestion?.title}</h3>
 
             {currentQuestion && (
               <RadioGroup
                 value={selectedAnswer || ""}
                 onValueChange={setSelectedAnswer}
                 className="space-y-3"
               >
                 {generateOptionsForQuestion(currentQuestion).map((option, idx) => (
                   <div
                     key={idx}
                     className={cn(
                       "flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                       selectedAnswer === option.text
                         ? "border-primary bg-primary/10"
                         : "border-border hover:border-primary/50"
                     )}
                     onClick={() => setSelectedAnswer(option.text)}
                   >
                     <RadioGroupItem
                       value={option.text}
                       id={`option-${idx}`}
                     />
                     <Label
                       htmlFor={`option-${idx}`}
                       className="flex-1 cursor-pointer"
                     >
                       {option.text}
                     </Label>
                   </div>
                 ))}
               </RadioGroup>
             )}
           </motion.div>
         </AnimatePresence>
 
         <div className="flex gap-3 pt-4">
           <Button variant="outline" onClick={onClose}>
             Exit Quiz
           </Button>
           <Button
             onClick={handleSubmitAnswer}
             disabled={!selectedAnswer}
             className="flex-1 gap-2"
           >
             {currentIndex < quizQuestions.length - 1 ? (
               <>
                 Next <ChevronRight className="h-4 w-4" />
               </>
             ) : (
               <>
                 Finish <CheckCircle2 className="h-4 w-4" />
               </>
             )}
           </Button>
         </div>
       </CardContent>
     </Card>
   );
 };
 
 export default AptitudeQuizMode;