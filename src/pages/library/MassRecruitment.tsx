import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Users,
  Search,
  Star,
  Loader2,
  Database,
  MessageSquare,
  Code2,
  Brain,
  Cpu,
  Filter,
  X,
  Shuffle,
  List,
  LayoutGrid,
  ChevronsUpDown,
  ChevronsDownUp,
  BookmarkCheck,
  FileQuestion,
  TrendingUp,
  Folder,
} from "lucide-react";
import CompanyCategorySection from "@/components/library/CompanyCategorySection";
import CompanyQuestionTableRow from "@/components/library/CompanyQuestionTableRow";
import ProgressSummaryCard from "@/components/library/ProgressSummaryCard";
import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";
import FolderManager from "@/components/library/FolderManager";
import AddToFolderButton from "@/components/library/AddToFolderButton";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  massRecruitmentCompanies,
  massRecruitmentCategories,
  getQuestionsForCompany,
} from "@/data/massRecruitmentData";
import type { Difficulty, Question } from "@/data/companyDetailData";
import { useMassRecruitmentProgress } from "@/hooks/useMassRecruitmentProgress";
import { useFolders } from "@/hooks/useFolders";

// Local storage keys
const FAVORITES_KEY = "mass-recruitment-favorites";
const VIEW_MODE_STORAGE_KEY = "mass-recruitment-view-mode";

// View modes
type ViewMode = "all" | "revision" | "folders";
type LayoutMode = "sections" | "tabs";

// Tab icons mapping
const tabIcons: Record<string, React.ElementType> = {
  "interview-questions": MessageSquare,
  "dsa-questions": Code2,
  "aptitude-questions": Brain,
  "sql-questions": Database,
  "core-cs-questions": Cpu,
};

