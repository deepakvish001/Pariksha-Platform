import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Building2,
  Search,
  Star,
  Briefcase,
  Loader2,
  ChevronsUpDown,
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
} from "lucide-react";
import AnswerPanel from "@/components/library/AnswerPanel";
import CompanyQuestionRow from "@/components/library/CompanyQuestionRow";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
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
} from "@/data/companyDetailData";
import { useCompanyProgress } from "@/hooks/useCompanyProgress";

// Local storage keys
const FAVORITES_KEY = "company-favorites";

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
    setSearchQuery("");
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

  // Get tab item counts
  const tabCounts = useMemo(() => {
    return {
      "sql-questions": sqlQuestions.length,
      "interview-questions": interviewQuestions.length,
      "dsa-questions": dsaQuestions.length,
      "aptitude-questions": aptitudeQuestions.length,
      "job-portals": jobPortals.length,
      "projects": projects.length,
      "resume-templates": resumeTemplates.length,
      "cold-dms": coldDMs.length,
    };
  }, []);

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

  // Check if current tab is a question tab
  const isQuestionTab = ["sql-questions", "interview-questions", "dsa-questions", "aptitude-questions"].includes(activeTab);

  // Get all question IDs with answers for the current tab
  const questionsWithAnswers = useMemo(() => {
    if (!isQuestionTab) return [];
    const questions = currentTabData as Question[];
    return questions.filter((q) => !!q.answer).map((q) => q.id);
  }, [currentTabData, isQuestionTab]);

  const handleExpandAll = () => {
    setExpandedQuestionIds(new Set(questionsWithAnswers));
    if (questionsWithAnswers.length > 0) {
      setTimeout(() => {
        const firstQuestionId = questionsWithAnswers[0];
        const element = document.querySelector(`[data-question-id="${firstQuestionId}"]`);
        if (element) {
          const headerOffset = 80;
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

  // Calculate progress stats for header
  const progressStats = useMemo(() => {
    const allQuestions = [...sqlQuestions, ...interviewQuestions, ...dsaQuestions, ...aptitudeQuestions];
    const solved = allQuestions.filter((q) => isSolved(q.id)).length;
    const total = allQuestions.length;
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    return { solved, total, percentage };
  }, [isSolved]);

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

  return (
    <TooltipProvider>
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
                <span className="text-foreground font-medium">{company.name}</span>
              </nav>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFavorite}
              className={cn(
                "gap-2",
                isFavorited && "text-amber-500 border-amber-500/50 bg-amber-500/10"
              )}
            >
              <Star className={cn("h-4 w-4", isFavorited && "fill-amber-400")} />
              {isFavorited ? "Favorited" : "Favorite"}
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Enhanced Company Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Company Icon & Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="h-16 w-16 rounded-2xl bg-gradient-orange flex items-center justify-center shrink-0 shadow-lg">
                  <Building2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{company.name}</h1>
                    <Badge variant="outline" className={cn("text-xs", getCategoryStyle(company.category))}>
                      {company.category}
                    </Badge>
                    {company.isHiring && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Hiring
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{company.description}</p>
                </div>
              </div>

              {/* Progress Stats Card */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center p-4 rounded-xl border border-border/50 bg-card min-w-[140px]"
                >
                  <div className="text-3xl font-bold text-primary">{progressStats.percentage}%</div>
                  <div className="text-xs text-muted-foreground mb-2">Complete</div>
                  <Progress value={progressStats.percentage} className="h-1.5 w-full" />
                  <div className="text-xs text-muted-foreground mt-2">
                    {progressStats.solved}/{progressStats.total} solved
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Tabs with Icons and Counts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-1 border-b border-border/50 mb-6 overflow-x-auto pb-px scrollbar-hide"
          >
            {companyTabs.map((tab) => {
              const Icon = tabIcons[tab.id];
              const count = tabCounts[tab.id as keyof typeof tabCounts];
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px rounded-t-lg",
                    isActive
                      ? "text-foreground border-primary bg-muted/50"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-5 px-1.5 text-xs",
                      isActive ? "bg-primary/20 text-primary" : ""
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </motion.div>

          {/* Search and Controls */}
          {(isQuestionTab || activeTab === "cold-dms") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${companyTabs.find((t) => t.id === activeTab)?.name.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isQuestionTab && questionsWithAnswers.length > 0 && (
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {expandedQuestionIds.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
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
                      >
                        <Button variant="outline" size="sm" onClick={handleExpandAll} className="gap-2 h-10">
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
                      >
                        <Button variant="outline" size="sm" onClick={handleCollapseAll} className="gap-2 h-10">
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

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading progress...</span>
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <div className="space-y-0">
              {isQuestionTab && (
                <QuestionsSection
                  questions={filteredData as Question[]}
                  showCategory={activeTab === "sql-questions"}
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
                <JobPortalsGrid
                  portals={filteredData as JobPortal[]}
                  isSolved={isSolved}
                  toggleSolved={handleToggleSolved}
                  isLoggedIn={!!user}
                />
              )}

              {activeTab === "projects" && <ProjectsGrid projects={filteredData as Project[]} />}

              {activeTab === "resume-templates" && <ResumeTemplatesGrid templates={filteredData as ResumeTemplate[]} />}

              {activeTab === "cold-dms" && (
                <ColdDMsGrid
                  dms={filteredData as ColdDM[]}
                  isSolved={isSolved}
                  toggleSolved={handleToggleSolved}
                  isLoggedIn={!!user}
                />
              )}
            </div>
          )}

          {/* Login prompt */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5 text-center"
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

// Questions Section Component
interface QuestionsSectionProps {
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

const QuestionsSection = ({
  questions,
  showCategory = false,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  isLoggedIn,
  expandedIds,
  onToggleExpand,
}: QuestionsSectionProps) => {
  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "grid gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground border-b border-border/50",
          showCategory ? "grid-cols-[40px_1fr_80px_100px_60px_60px]" : "grid-cols-[40px_1fr_80px_60px_60px]"
        )}
      >
        <div>#</div>
        <div>Question</div>
        <div>Difficulty</div>
        {showCategory && <div className="hidden sm:block">Category</div>}
        <div className="text-center">Solved</div>
        <div className="text-center">Revision</div>
      </div>

      {/* Rows */}
      <div>
        {questions.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">No questions found</div>
        ) : (
          questions.map((question, index) => (
            <CompanyQuestionRow
              key={question.id}
              question={question}
              index={index}
              isSolved={isSolved(question.id)}
              isRevision={isRevision(question.id)}
              isExpanded={expandedIds.has(question.id)}
              isLoggedIn={isLoggedIn}
              showCategory={showCategory}
              onToggleSolved={() => toggleSolved(question.id)}
              onToggleRevision={() => toggleRevision(question.id)}
              onToggleExpand={() => onToggleExpand(question.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Job Portals Grid (Card-based)
interface JobPortalsGridProps {
  portals: JobPortal[];
  isSolved: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  isLoggedIn: boolean;
}

const JobPortalsGrid = ({ portals, isSolved, toggleSolved, isLoggedIn }: JobPortalsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {portals.map((portal, index) => (
        <motion.div
          key={portal.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all bg-card"
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

// Projects Grid (Enhanced Cards)
interface ProjectsGridProps {
  projects: Project[];
}

const ProjectsGrid = ({ projects }: ProjectsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all bg-card"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="outline" className="text-xs">
                {tech}
              </Badge>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Resume Templates Grid (Gallery)
interface ResumeTemplatesGridProps {
  templates: ResumeTemplate[];
}

const ResumeTemplatesGrid = ({ templates }: ResumeTemplatesGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all bg-card cursor-pointer"
        >
          <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
            <FileText className="h-16 w-16 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="gap-2">
                <ExternalLink className="h-3 w-3" />
                Preview
              </Button>
            </div>
          </div>
          <div className="p-3">
            <h4 className="font-medium text-sm mb-0.5 truncate">{template.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {template.style}
            </Badge>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Cold DMs Grid (Card-based with Copy)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {dms.map((dm, index) => (
        <motion.div
          key={dm.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group border border-border/50 rounded-xl p-5 hover:border-primary/50 transition-all bg-card"
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
            <span className="text-xs text-muted-foreground">{dm.message.length} characters</span>
            <Button size="sm" variant="outline" className="gap-2 h-8" onClick={() => handleCopy(dm)}>
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
