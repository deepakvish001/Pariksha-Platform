import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  Search,
  Star,
  Briefcase,
  Loader2,
  Database,
  MessageSquare,
  Code2,
  Brain,
  Globe,
  FolderKanban,
  FileText,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Filter,
  X,
  ArrowLeft,
  Shuffle,
  Sparkles,
  List,
  LayoutGrid,
  ChevronsUpDown,
  ChevronsDownUp,
  BookmarkCheck,
  FileQuestion,
} from "lucide-react";
import CompanyCategorySection from "@/components/library/CompanyCategorySection";
import CompanyQuestionTableRow from "@/components/library/CompanyQuestionTableRow";
import ProgressSummaryCard from "@/components/library/ProgressSummaryCard";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { companies, categoryColors } from "@/data/companyResourcesData";
import {
  companyTabs,
  sqlQuestions,
  interviewQuestions,
  dsaQuestions,
  aptitudeQuestions,
  jobPortals,
  projects,
  resumeTemplates,
  coldDMs,
  type Question,
  type JobPortal,
  type Project,
  type ResumeTemplate,
  type ColdDM,
  type Difficulty,
} from "@/data/companyDetailData";
import { useCompanyProgress } from "@/hooks/useCompanyProgress";

// Local storage keys
const FAVORITES_KEY = "company-favorites";
const VIEW_MODE_STORAGE_KEY = "company-detail-view-mode";

// View modes
type ViewMode = "all" | "revision";
type LayoutMode = "sections" | "tabs";

// Tab icons mapping
const tabIcons: Record<string, React.ElementType> = {
  "sql-questions": Database,
  "interview-questions": MessageSquare,
  "dsa-questions": Code2,
  "aptitude-questions": Brain,
  "job-portals": Globe,
  "projects": FolderKanban,
  "resume-templates": FileText,
  "cold-dms": Mail,
};

// Question tab IDs
const questionTabIds = ["sql-questions", "interview-questions", "dsa-questions", "aptitude-questions"];
const resourceTabIds = ["job-portals", "projects", "resume-templates", "cold-dms"];

