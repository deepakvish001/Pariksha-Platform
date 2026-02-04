import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import SectionProgressBar from "./SectionProgressBar";
import CompanyQuestionTableRow from "./CompanyQuestionTableRow";
import type { Question } from "@/data/companyDetailData";

interface CompanyCategorySectionProps {
  categoryId: string;
  categoryName: string;
  questions: Question[];
  totalQuestionsInCategory: number;
  isFiltered: boolean;
  isOpen: boolean;
  showCategory?: boolean;
  onOpenChange: (open: boolean) => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  onToggleSolved: (id: number) => void;
  onToggleRevision: (id: number) => void;
  isLoggedIn: boolean;
}

const CompanyCategorySection = ({
  categoryId,
  categoryName,
  questions,
  totalQuestionsInCategory,
  isFiltered,
  isOpen,
  showCategory = false,
  onOpenChange,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  isLoggedIn,
}: CompanyCategorySectionProps) => {
  // Track which question's answer is expanded (only one at a time)
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const toggleAnswer = useCallback((questionId: number) => {
    setExpandedQuestion((prev) => (prev === questionId ? null : questionId));
  }, []);

  // Auto-collapse answer when section closes
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setExpandedQuestion(null);
    }
    onOpenChange(open);
  }, [onOpenChange]);

  const stats = useMemo(() => {
    const total = questions.length;
    const solved = questions.filter((q) => isSolved(q.id)).length;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percentage };
  }, [questions, isSolved]);

  const isComplete = stats.percentage === 100 && stats.total > 0;

  // Pick random unsolved question
  const goToRandomQuestion = () => {
    const unsolvedQuestions = questions.filter((q) => !isSolved(q.id));
    if (unsolvedQuestions.length === 0) return;

    const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
    const randomQuestion = unsolvedQuestions[randomIndex];

    // Ensure section is open
    if (!isOpen) {
      onOpenChange(true);
    }

    // Expand and scroll to the question after a short delay
    setTimeout(() => {
      setExpandedQuestion(randomQuestion.id);
      const element = document.querySelector(
        `[data-question-id="${randomQuestion.id}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, isOpen ? 0 : 300);
  };

  const unsolvedCount = stats.total - stats.solved;

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border last:border-b-0"
      >
        {/* Section Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 md:p-4 hover:bg-muted/50 transition-colors group text-left">
            {/* Chevron */}
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.div>

            {/* Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium text-sm md:text-base truncate">
                {categoryName}
              </span>
              {isFiltered && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-primary/10 text-primary">
                  {questions.length} match{questions.length !== 1 ? "es" : ""}
                </Badge>
              )}
              {isComplete && !isFiltered && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
              )}
            </div>

            {/* Progress Bar */}
            <SectionProgressBar
              value={stats.solved}
              total={isFiltered ? questions.length : totalQuestionsInCategory}
              className="hidden sm:flex"
            />

            {/* Mobile count */}
            <span className="sm:hidden text-xs font-medium text-muted-foreground">
              {stats.solved}/{isFiltered ? questions.length : totalQuestionsInCategory}
            </span>
          </button>
        </CollapsibleTrigger>

        {/* Section Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                {/* Section toolbar */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {stats.solved} of {stats.total} completed
                    {stats.percentage > 0 && ` (${stats.percentage}%)`}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToRandomQuestion();
                        }}
                        disabled={unsolvedCount === 0}
                        className="h-7 text-xs gap-1"
                      >
                        <Shuffle className="h-3 w-3" />
                        Random
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Pick random unsolved question
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Questions Table */}
                {questions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20">
                          <TableHead className="w-10 sm:w-12 text-xs font-semibold">
                            #
                          </TableHead>
                          <TableHead className="min-w-0 text-xs font-semibold">
                            Question
                          </TableHead>
                          <TableHead className="hidden sm:table-cell w-20 sm:w-24 text-xs font-semibold">
                            Difficulty
                          </TableHead>
                          {showCategory && (
                            <TableHead className="hidden md:table-cell w-28 text-xs font-semibold">
                              Category
                            </TableHead>
                          )}
                          <TableHead className="w-12 sm:w-16 text-center text-xs font-semibold">
                            <span className="hidden sm:inline">Solved</span>
                            <span className="sm:hidden">✓</span>
                          </TableHead>
                          <TableHead className="w-12 sm:w-16 text-center text-xs font-semibold">
                            <span className="hidden sm:inline">Revision</span>
                            <span className="sm:hidden">★</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {questions.map((question, index) => (
                            <CompanyQuestionTableRow
                              key={question.id}
                              question={question}
                              index={index}
                              isSolved={isSolved(question.id)}
                              isRevision={isRevision(question.id)}
                              isExpanded={expandedQuestion === question.id}
                              isLoggedIn={isLoggedIn}
                              showCategory={showCategory}
                              onToggleSolved={() => onToggleSolved(question.id)}
                              onToggleRevision={() => onToggleRevision(question.id)}
                              onToggleExpand={() => toggleAnswer(question.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No questions match your filters
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

export default CompanyCategorySection;