const MassRecruitment = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Get company from URL or default to first
  const selectedCompanyId = searchParams.get("company") || massRecruitmentCompanies[0].id;
  const selectedCompany = massRecruitmentCompanies.find((c) => c.id === selectedCompanyId) || massRecruitmentCompanies[0];

  const [activeTab, setActiveTab] = useState("interview-questions");
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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Persist layout mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, layoutMode);
  }, [layoutMode]);

  // Reset filters when switching companies or tabs
  useEffect(() => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setExpandedQuestionIds(new Set());
    setOpenSection(null);
  }, [selectedCompanyId, activeTab, layoutMode]);

  // Use Supabase-synced progress with spaced repetition support
  const {
    isLoading,
    isSolved,
    isRevision,
    toggleSolved: toggleSolvedAsync,
    toggleRevision: toggleRevisionAsync,
    markReviewed,
    dueQuestions,
    spacedRepetitionStats,
  } = useMassRecruitmentProgress(selectedCompanyId, activeTab);

  // Folders hook - using company-specific source
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
  } = useFolders(`mass-recruitment-${selectedCompanyId}`);

  // Save favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = () => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(selectedCompanyId)) {
        newFavorites.delete(selectedCompanyId);
      } else {
        newFavorites.add(selectedCompanyId);
      }
      return newFavorites;
    });
  };

  const handleCompanyChange = (companyId: string) => {
    setSearchParams({ company: companyId });
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

  // Get all questions for all categories
  const allQuestions = useMemo(() => {
    const result: Record<string, Question[]> = {};
    massRecruitmentCategories.forEach((cat) => {
      result[cat.id] = getQuestionsForCompany(selectedCompanyId, cat.id);
    });
    return result;
  }, [selectedCompanyId]);

  // Get current tab data (for tabs mode)
  const currentTabQuestions = useMemo(() => {
    return allQuestions[activeTab] || [];
  }, [activeTab, allQuestions]);

  // Get all revision questions across all categories
  const revisionQuestions = useMemo(() => {
    const questions: (Question & { categoryId: string; categoryName: string })[] = [];
    massRecruitmentCategories.forEach((cat) => {
      const catQuestions = allQuestions[cat.id] || [];
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

  // Get questions in selected folder
  const folderQuestions = useMemo(() => {
    if (!selectedFolderId) return [];
    const items = folderItems[selectedFolderId] || [];
    const questionSource = `mass-recruitment-${selectedCompanyId}`;
    const questionList: (Question & { categoryId: string; categoryName: string })[] = [];
    
    items
      .filter((item) => item.question_source === questionSource)
      .forEach((item) => {
        // Find which category has this question
        for (const cat of massRecruitmentCategories) {
          const catQuestions = allQuestions[cat.id] || [];
          const foundQuestion = catQuestions.find((q) => q.id === item.question_id);
          if (foundQuestion) {
            questionList.push({
              ...foundQuestion,
              categoryId: cat.id,
              categoryName: cat.name,
            });
            break;
          }
        }
      });
    
    return questionList;
  }, [selectedFolderId, folderItems, selectedCompanyId, allQuestions]);
  const questionsByCategory = useMemo(() => {
    const result: Record<string, Question[]> = {};
    massRecruitmentCategories.forEach((cat) => {
      let catQuestions = allQuestions[cat.id] || [];

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
    massRecruitmentCategories.forEach((cat) => {
      result[cat.id] = (allQuestions[cat.id] || []).length;
    });
    return result;
  }, [allQuestions]);

  // Check if filters are active
  const isFiltered = searchQuery.trim() !== "" || difficultyFilter !== "all";
  const hasActiveFilters = isFiltered;

  // Auto-expand section with search matches
  useEffect(() => {
    if (layoutMode === "sections" && searchQuery.trim()) {
      const firstMatchingSection = massRecruitmentCategories.find(
        (cat) => (questionsByCategory[cat.id]?.length || 0) > 0
      );
      setOpenSection(firstMatchingSection?.id || null);
    }
  }, [searchQuery, layoutMode, questionsByCategory]);

  // Filter questions for tabs mode (including folders mode)
  const filteredTabQuestions = useMemo(() => {
    let filtered: (Question & { categoryId?: string; categoryName?: string })[];
    
    if (viewMode === "folders" && selectedFolderId) {
      filtered = folderQuestions;
    } else if (viewMode === "revision") {
      filtered = revisionQuestions;
    } else {
      filtered = currentTabQuestions;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((q) => q.text.toLowerCase().includes(query));
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    return filtered;
  }, [currentTabQuestions, revisionQuestions, folderQuestions, searchQuery, difficultyFilter, viewMode, selectedFolderId]);

  // Section controls (accordion behavior)
  const toggleSection = useCallback((categoryId: string) => {
    setOpenSection((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const expandAllSections = useCallback(() => {
    setOpenSection(massRecruitmentCategories[0]?.id || null);
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
    const allQs = Object.values(allQuestions).flat();
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
  }, [allQuestions, isSolved]);

  // Total filtered count for section view
  const totalFilteredCount = useMemo(() => {
    return Object.values(questionsByCategory).reduce((sum, qs) => sum + qs.length, 0);
  }, [questionsByCategory]);

  const unsolvedCount = filteredTabQuestions.filter((q) => !isSolved(q.id)).length;
  const isFavorited = favorites.has(selectedCompanyId);

  // Get question details for spaced repetition panel
  const getQuestionDetails = useCallback(
    (questionId: number, categoryId: string) => {
      const category = massRecruitmentCategories.find((c) => c.id === categoryId);
      const questions = getQuestionsForCompany(selectedCompanyId, categoryId);
      const question = questions.find((q) => q.id === questionId);

      if (!question || !category) return undefined;

      return {
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        categoryId: categoryId,
        categoryName: category.name,
      };
    },
    [selectedCompanyId]
  );

  // Handle reviewing a question (for spaced repetition)
  const handleReviewQuestion = useCallback(
    async (questionId: number, categoryId: string) => {
      await markReviewed(questionId, categoryId);
    },
    [markReviewed]
  );

  // Handle scrolling to a question from spaced repetition panel
  const handleScrollToQuestion = useCallback(
    (questionId: number, categoryId: string) => {
      // If in sections mode, expand the relevant section
      if (layoutMode === "sections") {
        setOpenSection(categoryId);
      } else {
        // In tabs mode, switch to the category tab
        setActiveTab(categoryId);
      }

      // Scroll to the question after a brief delay for the section to expand
      setTimeout(() => {
        const element = document.querySelector(`[data-question-id="${questionId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-primary", "ring-offset-2");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
          }, 2000);
        }
      }, 300);
    },
    [layoutMode]
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Mass Recruitment</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Prepare for mass IT company recruitments with comprehensive study material.
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
          {/* Company Selector - Responsive Grid with Search */}
          <div className="space-y-3">
            {/* Selected Company Header + Dropdown */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <span className="text-sm font-bold text-primary">
                    {(selectedCompany?.shortName || selectedCompany?.name || "").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{selectedCompany?.name}</h2>
                  <p className="text-xs text-muted-foreground">Mass Recruitment Preparation</p>
                </div>
              </div>
              
              {/* Quick Select Dropdown for Mobile */}
              <div className="sm:hidden">
                <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {massRecruitmentCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.shortName || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Company Grid - Desktop/Tablet */}
            <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2">
              {massRecruitmentCompanies.map((company) => {
                const isSelected = selectedCompanyId === company.id;
                const isFav = favorites.has(company.id);
                return (
                  <motion.button
                    key={company.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCompanyChange(company.id)}
                    className={cn(
                      "relative p-3 rounded-lg border text-center transition-all duration-200",
                      "hover:shadow-md hover:border-primary/40",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card border-border hover:bg-muted/50"
                    )}
                  >
                    {isFav && (
                      <Star className="absolute top-1 right-1 h-3 w-3 fill-amber-400 text-amber-400" />
                    )}
                    <span className={cn(
                      "text-xs font-medium line-clamp-1",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {company.shortName || company.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Progress Summary Card */}
          {user && <ProgressSummaryCard stats={progressStats} />}

          {/* Spaced Repetition Panel */}
          {user && spacedRepetitionStats.total > 0 && (
            <SpacedRepetitionPanel
              dueQuestions={dueQuestions}
              stats={spacedRepetitionStats}
              getQuestionDetails={getQuestionDetails}
              onReviewQuestion={handleReviewQuestion}
              onScrollToQuestion={handleScrollToQuestion}
            />
          )}

          {/* Folder Manager (for folders view mode) */}
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
          <section>
            {/* Section Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileQuestion className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {selectedCompany?.shortName || selectedCompany?.name} Questions
              </h2>
              <Badge variant="secondary" className="text-xs">
                {progressStats.total} total
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavorite}
                aria-label={isFavorited ? "Favorited" : "Favorite"}
                className={cn(
                  "ml-auto gap-1.5 h-8",
                  isFavorited && "text-amber-500 border-amber-500/50 bg-amber-500/10"
                )}
              >
                <Star className={cn("h-3.5 w-3.5", isFavorited && "fill-amber-400")} />
                <span className="hidden sm:inline">{isFavorited ? "Favorited" : "Favorite"}</span>
              </Button>
            </div>

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
                            aria-label="Section view"
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
                            aria-label="Tab view"
                            className="h-7 px-2 gap-1"
                          >
                            <List className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-xs">Tabs</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Tab View</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Section expand/collapse controls */}
                    {layoutMode === "sections" && (
                      <div className="hidden sm:flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={expandAllSections}
                              aria-label="Expand first section"
                              className="h-7 px-2"
                            >
                              <ChevronsUpDown className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Expand first section</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={collapseAllSections}
                              aria-label="Collapse all"
                              className="h-7 px-2"
                            >
                              <ChevronsDownUp className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Collapse all</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* View Mode (All/Revision/Folders) */}
                  <div className="flex items-center gap-2">
                    <Tabs
                      value={viewMode}
                      onValueChange={(v) => {
                        setViewMode(v as ViewMode);
                        if (v !== "folders") {
                          setSelectedFolderId(null);
                        }
                      }}
                      className="h-8"
                    >
                      <TabsList className="h-8 p-1">
                        <TabsTrigger value="all" className="text-xs h-6 px-3">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="revision" className="text-xs h-6 px-3 gap-1">
                          <BookmarkCheck className="h-3 w-3" />
                          Revision
                        </TabsTrigger>
                        <TabsTrigger value="folders" className="text-xs h-6 px-3 gap-1">
                          <Folder className="h-3 w-3" />
                          Folders
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Category tabs (for tabs layout mode) */}
                {layoutMode === "tabs" && (
                  <ScrollArea className="w-full mt-3">
                    <div className="flex gap-2">
                      {massRecruitmentCategories.map((cat) => {
                        const Icon = tabIcons[cat.id] || FileQuestion;
                        return (
                          <Button
                            key={cat.id}
                            variant={activeTab === cat.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab(cat.id)}
                            className="shrink-0 gap-1.5"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {cat.name}
                          </Button>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}

                {/* Search and Filter Row */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchQuery("")}
                        aria-label="Clear search"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <Select
                    value={difficultyFilter}
                    onValueChange={(v) => setDifficultyFilter(v as Difficulty | "all")}
                  >
                    <SelectTrigger className="w-[130px] h-9">
                      <Filter className="h-3.5 w-3.5 mr-2" />
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs gap-1">
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}

                  {/* Random button for tabs mode */}
                  {layoutMode === "tabs" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToRandomQuestion}
                          disabled={unsolvedCount === 0}
                          aria-label="Random question"
                          className="h-9 gap-1.5"
                        >
                          <Shuffle className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Random</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pick random unsolved question</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/*  */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Section View */}
              {!isLoading && layoutMode === "sections" ? (
                totalFilteredCount > 0 || viewMode !== "revision" ? (
                  <div>
                    {massRecruitmentCategories.map((category) => {
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
                          showCategory={false}
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
                          {(viewMode === "revision" || viewMode === "folders") && (
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
                          {user && folders.length > 0 && viewMode !== "folders" && (
                            <TableHead className="w-12 text-center text-xs font-semibold">
                              <Folder className="h-3.5 w-3.5 mx-auto" />
                            </TableHead>
                          )}
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
                              showCategory={viewMode === "revision" || viewMode === "folders"}
                              onToggleSolved={() => handleToggleSolved(question.id)}
                              onToggleRevision={() => handleToggleRevision(question.id)}
                              onToggleExpand={() => handleToggleExpand(question.id)}
                              folderButton={
                                user && folders.length > 0 && viewMode !== "folders" ? (
                                  <AddToFolderButton
                                    questionId={question.id}
                                    questionSource={`mass-recruitment-${selectedCompanyId}`}
                                    folders={folders}
                                    isInFolder={isInFolder}
                                    onAddToFolder={addToFolder}
                                    onRemoveFromFolder={removeFromFolder}
                                  />
                                ) : undefined
                              }
                            />
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                ) : viewMode === "revision" ? (
                  <EmptyRevisionState onBrowseAll={() => setViewMode("all")} />
                ) : viewMode === "folders" && !selectedFolderId ? (
                  <EmptySelectFolderState />
                ) : viewMode === "folders" && selectedFolderId ? (
                  <EmptyFolderState onBrowseAll={() => setViewMode("all")} />
                ) : hasActiveFilters ? (
                  <EmptySearchState onClearFilters={clearFilters} />
                ) : (
                  <EmptyQuestionsState />
                )
              ) : null}
            </motion.div>
          </section>

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

const EmptySelectFolderState = () => (
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
      <Folder className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <h3 className="text-lg font-medium">Select a folder</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Click on a folder above to view its questions, or create a new folder.
    </p>
  </motion.div>
);

const EmptyFolderState = ({ onBrowseAll }: { onBrowseAll: () => void }) => (
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
      <Folder className="h-8 w-8 text-muted-foreground" />
    </motion.div>
    <h3 className="text-lg font-medium">No questions in this folder</h3>
    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
      Add questions to this folder using the folder icon next to each question.
    </p>
    <Button variant="outline" className="mt-4" onClick={onBrowseAll}>
      Browse All Questions
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

export default MassRecruitment;