// Question categories for section view
const questionCategories = [
  { id: "sql-questions", name: "SQL Questions" },
  { id: "interview-questions", name: "Interview Questions" },
  { id: "dsa-questions", name: "DSA Questions" },
  { id: "aptitude-questions", name: "Aptitude Questions" },
];

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Find the company
  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companyId]
  );

  const [activeTab, setActiveTab] = useState("sql-questions");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "tabs" ? "tabs" : "sections";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist layout mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

  // Reset filters when switching modes
  useEffect(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setExpandedQuestionIds(new Set());
  }, [activeTab, layoutMode]);

  // Use Supabase-synced progress for current tab
  const {
    isLoading,
    isSolved,
    isRevision,
    toggleSolved: toggleSolvedAsync,
    toggleRevision: toggleRevisionAsync,
  } = useCompanyProgress(companyId, activeTab);

  // Save favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = () => {
    if (!companyId) return;
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(companyId)) {
        newFavorites.delete(companyId);
      } else {
        newFavorites.add(companyId);
      }
      return newFavorites;
    });
  };

  const handleToggleSolved = async (itemId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const wasSolved = isSolved(itemId);
    await toggleSolvedAsync(itemId);

    if (!wasSolved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#6ee7b7"],
      });
    }
  };

  const handleToggleRevision = async (itemId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    await toggleRevisionAsync(itemId);
  };

  // Get all questions data
  const allQuestions = useMemo(() => ({
    "sql-questions": sqlQuestions,
    "interview-questions": interviewQuestions,
    "dsa-questions": dsaQuestions,
    "aptitude-questions": aptitudeQuestions,
  }), []);

  // Get current tab data (for tabs mode)
  const currentTabQuestions = useMemo(() => {
    return allQuestions[activeTab as keyof typeof allQuestions] || [];
  }, [activeTab, allQuestions]);

  // Get all revision questions across all categories
  const revisionQuestions = useMemo(() => {
    const questions: (Question & { categoryId: string; categoryName: string })[] = [];
    questionCategories.forEach((cat) => {
      const catQuestions = allQuestions[cat.id as keyof typeof allQuestions] || [];
      catQuestions.forEach((q) => {
        if (isRevision(q.id)) {
          questions.push({
            ...q,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        }
      });
    });
    return questions;
  }, [allQuestions, isRevision]);

  // Get questions grouped by category for section view
  const questionsByCategory = useMemo(() => {
    const result: Record<string, Question[]> = {};
    questionCategories.forEach((cat) => {
      let catQuestions = allQuestions[cat.id as keyof typeof allQuestions] || [];

      // Apply revision filter
      if (viewMode === "revision") {
        catQuestions = catQuestions.filter((q) => isRevision(q.id));
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        catQuestions = catQuestions.filter((q) =>
          q.text.toLowerCase().includes(query)
        );
      }

      // Apply difficulty filter
      if (difficultyFilter !== "all") {
        catQuestions = catQuestions.filter((q) => q.difficulty === difficultyFilter);
      }

      result[cat.id] = catQuestions;
    });
    return result;
  }, [allQuestions, searchQuery, difficultyFilter, viewMode, isRevision]);

  // Total question counts per category (unfiltered)
  const totalQuestionsPerCategory = useMemo(() => {
    const result: Record<string, number> = {};
    questionCategories.forEach((cat) => {
      result[cat.id] = (allQuestions[cat.id as keyof typeof allQuestions] || []).length;
    });
    return result;
  }, [allQuestions]);

  // Check if filters are active
  const isFiltered = searchQuery.trim() !== "" || difficultyFilter !== "all";
  const hasActiveFilters = isFiltered;

  // Auto-expand section with search matches
  useEffect(() => {
    if (layoutMode === "sections" && searchQuery.trim()) {
      const firstMatchingSection = questionCategories.find(
        (cat) => (questionsByCategory[cat.id]?.length || 0) > 0
      );
      setOpenSection(firstMatchingSection?.id || null);
    }
  }, [searchQuery, layoutMode, questionsByCategory]);

  // Filter questions for tabs mode
  const filteredTabQuestions = useMemo(() => {
    let filtered = viewMode === "revision" ? revisionQuestions : currentTabQuestions;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q) => q.text.toLowerCase().includes(query));
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    return filtered;
  }, [currentTabQuestions, revisionQuestions, searchQuery, difficultyFilter, viewMode]);

  // Section controls (accordion behavior)
  const toggleSection = useCallback((categoryId: string) => {
    setOpenSection((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const expandAllSections = useCallback(() => {
    setOpenSection(questionCategories[0]?.id || null);
  }, []);

  const collapseAllSections = useCallback(() => {
    setOpenSection(null);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
  }, []);

  // Random question for tabs mode
  const goToRandomQuestion = useCallback(() => {
    const unsolvedQuestions = filteredTabQuestions.filter((q) => !isSolved(q.id));
    if (unsolvedQuestions.length === 0) return;

    const randomIndex = Math.floor(Math.random() * unsolvedQuestions.length);
    const randomQuestion = unsolvedQuestions[randomIndex];

    setExpandedQuestionIds(new Set([randomQuestion.id]));

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
  }, [filteredTabQuestions, isSolved]);

  // Toggle answer expansion for tabs mode
  const handleToggleExpand = useCallback((id: number) => {
    setExpandedQuestionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        // Only one expanded at a time
        newSet.clear();
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Calculate progress stats
  const progressStats = useMemo(() => {
    const allQs = [...sqlQuestions, ...interviewQuestions, ...dsaQuestions, ...aptitudeQuestions];
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

  // Total filtered count for section view
  const totalFilteredCount = useMemo(() => {
    return Object.values(questionsByCategory).reduce((sum, qs) => sum + qs.length, 0);
  }, [questionsByCategory]);

  const unsolvedCount = filteredTabQuestions.filter((q) => !isSolved(q.id)).length;

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Company not found</h2>
          <Button variant="outline" onClick={() => navigate("/library/companies")}>
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  const getCategoryStyle = (category: string) => {
    return categoryColors[category] || "text-muted-foreground border-border bg-muted/50";
  };

  const isFavorited = favorites.has(companyId || "");
  const isQuestionMode = !resourceTabIds.includes(activeTab);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <SidebarTrigger />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/library/companies")}
                  className="mr-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to companies</TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-bold truncate">{company.name}</h1>
                  <Badge variant="outline" className={cn("text-xs shrink-0 hidden sm:inline-flex", getCategoryStyle(company.category))}>
                    {company.category}
                  </Badge>
                  {company.isHiring && (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/40 bg-emerald-500/10 shrink-0 hidden sm:inline-flex">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Hiring
                    </Badge>
                  )}
                </div>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {progressStats.totalSolved}/{progressStats.total} questions completed
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorite}
              className={cn(
                "gap-2 shrink-0",
                isFavorited && "text-amber-500 border-amber-500/50 bg-amber-500/10"
              )}
            >
              <Star className={cn("h-4 w-4", isFavorited && "fill-amber-400")} />
              <span className="hidden sm:inline">{isFavorited ? "Favorited" : "Favorite"}</span>
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
          {/* Progress Summary Card */}
          {user && <ProgressSummaryCard stats={progressStats} />}

          {/* Resource Tabs (separate section for non-question resources) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-wrap gap-2"
          >
            {companyTabs
              .filter((tab) => resourceTabIds.includes(tab.id))
              .map((tab) => {
                const Icon = tabIcons[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                  </Button>
                );
              })}
          </motion.div>

          {/* Main Questions Content Card */}
          {isQuestionMode && (
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
                            onClick={openSection ? collapseAllSections : expandAllSections}
                            className="h-7 px-2 gap-1"
                          >
                            {openSection ? (
                              <ChevronsDownUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline text-xs">
                              {openSection ? "Collapse" : "Expand"}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {openSection ? "Collapse section" : "Expand first section"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Revision Toggle */}
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

                {/* Category Tabs (only for tabs mode) */}
                {layoutMode === "tabs" && viewMode !== "revision" && (
                  <div className="mt-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="flex-wrap h-auto gap-1.5 md:gap-2 bg-transparent p-0">
                        {questionCategories.map((category) => (
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
                              <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 md:h-10 md:w-10">
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
                    {layoutMode === "sections" ? totalFilteredCount : filteredTabQuestions.length} question{(layoutMode === "sections" ? totalFilteredCount : filteredTabQuestions.length) !== 1 ? "s" : ""}{" "}
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

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading progress...</span>
                </div>
              )}

              {/* Content: Sections View or Tabs View */}
              {!isLoading && layoutMode === "sections" ? (
                /* Sections View */
                totalFilteredCount > 0 ? (
                  <div>
                    {questionCategories.map((category) => {
                      const categoryQuestions = questionsByCategory[category.id] || [];
                      // Skip empty categories in revision mode
                      if (viewMode === "revision" && categoryQuestions.length === 0) {
                        return null;
                      }
                      return (
                        <CompanyCategorySection
                          key={category.id}
                          categoryId={category.id}
                          categoryName={category.name}
                          questions={categoryQuestions}
                          totalQuestionsInCategory={totalQuestionsPerCategory[category.id] || 0}
                          isFiltered={isFiltered}
                          isOpen={openSection === category.id}
                          showCategory={activeTab === "sql-questions"}
                          onOpenChange={() => toggleSection(category.id)}
                          isSolved={isSolved}
                          isRevision={isRevision}
                          onToggleSolved={handleToggleSolved}
                          onToggleRevision={handleToggleRevision}
                          isLoggedIn={!!user}
                        />
                      );
                    })}
                  </div>
                ) : viewMode === "revision" ? (
                  <EmptyRevisionState onBrowseAll={() => setViewMode("all")} />
                ) : (
                  <EmptySearchState onClearFilters={clearFilters} />
                )
              ) : !isLoading && layoutMode === "tabs" ? (
                /* Tabs View */
                filteredTabQuestions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20">
                          <TableHead className="w-10 sm:w-12 text-xs font-semibold">#</TableHead>
                          <TableHead className="min-w-0 text-xs font-semibold">Question</TableHead>
                          {viewMode === "revision" && (
                            <TableHead className="hidden md:table-cell w-28 text-xs font-semibold">Category</TableHead>
                          )}
                          <TableHead className="hidden sm:table-cell w-20 sm:w-24 text-xs font-semibold">Difficulty</TableHead>
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
                          {filteredTabQuestions.map((question, index) => (
                            <CompanyQuestionTableRow
                              key={question.id}
                              question={question}
                              index={index}
                              isSolved={isSolved(question.id)}
                              isRevision={isRevision(question.id)}
                              isExpanded={expandedQuestionIds.has(question.id)}
                              isLoggedIn={!!user}
                              showCategory={viewMode === "revision"}
                              onToggleSolved={() => handleToggleSolved(question.id)}
                              onToggleRevision={() => handleToggleRevision(question.id)}
                              onToggleExpand={() => handleToggleExpand(question.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                ) : viewMode === "revision" ? (
                  <EmptyRevisionState onBrowseAll={() => setViewMode("all")} />
                ) : hasActiveFilters ? (
                  <EmptySearchState onClearFilters={clearFilters} />
                ) : (
                  <EmptyQuestionsState />
                )
              ) : null}
            </motion.div>
          )}

          {/* Resource Content (non-question tabs) */}
          {!isQuestionMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {activeTab === "job-portals" && (
                <JobPortalsGrid
                  portals={jobPortals}
                  isSolved={isSolved}
                  toggleSolved={handleToggleSolved}
                  isLoggedIn={!!user}
                />
              )}

              {activeTab === "projects" && <ProjectsGrid projects={projects} />}

              {activeTab === "resume-templates" && <ResumeTemplatesGrid templates={resumeTemplates} />}

              {activeTab === "cold-dms" && (
                <ColdDMsGrid
                  dms={coldDMs}
                  isSolved={isSolved}
                  toggleSolved={handleToggleSolved}
                  isLoggedIn={!!user}
                />
              )}
            </motion.div>
          )}

          {/* Login prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-primary/30 bg-primary/5 text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">Sign in to track your progress and sync across devices</p>
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
    <p className="text-sm text-muted-foreground mt-1">
      Try adjusting your search or filters.
    </p>
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
      <FileQuestion className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <h3 className="text-lg font-medium">No questions available</h3>
    <p className="text-sm text-muted-foreground mt-1">
      Questions for this category will be added soon.
    </p>
  </motion.div>
);

// Resource Grid Components
interface JobPortalsGridProps {
  portals: JobPortal[];
  isSolved: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  isLoggedIn: boolean;
}

const JobPortalsGrid = ({ portals, isSolved, toggleSolved, isLoggedIn }: JobPortalsGridProps) => {
  if (portals.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg p-12 text-center">
        <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-foreground mb-1">No job portals found</h3>
        <p className="text-sm text-muted-foreground">Check back later for updates</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {portals.map((portal, index) => (
        <motion.div
          key={portal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all bg-card"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <button
              onClick={() => toggleSolved(portal.id)}
              disabled={!isLoggedIn}
              className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                isSolved(portal.id)
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                  : "border-border hover:border-emerald-500/50",
                !isLoggedIn && "opacity-50 cursor-not-allowed"
              )}
              title={isLoggedIn ? (isSolved(portal.id) ? "Mark as not applied" : "Mark as applied") : "Sign in to track"}
            >
              {isSolved(portal.id) && <Check className="h-4 w-4" />}
            </button>
          </div>
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{portal.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{portal.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {portal.location}
            </Badge>
            {portal.url && (
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Visit <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface ProjectsGridProps {
  projects: Project[];
}

const ProjectsGrid = ({ projects }: ProjectsGridProps) => {
  if (projects.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg p-12 text-center">
        <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-foreground mb-1">No projects available</h3>
        <p className="text-sm text-muted-foreground">Check back later for project ideas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all bg-card"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
            {project.technologies.slice(0, 5).map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{project.technologies.length - 5}
              </Badge>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface ResumeTemplatesGridProps {
  templates: ResumeTemplate[];
}

const ResumeTemplatesGrid = ({ templates }: ResumeTemplatesGridProps) => {
  if (templates.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-foreground mb-1">No templates available</h3>
        <p className="text-sm text-muted-foreground">Check back later for resume templates</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all bg-card cursor-pointer"
        >
          <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
            <FileText className="h-12 w-12 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="gap-2">
                <ExternalLink className="h-3 w-3" />
                Preview
              </Button>
            </div>
          </div>
          <div className="p-3">
            <h4 className="font-medium text-sm mb-1 truncate">{template.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {template.style}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface ColdDMsGridProps {
  dms: ColdDM[];
  isSolved: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  isLoggedIn: boolean;
}

const ColdDMsGrid = ({ dms, isSolved, toggleSolved, isLoggedIn }: ColdDMsGridProps) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (dm: ColdDM) => {
    await navigator.clipboard.writeText(dm.message);
    setCopiedId(dm.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (dms.length === 0) {
    return (
      <div className="border border-border/50 rounded-lg p-12 text-center">
        <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="font-medium text-foreground mb-1">No templates found</h3>
        <p className="text-sm text-muted-foreground">Check back later for cold DM templates</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {dms.map((dm, index) => (
        <motion.div
          key={dm.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "group border rounded-xl p-5 transition-all bg-card",
            copiedId === dm.id
              ? "border-emerald-500/50 bg-emerald-500/5"
              : "border-border/50 hover:border-primary/50"
          )}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">{dm.title}</h3>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {dm.category}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => toggleSolved(dm.id)}
              disabled={!isLoggedIn}
              className={cn(
                "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                isSolved(dm.id) ? "border-emerald-500 bg-emerald-500/20 text-emerald-500" : "border-border hover:border-emerald-500/50",
                !isLoggedIn && "opacity-50 cursor-not-allowed"
              )}
              title={isLoggedIn ? (isSolved(dm.id) ? "Mark as unused" : "Mark as used") : "Sign in to track"}
            >
              {isSolved(dm.id) && <Check className="h-3 w-3" />}
            </button>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{dm.message}</p>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">{dm.message.length} chars</span>
            <Button
              size="sm"
              variant={copiedId === dm.id ? "default" : "outline"}
              className={cn(
                "gap-2 h-8 transition-all",
                copiedId === dm.id && "bg-emerald-500 hover:bg-emerald-600"
              )}
              onClick={() => handleCopy(dm)}
            >
              {copiedId === dm.id ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CompanyDetail;
