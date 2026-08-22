import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
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
import { TableCell, TableRow } from "@/components/ui/table";
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

interface CompanyQuestionTableRowProps {
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
  folderButton?: React.ReactNode;
}

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  Hard: "bg-red-500/20 text-red-500 border-red-500/30",
};

const CompanyQuestionTableRow = ({
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
  folderButton,
}: CompanyQuestionTableRowProps) => {
  const hasAnswer = !!question.answer;

  return (
    <>
      <TableRow
        data-question-id={question.id}
        className={cn(
          "transition-colors hover:bg-muted/30",
          isExpanded && "bg-muted/20"
        )}
      >
        {/* Index */}
        <TableCell className="w-12 text-center">
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            {isSolved && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                <Sparkles className="h-3 w-3 text-emerald-500" />
              </motion.div>
            )}
            <span>{index + 1}</span>
          </div>
        </TableCell>

        {/* Question Text */}
        <TableCell className="min-w-0">
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
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium text-foreground transition-colors text-sm leading-relaxed",
                  hasAnswer && "group-hover:text-primary",
                  isSolved && "line-through text-muted-foreground"
                )}
              >
                {question.text}
              </p>

              {/* Mobile meta info - shown inline below text */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium", difficultyStyles[question.difficulty])}
                >
                  {question.difficulty}
                </Badge>
                {showCategory && question.category && (
                  <Badge variant="outline" className="text-xs">
                    {question.category}
                  </Badge>
                )}
              </div>

              {question.description && !isExpanded && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {question.description}
                </p>
              )}
            </div>
          </div>
        </TableCell>

        {/* Difficulty - hidden on mobile */}
        <TableCell className="hidden sm:table-cell w-24">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", difficultyStyles[question.difficulty])}
          >
            {question.difficulty}
          </Badge>
        </TableCell>

        {/* Category (optional) - hidden on mobile and tablet */}
        {showCategory && (
          <TableCell className="hidden md:table-cell w-28">
            {question.category && (
              <Badge variant="outline" className="text-xs">
                {question.category}
              </Badge>
            )}
          </TableCell>
        )}

        {/* Solved Checkbox */}
        <TableCell className="w-16 text-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileTap={{ scale: 0.9 }} className="inline-flex justify-center">
                <Checkbox
                  checked={isSolved}
                  onCheckedChange={() => onToggleSolved()}
                  disabled={!isLoggedIn}
                  aria-label={
                    isLoggedIn
                      ? isSolved
                        ? "Mark as unsolved"
                        : "Mark as solved"
                      : "Sign in to track progress"
                  }
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                    "hover:border-emerald-400",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isLoggedIn
                ? isSolved
                  ? "Mark as unsolved"
                  : "Mark as solved"
                : "Sign in to track progress"}
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Revision Bookmark */}
        <TableCell className="w-16 text-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9, rotate: isRevision ? -15 : 15 }}
                className="inline-flex justify-center"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRevision();
                  }}
                  disabled={!isLoggedIn}
                  aria-label={isRevision ? "Remove from revision" : "Add to revision"}
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isRevision
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-muted-foreground hover:text-foreground",
                    !isLoggedIn && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isRevision ? (
                    <BookmarkCheck className="h-4 w-4 fill-current" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {isLoggedIn
                ? isRevision
                  ? "Remove from revision"
                  : "Add to revision list"
                : "Sign in to track progress"}
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Folder Button (optional) */}
        {folderButton && (
          <TableCell className="w-12 text-center">
            {folderButton}
          </TableCell>
        )}
      </TableRow>

      {/* Expandable Answer Panel - spans all columns */}
      <AnimatePresence>
        {isExpanded && hasAnswer && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={showCategory ? (folderButton ? 7 : 6) : (folderButton ? 6 : 5)}
              className="p-0 border-0"
            >
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-muted/20 border-t border-border/30"
              >
                <AnswerPanel answer={question.answer} />
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
};

export default CompanyQuestionTableRow;
