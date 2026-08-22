import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  ExternalLink, 
  Filter,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  X,
  CheckSquare,
  Square,
  Star,
  Loader2,
  List,
  Layers,
  Tags,
  Save,
  Bookmark,
  Circle,
  Hexagon,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  cpTracks, 
  cpTopics, 
  cpProblemSets,
  getTrackDifficulty,
  type CPProblemSet,
  type CPProblem 
} from "@/data/competitiveProgrammingData";
import { getTrackIcon, getTrackColors, getTopicIcon, difficultyConfig, getPlatformColor } from "@/data/cpIconMappings";
import CPFilterSidebar from "@/components/sheets/CPFilterSidebar";
import CPHeroSection from "@/components/sheets/CPHeroSection";
import CPStatsDashboard from "@/components/sheets/CPStatsDashboard";
import CPEmptyState from "@/components/sheets/CPEmptyState";
import CPFloatingProgress from "@/components/sheets/CPFloatingProgress";
import CPProblemSetCard, { MiniProgressRing } from "@/components/sheets/CPProblemSetCard";
import CPProblemTable from "@/components/sheets/CPProblemTable";
import StreakCounter from "@/components/StreakCounter";
import { useCPProgress } from "@/hooks/useCPProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

type ViewTab = "all" | "by-track" | "by-topic" | "revision";

// Get track badge color (kept for legacy usage)
function getTrackBadgeClass(trackId: string) {
  const track = cpTracks.find(t => t.id === trackId);
  return track?.color || "bg-muted text-muted-foreground";
}

// Local DifficultyBadge for track/topic headers
function DifficultyBadgeLegacy({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm",
    Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm",
    Hard: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 shadow-sm",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5 font-semibold", styles[difficulty])}>
      {difficulty}
    </Badge>
  );
}

