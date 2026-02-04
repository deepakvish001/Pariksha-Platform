import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Bookmark,
  BookmarkCheck,
  BarChart3,
  Server,
  Brain,
  Layout,
  LineChart,
  Network,
  Cloud,
  Coffee,
  BarChart,
  Briefcase,
  Palette,
  Megaphone,
  TrendingUp,
  Rocket,
  Blocks,
  Globe,
  Search,
  Filter,
  X,
  StickyNote,
  FileText,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  roles,
  categories,
  getQuestions,
  getAllQuestionsForRole,
  getQuestionCountsByDifficulty,
  type Question,
  type Difficulty,
} from "@/data/positionResourcesData";

// Icon mapping for roles
const iconMap: Record<string, React.ElementType> = {
  Server,
  Brain,
  Layout,
  LineChart,
  Network,
  Cloud,
  Coffee,
  BarChart,
  Briefcase,
  Palette,
  Megaphone,
  TrendingUp,
  Rocket,
  Blocks,
  Globe,
};

// Local storage keys
const STORAGE_KEY = "position-resources-progress";

// View modes
type ViewMode = "all" | "revision";

interface ProgressState {
  [roleId: string]: {
    [categoryId: string]: {
      [questionId: number]: {
        solved: boolean;
        revision: boolean;
        note?: string;
      };
    };
  };
}

interface NoteDialogState {
  isOpen: boolean;
  questionId: number | null;
  categoryId: string | null;
  questionText: string;
}

interface QuestionWithMeta extends Question {
  categoryId: string;
  categoryName: string;
}

