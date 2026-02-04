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
      };
    };
  };
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

      <main className="p-6 md:p-8 space-y-6">
        {/* Role Tabs - Horizontally Scrollable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-3">
              {roles.map((role) => {
                const IconComponent = iconMap[role.icon];
                return (
                  <Button
                    key={role.id}
                    variant={selectedRole === role.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "flex items-center gap-2 shrink-0 transition-all",
                      selectedRole === role.id && "shadow-md"
                    )}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span>{role.name}</span>
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* View Mode + Category Tabs */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* View Mode Toggle */}
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
              className="shrink-0"
            >
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="gap-2">
                  <Layers className="h-4 w-4" />
                  All Questions
                </TabsTrigger>
                <TabsTrigger value="revision" className="gap-2">
                  <BookmarkCheck className="h-4 w-4" />
                  Revision ({revisionQuestions.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Category Tabs - Only show in "all" mode */}
            {viewMode === "all" && (
              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="flex-1"
              >
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="shrink-0"
                    >
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>
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
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Question</TableHead>
                  {viewMode === "revision" && (
                    <TableHead className="w-36">Category</TableHead>
                  )}
                  <TableHead className="w-28">Difficulty</TableHead>
                  <TableHead className="w-20 text-center">Solved</TableHead>
                  <TableHead className="w-20 text-center">Revision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuestions.map((question, index) => (
                  <TableRow
                    key={`${question.categoryId}-${question.id}`}
                    className={cn(
                      "transition-colors",
                      isSolved(question.id, question.categoryId) && "bg-muted/30"
                    )}
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        isSolved(question.id, question.categoryId) &&
                          "line-through text-muted-foreground"
                      )}
                    >
                      {question.text}
                    </TableCell>
                    {viewMode === "revision" && (
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {question.categoryName}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          getDifficultyStyles(question.difficulty)
                        )}
                      >
                        {question.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSolved(question.id, question.categoryId)}
                        onCheckedChange={() =>
                          toggleSolved(question.id, question.categoryId)
                        }
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleRevision(question.id, question.categoryId)
                        }
                        className={cn(
                          "h-8 w-8 transition-colors",
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
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
      </main>
    </div>
  );
};

export default PositionResources;
