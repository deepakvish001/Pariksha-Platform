import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  Search,
  Star,
  Check,
  Bookmark,
  FileText,
  Briefcase,
  Loader2,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import AnswerPanel from "@/components/library/AnswerPanel";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const difficultyColors: Record<Difficulty, string> = {
  Easy: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Find the company
  const company = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companyId]
  );

  const [activeTab, setActiveTab] = useState(companyTabs[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Reset expanded questions when switching tabs
  useEffect(() => {
    setExpandedQuestionIds(new Set());
  }, [activeTab]);

  // Use Supabase-synced progress
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

  // Get current tab data
  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case "sql-questions":
        return sqlQuestions;
      case "interview-questions":
        return interviewQuestions;
      case "dsa-questions":
        return dsaQuestions;
      case "aptitude-questions":
        return aptitudeQuestions;
      case "job-portals":
        return jobPortals;
      case "projects":
        return projects;
      case "resume-templates":
        return resumeTemplates;
      case "cold-dms":
        return coldDMs;
      default:
        return [];
    }
  }, [activeTab]);

  // Get all question IDs with answers for the current tab
  const questionsWithAnswers = useMemo(() => {
    const questions = currentTabData as Question[];
    return questions.filter((q) => !!q.answer).map((q) => q.id);
  }, [currentTabData]);

  const handleExpandAll = () => {
    setExpandedQuestionIds(new Set(questionsWithAnswers));
    // Smooth scroll to first question with answer after a short delay for animation
    if (questionsWithAnswers.length > 0) {
      setTimeout(() => {
        const firstQuestionId = questionsWithAnswers[0];
        const element = document.querySelector(`[data-question-id="${firstQuestionId}"]`);
        if (element) {
          const headerOffset = 80; // Account for sticky header height
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleCollapseAll = () => {
    setExpandedQuestionIds(new Set());
  };

  const handleToggleExpand = (id: number) => {
    setExpandedQuestionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return currentTabData;
    const query = searchQuery.toLowerCase();

    return currentTabData.filter((item: any) => {
      if ("text" in item) return item.text.toLowerCase().includes(query);
      if ("name" in item) return item.name.toLowerCase().includes(query);
      if ("title" in item) return item.title.toLowerCase().includes(query);
      if ("message" in item) return item.message.toLowerCase().includes(query);
      return true;
    });
  }, [currentTabData, searchQuery]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/library/companies" className="hover:text-foreground transition-colors">
                Companies
              </Link>
              <span>/</span>
              <span className="text-foreground">{company.name}</span>
            </nav>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFavorite}
            className={cn(
              "gap-2",
              favorites.has(companyId || "") && "text-yellow-500 border-yellow-500/50"
            )}
          >
            <Star
              className={cn(
                "h-4 w-4",
                favorites.has(companyId || "") && "fill-yellow-400"
              )}
            />
            {favorites.has(companyId || "") ? "Favorited" : "Add to favorites"}
          </Button>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Company Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-orange flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{company.name}</h1>
                <Badge
                  variant="outline"
                  className={cn("text-xs", getCategoryStyle(company.category))}
                >
                  {company.category}
                </Badge>
                {company.isHiring && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-500/40 bg-green-500/10">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Hiring
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed">{company.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-border/50 mb-6 overflow-x-auto pb-px">
          {companyTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                activeTab === tab.id
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Search and controls for question tabs */}
        {["sql-questions", "interview-questions", "dsa-questions", "aptitude-questions"].includes(activeTab) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${companyTabs.find(t => t.id === activeTab)?.name.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {questionsWithAnswers.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Expanded count badge */}
                <AnimatePresence>
                  {expandedQuestionIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Badge variant="secondary" className="h-10 px-3 text-sm font-medium">
                        {expandedQuestionIds.size}/{questionsWithAnswers.length} expanded
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence mode="wait">
                  {expandedQuestionIds.size < questionsWithAnswers.length && (
                    <motion.div
                      key="expand"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExpandAll}
                        className="gap-2 h-10 whitespace-nowrap"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        Expand All
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {expandedQuestionIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCollapseAll}
                        className="gap-2 h-10 whitespace-nowrap"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        Collapse All
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Search for cold-dms tab */}
        {activeTab === "cold-dms" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mb-6"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cold DMs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading progress...</span>
          </div>
        )}

        {/* Content based on active tab */}
        {!isLoading && (
          <div className="space-y-0">
            {activeTab === "sql-questions" && (
              <QuestionsTable
                questions={filteredData as Question[]}
                showCategory
                isSolved={isSolved}
                isRevision={isRevision}
                toggleSolved={handleToggleSolved}
                toggleRevision={handleToggleRevision}
                isLoggedIn={!!user}
                expandedIds={expandedQuestionIds}
                onToggleExpand={handleToggleExpand}
              />
            )}

            {activeTab === "interview-questions" && (
              <QuestionsTable
                questions={filteredData as Question[]}
                isSolved={isSolved}
                isRevision={isRevision}
                toggleSolved={handleToggleSolved}
                toggleRevision={handleToggleRevision}
                isLoggedIn={!!user}
                expandedIds={expandedQuestionIds}
                onToggleExpand={handleToggleExpand}
              />
            )}

            {activeTab === "dsa-questions" && (
              <QuestionsTable
                questions={filteredData as Question[]}
                isSolved={isSolved}
                isRevision={isRevision}
                toggleSolved={handleToggleSolved}
                toggleRevision={handleToggleRevision}
                isLoggedIn={!!user}
                expandedIds={expandedQuestionIds}
                onToggleExpand={handleToggleExpand}
              />
            )}

            {activeTab === "aptitude-questions" && (
              <QuestionsTable
                questions={filteredData as Question[]}
                isSolved={isSolved}
                isRevision={isRevision}
                toggleSolved={handleToggleSolved}
                toggleRevision={handleToggleRevision}
                isLoggedIn={!!user}
                expandedIds={expandedQuestionIds}
                onToggleExpand={handleToggleExpand}
              />
            )}

            {activeTab === "job-portals" && (
              <JobPortalsTable
                portals={filteredData as JobPortal[]}
                isSolved={isSolved}
                toggleSolved={handleToggleSolved}
                isLoggedIn={!!user}
              />
            )}

            {activeTab === "projects" && (
              <ProjectsTable projects={filteredData as Project[]} />
            )}

            {activeTab === "resume-templates" && (
              <ResumeTemplatesGrid templates={filteredData as ResumeTemplate[]} />
            )}

            {activeTab === "cold-dms" && (
              <ColdDMsTable
                dms={filteredData as ColdDM[]}
                isSolved={isSolved}
                toggleSolved={handleToggleSolved}
                isLoggedIn={!!user}
              />
            )}
          </div>
        )}

        {/* Login prompt for non-authenticated users */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5 text-center"
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
  );
};

// Questions Table Component
interface QuestionsTableProps {
  questions: Question[];
  showCategory?: boolean;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  isLoggedIn: boolean;
  expandedIds: Set<number>;
  onToggleExpand: (id: number) => void;
}

const QuestionsTable = ({
  questions,
  showCategory,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  isLoggedIn,
  expandedIds,
  onToggleExpand,
}: QuestionsTableProps) => {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_100px_100px_80px_80px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/50">
        <div>#</div>
        <div>Question</div>
        <div>Difficulty</div>
        {showCategory && <div>Category</div>}
        {!showCategory && <div></div>}
        <div className="text-center">Solved</div>
        <div className="text-center">Revision</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {questions.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No questions found
          </div>
        ) : (
          questions.map((question, index) => {
            const hasAnswer = !!question.answer;
            const isExpanded = expandedIds.has(question.id);

            return (
              <div key={question.id} data-question-id={question.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-[40px_1fr_100px_100px_80px_80px] gap-4 px-4 py-4 hover:bg-muted/20 transition-colors items-start",
                    isExpanded && "bg-muted/30"
                  )}
                >
                  <div className="text-sm text-muted-foreground pt-1">{index + 1}</div>
                  <div className="min-w-0">
                    <div
                      className={cn(
                        "flex items-start gap-2",
                        hasAnswer && "cursor-pointer group"
                      )}
                      onClick={() => hasAnswer && onToggleExpand(question.id)}
                      role={hasAnswer ? "button" : undefined}
                      tabIndex={hasAnswer ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (hasAnswer && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          onToggleExpand(question.id);
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
                        <h4 className={cn(
                          "font-medium text-foreground mb-1 transition-colors",
                          hasAnswer && "group-hover:text-primary",
                          isSolved(question.id) && "line-through text-muted-foreground"
                        )}>
                          {question.text}
                        </h4>
                        {question.description && !isExpanded && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", difficultyColors[question.difficulty])}
                    >
                      {question.difficulty}
                    </Badge>
                  </div>
                  <div>
                    {showCategory && question.category && (
                      <Badge variant="outline" className="text-xs">
                        {question.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSolved(question.id);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                        isSolved(question.id)
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                          : "border-border hover:border-emerald-500/50",
                        !isLoggedIn && "opacity-50"
                      )}
                      title={isLoggedIn ? "Mark as solved" : "Sign in to track progress"}
                    >
                      {isSolved(question.id) && <Check className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRevision(question.id);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                        isRevision(question.id)
                          ? "border-amber-500 bg-amber-500/20 text-amber-500"
                          : "border-border hover:border-amber-500/50",
                        !isLoggedIn && "opacity-50"
                      )}
                      title={isLoggedIn ? "Mark for revision" : "Sign in to track progress"}
                    >
                      <Bookmark
                        className={cn("h-4 w-4", isRevision(question.id) && "fill-amber-500")}
                      />
                    </button>
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
          })
        )}
      </div>
    </div>
  );
};

// Job Portals Table
interface JobPortalsTableProps {
  portals: JobPortal[];
  isSolved: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  isLoggedIn: boolean;
}

const JobPortalsTable = ({ portals, isSolved, toggleSolved, isLoggedIn }: JobPortalsTableProps) => {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_150px_80px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/50">
        <div>#</div>
        <div>Website</div>
        <div>Locations</div>
        <div className="text-center">Applied</div>
      </div>

      <div className="divide-y divide-border/30">
        {portals.map((portal, index) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="grid grid-cols-[40px_1fr_150px_80px] gap-4 px-4 py-4 hover:bg-muted/20 transition-colors items-start"
          >
            <div className="text-sm text-muted-foreground pt-1">{index + 1}</div>
            <div className="min-w-0">
              <h4 className="font-medium text-foreground mb-1">{portal.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {portal.description}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">{portal.location}</div>
            <div className="flex justify-center">
              <button
                onClick={() => toggleSolved(portal.id)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                  isSolved(portal.id)
                    ? "border-green-500 bg-green-500/20 text-green-500"
                    : "border-border hover:border-green-500/50",
                  !isLoggedIn && "opacity-50"
                )}
                title={isLoggedIn ? "Mark as applied" : "Sign in to track progress"}
              >
                {isSolved(portal.id) && <Check className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Projects Table
interface ProjectsTableProps {
  projects: Project[];
}

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_1fr] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/50">
        <div>#</div>
        <div>Title</div>
        <div>Technology</div>
      </div>

      <div className="divide-y divide-border/30">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="grid grid-cols-[40px_1fr_1fr] gap-4 px-4 py-4 hover:bg-muted/20 transition-colors items-start"
          >
            <div className="text-sm text-muted-foreground pt-1">{index + 1}</div>
            <div className="min-w-0">
              <h4 className="font-medium text-foreground mb-1">{project.title}</h4>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Resume Templates Grid
interface ResumeTemplatesGridProps {
  templates: ResumeTemplate[];
}

const ResumeTemplatesGrid = ({ templates }: ResumeTemplatesGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border border-border/50 rounded-lg overflow-hidden hover:border-primary/50 transition-all group cursor-pointer"
        >
          <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
          </div>
          <div className="p-4">
            <h4 className="font-medium text-sm mb-1">{template.name}</h4>
            <p className="text-xs text-muted-foreground">{template.style}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Cold DMs Table
interface ColdDMsTableProps {
  dms: ColdDM[];
  isSolved: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  isLoggedIn: boolean;
}

const ColdDMsTable = ({ dms, isSolved, toggleSolved, isLoggedIn }: ColdDMsTableProps) => {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_150px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/50">
        <div>#</div>
        <div>Title</div>
        <div>Category</div>
      </div>

      <div className="divide-y divide-border/30">
        {dms.map((dm, index) => (
          <motion.div
            key={dm.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
            className="grid grid-cols-[40px_1fr_150px] gap-4 px-4 py-4 hover:bg-muted/20 transition-colors items-start"
          >
            <div className="text-sm text-muted-foreground pt-1">{index + 1}</div>
            <div className="min-w-0">
              <h4 className="font-medium text-foreground mb-1">{dm.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">{dm.message}</p>
            </div>
            <div>
              <Badge variant="outline" className="text-xs">
                {dm.category}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompanyDetail;
