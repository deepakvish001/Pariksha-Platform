import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
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
  ArrowLeft,
  Shuffle,
  Sparkles,
  List,
  LayoutGrid,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import ProgressSummaryCard from "@/components/library/ProgressSummaryCard";
import QuestionRow from "@/components/library/QuestionRow";
import CategorySection from "@/components/library/CategorySection";
import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition";

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
const VIEW_MODE_STORAGE_KEY = "position-resources-view-mode";

// View modes
type ViewMode = "all" | "revision";
type LayoutMode = "sections" | "tabs";

interface ProgressState {
  [roleId: string]: {
    [categoryId: string]: {
      [questionId: number]: {
        solved: boolean;
        revision: boolean;
        note?: string;
        completedAt?: string;
        reviewCount?: number;
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

const PositionDetail = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  
  // Get the role from URL params, fallback to first role
  const currentRole = useMemo(
    () => roles.find((r) => r.id === roleId) || roles[0],
    [roleId]
  );
  const selectedRole = currentRole.id;

  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "tabs" ? "tabs" : "sections";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [hasNotesFilter, setHasNotesFilter] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({});
  const [noteDialog, setNoteDialog] = useState<NoteDialogState>({
    isOpen: false,
    questionId: null,
    categoryId: null,
    questionText: "",
  });
  const [noteText, setNoteText] = useState("");
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);
  
  // Section open states for collapsible view (accordion behavior - only one open at a time)
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Persist layout mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

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

  // Get current category data
  const currentCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  // Get role icon
  const RoleIcon = iconMap[currentRole.icon] || Layers;

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

  // Get total question counts per category (unfiltered)
  const totalQuestionsPerCategory = useMemo(() => {
    const result: Record<string, number> = {};
    categories.forEach((cat) => {
      result[cat.id] = getQuestions(selectedRole, cat.id).length;
    });
    return result;
  }, [selectedRole]);

  // Get questions grouped by category for section view
  const questionsByCategory = useMemo(() => {
    const result: Record<string, QuestionWithMeta[]> = {};
    categories.forEach((cat) => {
      let catQuestions = getQuestions(selectedRole, cat.id).map((q) => ({
        ...q,
        categoryId: cat.id,
        categoryName: cat.name,
      }));

      // Apply revision filter for section view
      if (viewMode === "revision") {
        catQuestions = catQuestions.filter((q) =>
          progress[selectedRole]?.[q.categoryId]?.[q.id]?.revision
        );
      }

      // Apply filters
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        catQuestions = catQuestions.filter((q) =>
          q.text.toLowerCase().includes(query)
        );
      }
      if (difficultyFilter !== "all") {
        catQuestions = catQuestions.filter((q) => q.difficulty === difficultyFilter);
      }
      if (hasNotesFilter) {
        catQuestions = catQuestions.filter((q) =>
          Boolean(progress[selectedRole]?.[q.categoryId]?.[q.id]?.note)
        );
      }

      result[cat.id] = catQuestions;
    });
    return result;
  }, [selectedRole, searchQuery, difficultyFilter, hasNotesFilter, progress, viewMode]);

  // Check if filters are active (for highlighting matches)
  const isFiltered = searchQuery.trim() !== "" || difficultyFilter !== "all" || hasNotesFilter;

  // Auto-expand sections with matches when searching
  // Auto-expand section with search matches (open first matching section in accordion mode)
  useEffect(() => {
    if (layoutMode === "sections" && searchQuery.trim()) {
      const firstMatchingSection = categories.find(
        (cat) => (questionsByCategory[cat.id]?.length || 0) > 0
      );
      setOpenSection(firstMatchingSection?.id || null);
    }
  }, [searchQuery, layoutMode, questionsByCategory]);

  // Get current questions based on view mode (for tabs layout)
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

  // Filter questions by search, difficulty, and notes (for tabs layout)
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

    // Has notes filter
    if (hasNotesFilter) {
      filtered = filtered.filter((q) => 
        Boolean(progress[selectedRole]?.[q.categoryId]?.[q.id]?.note)
      );
    }

    return filtered;
  }, [baseQuestions, searchQuery, difficultyFilter, hasNotesFilter, progress, selectedRole]);

  // Toggle solved status with confetti
  const toggleSolved = useCallback((questionId: number, categoryId: string) => {
    const wasSolved = progress[selectedRole]?.[categoryId]?.[questionId]?.solved;
    const now = new Date().toISOString();
    
    setProgress((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [categoryId]: {
          ...prev[selectedRole]?.[categoryId],
          [questionId]: {
            ...prev[selectedRole]?.[categoryId]?.[questionId],
            solved: !wasSolved,
            // Set completedAt when marking as solved, clear when unsolved
            completedAt: wasSolved ? undefined : now,
            // Reset review count when marking as solved
            reviewCount: wasSolved ? prev[selectedRole]?.[categoryId]?.[questionId]?.reviewCount : 0,
          },
        },
      },
    }));

    // Trigger confetti when marking as solved
    if (!wasSolved) {
      setLastCompletedId(`${categoryId}-${questionId}`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
      setTimeout(() => setLastCompletedId(null), 1000);
    }
  }, [selectedRole, progress]);

  // Mark a question as reviewed for spaced repetition
  const markAsReviewed = useCallback((questionId: number, categoryId: string) => {
    const now = new Date().toISOString();
    const currentReviewCount = progress[selectedRole]?.[categoryId]?.[questionId]?.reviewCount || 0;
    
    setProgress((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [categoryId]: {
          ...prev[selectedRole]?.[categoryId],
          [questionId]: {
            ...prev[selectedRole]?.[categoryId]?.[questionId],
            completedAt: now,
            reviewCount: currentReviewCount + 1,
          },
        },
      },
    }));

    // Light confetti for review completion
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.7 },
      colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    });
  }, [selectedRole, progress]);

  // Toggle revision status
  const toggleRevision = useCallback((questionId: number, categoryId: string) => {
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
  }, [selectedRole]);

  // Check if question is solved
  const isSolved = useCallback((questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.solved || false
  , [selectedRole, progress]);

  // Check if question is marked for revision
  const isRevision = useCallback((questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.revision || false
  , [selectedRole, progress]);

  // Get note for a question
  const getNote = useCallback((questionId: number, categoryId: string) =>
    progress[selectedRole]?.[categoryId]?.[questionId]?.note || ""
  , [selectedRole, progress]);

  // Open note dialog
  const openNoteDialog = useCallback((questionId: number, categoryId: string, questionText: string) => {
    const existingNote = progress[selectedRole]?.[categoryId]?.[questionId]?.note || "";
    setNoteText(existingNote);
    setNoteDialog({
      isOpen: true,
      questionId,
      categoryId,
      questionText,
    });
  }, [selectedRole, progress]);

  // Save note
  const saveNote = useCallback(() => {
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
  }, [noteDialog, noteText, selectedRole]);

  // Calculate progress stats
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

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setHasNotesFilter(false);
  }, []);

  // Random question (for tabs view)
  const goToRandomQuestion = useCallback(() => {
    const unsolvedQuestions = filteredQuestions.filter(
      (q) => !isSolved(q.id, q.categoryId)
    );
    if (unsolvedQuestions.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
    const randomQuestion = unsolvedQuestions[randomIndex];
    
    // Scroll to the question or highlight it
    const element = document.querySelector(`[data-question-id="${randomQuestion.categoryId}-${randomQuestion.id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  }, [filteredQuestions, isSolved]);

  // Section controls (accordion behavior - only one section open at a time)
  const toggleSection = useCallback((categoryId: string) => {
    setOpenSection((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const expandAllSections = useCallback(() => {
    // In accordion mode, expand first section
    setOpenSection(categories[0]?.id || null);
  }, []);

  const collapseAllSections = useCallback(() => {
    setOpenSection(null);
  }, []);

  const allExpanded = false; // Accordion mode doesn't support all expanded

  const hasActiveFilters = searchQuery.trim() !== "" || difficultyFilter !== "all" || hasNotesFilter;
  const unsolvedCount = filteredQuestions.filter((q) => !isSolved(q.id, q.categoryId)).length;

  // Total filtered count for section view
  const totalFilteredCount = useMemo(() => {
    return Object.values(questionsByCategory).reduce((sum, qs) => sum + qs.length, 0);
  }, [questionsByCategory]);

  // Spaced repetition hook
  const { dueQuestions, stats: spacedRepStats } = useSpacedRepetition(progress, selectedRole);

  // Get question details for spaced repetition panel
  const getQuestionDetails = useCallback((questionId: number, categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return undefined;
    
    const questions = getQuestions(selectedRole, categoryId);
    const question = questions.find((q) => q.id === questionId);
    if (!question) return undefined;
    
    return {
      ...question,
      categoryId,
      categoryName: category.name,
    };
  }, [selectedRole]);

  // Scroll to a question in the list
  const scrollToQuestion = useCallback((questionId: number, categoryId: string) => {
    // Expand the section if collapsed (accordion mode - just set the section)
    if (openSection !== categoryId) {
      setOpenSection(categoryId);
    }
    
    // Scroll after a short delay for section to expand
    setTimeout(() => {
      const element = document.querySelector(
        `[data-question-id="${categoryId}-${questionId}"]`
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, 300);
  }, [openSection]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/library/positions")}
                  className="mr-2"
                  aria-label="Back to positions"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to positions</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <RoleIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold">{currentRole.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {progressStats.totalSolved}/{progressStats.total} questions completed
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          {/* Progress Summary Card */}
          <ProgressSummaryCard stats={progressStats} />

          {/* Spaced Repetition Panel */}
          <SpacedRepetitionPanel
            dueQuestions={dueQuestions}
            stats={spacedRepStats}
            getQuestionDetails={getQuestionDetails}
            onReviewQuestion={markAsReviewed}
            onScrollToQuestion={scrollToQuestion}
          />

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg border border-border bg-card overflow-hidden"
          >
            {/* View Mode Toggle + Layout Toggle */}
            <div className="border-b border-border p-3 md:p-4 bg-muted/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Layout Mode Toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-border p-1 bg-background">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutMode === "sections" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setLayoutMode("sections")}
                          className="h-7 px-2 gap-1"
                          aria-label="Section view"
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Sections</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Section View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={layoutMode === "tabs" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setLayoutMode("tabs")}
                          className="h-7 px-2 gap-1"
                          aria-label="Tab view"
                        >
                          <List className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline text-xs">Tabs</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Tab View</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Expand/Collapse All (only for sections mode) */}
                  {layoutMode === "sections" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={allExpanded ? collapseAllSections : expandAllSections}
                          className="h-7 px-2 gap-1"
                          aria-label={allExpanded ? "Collapse all sections" : "Expand all sections"}
                        >
                          {allExpanded ? (
                            <ChevronsDownUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline text-xs">
                            {allExpanded ? "Collapse" : "Expand"}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {allExpanded ? "Collapse all sections" : "Expand all sections"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                {/* Revision Toggle (visible in both modes) */}
                <Button
                  variant={viewMode === "revision" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(viewMode === "revision" ? "all" : "revision")}
                  className="h-7 gap-1"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span className="text-xs">Revision</span>
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-background/50">
                    {revisionQuestions.length}
                  </Badge>
                </Button>
              </div>

              {/* Tabs Navigation (only for tabs mode) */}
              {layoutMode === "tabs" && viewMode !== "revision" && (
                <div className="mt-3">
                  <Tabs
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <TabsList className="flex-wrap h-auto gap-1.5 md:gap-2 bg-transparent p-0">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category.id}
                          value={category.id}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm px-2.5 md:px-3 py-1.5"
                        >
                          <span className="hidden md:inline">{category.name}</span>
                          <span className="md:hidden">{category.name.replace(" Questions", "")}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Search and Filter Bar */}
            <div className="border-b border-border p-3 md:p-4">
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 h-9 md:h-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Filter Actions */}
                <div className="flex gap-2">
                  {/* Difficulty Filter */}
                  <Select
                    value={difficultyFilter}
                    onValueChange={(v) => setDifficultyFilter(v as Difficulty | "all")}
                  >
                    <SelectTrigger className="w-28 md:w-32 h-9 md:h-10">
                      <Filter className="h-3.5 w-3.5 mr-1.5 hidden sm:block" />
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Easy">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Easy
                        </span>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Medium
                        </span>
                      </SelectItem>
                      <SelectItem value="Hard">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          Hard
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Has Notes Filter */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={hasNotesFilter ? "default" : "outline"}
                        size="icon"
                        onClick={() => setHasNotesFilter(!hasNotesFilter)}
                        className="h-9 w-9 md:h-10 md:w-10"
                        aria-label={hasNotesFilter ? "Show all questions" : "Show questions with notes"}
                      >
                        <StickyNote className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hasNotesFilter ? "Show all questions" : "Show questions with notes"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Random Question (only for tabs mode) */}
                  {layoutMode === "tabs" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={goToRandomQuestion}
                          disabled={unsolvedCount === 0}
                          className="h-9 w-9 md:h-10 md:w-10"
                          aria-label="Pick a random unsolved question"
                        >
                          <Shuffle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Pick a random unsolved question
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Clear Filters */}
                  <AnimatePresence>
                    {hasActiveFilters && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 md:h-10 md:w-10" aria-label="Clear all filters">
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear all filters</TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {layoutMode === "sections" ? totalFilteredCount : filteredQuestions.length} question{(layoutMode === "sections" ? totalFilteredCount : filteredQuestions.length) !== 1 ? "s" : ""}{" "}
                  {hasActiveFilters ? "found" : "available"}
                  {viewMode === "revision" && " for revision"}
                </p>
                {layoutMode === "tabs" && unsolvedCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {unsolvedCount} pending
                  </Badge>
                )}
              </div>
            </div>

            {/* Content: Sections View or Tabs View */}
            {layoutMode === "sections" ? (
              /* Sections View */
              totalFilteredCount > 0 ? (
                <div>
                  {categories.map((category) => {
                    const categoryQuestions = questionsByCategory[category.id] || [];
                    // Skip empty categories in revision mode
                    if (viewMode === "revision" && categoryQuestions.length === 0) {
                      return null;
                    }
                    return (
                      <CategorySection
                        key={category.id}
                        categoryId={category.id}
                        categoryName={category.name}
                        questions={categoryQuestions}
                        totalQuestionsInCategory={totalQuestionsPerCategory[category.id] || 0}
                        isFiltered={isFiltered}
                        isOpen={openSection === category.id}
                        onOpenChange={() => toggleSection(category.id)}
                        isSolved={isSolved}
                        isRevision={isRevision}
                        getNote={getNote}
                        onToggleSolved={toggleSolved}
                        onToggleRevision={toggleRevision}
                        onOpenNote={openNoteDialog}
                      />
                    );
                  })}
                </div>
              ) : viewMode === "revision" ? (
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
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setViewMode("all")}
                  >
                    Browse All Questions
                  </Button>
                </motion.div>
              ) : (
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                </motion.div>
              )
            ) : (
              /* Tabs View (original) */
              filteredQuestions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/20">
                        <TableHead className="w-10 sm:w-12 text-xs font-semibold">#</TableHead>
                        <TableHead className="min-w-0 text-xs font-semibold">Question</TableHead>
                        {viewMode === "revision" && (
                          <TableHead className="hidden md:table-cell w-28 text-xs font-semibold">Category</TableHead>
                        )}
                        <TableHead className="w-20 sm:w-24 text-xs font-semibold">Difficulty</TableHead>
                        <TableHead className="w-12 sm:w-16 text-center text-xs font-semibold">
                          <span className="hidden sm:inline">Solved</span>
                          <span className="sm:hidden">✓</span>
                        </TableHead>
                        <TableHead className="w-12 sm:w-16 text-center text-xs font-semibold">
                          <span className="hidden sm:inline">Revision</span>
                          <span className="sm:hidden">★</span>
                        </TableHead>
                        <TableHead className="w-12 sm:w-16 text-center text-xs font-semibold">
                          <span className="hidden sm:inline">Notes</span>
                          <span className="sm:hidden">📝</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredQuestions.map((question, index) => (
                          <QuestionRow
                            key={`${question.categoryId}-${question.id}`}
                            question={question}
                            index={index}
                            isSolved={isSolved(question.id, question.categoryId)}
                            isRevision={isRevision(question.id, question.categoryId)}
                            hasNote={!!getNote(question.id, question.categoryId)}
                            notePreview={getNote(question.id, question.categoryId)}
                            showCategory={viewMode === "revision"}
                            onToggleSolved={() => toggleSolved(question.id, question.categoryId)}
                            onToggleRevision={() => toggleRevision(question.id, question.categoryId)}
                            onOpenNote={() => openNoteDialog(question.id, question.categoryId, question.text)}
                          />
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center px-4"
                >
                  {viewMode === "revision" ? (
                    <>
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
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setViewMode("all")}
                      >
                        Browse All Questions
                      </Button>
                    </>
                  ) : hasActiveFilters ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
                      >
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
                      >
                        <Layers className="h-8 w-8 text-muted-foreground" />
                      </motion.div>
                      <h3 className="text-lg font-medium">No questions available</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Questions for this category will be added soon.
                      </p>
                    </>
                  )}
                </motion.div>
              )
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
                  <label htmlFor="position-note-text" className="text-sm font-medium">Your Notes</label>
                  <textarea
                    id="position-note-text"
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
    </TooltipProvider>
  );
};

export default PositionDetail;