const PositionResources = () => {
  const [selectedRole, setSelectedRole] = useState(roles[0].id);
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({});
  const [noteDialog, setNoteDialog] = useState<NoteDialogState>({
    isOpen: false,
    questionId: null,
    categoryId: null,
    questionText: "",
  });
  const [noteText, setNoteText] = useState("");

  // Load progress from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch {
        console.error("Failed to parse progress from local storage");
      }
    }
  }, []);

  // Save progress to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Get current role data
  const currentRole = useMemo(
    () => roles.find((r) => r.id === selectedRole),
    [selectedRole]
  );

  // Get current category data
  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  // Get all revision questions across all categories for the selected role
  const revisionQuestions = useMemo(() => {
    const questions: QuestionWithMeta[] = [];
    categories.forEach((cat) => {
      const catQuestions = getQuestions(selectedRole, cat.id);
      catQuestions.forEach((q) => {
        if (progress[selectedRole]?.[cat.id]?.[q.id]?.revision) {
          questions.push({
            ...q,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        }
      });
    });
    return questions;
  }, [selectedRole, progress]);

  // Get current questions based on view mode
  const baseQuestions = useMemo(() => {
    if (viewMode === "revision") {
      return revisionQuestions;
    }
    return getQuestions(selectedRole, selectedCategory).map((q) => ({
      ...q,
      categoryId: selectedCategory,
      categoryName: currentCategory?.name || "",
    }));
  }, [selectedRole, selectedCategory, viewMode, revisionQuestions, currentCategory]);

  // Filter questions by search and difficulty
  const filteredQuestions = useMemo(() => {
    let filtered = baseQuestions;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q) =>
        q.text.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    return filtered;
  }, [baseQuestions, searchQuery, difficultyFilter]);

  // Toggle solved status
  const toggleSolved = (questionId: number, categoryId: string) => {
    setProgress((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [categoryId]: {
          ...prev[selectedRole]?.[categoryId],
          [questionId]: {
            ...prev[selectedRole]?.[categoryId]?.[questionId],
            solved: !prev[selectedRole]?.[categoryId]?.[questionId]?.solved,
          },
        },
      },
    }));
  };

  // Toggle revision status
  const toggleRevision = (questionId: number, categoryId: string) => {
    setProgress((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [categoryId]: {
          ...prev[selectedRole]?.[categoryId],
          [questionId]: {
            ...prev[selectedRole]?.[categoryId]?.[questionId],
            revision: !prev[selectedRole]?.[categoryId]?.[questionId]?.revision,
          },
        },
      },
    }));
  };

  // Check if question is solved
  const isSolved = (questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.solved || false;

  // Check if question is marked for revision
  const isRevision = (questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.revision || false;

  // Get note for a question
  const getNote = (questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.note || "";

  // Open note dialog
  const openNoteDialog = (questionId: number, categoryId: string, questionText: string) => {
    const existingNote = getNote(questionId, categoryId);
    setNoteText(existingNote);
    setNoteDialog({
      isOpen: true,
      questionId,
      categoryId,
      questionText,
    });
  };

  // Save note
  const saveNote = () => {
    if (noteDialog.questionId === null || noteDialog.categoryId === null) return;

    setProgress((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [noteDialog.categoryId!]: {
          ...prev[selectedRole]?.[noteDialog.categoryId!],
          [noteDialog.questionId!]: {
            ...prev[selectedRole]?.[noteDialog.categoryId!]?.[noteDialog.questionId!],
            note: noteText.trim() || undefined,
          },
        },
      },
    }));

    setNoteDialog({ isOpen: false, questionId: null, categoryId: null, questionText: "" });
    setNoteText("");
  };

  // Calculate progress stats for dialog
  const progressStats = useMemo(() => {
    const allQuestions = getAllQuestionsForRole(selectedRole);
    const counts = getQuestionCountsByDifficulty(allQuestions);

    let solvedEasy = 0;
    let solvedMedium = 0;
    let solvedHard = 0;
    let totalSolved = 0;

    // Count solved questions across all categories
    categories.forEach((cat) => {
      const catQuestions = getQuestions(selectedRole, cat.id);
      catQuestions.forEach((q) => {
        if (progress[selectedRole]?.[cat.id]?.[q.id]?.solved) {
          totalSolved++;
          if (q.difficulty === "Easy") solvedEasy++;
          if (q.difficulty === "Medium") solvedMedium++;
          if (q.difficulty === "Hard") solvedHard++;
        }
      });
    });

    return {
      total: counts.total,
      totalSolved,
      easy: { total: counts.easy, solved: solvedEasy },
      medium: { total: counts.medium, solved: solvedMedium },
      hard: { total: counts.hard, solved: solvedHard },
      percentage:
        counts.total > 0 ? Math.round((totalSolved / counts.total) * 100) : 0,
    };
  }, [selectedRole, progress]);

  // Get difficulty badge styles
  const getDifficultyStyles = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "Medium":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "Hard":
        return "bg-red-500/20 text-red-500 border-red-500/30";
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() !== "" || difficultyFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Position Wise Resources</h1>
              <p className="text-sm text-muted-foreground">
                Prepare for your dream job with position-specific resources
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 space-y-4">
        {/* Navigation Controls - Compact Grid Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Row 1: Role Select + View Mode */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Role Selector */}
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-72">
                {(() => {
                  const role = roles.find((r) => r.id === selectedRole);
                  const IconComponent = role ? iconMap[role.icon] : null;
                  return (
                    <div className="flex items-center gap-2">
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      <span className="truncate">{role?.name || "Select Role"}</span>
                    </div>
                  );
                })()}
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => {
                  const IconComponent = iconMap[role.icon];
                  return (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                        <span>{role.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("all")}
                className="flex-1 sm:flex-none gap-2"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">All Questions</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button
                variant={viewMode === "revision" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("revision")}
                className="flex-1 sm:flex-none gap-2"
              >
                <BookmarkCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Revision</span>
                <span className="sm:hidden">Rev</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {revisionQuestions.length}
                </Badge>
              </Button>
            </div>
          </div>

          {/* Row 2: Category Pills - Only show in "all" mode */}
          {viewMode === "all" && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs sm:text-sm"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Difficulty Filter */}
          <Select
            value={difficultyFilter}
            onValueChange={(v) => setDifficultyFilter(v as Difficulty | "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          {/* Progress Button */}
          <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                My Progress
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Progress for {currentRole?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">
                      {progressStats.totalSolved}/{progressStats.total} (
                      {progressStats.percentage}%)
                    </span>
                  </div>
                  <Progress value={progressStats.percentage} className="h-3" />
                </div>

                {/* Difficulty Breakdown */}
                <div className="space-y-4">
                  <h4 className="font-medium">By Difficulty</h4>

                  {/* Easy */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        Easy
                      </span>
                      <span>
                        {progressStats.easy.solved}/{progressStats.easy.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        progressStats.easy.total > 0
                          ? (progressStats.easy.solved / progressStats.easy.total) * 100
                          : 0
                      }
                      className="h-2 [&>div]:bg-green-500"
                    />
                  </div>

                  {/* Medium */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        Medium
                      </span>
                      <span>
                        {progressStats.medium.solved}/{progressStats.medium.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        progressStats.medium.total > 0
                          ? (progressStats.medium.solved / progressStats.medium.total) * 100
                          : 0
                      }
                      className="h-2 [&>div]:bg-orange-500"
                    />
                  </div>

                  {/* Hard */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        Hard
                      </span>
                      <span>
                        {progressStats.hard.solved}/{progressStats.hard.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        progressStats.hard.total > 0
                          ? (progressStats.hard.solved / progressStats.hard.total) * 100
                          : 0
                      }
                      className="h-2 [&>div]:bg-red-500"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Content Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <h2 className="text-2xl font-bold">
              {viewMode === "revision"
                ? `${currentRole?.name} - Revision List`
                : `${currentRole?.name} - ${currentCategory?.name}`}
            </h2>
            <p className="text-muted-foreground">
              {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}{" "}
              {hasActiveFilters ? "found" : "available"}
              {viewMode === "revision" && " for revision"}
            </p>
          </div>
        </motion.div>

        {/* Questions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg border border-border bg-card"
        >
          {filteredQuestions.length > 0 ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 sm:w-12">#</TableHead>
                    <TableHead className="min-w-0">Question</TableHead>
                    {viewMode === "revision" && (
                      <TableHead className="hidden md:table-cell w-28">Category</TableHead>
                    )}
                    <TableHead className="w-20 sm:w-24">Difficulty</TableHead>
                    <TableHead className="w-12 sm:w-16 text-center">
                      <span className="hidden sm:inline">Solved</span>
                      <span className="sm:hidden">✓</span>
                    </TableHead>
                    <TableHead className="w-12 sm:w-16 text-center">
                      <span className="hidden sm:inline">Revision</span>
                      <span className="sm:hidden">★</span>
                    </TableHead>
                    <TableHead className="w-12 sm:w-16 text-center">
                      <span className="hidden sm:inline">Notes</span>
                      <span className="sm:hidden">📝</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question, index) => {
                    const hasNote = !!getNote(question.id, question.categoryId);
                    return (
                      <TableRow
                        key={`${question.categoryId}-${question.id}`}
                        className={cn(
                          "transition-colors",
                          isSolved(question.id, question.categoryId) && "bg-muted/30"
                        )}
                      >
                        <TableCell className="font-medium text-muted-foreground text-xs sm:text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell className="min-w-0">
                          <p
                            className={cn(
                              "font-medium text-sm break-words",
                              isSolved(question.id, question.categoryId) &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {question.text}
                          </p>
                          {viewMode === "revision" && (
                            <Badge variant="secondary" className="font-normal mt-1 md:hidden text-xs">
                              {question.categoryName}
                            </Badge>
                          )}
                          {hasNote && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              <StickyNote className="h-3 w-3 inline mr-1" />
                              {getNote(question.id, question.categoryId)}
                            </p>
                          )}
                        </TableCell>
                        {viewMode === "revision" && (
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="secondary" className="font-normal text-xs">
                              {question.categoryName}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium text-xs",
                              getDifficultyStyles(question.difficulty)
                            )}
                          >
                            <span className="hidden sm:inline">{question.difficulty}</span>
                            <span className="sm:hidden">{question.difficulty[0]}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center p-2">
                          <Checkbox
                            checked={isSolved(question.id, question.categoryId)}
                            onCheckedChange={() =>
                              toggleSolved(question.id, question.categoryId)
                            }
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </TableCell>
                        <TableCell className="text-center p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleRevision(question.id, question.categoryId)
                            }
                            className={cn(
                              "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                              isRevision(question.id, question.categoryId)
                                ? "text-yellow-500 hover:text-yellow-600"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {isRevision(question.id, question.categoryId) ? (
                              <BookmarkCheck className="h-4 w-4 fill-current" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-center p-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openNoteDialog(question.id, question.categoryId, question.text)
                            }
                            className={cn(
                              "h-7 w-7 sm:h-8 sm:w-8 transition-colors",
                              hasNote
                                ? "text-blue-500 hover:text-blue-600"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {hasNote ? (
                              <FileText className="h-4 w-4" />
                            ) : (
                              <StickyNote className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              {viewMode === "revision" ? (
                <>
                  <BookmarkCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No revision questions</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bookmark questions to add them to your revision list.
                  </p>
                </>
              ) : hasActiveFilters ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No questions found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No questions available</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Questions for this category will be added soon.
                  </p>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Notes Dialog */}
        <Dialog
          open={noteDialog.isOpen}
          onOpenChange={(open) => {
            if (!open) {
              setNoteDialog({ isOpen: false, questionId: null, categoryId: null, questionText: "" });
              setNoteText("");
            }
          }}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Add Note
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{noteDialog.questionText}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Notes</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add your personal notes, hints, or key points..."
                  className="w-full min-h-[120px] p-3 text-sm border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNoteDialog({ isOpen: false, questionId: null, categoryId: null, questionText: "" });
                    setNoteText("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveNote}>
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PositionResources;
