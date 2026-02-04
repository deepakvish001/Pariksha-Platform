import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  SpacedRepetitionQuestion,
  formatDueTime,
  getNextReviewInterval,
} from "@/hooks/useSpacedRepetition";
import type { Difficulty } from "@/data/positionResourcesData";

interface QuestionWithMeta {
  id: number;
  text: string;
  difficulty: Difficulty;
  categoryId: string;
  categoryName: string;
}

interface SpacedRepetitionPanelProps {
  dueQuestions: SpacedRepetitionQuestion[];
  stats: {
    critical: number;
    due: number;
    upcoming: number;
    total: number;
  };
  getQuestionDetails: (
    questionId: number,
    categoryId: string
  ) => QuestionWithMeta | undefined;
  onReviewQuestion: (questionId: number, categoryId: string) => void;
  onScrollToQuestion: (questionId: number, categoryId: string) => void;
}

const urgencyStyles = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-500",
    icon: AlertTriangle,
  },
  due: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    icon: Clock,
  },
  upcoming: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-500",
    icon: Calendar,
  },
  later: {
    bg: "bg-muted/50",
    border: "border-border",
    text: "text-muted-foreground",
    icon: TrendingUp,
  },
};

const SpacedRepetitionPanel = ({
  dueQuestions,
  stats,
  getQuestionDetails,
  onReviewQuestion,
  onScrollToQuestion,
}: SpacedRepetitionPanelProps) => {
  const [isOpen, setIsOpen] = useState(stats.critical > 0 || stats.due > 0);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    stats.critical > 0 ? "critical" : stats.due > 0 ? "due" : null
  );

  if (stats.total === 0) {
    return null;
  }

  const groupedQuestions = {
    critical: dueQuestions.filter((q) => q.urgency === "critical"),
    due: dueQuestions.filter((q) => q.urgency === "due"),
    upcoming: dueQuestions.filter((q) => q.urgency === "upcoming"),
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-lg border overflow-hidden mb-4",
          stats.critical > 0
            ? "border-red-500/30 bg-red-500/5"
            : stats.due > 0
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-border bg-card"
        )}
      >
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  stats.critical > 0
                    ? "bg-red-500/20"
                    : stats.due > 0
                    ? "bg-amber-500/20"
                    : "bg-primary/20"
                )}
              >
                <Brain
                  className={cn(
                    "h-5 w-5",
                    stats.critical > 0
                      ? "text-red-500"
                      : stats.due > 0
                      ? "text-amber-500"
                      : "text-primary"
                  )}
                />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Spaced Repetition</h3>
                <p className="text-xs text-muted-foreground">
                  {stats.total} question{stats.total !== 1 ? "s" : ""} to review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stats.critical > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.critical} overdue
                </Badge>
              )}
              {stats.due > 0 && (
                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">
                  {stats.due} due today
                </Badge>
              )}
              {stats.upcoming > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {stats.upcoming} upcoming
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-border/50"
              >
                {/* Section Groups */}
                {(["critical", "due", "upcoming"] as const).map((urgency) => {
                  const questions = groupedQuestions[urgency];
                  if (questions.length === 0) return null;

                  const style = urgencyStyles[urgency];
                  const Icon = style.icon;
                  const isExpanded = expandedSection === urgency;

                  return (
                    <div key={urgency} className="border-b border-border/30 last:border-b-0">
                      <button
                        onClick={() =>
                          setExpandedSection(isExpanded ? null : urgency)
                        }
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors",
                          style.bg
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", style.text)} />
                          <span className="font-medium text-sm capitalize">
                            {urgency === "critical"
                              ? "Overdue"
                              : urgency === "due"
                              ? "Due Today"
                              : "Upcoming"}
                          </span>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", style.bg, style.text)}
                          >
                            {questions.length}
                          </Badge>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-3"
                          >
                            <div className="space-y-2 pt-2">
                              {questions.slice(0, 5).map((q) => {
                                const details = getQuestionDetails(
                                  q.questionId,
                                  q.categoryId
                                );
                                if (!details) return null;

                                return (
                                  <QuestionCard
                                    key={`${q.categoryId}-${q.questionId}`}
                                    question={q}
                                    details={details}
                                    onReview={() =>
                                      onReviewQuestion(q.questionId, q.categoryId)
                                    }
                                    onScrollTo={() =>
                                      onScrollToQuestion(q.questionId, q.categoryId)
                                    }
                                  />
                                );
                              })}
                              {questions.length > 5 && (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                  +{questions.length - 5} more questions
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Tips */}
                <div className="p-4 bg-muted/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Review questions regularly to strengthen memory retention
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

interface QuestionCardProps {
  question: SpacedRepetitionQuestion;
  details: QuestionWithMeta;
  onReview: () => void;
  onScrollTo: () => void;
}

const QuestionCard = ({
  question,
  details,
  onReview,
  onScrollTo,
}: QuestionCardProps) => {
  const style = urgencyStyles[question.urgency];
  const nextInterval = getNextReviewInterval(question.reviewCount + 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-3 rounded-lg border",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={onScrollTo}
            className="text-sm font-medium text-left hover:underline line-clamp-2"
          >
            {details.text}
          </button>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {details.categoryName}
            </Badge>
            <span className={cn("text-xs font-medium", style.text)}>
              {formatDueTime(question.dueIn)}
            </span>
            {question.reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">
                Reviewed {question.reviewCount}x
              </span>
            )}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={onReview}
              className="shrink-0 h-8"
            >
              Review
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Mark as reviewed (next review in {nextInterval} days)
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Progress indicator */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Memory strength</span>
          <span>{Math.min(question.reviewCount * 20, 100)}%</span>
        </div>
        <Progress
          value={Math.min(question.reviewCount * 20, 100)}
          className="h-1"
        />
      </div>
    </motion.div>
  );
};

export default SpacedRepetitionPanel;
