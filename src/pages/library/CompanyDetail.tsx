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
  Globe,
  FolderKanban,
  FileText,
  Mail,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
} from "lucide-react";
import CompanyQuestionRow from "@/components/library/CompanyQuestionRow";
import CompanyTabSidebar, { CompanyTabsHorizontal } from "@/components/library/CompanyTabSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <div className="h-screen bg-background flex items-center justify-center">
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
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Compact Header */}
        <header className="shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm z-40">
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 h-12 sm:h-14">
            <SidebarTrigger className="shrink-0" />
            
            {/* Back button on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden shrink-0"
              onClick={() => navigate("/library/companies")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Company Info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-orange flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link 
                    to="/library/companies" 
                    className="hidden lg:block text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Companies /
                  </Link>
                  <h1 className="text-sm sm:text-base font-semibold truncate">{company.name}</h1>
                  <Badge 
                    variant="outline" 
                    className={cn("text-[10px] px-1.5 py-0 hidden sm:inline-flex", getCategoryStyle(company.category))}
                  >
                    {company.category}
                  </Badge>
                  {company.isHiring && (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-500/40 bg-emerald-500/10"
                    >
                      <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                      <span className="hidden sm:inline">Hiring</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress & Favorite */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                  <span className="text-xs font-medium text-primary">{progressStats.percentage}%</span>
                  <Progress value={progressStats.percentage} className="h-1.5 w-16" />
                  <span className="text-[10px] text-muted-foreground">
                    {progressStats.solved}/{progressStats.total}
                  </span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                className={cn(
                  "h-8 w-8",
                  isFavorited && "text-amber-500"
                )}
              >
                <Star className={cn("h-4 w-4", isFavorited && "fill-amber-400")} />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Progress Bar */}
        {user && (
          <div className="sm:hidden px-3 py-2 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary">{progressStats.percentage}%</span>
              <Progress value={progressStats.percentage} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">
                {progressStats.solved}/{progressStats.total}
              </span>
            </div>
          </div>
        )}

        {/* Horizontal Tabs (Mobile/Tablet) */}
        <div className="shrink-0 px-3 sm:px-4 pt-2 bg-background">
          <CompanyTabsHorizontal
            tabs={companyTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabCounts={tabCounts}
          />
        </div>

        {/* Two-Panel Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <CompanyTabSidebar
            tabs={companyTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabCounts={tabCounts}
          />

          {/* Content Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search and Controls - Sticky */}
            {(isQuestionTab || activeTab === "cold-dms") && (
              <div className="shrink-0 px-3 sm:px-4 py-2 border-b border-border/40 bg-background/95">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={`Search...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  {isQuestionTab && questionsWithAnswers.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      {expandedQuestionIds.size > 0 && (
                        <Badge variant="secondary" className="h-8 px-2 text-xs">
                          {expandedQuestionIds.size}/{questionsWithAnswers.length}
                        </Badge>
                      )}
                      {expandedQuestionIds.size < questionsWithAnswers.length && (
                        <Button variant="outline" size="sm" onClick={handleExpandAll} className="h-8 text-xs gap-1">
                          <ChevronsUpDown className="h-3 w-3" />
                          Expand
                        </Button>
                      )}
                      {expandedQuestionIds.size > 0 && (
                        <Button variant="outline" size="sm" onClick={handleCollapseAll} className="h-8 text-xs gap-1">
                          <ChevronsUpDown className="h-3 w-3" />
                          Collapse
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-3 sm:p-4">
                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                )}

                {/* Content */}
                {!isLoading && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
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
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Login prompt */}
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5 text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-2">Sign in to track your progress</p>
                    <Button size="sm" className="h-7 text-xs" onClick={() => navigate("/login")}>
                      Sign In
                    </Button>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
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
          "grid gap-2 sm:gap-3 px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-b border-border/50",
          showCategory 
            ? "grid-cols-[28px_1fr_auto_28px_28px] sm:grid-cols-[32px_1fr_60px_80px_40px_40px]" 
            : "grid-cols-[28px_1fr_auto_28px_28px] sm:grid-cols-[32px_1fr_60px_40px_40px]"
        )}
      >
        <div>#</div>
        <div>Question</div>
        <div className="text-center sm:text-left">Diff</div>
        {showCategory && <div className="hidden sm:block">Category</div>}
        <div className="text-center">✓</div>
        <div className="text-center">★</div>
      </div>

      {/* Rows */}
      <div>
        {questions.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">No questions found</div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {portals.map((portal, index) => (
        <motion.div
          key={portal.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group border border-border/50 rounded-lg p-3 sm:p-4 hover:border-primary/50 hover:shadow-sm transition-all bg-card"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <button
              onClick={() => toggleSolved(portal.id)}
              disabled={!isLoggedIn}
              className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                isSolved(portal.id)
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                  : "border-border hover:border-emerald-500/50",
                !isLoggedIn && "opacity-50 cursor-not-allowed"
              )}
              title={isLoggedIn ? (isSolved(portal.id) ? "Mark as not applied" : "Mark as applied") : "Sign in to track"}
            >
              {isSolved(portal.id) && <Check className="h-3 w-3" />}
            </button>
          </div>
          <h3 className="font-medium text-sm text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{portal.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{portal.description}</p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[10px] h-5">
              {portal.location}
            </Badge>
            {portal.url && (
              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
              >
                Visit <ExternalLink className="h-2.5 w-2.5" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group border border-border/50 rounded-lg p-3 sm:p-4 hover:border-primary/50 hover:shadow-sm transition-all bg-card"
        >
          <div className="flex items-start gap-2 mb-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <FolderKanban className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-foreground mb-0.5 group-hover:text-primary transition-colors line-clamp-1">
                {project.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
            {project.technologies.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="outline" className="text-[10px] px-1.5 py-0">
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{project.technologies.length - 4}
              </Badge>
            )}
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          className="group border border-border/50 rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-sm transition-all bg-card cursor-pointer"
        >
          <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center relative">
            <FileText className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="gap-1 h-7 text-xs">
                <ExternalLink className="h-3 w-3" />
                Preview
              </Button>
            </div>
          </div>
          <div className="p-2">
            <h4 className="font-medium text-xs mb-0.5 truncate">{template.name}</h4>
            <Badge variant="secondary" className="text-[10px] h-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {dms.map((dm, index) => (
        <motion.div
          key={dm.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="group border border-border/50 rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-all bg-card"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-xs text-foreground truncate">{dm.title}</h3>
                <Badge variant="secondary" className="text-[10px] h-4 mt-0.5">
                  {dm.category}
                </Badge>
              </div>
            </div>
            <button
              onClick={() => toggleSolved(dm.id)}
              disabled={!isLoggedIn}
              className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                isSolved(dm.id) ? "border-emerald-500 bg-emerald-500/20 text-emerald-500" : "border-border hover:border-emerald-500/50",
                !isLoggedIn && "opacity-50 cursor-not-allowed"
              )}
              title={isLoggedIn ? (isSolved(dm.id) ? "Mark as unused" : "Mark as used") : "Sign in to track"}
            >
              {isSolved(dm.id) && <Check className="h-2.5 w-2.5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{dm.message}</p>
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">{dm.message.length} chars</span>
            <Button size="sm" variant="outline" className="gap-1 h-6 text-[10px] px-2" onClick={() => handleCopy(dm)}>
              {copiedId === dm.id ? (
                <>
                  <Check className="h-2.5 w-2.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-2.5 w-2.5" />
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
