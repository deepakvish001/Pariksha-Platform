import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Clock, ArrowRight, Check, ChevronLeft, ChevronRight, 
  Flag, Pause, Play, RotateCcw, Trophy, Target, Timer,
  CheckCircle, XCircle, SkipForward, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useXPWithNotifications, XP_VALUES } from "@/hooks/useXPWithNotifications";
import AnswerPanel from "./AnswerPanel";

interface QuizQuestion {
  id: number;
  title: string;
  text: string;
  difficulty: string;
  options?: { text: string; isCorrect: boolean }[];
  answer?: string;
}

interface ValidQuizQuestion extends QuizQuestion {
  options: { text: string; isCorrect: boolean }[];
}

interface FundamentalsQuizModeProps {
  title: string;
  questions: QuizQuestion[];
  sheetId: string;
  onClose: () => void;
}

type QuizState = "setup" | "playing" | "paused" | "results" | "review";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FundamentalsQuizMode = ({ title, questions, sheetId, onClose }: FundamentalsQuizModeProps) => {
  const { user } = useAuth();
  const { awardXP } = useXPWithNotifications();
  
  const [quizState, setQuizState] = useState<QuizState>("setup");
  const [quizQuestions, setQuizQuestions] = useState<ValidQuizQuestion[]>([]);
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
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  
  // Review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());

  // Filter questions that have valid options
  const availableQuestions = useMemo((): ValidQuizQuestion[] => {
    let filtered = questions.filter((q): q is ValidQuizQuestion => 
      q.options !== undefined && q.options.length > 0
    );
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }
    return filtered;
  }, [questions, difficultyFilter]);

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
    const newAnswers = [...answers];
    const newTimes = [...timePerQuestion];
    for (let i = answers.length; i < quizQuestions.length; i++) {
      newAnswers.push(null);
      newTimes.push(0);
    }
    setAnswers(newAnswers);
    setTimePerQuestion(newTimes);
    setQuizState("results");
    saveResults(newAnswers, newTimes);
  };

  const startQuiz = () => {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
    
    setQuizQuestions(selected);
    setAnswers([]);
    setTimePerQuestion([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setTotalTime(0);
    setTimeLimit(timedMode ? timeLimitMinutes * 60 : 0);
    setQuestionStartTime(Date.now());
    setMarkedForReview(new Set());
    setSkippedQuestions(new Set());
    setQuizState("playing");
  };

  const handlePause = () => {
    setQuizState("paused");
  };

  const handleResume = () => {
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
    
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      const finalAnswers = [...answers, selectedAnswer];
      const finalTimes = [...timePerQuestion, timeTaken];
      setQuizState("results");
      saveResults(finalAnswers, finalTimes);
    }
  };

  const handleSkip = () => {
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    setTimePerQuestion(prev => [...prev, timeTaken]);
    setAnswers(prev => [...prev, null]);
    setSkippedQuestions(prev => new Set(prev).add(currentIndex));
    
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
    } else {
      const finalAnswers = [...answers, null];
      const finalTimes = [...timePerQuestion, timeTaken];
      setQuizState("results");
      saveResults(finalAnswers, finalTimes);
    }
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const updated = new Set(prev);
      if (updated.has(currentIndex)) {
        updated.delete(currentIndex);
      } else {
        updated.add(currentIndex);
      }
      return updated;
    });
  };

  const saveResults = async (finalAnswers: (number | null)[], questionTimes: number[]) => {
    if (!user) return;
    
    const score = finalAnswers.reduce((acc, ans, idx) => {
      if (ans === null) return acc;
      return quizQuestions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
    }, 0);
    
    const accuracy = Math.round((score / quizQuestions.length) * 100);
    
    try {
      await supabase
        .from("quiz_results")
        .insert({
          user_id: user.id,
          quiz_type: sheetId,
          score,
          total_questions: quizQuestions.length,
          accuracy,
          total_time_seconds: totalTime,
          avg_time_seconds: Math.round(totalTime / quizQuestions.length),
          category: sheetId,
          difficulty: difficultyFilter,
        });

      const quizXP = XP_VALUES.QUIZ_COMPLETE + (score * XP_VALUES.QUESTION_CORRECT);
      const isPerfect = score === quizQuestions.length;
      const totalXP = isPerfect ? quizXP + XP_VALUES.QUIZ_PERFECT : quizXP;
      
      await awardXP(
        totalXP, 
        "quiz_complete", 
        isPerfect 
          ? `🎯 Perfect score on ${title}!` 
          : `${title} Quiz: ${score}/${quizQuestions.length}`
      );
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };

  const getScore = () => {
    return answers.reduce((acc, ans, idx) => {
      if (ans === null) return acc;
      return quizQuestions[idx]?.options[ans]?.isCorrect ? acc + 1 : acc;
    }, 0);
  };

  const getAccuracy = () => {
    const score = getScore();
    return Math.round((score / quizQuestions.length) * 100);
  };

  const reviewItems = useMemo(() => {
    return quizQuestions.map((q, idx) => ({
      question: q,
      userAnswer: answers[idx],
      index: idx,
      isCorrect: answers[idx] !== null && q.options[answers[idx]!]?.isCorrect,
    }));
  }, [quizQuestions, answers]);

  // Setup View
  if (quizState === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto"
      >
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{title} Quiz</h2>
                <p className="text-muted-foreground">Configure your quiz session</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close quiz setup">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Count */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Number of Questions</Label>
                    <span className="text-sm font-medium">{questionCount}</span>
                  </div>
                  <Slider
                    value={[questionCount]}
                    onValueChange={([v]) => setQuestionCount(v)}
                    min={5}
                    max={Math.min(30, availableQuestions.length)}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {availableQuestions.length} questions available
                  </p>
                </div>

                {/* Difficulty Filter */}
                <div className="space-y-3">
                  <Label>Difficulty</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "Easy", "Medium", "Hard"].map((diff) => (
                      <Button
                        key={diff}
                        variant={difficultyFilter === diff ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDifficultyFilter(diff)}
                      >
                        {diff === "all" ? "All Levels" : diff}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Timed Mode */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Timed Mode</Label>
                    <p className="text-xs text-muted-foreground">Set a time limit for the quiz</p>
                  </div>
                  <Switch checked={timedMode} onCheckedChange={setTimedMode} />
                </div>

                {timedMode && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Time Limit</Label>
                      <span className="text-sm font-medium">{timeLimitMinutes} min</span>
                    </div>
                    <Slider
                      value={[timeLimitMinutes]}
                      onValueChange={([v]) => setTimeLimitMinutes(v)}
                      min={5}
                      max={60}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={startQuiz}
                  disabled={availableQuestions.length === 0}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    );
  }

  // Paused View
  if (quizState === "paused") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
      >
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Pause className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Quiz Paused</h3>
              <p className="text-muted-foreground mt-1">
                Question {currentIndex + 1} of {quizQuestions.length}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Exit Quiz
              </Button>
              <Button onClick={handleResume}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Playing View
  if (quizState === "playing") {
    const currentQuestion = quizQuestions[currentIndex];
    const progress = ((currentIndex + 1) / quizQuestions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background overflow-auto"
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {currentIndex + 1}/{quizQuestions.length}
                </Badge>
                {timeLimit > 0 && (
                  <Badge variant={totalTime > timeLimit * 0.8 ? "destructive" : "secondary"}>
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(timeLimit - totalTime)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMarkForReview}
                  className={cn(markedForReview.has(currentIndex) && "text-amber-500")}
                >
                  <Flag className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePause}>
                  <Pause className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-1" />
          </header>

          {/* Question */}
          <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <Badge variant="outline" className="mb-3">
                    {currentQuestion.difficulty}
                  </Badge>
                  <h3 className="text-xl font-semibold">{currentQuestion.title}</h3>
                  <p className="text-muted-foreground mt-2">{currentQuestion.text}</p>
                </div>

                <RadioGroup
                  value={selectedAnswer?.toString()}
                  onValueChange={(v) => handleAnswerSelect(parseInt(v))}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Label
                        htmlFor={`option-${idx}`}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                          selectedAnswer === idx
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                        <span>{option.text}</span>
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
            <div className="flex justify-between max-w-3xl mx-auto">
              <Button variant="outline" onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-2" />
                Skip
              </Button>
              <Button onClick={handleNext} disabled={selectedAnswer === null}>
                {currentIndex < quizQuestions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  <>
                    Finish
                    <Check className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </footer>
        </div>
      </motion.div>
    );
  }

  // Results View
  if (quizState === "results") {
    const score = getScore();
    const accuracy = getAccuracy();
    const avgTime = Math.round(totalTime / quizQuestions.length);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background overflow-auto"
      >
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close quiz results">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Score Card */}
            <Card className="overflow-hidden">
              <div className={cn(
                "p-8 text-center text-white",
                accuracy >= 80 ? "bg-gradient-to-br from-emerald-500 to-green-600" :
                accuracy >= 60 ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                "bg-gradient-to-br from-red-500 to-rose-600"
              )}>
                <Trophy className="h-12 w-12 mx-auto mb-4" />
                <div className="text-5xl font-bold">{score}/{quizQuestions.length}</div>
                <div className="text-xl mt-2">{accuracy}% Accuracy</div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-500">
                      {answers.filter((a, i) => a !== null && quizQuestions[i]?.options[a]?.isCorrect).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {answers.filter((a, i) => a !== null && !quizQuestions[i]?.options[a]?.isCorrect).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Wrong</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {answers.filter(a => a === null).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Timer className="h-8 w-8 text-primary/50" />
                  <div>
                    <div className="text-2xl font-bold">{formatTime(totalTime)}</div>
                    <div className="text-sm text-muted-foreground">Total Time</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Target className="h-8 w-8 text-primary/50" />
                  <div>
                    <div className="text-2xl font-bold">{avgTime}s</div>
                    <div className="text-sm text-muted-foreground">Avg per Question</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setQuizState("review")}>
                Review Answers
              </Button>
              <Button className="flex-1" onClick={() => setQuizState("setup")}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Review View
  if (quizState === "review") {
    const currentReview = reviewItems[reviewIndex];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background overflow-auto"
      >
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <Button variant="ghost" size="sm" onClick={() => setQuizState("results")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Results
              </Button>
              <Badge variant="outline">
                Question {reviewIndex + 1} of {quizQuestions.length}
              </Badge>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close quiz review">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Review Content */}
          <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                {currentReview.isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-1" />
                ) : currentReview.userAnswer === null ? (
                  <AlertCircle className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                )}
                <div>
                  <Badge variant="outline" className="mb-2">
                    {currentReview.question.difficulty}
                  </Badge>
                  <h3 className="text-xl font-semibold">{currentReview.question.title}</h3>
                  <p className="text-muted-foreground mt-1">{currentReview.question.text}</p>
                </div>
              </div>

              {/* Options Review */}
              <div className="space-y-2">
                {currentReview.question.options.map((option, idx) => {
                  const isSelected = currentReview.userAnswer === idx;
                  const isCorrect = option.isCorrect;
                  
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-lg border",
                        isCorrect && "border-emerald-500 bg-emerald-500/10",
                        isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                        !isSelected && !isCorrect && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : isSelected ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5" />
                        )}
                        <span>{option.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {currentReview.question.answer && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Explanation</h4>
                  <AnswerPanel answer={currentReview.question.answer} />
                </div>
              )}
            </div>
          </main>

          {/* Navigation */}
          <footer className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
            <div className="flex justify-between max-w-3xl mx-auto">
              <Button
                variant="outline"
                onClick={() => setReviewIndex(prev => prev - 1)}
                disabled={reviewIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                onClick={() => setReviewIndex(prev => prev + 1)}
                disabled={reviewIndex === quizQuestions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </footer>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default FundamentalsQuizMode;