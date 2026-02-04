import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import AnswerPanel from "./AnswerPanel";
import type { Difficulty } from "@/data/companyDetailData";

interface CompanyQuestion {
  id: number;
  text: string;
  description?: string;
  difficulty: Difficulty;
  category?: string;
  answer?: string;
}

interface CompanyQuestionRowProps {
  question: CompanyQuestion;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  isExpanded: boolean;
  isLoggedIn: boolean;
  showCategory?: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onToggleExpand: () => void;
}

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Hard: "bg-red-500/20 text-red-500 border-red-500/30",
};

const CompanyQuestionRow = ({
  question,
  index,
  isSolved,
  isRevision,
  isExpanded,
  isLoggedIn,
  showCategory = false,
  onToggleSolved,
  onToggleRevision,
  onToggleExpand,
}: CompanyQuestionRowProps) => {
  const hasAnswer = !!question.answer;

  return (
    <div data-question-id={question.id}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.015 }}
        className={cn(
          "grid gap-2 sm:gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors items-center border-b border-border/30 last:border-0",
          showCategory
            ? "grid-cols-[28px_1fr_auto_28px_28px] sm:grid-cols-[32px_1fr_60px_80px_40px_40px]"
            : "grid-cols-[28px_1fr_auto_28px_28px] sm:grid-cols-[32px_1fr_60px_40px_40px]",
          isExpanded && "bg-muted/30"
        )}
      >
        {/* Index */}
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-0.5">
          {isSolved && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="hidden sm:block"
            >
              <Sparkles className="h-3 w-3 text-emerald-500" />
            </motion.div>
          )}
          <span>{index + 1}</span>
        </div>

        {/* Question Text */}
        <div className="min-w-0">
          <div
            className={cn(
              "flex items-start gap-2",
              hasAnswer && "cursor-pointer group"
            )}
            onClick={hasAnswer ? onToggleExpand : undefined}
            role={hasAnswer ? "button" : undefined}
            tabIndex={hasAnswer ? 0 : undefined}
            onKeyDown={(e) => {
              if (hasAnswer && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onToggleExpand();
              }
            }}
          >
            {hasAnswer && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 mt-0.5"
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.div>
            )}
            <div className="flex-1">
              <p
                className={cn(
                  "font-medium text-foreground transition-colors text-sm",
                  hasAnswer && "group-hover:text-primary",
                  isSolved && "line-through text-muted-foreground"
                )}
              >
                {question.text}
              </p>
              {question.description && !isExpanded && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {question.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex justify-center sm:justify-start">
          <Badge
            variant="outline"
            className={cn("text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0", difficultyStyles[question.difficulty])}
          >
            <span className="hidden sm:inline">{question.difficulty}</span>
            <span className="sm:hidden">{question.difficulty[0]}</span>
          </Badge>
        </div>

        {/* Category (optional) */}
        {showCategory && (
          <div className="hidden sm:block">
            {question.category && (
              <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">
                {question.category}
              </Badge>
            )}
          </div>
        )}

        {/* Solved Checkbox */}
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Checkbox
                  checked={isSolved}
                  onCheckedChange={(e) => {
                    e && e.valueOf();
                    onToggleSolved();
                  }}
                  disabled={!isLoggedIn}
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200",
                    "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                    "hover:border-emerald-400",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs hidden sm:block">
              {isLoggedIn
                ? isSolved
                  ? "Mark as unsolved"
                  : "Mark as solved"
                : "Sign in to track progress"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Revision Bookmark */}
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: isRevision ? -15 : 15 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRevision();
                  }}
                  disabled={!isLoggedIn}
                  className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 transition-colors",
                    isRevision
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-muted-foreground hover:text-foreground",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isRevision ? (
                    <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs hidden sm:block">
              {isLoggedIn
                ? isRevision
                  ? "Remove from revision"
                  : "Add to revision list"
                : "Sign in to track progress"}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* Expandable Answer Panel */}
      <AnimatePresence>
        {isExpanded && hasAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-muted/20 border-t border-border/30"
          >
            <AnswerPanel answer={question.answer} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyQuestionRow;
