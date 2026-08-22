import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  MessageSquare,
  Search,
  Filter,
  X,
  Shuffle,
  BookmarkCheck,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";
import AnswerPanel from "@/components/library/AnswerPanel";
import FolderManager from "@/components/library/FolderManager";
import AddToFolderButton from "@/components/library/AddToFolderButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewProgress } from "@/hooks/useInterviewProgress";
import { useFolders } from "@/hooks/useFolders";
import {
  interviewQuestions,
  interviewRoles,
  getQuestionsByRole,
  getQuestionsByDifficulty,
  searchQuestions,
  type InterviewQuestion,
} from "@/data/interviewQuestionsData";
import type { Difficulty } from "@/data/positionResourcesData";

type ViewMode = "all" | "solved" | "revision" | "folders";

const InterviewQuestions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const {
    isLoading,
    isSolved,
    isRevision,
    toggleSolved,
    toggleRevision,
    markReviewed,
    dueQuestions,
    spacedRepetitionStats,
  } = useInterviewProgress();

  const {
    folders,
    folderItems,
    isLoading: foldersLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    addToFolder,
    removeFromFolder,
    isInFolder,
  } = useFolders("interview");

  // Get questions in selected folder
  const folderQuestions = useMemo(() => {
    if (!selectedFolderId) return [];
    const items = folderItems[selectedFolderId] || [];
    return items
      .filter((item) => item.question_source === "interview")
      .map((item) => interviewQuestions.find((q) => q.id === item.question_id))
      .filter(Boolean) as InterviewQuestion[];
  }, [selectedFolderId, folderItems]);

  // Filter questions based on all filters
  const filteredQuestions = useMemo(() => {
    // If viewing folders and a folder is selected, show folder questions
    if (viewMode === "folders" && selectedFolderId) {
      let questions = folderQuestions;
      questions = getQuestionsByDifficulty(questions, difficultyFilter);
      questions = searchQuestions(questions, searchQuery);
      if (roleFilter !== "all") {
        questions = questions.filter((q) => q.roleId === roleFilter);
      }
      return questions;
    }

    let questions = getQuestionsByRole(roleFilter);
    questions = getQuestionsByDifficulty(questions, difficultyFilter);
    questions = searchQuestions(questions, searchQuery);

    // View mode filter
    if (viewMode === "solved") {
      questions = questions.filter((q) => isSolved(q.id));
    } else if (viewMode === "revision") {
      questions = questions.filter((q) => isRevision(q.id));
    }

    return questions;
  }, [roleFilter, difficultyFilter, searchQuery, viewMode, isSolved, isRevision, selectedFolderId, folderQuestions]);

  // Progress stats
  const progressStats = useMemo(() => {
    const allQs = interviewQuestions;
    let solvedEasy = 0, solvedMedium = 0, solvedHard = 0, totalSolved = 0;
    let easyTotal = 0, mediumTotal = 0, hardTotal = 0;

    allQs.forEach((q) => {
      if (q.difficulty === "Easy") easyTotal++;
      if (q.difficulty === "Medium") mediumTotal++;
      if (q.difficulty === "Hard") hardTotal++;

      if (isSolved(q.id)) {
        totalSolved++;
        if (q.difficulty === "Easy") solvedEasy++;
        if (q.difficulty === "Medium") solvedMedium++;
        if (q.difficulty === "Hard") solvedHard++;
      }
    });

    return {
      total: allQs.length,
      totalSolved,
      easy: { total: easyTotal, solved: solvedEasy },
      medium: { total: mediumTotal, solved: solvedMedium },
      hard: { total: hardTotal, solved: solvedHard },
      percentage: allQs.length > 0 ? Math.round((totalSolved / allQs.length) * 100) : 0,
    };
  }, [isSolved]);

  const handleToggleSolved = async (questionId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const wasSolved = isSolved(questionId);
    await toggleSolved(questionId);

    if (!wasSolved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#6ee7b7"],
      });
    }
  };

  const handleToggleRevision = async (questionId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    await toggleRevision(questionId);
  };

  const handleToggleExpand = useCallback((id: number) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id));
  }, []);

  const goToRandomQuestion = useCallback(() => {
    const unsolvedQuestions = filteredQuestions.filter((q) => !isSolved(q.id));
    if (unsolvedQuestions.length === 0) return;

    const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
    const randomQuestion = unsolvedQuestions[randomIndex];

    setExpandedQuestionId(randomQuestion.id);

    setTimeout(() => {
      const element = document.querySelector(`[data-question-id="${randomQuestion.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, 100);
  }, [filteredQuestions, isSolved]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setRoleFilter("all");
  }, []);

  // Get question details for spaced repetition panel
  const getQuestionDetails = useCallback((questionId: number) => {
    const question = interviewQuestions.find((q) => q.id === questionId);
    if (!question) return undefined;

    const role = interviewRoles.find((r) => r.id === question.roleId);
    return {
      id: question.id,
      text: question.text,
      difficulty: question.difficulty,
      categoryId: "interview",
      categoryName: role?.name || "General",
    };
  }, []);

  const handleReviewQuestion = useCallback(
    async (questionId: number) => {
      await markReviewed(questionId);
    },
    [markReviewed]
  );

  const handleScrollToQuestion = useCallback((questionId: number) => {
    setExpandedQuestionId(questionId);
    setTimeout(() => {
      const element = document.querySelector(`[data-question-id="${questionId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, 100);
  }, []);

  const hasActiveFilters = searchQuery.trim() !== "" || difficultyFilter !== "all" || roleFilter !== "all";
  const unsolvedCount = filteredQuestions.filter((q) => !isSolved(q.id)).length;

  const getRoleName = (roleId: string) => {
    const role = interviewRoles.find((r) => r.id === roleId);
    return role?.name || roleId;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Interview Questions</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Prepare for your interviews with our comprehensive collection of questions and answers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                    <TrendingUp className="h-4 w-4" />
                    My progress
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View your overall progress</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
          {/* View Mode Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as ViewMode);
              if (v !== "folders") {
                setSelectedFolderId(null);
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All questions</TabsTrigger>
              <TabsTrigger value="solved">Solved questions</TabsTrigger>
              <TabsTrigger value="revision" className="gap-1.5">
                <BookmarkCheck className="h-3.5 w-3.5" />
                Revision
              </TabsTrigger>
              <TabsTrigger value="folders" className="gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                Folders
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Progress Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Total Progress</span>
                  <span className="text-xs text-primary font-medium">{progressStats.percentage}%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{progressStats.totalSolved}</span>
                  <span className="text-sm text-muted-foreground">/ {progressStats.total}</span>
                </div>
                <Progress value={progressStats.percentage} className="h-1.5 mt-2" />
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Easy Questions</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-emerald-500">{progressStats.easy.solved}</span>
                  <span className="text-sm text-muted-foreground">/ {progressStats.easy.total}</span>
                </div>
                <Progress
                  value={progressStats.easy.total > 0 ? (progressStats.easy.solved / progressStats.easy.total) * 100 : 0}
                  className="h-1.5 mt-2 [&>div]:bg-emerald-500"
                />
              </CardContent>
            </Card>

            <Card className="border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Medium Questions</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-amber-500">{progressStats.medium.solved}</span>
                  <span className="text-sm text-muted-foreground">/ {progressStats.medium.total}</span>
                </div>
                <Progress
                  value={progressStats.medium.total > 0 ? (progressStats.medium.solved / progressStats.medium.total) * 100 : 0}
                  className="h-1.5 mt-2 [&>div]:bg-amber-500"
                />
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Hard Questions</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-red-500">{progressStats.hard.solved}</span>
                  <span className="text-sm text-muted-foreground">/ {progressStats.hard.total}</span>
                </div>
                <Progress
                  value={progressStats.hard.total > 0 ? (progressStats.hard.solved / progressStats.hard.total) * 100 : 0}
                  className="h-1.5 mt-2 [&>div]:bg-red-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Folders View */}
          {viewMode === "folders" && user && (
            <FolderManager
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={createFolder}
              onUpdateFolder={updateFolder}
              onDeleteFolder={deleteFolder}
              isLoading={foldersLoading}
            />
          )}

          {/* Spaced Repetition Panel */}
          {user && spacedRepetitionStats.total > 0 && viewMode !== "folders" && (
            <SpacedRepetitionPanel
              dueQuestions={dueQuestions}
              stats={spacedRepetitionStats}
              getQuestionDetails={getQuestionDetails}
              onReviewQuestion={handleReviewQuestion}
              onScrollToQuestion={handleScrollToQuestion}
            />
          )}

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interview questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v as Difficulty | "all")}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-3.5 w-3.5 mr-2" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {interviewRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToRandomQuestion}
                  disabled={unsolvedCount === 0}
                  aria-label="Pick random unsolved question"
                  className="gap-1.5 ml-auto"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Random</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pick random unsolved question</TooltipContent>
            </Tooltip>
          </div>

          {/* Questions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20">
                      <TableHead className="w-12 text-xs font-semibold">#</TableHead>
                      <TableHead className="min-w-0 text-xs font-semibold">Question</TableHead>
                      <TableHead className="hidden md:table-cell w-40 text-xs font-semibold">Role</TableHead>
                      <TableHead className="hidden sm:table-cell w-24 text-xs font-semibold">Difficulty</TableHead>
                      <TableHead className="w-16 text-center text-xs font-semibold">Solved</TableHead>
                      <TableHead className="w-16 text-center text-xs font-semibold">Revision</TableHead>
                      {user && folders.length > 0 && (
                        <TableHead className="w-12 text-center text-xs font-semibold">Folder</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredQuestions.map((question, index) => (
                        <QuestionRow
                          key={question.id}
                          question={question}
                          index={index}
                          isSolved={isSolved(question.id)}
                          isRevision={isRevision(question.id)}
                          isExpanded={expandedQuestionId === question.id}
                          isLoggedIn={!!user}
                          getRoleName={getRoleName}
                          folders={folders}
                          isInFolder={isInFolder}
                          onAddToFolder={addToFolder}
                          onRemoveFromFolder={removeFromFolder}
                          onToggleSolved={() => handleToggleSolved(question.id)}
                          onToggleRevision={() => handleToggleRevision(question.id)}
                          onToggleExpand={() => handleToggleExpand(question.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            ) : viewMode === "folders" ? (
              selectedFolderId ? (
                <EmptyFolderState />
              ) : (
                <SelectFolderState />
              )
            ) : viewMode === "revision" ? (
              <EmptyRevisionState onBrowseAll={() => setViewMode("all")} />
            ) : viewMode === "solved" ? (
              <EmptySolvedState onBrowseAll={() => setViewMode("all")} />
            ) : hasActiveFilters ? (
              <EmptySearchState onClearFilters={clearFilters} />
            ) : (
              <EmptyQuestionsState />
            )}
          </motion.div>

          {/* Login prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">
                Sign in to track your progress and sync across devices
              </p>
              <Button size="sm" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </motion.div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
};

// Question Row Component
interface QuestionRowProps {
  question: InterviewQuestion;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  isExpanded: boolean;
  isLoggedIn: boolean;
  getRoleName: (roleId: string) => string;
  folders: import("@/hooks/useFolders").Folder[];
  isInFolder: (folderId: string, questionId: number, questionSource: string) => boolean;
  onAddToFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  onRemoveFromFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onToggleExpand: () => void;
}

const QuestionRow = ({
  question,
  index,
  isSolved,
  isRevision,
  isExpanded,
  isLoggedIn,
  getRoleName,
  folders,
  isInFolder,
  onAddToFolder,
  onRemoveFromFolder,
  onToggleSolved,
  onToggleRevision,
  onToggleExpand,
}: QuestionRowProps) => {
  const difficultyColors = {
    Easy: "text-emerald-500 bg-emerald-500/10",
    Medium: "text-amber-500 bg-amber-500/10",
    Hard: "text-red-500 bg-red-500/10",
  };

  const hasFolders = folders.length > 0;

  return (
    <>
      <TableRow
        data-question-id={question.id}
        className={cn(
          "cursor-pointer transition-colors",
          isSolved && "bg-emerald-500/5",
          isExpanded && "bg-muted/50"
        )}
        onClick={onToggleExpand}
      >
        <TableCell className="font-medium text-muted-foreground text-sm">
          {index + 1}
        </TableCell>
        <TableCell>
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", isSolved && "text-muted-foreground")}>
                {question.text}
              </p>
              {question.answer && !isExpanded && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {question.answer.replace(/[#*`]/g, "").slice(0, 100)}...
                </p>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Badge variant="outline" className="text-xs font-normal">
            {getRoleName(question.roleId)}
          </Badge>
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Badge className={cn("text-xs", difficultyColors[question.difficulty])}>
            {question.difficulty}
          </Badge>
        </TableCell>
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSolved}
                disabled={!isLoggedIn}
                aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                className={cn("h-8 w-8", isSolved && "text-emerald-500")}
              >
                <CheckCircle2 className={cn("h-4 w-4", isSolved && "fill-emerald-500")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isSolved ? "Mark as unsolved" : "Mark as solved"}</TooltipContent>
          </Tooltip>
        </TableCell>
        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleRevision}
                disabled={!isLoggedIn}
                aria-label={isRevision ? "Remove from revision" : "Add to revision"}
                className={cn("h-8 w-8", isRevision && "text-amber-500")}
              >
                <Bookmark className={cn("h-4 w-4", isRevision && "fill-amber-500")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRevision ? "Remove from revision" : "Add to revision"}</TooltipContent>
          </Tooltip>
        </TableCell>
        {isLoggedIn && hasFolders && (
          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
            <AddToFolderButton
              folders={folders}
              questionId={question.id}
              questionSource="interview"
              isInFolder={isInFolder}
              onAddToFolder={onAddToFolder}
              onRemoveFromFolder={onRemoveFromFolder}
              disabled={!isLoggedIn}
            />
          </TableCell>
        )}
      </TableRow>

      <AnimatePresence>
        {isExpanded && question.answer && (
          <TableRow>
            <TableCell colSpan={hasFolders && isLoggedIn ? 7 : 6} className="p-0 border-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
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

// Empty States
const EmptyRevisionState = ({ onBrowseAll }: { onBrowseAll: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4"
    >
      <BookmarkCheck className="h-8 w-8 text-amber-500" />
    </motion.div>
    <h3 className="text-lg font-medium">No revision questions</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Bookmark questions to add them to your revision list for quick access later.
    </p>
    <Button variant="outline" className="mt-4" onClick={onBrowseAll}>
      Browse All Questions
    </Button>
  </motion.div>
);

const EmptySolvedState = ({ onBrowseAll }: { onBrowseAll: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"
    >
      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
    </motion.div>
    <h3 className="text-lg font-medium">No solved questions yet</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Start solving questions to track your progress here.
    </p>
    <Button variant="outline" className="mt-4" onClick={onBrowseAll}>
      Start Solving
    </Button>
  </motion.div>
);

const EmptySearchState = ({ onClearFilters }: { onClearFilters: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
    >
      <Search className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <h3 className="text-lg font-medium">No questions found</h3>
    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
    <Button variant="outline" onClick={onClearFilters} className="mt-4">
      Clear Filters
    </Button>
  </motion.div>
);

const EmptyQuestionsState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
    >
      <MessageSquare className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <h3 className="text-lg font-medium">No questions available</h3>
    <p className="text-sm text-muted-foreground mt-1">Questions will be added soon.</p>
  </motion.div>
);

const EmptyFolderState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Folder className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium">This folder is empty</h3>
    <p className="text-sm text-muted-foreground mt-1">Add questions to this folder from the All questions tab.</p>
  </motion.div>
);

const SelectFolderState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 text-center px-4"
  >
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Folder className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium">Select a folder</h3>
    <p className="text-sm text-muted-foreground mt-1">Choose a folder above to view its questions.</p>
  </motion.div>
);

export default InterviewQuestions;
