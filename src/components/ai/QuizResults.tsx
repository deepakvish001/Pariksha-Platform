import { motion } from "framer-motion";
import { Trophy, Clock, CheckCircle2, XCircle, RotateCcw, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface Question {
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface QuizResultsProps {
  questions: Question[];
  results: {
    score: number;
    total: number;
    answers: number[];
    timeSpent: number;
    flaggedQuestions: number[];
  };
  onRetake: () => void;
  onReview: () => void;
  onExit: () => void;
}

export const QuizResults = ({
  questions,
  results,
  onRetake,
  onReview,
  onExit,
}: QuizResultsProps) => {
  const percentage = Math.round((results.score / results.total) * 100);
  const isPassing = percentage >= 70;
  const isPerfect = percentage === 100;

  useEffect(() => {
    if (isPerfect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else if (isPassing) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
      });
    }
  }, [isPassing, isPerfect]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = () => {
    if (percentage >= 90) return { grade: "A", color: "text-green-500" };
    if (percentage >= 80) return { grade: "B", color: "text-blue-500" };
    if (percentage >= 70) return { grade: "C", color: "text-yellow-500" };
    if (percentage >= 60) return { grade: "D", color: "text-orange-500" };
    return { grade: "F", color: "text-red-500" };
  };

  const { grade, color } = getGrade();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="text-center">
          <CardHeader className="pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Trophy className={cn("h-10 w-10", isPassing ? "text-yellow-500" : "text-muted-foreground")} />
            </div>
            <CardTitle className="text-2xl">
              {isPerfect ? "Perfect Score! 🎉" : isPassing ? "Great Job!" : "Keep Practicing!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className={cn("text-5xl font-bold", color)}>{grade}</div>
                <p className="text-sm text-muted-foreground mt-1">Grade</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold">{percentage}%</div>
                <p className="text-sm text-muted-foreground mt-1">Score</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold">{results.score}/{results.total}</div>
                <p className="text-sm text-muted-foreground mt-1">Correct</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={percentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{results.score} correct</span>
                <span>{results.total - results.score} incorrect</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-4">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(results.timeSpent)}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {results.score} correct
              </Badge>
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                {results.total - results.score} wrong
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button onClick={onReview} variant="outline" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Review Answers
              </Button>
              <Button onClick={onRetake} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </Button>
              <Button onClick={onExit}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {questions.map((q, index) => {
              const isCorrect = results.answers[index] === q.correctAnswer;
              const wasSkipped = results.answers[index] === -1;

              return (
                <div
                  key={index}
                  className={cn(
                    "w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium",
                    wasSkipped
                      ? "bg-muted text-muted-foreground"
                      : isCorrect
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30" />
              <span className="text-muted-foreground">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30" />
              <span className="text-muted-foreground">Incorrect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-muted-foreground">Skipped</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
