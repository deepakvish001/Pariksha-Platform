import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface QuizPlayerProps {
  questions: Question[];
  timeLimit?: number; // in minutes
  onComplete: (results: QuizResults) => void;
  onExit: () => void;
}

export interface QuizResults {
  score: number;
  total: number;
  answers: number[];
  timeSpent: number; // in seconds
  flaggedQuestions: number[];
}

export const QuizPlayer = ({ questions, timeLimit, onComplete, onExit }: QuizPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [flagged, setFlagged] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : 0);
  const [startTime] = useState(Date.now());

  // Timer
  useEffect(() => {
    if (!timeLimit) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const toggleFlag = () => {
    setFlagged((prev) =>
      prev.includes(currentIndex)
        ? prev.filter(i => i !== currentIndex)
        : [...prev, currentIndex]
    );
  };

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const score = answers.reduce((acc, answer, index) => {
      if (answer !== null && questions[index].correctAnswer === answer) {
        return acc + 1;
      }
      return acc;
    }, 0);

    onComplete({
      score,
      total: questions.length,
      answers: answers.map(a => a ?? -1),
      timeSpent,
      flaggedQuestions: flagged,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1.5">
            Question {currentIndex + 1} of {questions.length}
          </Badge>
          <Badge variant="secondary">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>
        {timeLimit && (
          <Badge
            variant={timeRemaining < 60 ? "destructive" : "outline"}
            className="gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            {formatTime(timeRemaining)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg font-medium leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFlag}
                  aria-label={flagged.includes(currentIndex) ? "Unflag question" : "Flag question"}
                  className={cn(
                    "flex-shrink-0",
                    flagged.includes(currentIndex) && "text-yellow-500"
                  )}
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuestion.options?.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => handleAnswer(optionIndex)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-muted/50",
                    answers[currentIndex] === optionIndex
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium flex-shrink-0",
                        answers[currentIndex] === optionIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-8 h-8 rounded-lg text-sm font-medium transition-all",
              "border hover:border-primary/50",
              currentIndex === index && "ring-2 ring-primary/20",
              answers[index] !== null
                ? "bg-primary/10 border-primary text-primary"
                : "border-border",
              flagged.includes(index) && "border-yellow-500"
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onExit}>
            Exit Quiz
          </Button>
          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