// Track Section Component (enhanced with icons and colors)
function TrackSection({
  trackId,
  problemSets,
  isExpanded,
  onToggle,
  expandedSets,
  toggleSetExpansion,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
}: {
  trackId: string;
  problemSets: CPProblemSet[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedSets: number[];
  toggleSetExpansion: (id: number) => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
}) {
  const track = cpTracks.find(t => t.id === trackId);
  
  if (!track) return null;

  const TrackIcon = getTrackIcon(trackId);
  const colors = getTrackColors(trackId);
  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problems.length, 0);
  const completedProblems = problemSets.reduce((acc, ps) => 
    acc + ps.problems.filter(p => isSolved(p.id)).length, 0);
  const progressPercent = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;
  const difficulty = getTrackDifficulty(trackId);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className={cn(
            "flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50",
            "relative overflow-hidden"
          )}
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        >
          {/* Left gradient accent border */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", colors.gradient)} />
          
          <div className="flex items-center gap-3 min-w-0 pl-2">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            
            {/* Track icon with colored background */}
            <div className={cn("p-1.5 rounded-lg shrink-0", colors.bg)}>
              <TrackIcon className={cn("h-4 w-4", colors.text)} />
            </div>
            
            <Badge className={cn("text-xs shrink-0 border", colors.bg, colors.text, colors.border)}>
              {problemSets.length} sets
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{track.name}</span>
            <DifficultyBadgeLegacy difficulty={difficulty} />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini progress ring */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 rotate-[-90deg]">
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={75.4}
                    strokeDashoffset={75.4 - (progressPercent / 100) * 75.4}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                  {progressPercent}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedProblems}/{totalProblems}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.div>
      </CollapsibleTrigger>
      
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-muted/5"
            >
              {problemSets.map((ps) => (
                <CPProblemSetCard
                  key={ps.id}
                  problemSet={ps}
                  isExpanded={expandedSets.includes(ps.id)}
                  onToggle={() => toggleSetExpansion(ps.id)}
                  isSolved={isSolved}
                  isRevision={isRevision}
                  toggleSolved={toggleSolved}
                  toggleRevision={toggleRevision}
                  onOpenNote={onOpenNote}
                  showTrackBadge={false}
                />
              ))}
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Topic Section Component (enhanced with icons)
function TopicSection({
  topicId,
  problemSets,
  isExpanded,
  onToggle,
  expandedSets,
  toggleSetExpansion,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
}: {
  topicId: string;
  problemSets: CPProblemSet[];
  isExpanded: boolean;
  onToggle: () => void;
  expandedSets: number[];
  toggleSetExpansion: (id: number) => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
}) {
  const topic = cpTopics.find(t => t.id === topicId);
  
  if (!topic) return null;

  const TopicIcon = getTopicIcon(topicId);
  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problems.length, 0);
  const completedProblems = problemSets.reduce((acc, ps) => 
    acc + ps.problems.filter(p => isSolved(p.id)).length, 0);
  const progressPercent = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50 relative overflow-hidden"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        >
          {/* Left accent border */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500" />
          
          <div className="flex items-center gap-3 min-w-0 pl-2">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            
            {/* Topic icon */}
            <div className="p-1.5 rounded-lg bg-indigo-500/10 shrink-0">
              <TopicIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            
            <Badge variant="secondary" className="text-xs shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
              {problemSets.length} sets
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{topic.name}</span>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {/* Mini progress ring */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 rotate-[-90deg]">
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  <circle
                    cx="16" cy="16" r="12"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={75.4}
                    strokeDashoffset={75.4 - (progressPercent / 100) * 75.4}
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                  {progressPercent}%
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedProblems}/{totalProblems}
              </span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.div>
      </CollapsibleTrigger>
      
      <AnimatePresence>
        {isExpanded && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-muted/5"
            >
              {problemSets.map((ps) => (
                <CPProblemSetCard
                  key={ps.id}
                  problemSet={ps}
                  isExpanded={expandedSets.includes(ps.id)}
                  onToggle={() => toggleSetExpansion(ps.id)}
                  isSolved={isSolved}
                  isRevision={isRevision}
                  toggleSolved={toggleSolved}
                  toggleRevision={toggleRevision}
                  onOpenNote={onOpenNote}
                  showTrackBadge={false}
                />
              ))}
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

const CPProblemSetsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth, LoginPromptDialog: AuthDialog } = useRequireAuth();
  const { isSolved, isRevision, toggleSolved, toggleRevision, getTotalSolved, isLoading: isProgressLoading } = useCPProgress();
  
  // Auth-gated toggle wrappers
  const gatedToggleSolved = (id: number) => requireAuth(() => toggleSolved(id));
  const gatedToggleRevision = (id: number) => requireAuth(() => toggleRevision(id));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [expandedSets, setExpandedSets] = useState<number[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<string[]>(["preliminaries", "basics"]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>(["dynamic-programming", "graphs"]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(() => {
    const saved = localStorage.getItem("cp-page-size");
    if (saved && PAGE_SIZE_OPTIONS.includes(Number(saved) as PageSize)) {
      return Number(saved) as PageSize;
    }
    return 10;
  });

  // Persist page size to localStorage
  useEffect(() => {
    localStorage.setItem("cp-page-size", String(pageSize));
  }, [pageSize]);
  
  // Notes dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentNoteProblem, setCurrentNoteProblem] = useState<{ id: number; title: string } | null>(null);
  const [noteContent, setNoteContent] = useState("");
  
  // Revision tab sorting
  const [revisionSort, setRevisionSort] = useState<"difficulty" | "set" | "name">("difficulty");
  
  // Revision tab filter - show only unsolved
  const [showOnlyUnsolved, setShowOnlyUnsolved] = useState(false);
  
  // Revision tab - expanded problem sets
  const [expandedRevisionSets, setExpandedRevisionSets] = useState<number[]>([]);
  
  // Clear revision confirmation dialog
  const [clearRevisionDialogOpen, setClearRevisionDialogOpen] = useState(false);
  const [problemsToClear, setProblemsToClear] = useState<number[]>([]);

  // Calculate problem set counts per track
  const problemSetCounts = useMemo(() => {
    const counts: Record<string, number> = { total: cpProblemSets.length };
    cpTracks.forEach(track => {
      counts[track.id] = cpProblemSets.filter(ps => ps.trackId === track.id).length;
    });
    return counts;
  }, []);

  // Filter problem sets
  const filteredProblemSets = useMemo(() => {
    return cpProblemSets.filter(ps => {
      const matchesSearch = searchQuery === "" || 
        ps.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ps.problems.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTrack = selectedTrack === "all" || ps.trackId === selectedTrack;
      const matchesTopic = selectedTopic === "all" || ps.topicId === selectedTopic;
      return matchesSearch && matchesTrack && matchesTopic;
    });
  }, [searchQuery, selectedTrack, selectedTopic]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProblemSets.length / pageSize);
  const paginatedProblemSets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProblemSets.slice(startIndex, startIndex + pageSize);
  }, [filteredProblemSets, currentPage, pageSize]);

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTrack, selectedTopic, pageSize]);

  // Group by track
  const groupedByTrack = useMemo(() => {
    const groups: Record<string, CPProblemSet[]> = {};
    filteredProblemSets.forEach(ps => {
      if (!groups[ps.trackId]) groups[ps.trackId] = [];
      groups[ps.trackId].push(ps);
    });
    return groups;
  }, [filteredProblemSets]);

  // Group by topic
  const groupedByTopic = useMemo(() => {
    const groups: Record<string, CPProblemSet[]> = {};
    filteredProblemSets.forEach(ps => {
      if (!groups[ps.topicId]) groups[ps.topicId] = [];
      groups[ps.topicId].push(ps);
    });
    return groups;
  }, [filteredProblemSets]);

  const toggleSetExpansion = (setId: number) => {
    setExpandedSets(prev => 
      prev.includes(setId) 
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const toggleTrackExpansion = (trackId: string) => {
    setExpandedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const toggleTopicExpansion = (topicId: string) => {
    setExpandedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const clearFilters = () => {
    setSelectedTrack("all");
    setSelectedTopic("all");
    setSearchQuery("");
  };

  const openNoteDialog = (problemId: number, title: string) => {
    requireAuth(() => {
      setCurrentNoteProblem({ id: problemId, title });
      setNoteContent("");
      setNoteDialogOpen(true);
    });
  };

  const saveNote = () => {
    // Note saving would be implemented with backend
    setNoteDialogOpen(false);
    setCurrentNoteProblem(null);
  };

  // Calculate totals
  const totalProblems = filteredProblemSets.reduce((acc, ps) => acc + ps.problems.length, 0);
  const allProblems = cpProblemSets.flatMap(ps => ps.problems);
  const completedCount = allProblems.filter(p => isSolved(p.id)).length;
  const totalProblemCount = allProblems.length;
  const progressPercent = totalProblemCount > 0 ? Math.round((completedCount / totalProblemCount) * 100) : 0;
  const hasActiveFilters = selectedTrack !== "all" || selectedTopic !== "all" || searchQuery !== "";
  
  // Calculate revision count for badge
  const revisionCount = useMemo(() => {
    return cpProblemSets.flatMap(ps => ps.problems).filter(p => isRevision(p.id)).length;
  }, [isRevision]);

  // Calculate difficulty counts
  const difficultyCounts = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0, EasySolved: 0, MediumSolved: 0, HardSolved: 0 };
    allProblems.forEach(p => {
      counts[p.difficulty]++;
      if (isSolved(p.id)) {
        counts[`${p.difficulty}Solved` as keyof typeof counts]++;
      }
    });
    return counts;
  }, [allProblems, isSolved]);

  // Calculate tracks completed (any track with >50% solved)
  const tracksCompleted = useMemo(() => {
    return cpTracks.filter(track => {
      const trackProblems = cpProblemSets
        .filter(ps => ps.trackId === track.id)
        .flatMap(ps => ps.problems);
      const solved = trackProblems.filter(p => isSolved(p.id)).length;
      return trackProblems.length > 0 && (solved / trackProblems.length) >= 0.5;
    }).length;
  }, [isSolved]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/learn/sheets")}
            aria-label="Back to Sheets"
            className="gap-1 shrink-0"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="hidden sm:inline">Sheets</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">Competitive Programming</h1>
          </div>
          <StreakCounter variant="mini" />
          {isProgressLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Badge variant="outline" className="hidden md:flex text-xs whitespace-nowrap gap-1.5">
            <Sparkles className="h-3 w-3" />
            {completedCount}/{totalProblemCount} solved
          </Badge>
        </div>
      </header>

      <div className="flex gap-0 relative">
        {/* Desktop Sidebar - Fixed position relative to viewport */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="fixed top-14 w-64 h-[calc(100vh-3.5rem)] overflow-hidden z-30">
            <CPFilterSidebar
              selectedTrack={selectedTrack}
              onTrackChange={setSelectedTrack}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              problemSetCounts={problemSetCounts}
              onClearFilters={clearFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0 space-y-6 min-w-0">
          {/* New Hero Section */}
          <CPHeroSection
            totalProblems={totalProblemCount}
            solvedCount={completedCount}
            tracksCount={cpTracks.length}
            revisionCount={revisionCount}
          />

          {/* Enhanced Stats Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CPStatsDashboard
              totalProblems={totalProblemCount}
              solvedCount={completedCount}
              progressPercent={progressPercent}
              easyCount={difficultyCounts.Easy}
              mediumCount={difficultyCounts.Medium}
              hardCount={difficultyCounts.Hard}
              easySolved={difficultyCounts.EasySolved}
              mediumSolved={difficultyCounts.MediumSolved}
              hardSolved={difficultyCounts.HardSolved}
              tracksCompleted={tracksCompleted}
              totalTracks={cpTracks.length}
            />
          </motion.div>

          {/* Sign in prompt for unauthenticated users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-r from-primary/5 to-amber-500/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Sign in to track your progress</span>
                    <span className="text-muted-foreground"> across devices and sync with your profile.</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Search & Mobile Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems or sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open filters" className="lg:hidden h-9 w-9 shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <CPFilterSidebar
                    selectedTrack={selectedTrack}
                    onTrackChange={(id) => { setSelectedTrack(id); }}
                    selectedTopic={selectedTopic}
                    onTopicChange={(id) => { setSelectedTopic(id); }}
                    problemSetCounts={problemSetCounts}
                    onClearFilters={clearFilters}
                    isMobile
                    onClose={() => setMobileFilterOpen(false)}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </motion.div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedTrack !== "all" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {cpTracks.find(t => t.id === selectedTrack)?.name}
                  <button onClick={() => setSelectedTrack("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedTopic !== "all" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {cpTopics.find(t => t.id === selectedTopic)?.name}
                  <button onClick={() => setSelectedTopic("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                Clear all
              </Button>
            </div>
          )}

          {/* Tabs for View Selection */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ViewTab)} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-11 sm:h-10 p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger 
                value="all" 
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">All Sets</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger 
                value="by-track" 
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">By Track</span>
                <span className="sm:hidden">Track</span>
              </TabsTrigger>
              <TabsTrigger 
                value="by-topic" 
                className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Tags className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">By Topic</span>
                <span className="sm:hidden">Topic</span>
              </TabsTrigger>
              <TabsTrigger 
                value="revision" 
                className="gap-1.5 text-xs sm:text-sm relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
              >
                <Star className={cn("h-3.5 w-3.5", activeTab === "revision" && "fill-current")} />
                <span className="hidden sm:inline">Revision</span>
                <span className="sm:hidden">Rev</span>
                {revisionCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-1 h-5 min-w-5 px-1.5 text-[10px] border-0",
                      activeTab === "revision" 
                        ? "bg-white/20 text-white" 
                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {revisionCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* All Sets View - Expandable sections with problems inside */}
            <TabsContent value="all" className="mt-4 space-y-4">
              {/* Controls: Expand/Collapse All with indicator */}
              {paginatedProblemSets.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {paginatedProblemSets.filter(ps => expandedSets.includes(ps.id)).length} of {paginatedProblemSets.length} expanded
                    </span>
                    <Progress 
                      value={paginatedProblemSets.length > 0 ? (paginatedProblemSets.filter(ps => expandedSets.includes(ps.id)).length / paginatedProblemSets.length) * 100 : 0} 
                      className="w-20 h-1.5"
                      indicatorClassName={paginatedProblemSets.length > 0 && paginatedProblemSets.filter(ps => expandedSets.includes(ps.id)).length === paginatedProblemSets.length ? "bg-emerald-500" : undefined}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allSetIds = paginatedProblemSets.map(ps => ps.id);
                        setExpandedSets(prev => {
                          const newExpanded = new Set([...prev, ...allSetIds]);
                          return Array.from(newExpanded);
                        });
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <ChevronDown className="h-3 w-3" />
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allSetIds = paginatedProblemSets.map(ps => ps.id);
                        setExpandedSets(prev => prev.filter(id => !allSetIds.includes(id)));
                      }}
                      className="h-8 text-xs gap-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                      Collapse All
                    </Button>
                  </div>
                </div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-0">
                    {paginatedProblemSets.length > 0 ? (
                      paginatedProblemSets.map((ps, index) => (
                        <motion.div
                          key={ps.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          <CPProblemSetCard
                            problemSet={ps}
                            isExpanded={expandedSets.includes(ps.id)}
                            onToggle={() => toggleSetExpansion(ps.id)}
                            isSolved={isSolved}
                            isRevision={isRevision}
                            toggleSolved={gatedToggleSolved}
                            toggleRevision={gatedToggleRevision}
                            onOpenNote={openNoteDialog}
                          />
                        </motion.div>
                      ))
                    ) : (
                      <CPEmptyState 
                        type="no-results" 
                        onAction={clearFilters}
                        actionLabel="Clear Filters"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pagination */}
              {filteredProblemSets.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredProblemSets.length)} of {filteredProblemSets.length} sets
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={cn(
                              "cursor-pointer",
                              currentPage === 1 && "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                        
                        {/* First page */}
                        {currentPage > 2 && (
                          <>
                            <PaginationItem>
                              <PaginationLink 
                                onClick={() => setCurrentPage(1)}
                                className="cursor-pointer"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {currentPage > 3 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                          </>
                        )}
                        
                        {/* Page numbers around current */}
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          let page: number;
                          if (currentPage === 1) {
                            page = i + 1;
                          } else if (currentPage === totalPages) {
                            page = totalPages - 2 + i;
                          } else {
                            page = currentPage - 1 + i;
                          }
                          
                          if (page < 1 || page > totalPages) return null;
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {/* Last page */}
                        {currentPage < totalPages - 1 && (
                          <>
                            {currentPage < totalPages - 2 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink 
                                onClick={() => setCurrentPage(totalPages)}
                                className="cursor-pointer"
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={cn(
                              "cursor-pointer",
                              currentPage === totalPages && "pointer-events-none opacity-50"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </TabsContent>

            {/* By Track View - Grouped by Track */}
            <TabsContent value="by-track" className="mt-4 space-y-4">
              {/* Controls: Jump to + Expand/Collapse All */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Jump to:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const trackId = e.target.value;
                      if (trackId) {
                        // Expand the track if not already expanded
                        if (!expandedTracks.includes(trackId)) {
                          setExpandedTracks(prev => [...prev, trackId]);
                        }
                        // Scroll to the track section
                        const element = document.getElementById(`track-section-${trackId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
                  >
                    <option value="">Select a track...</option>
                    {cpTracks.map((track) => {
                      const trackSets = groupedByTrack[track.id] || [];
                      if (trackSets.length === 0) return null;
                      return (
                        <option key={track.id} value={track.id}>
                          {track.name} ({trackSets.length} sets)
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {expandedTracks.filter(id => cpTracks.some(t => t.id === id && (groupedByTrack[t.id] || []).length > 0)).length} of {cpTracks.filter(t => (groupedByTrack[t.id] || []).length > 0).length} expanded
                  </span>
                  <Progress 
                    value={(() => {
                      const total = cpTracks.filter(t => (groupedByTrack[t.id] || []).length > 0).length;
                      const expanded = expandedTracks.filter(id => cpTracks.some(t => t.id === id && (groupedByTrack[t.id] || []).length > 0)).length;
                      return total > 0 ? (expanded / total) * 100 : 0;
                    })()} 
                    className="w-20 h-1.5"
                    indicatorClassName={(() => {
                      const total = cpTracks.filter(t => (groupedByTrack[t.id] || []).length > 0).length;
                      const expanded = expandedTracks.filter(id => cpTracks.some(t => t.id === id && (groupedByTrack[t.id] || []).length > 0)).length;
                      return total > 0 && expanded === total ? "bg-emerald-500" : undefined;
                    })()}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allTrackIds = cpTracks
                          .filter(t => (groupedByTrack[t.id] || []).length > 0)
                          .map(t => t.id);
                        setExpandedTracks(allTrackIds);
                      }}
                      className="h-8 text-xs"
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedTracks([])}
                      className="h-8 text-xs"
                    >
                      Collapse All
                    </Button>
                  </div>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {cpTracks.map((track) => {
                      const trackSets = groupedByTrack[track.id] || [];
                      if (trackSets.length === 0) return null;
                      
                      return (
                        <div key={track.id} id={`track-section-${track.id}`}>
                          <TrackSection
                            trackId={track.id}
                            problemSets={trackSets}
                            isExpanded={expandedTracks.includes(track.id)}
                            onToggle={() => toggleTrackExpansion(track.id)}
                            expandedSets={expandedSets}
                            toggleSetExpansion={toggleSetExpansion}
                            isSolved={isSolved}
                            isRevision={isRevision}
                            toggleSolved={gatedToggleSolved}
                            toggleRevision={gatedToggleRevision}
                            onOpenNote={openNoteDialog}
                          />
                        </div>
                      );
                    })}
                    {filteredProblemSets.length === 0 && (
                      <CPEmptyState 
                        type="no-results" 
                        onAction={clearFilters}
                        actionLabel="Clear Filters"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* By Topic View - Grouped by Topic */}
            <TabsContent value="by-topic" className="mt-4 space-y-4">
              {/* Controls: Jump to + Expand/Collapse All */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Jump to:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      const topicId = e.target.value;
                      if (topicId) {
                        // Expand the topic if not already expanded
                        if (!expandedTopics.includes(topicId)) {
                          setExpandedTopics(prev => [...prev, topicId]);
                        }
                        // Scroll to the topic section
                        const element = document.getElementById(`topic-section-${topicId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[200px]"
                  >
                    <option value="">Select a topic...</option>
                    {cpTopics.map((topic) => {
                      const topicSets = groupedByTopic[topic.id] || [];
                      if (topicSets.length === 0) return null;
                      return (
                        <option key={topic.id} value={topic.id}>
                          {topic.name} ({topicSets.length} sets)
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {expandedTopics.filter(id => cpTopics.some(t => t.id === id && (groupedByTopic[t.id] || []).length > 0)).length} of {cpTopics.filter(t => (groupedByTopic[t.id] || []).length > 0).length} expanded
                  </span>
                  <Progress 
                    value={(() => {
                      const total = cpTopics.filter(t => (groupedByTopic[t.id] || []).length > 0).length;
                      const expanded = expandedTopics.filter(id => cpTopics.some(t => t.id === id && (groupedByTopic[t.id] || []).length > 0)).length;
                      return total > 0 ? (expanded / total) * 100 : 0;
                    })()} 
                    className="w-20 h-1.5"
                    indicatorClassName={(() => {
                      const total = cpTopics.filter(t => (groupedByTopic[t.id] || []).length > 0).length;
                      const expanded = expandedTopics.filter(id => cpTopics.some(t => t.id === id && (groupedByTopic[t.id] || []).length > 0)).length;
                      return total > 0 && expanded === total ? "bg-emerald-500" : undefined;
                    })()}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allTopicIds = cpTopics
                          .filter(t => (groupedByTopic[t.id] || []).length > 0)
                          .map(t => t.id);
                        setExpandedTopics(allTopicIds);
                      }}
                      className="h-8 text-xs"
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedTopics([])}
                      className="h-8 text-xs"
                    >
                      Collapse All
                    </Button>
                  </div>
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {cpTopics.map((topic) => {
                      const topicSets = groupedByTopic[topic.id] || [];
                      if (topicSets.length === 0) return null;
                      
                      return (
                        <div key={topic.id} id={`topic-section-${topic.id}`}>
                          <TopicSection
                            topicId={topic.id}
                            problemSets={topicSets}
                            isExpanded={expandedTopics.includes(topic.id)}
                            onToggle={() => toggleTopicExpansion(topic.id)}
                            expandedSets={expandedSets}
                            toggleSetExpansion={toggleSetExpansion}
                            isSolved={isSolved}
                            isRevision={isRevision}
                            toggleSolved={gatedToggleSolved}
                            toggleRevision={gatedToggleRevision}
                            onOpenNote={openNoteDialog}
                          />
                        </div>
                      );
                    })}
                    {filteredProblemSets.length === 0 && (
                      <CPEmptyState 
                        type="no-results" 
                        onAction={clearFilters}
                        actionLabel="Clear Filters"
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Revision View - Problems marked for revision, grouped by Problem Set */}
            <TabsContent value="revision" className="mt-4 space-y-4">
              {(() => {
                // Get all problems marked for revision, grouped by problem set
                const revisionBySet: Record<number, { 
                  problemSet: CPProblemSet; 
                  problems: (typeof cpProblemSets[0]['problems'][0] & { problemSetTitle: string; problemSetId: number; trackId: string })[] 
                }> = {};
                
                cpProblemSets.forEach(ps => {
                  const revProblems = ps.problems
                    .filter(p => isRevision(p.id))
                    .map(p => ({ ...p, problemSetTitle: ps.title, problemSetId: ps.id, trackId: ps.trackId }));
                  
                  if (revProblems.length > 0) {
                    revisionBySet[ps.id] = { problemSet: ps, problems: revProblems };
                  }
                });
                
                const allRevisionProblems = Object.values(revisionBySet).flatMap(g => g.problems);
                const count = allRevisionProblems.length;
                const setCount = Object.keys(revisionBySet).length;
                
                if (count === 0) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5">
                        <CardContent className="p-0">
                          <CPEmptyState 
                            type="no-revision" 
                            onAction={() => setActiveTab("all")}
                            actionLabel="Browse Problems"
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }
                
                const unsolvedCount = allRevisionProblems.filter(p => !isSolved(p.id)).length;
                
                // Toggle expansion of a revision set
                const toggleRevisionSetExpansion = (setId: number) => {
                  setExpandedRevisionSets(prev => 
                    prev.includes(setId) 
                      ? prev.filter(id => id !== setId)
                      : [...prev, setId]
                  );
                };
                
                return (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current text-amber-500" />
                          {count} {count === 1 ? 'problem' : 'problems'} in {setCount} {setCount === 1 ? 'set' : 'sets'}
                        </Badge>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showOnlyUnsolved}
                            onChange={(e) => setShowOnlyUnsolved(e.target.checked)}
                            className="h-4 w-4 rounded border-input accent-primary"
                          />
                          <span className="text-sm text-muted-foreground">
                            Unsolved only ({unsolvedCount})
                          </span>
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const allSetIds = Object.keys(revisionBySet).map(Number);
                              setExpandedRevisionSets(allSetIds);
                            }}
                            className="h-8 text-xs"
                          >
                            Expand All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedRevisionSets([])}
                            className="h-8 text-xs"
                          >
                            Collapse All
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProblemsToClear(allRevisionProblems.map(p => p.id));
                            setClearRevisionDialogOpen(true);
                          }}
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      {Object.entries(revisionBySet).map(([setIdStr, { problemSet, problems }]) => {
                        const setId = Number(setIdStr);
                        const isExpanded = expandedRevisionSets.includes(setId);
                        const track = cpTracks.find(t => t.id === problemSet.trackId);
                        
                        // Filter problems if unsolved only is enabled
                        const displayProblems = showOnlyUnsolved 
                          ? problems.filter(p => !isSolved(p.id))
                          : problems;
                        
                        if (displayProblems.length === 0) return null;
                        
                        const solvedInSet = displayProblems.filter(p => isSolved(p.id)).length;
                        const progressPercent = Math.round((solvedInSet / displayProblems.length) * 100);
                        
                        return (
                          <Card key={setId} className="overflow-hidden">
                            <Collapsible open={isExpanded} onOpenChange={() => toggleRevisionSetExpansion(setId)}>
                              <CollapsibleTrigger asChild>
                                <motion.div
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                  whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                    <motion.div
                                      animate={{ rotate: isExpanded ? 90 : 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </motion.div>
                                    <Badge 
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex",
                                        track?.color
                                      )}
                                    >
                                      {track?.name || problemSet.trackId}
                                    </Badge>
                                    <Badge 
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 shrink-0 gap-1"
                                    >
                                      <Star className="h-2.5 w-2.5 fill-current text-amber-500" />
                                      {displayProblems.length}
                                    </Badge>
                                    <span className="font-medium text-sm truncate">{problemSet.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {solvedInSet} / {displayProblems.length}
                                      </span>
                                      <Progress value={progressPercent} className="w-16 sm:w-24 h-1.5" />
                                      <span className="text-xs text-muted-foreground w-8 text-right hidden sm:inline">
                                        {progressPercent}%
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              </CollapsibleTrigger>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <CollapsibleContent forceMount>
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-12 text-center">Status</TableHead>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>Problem</TableHead>
                                            <TableHead className="w-20">Difficulty</TableHead>
                                            <TableHead className="w-14 text-center">Star</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {displayProblems.map((problem, index) => (
                                            <motion.tr
                                              key={problem.id}
                                              initial={{ opacity: 0, x: -10 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: index * 0.02 }}
                                              className={cn(
                                                "border-b transition-colors",
                                                isSolved(problem.id) && "bg-primary/5"
                                              )}
                                            >
                                              <TableCell className="w-12 text-center py-2">
                                                <motion.button
                                                  onClick={() => toggleSolved(problem.id)}
                                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.95 }}
                                                >
                                                  {isSolved(problem.id) ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                  ) : (
                                                    <Square className="h-4 w-4" />
                                                  )}
                                                </motion.button>
                                              </TableCell>
                                              <TableCell className="w-12 text-center py-2">
                                                <span className="text-xs text-muted-foreground">{index + 1}</span>
                                              </TableCell>
                                              <TableCell className="py-2">
                                                <div className="flex items-center gap-2">
                                                  <span className={cn(
                                                    "font-medium text-sm",
                                                    isSolved(problem.id) && "line-through text-muted-foreground"
                                                  )}>
                                                    {problem.title}
                                                  </span>
                                                  {problem.problemUrl && (
                                                    <a
                                                      href={problem.problemUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-muted-foreground hover:text-primary transition-colors"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                  )}
                                                </div>
                                              </TableCell>
                                              <TableCell className="w-20 py-2">
                                                <DifficultyBadgeLegacy difficulty={problem.difficulty} />
                                              </TableCell>
                                              <TableCell className="w-14 text-center py-2">
                                                <motion.button
                                                  onClick={() => toggleRevision(problem.id)}
                                                  className="text-amber-500 hover:text-amber-600 transition-colors"
                                                  whileHover={{ scale: 1.2 }}
                                                  whileTap={{ scale: 0.9 }}
                                                >
                                                  <Star className="h-3.5 w-3.5 fill-current" />
                                                </motion.button>
                                              </TableCell>
                                            </motion.tr>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </motion.div>
                                  </CollapsibleContent>
                                )}
                              </AnimatePresence>
                            </Collapsible>
                          </Card>
                        );
                      })}
                    </motion.div>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Notes Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Notes: {currentNoteProblem?.title}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Add your notes here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>
              <Save className="h-4 w-4 mr-2" />
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Revision Confirmation Dialog */}
      <AlertDialog open={clearRevisionDialogOpen} onOpenChange={setClearRevisionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all revision marks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {problemsToClear.length} {problemsToClear.length === 1 ? 'problem' : 'problems'} from your revision list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                problemsToClear.forEach(id => toggleRevision(id));
                setProblemsToClear([]);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Progress Indicator */}
      <CPFloatingProgress
        solvedCount={completedCount}
        totalCount={totalProblemCount}
        revisionCount={revisionCount}
      />
      {AuthDialog}
    </div>
  );
};

export default CPProblemSetsView;

