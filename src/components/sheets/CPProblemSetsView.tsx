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
  Save
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
} from "@/components/ui/dialog";
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
import CPFilterSidebar from "@/components/sheets/CPFilterSidebar";
import StreakCounter from "@/components/StreakCounter";
import { useCPProgress } from "@/hooks/useCPProgress";
import { useAuth } from "@/contexts/AuthContext";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

type ViewTab = "all" | "by-track" | "by-topic";

// Difficulty Badge Component
function DifficultyBadge({ difficulty }: { difficulty: "Easy" | "Medium" | "Hard" }) {
  const styles = {
    Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", styles[difficulty])}>
      {difficulty}
    </Badge>
  );
}

// Get track badge color
function getTrackBadgeClass(trackId: string) {
  const track = cpTracks.find(t => t.id === trackId);
  return track?.color || "bg-muted text-muted-foreground";
}

// Problem Row Component (individual problem inside a set)
function ProblemRow({
  problem,
  problemSetId,
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  onOpenNote,
}: {
  problem: CPProblem;
  problemSetId: number;
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  onOpenNote: () => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "group transition-colors border-b border-border/20 last:border-0",
        isSolved ? "bg-primary/5" : "hover:bg-muted/30"
      )}
    >
      {/* Status Checkbox */}
      <TableCell className="w-12 text-center py-2">
        <motion.button
          onClick={onToggleSolved}
          className="text-muted-foreground hover:text-foreground transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {isSolved ? (
              <motion.div
                key="checked"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <CheckSquare className="h-4 w-4 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TableCell>

      {/* Problem Number */}
      <TableCell className="w-12 text-center py-2">
        <span className="text-xs text-muted-foreground">{index + 1}</span>
      </TableCell>

      {/* Problem Title */}
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm",
            isSolved && "line-through text-muted-foreground"
          )}>
            {problem.title}
          </span>
          {problem.platform && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 hidden sm:inline">
              {problem.platform}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Difficulty */}
      <TableCell className="w-20 text-center py-2 hidden sm:table-cell">
        <DifficultyBadge difficulty={problem.difficulty} />
      </TableCell>

      {/* Practice Link */}
      <TableCell className="w-20 text-center py-2">
        {problem.problemUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={problem.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Solve Problem</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      {/* Notes Button */}
      <TableCell className="w-14 text-center py-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onOpenNote}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Add Note</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Revision Star */}
      <TableCell className="w-14 text-center py-2">
        <motion.button
          onClick={onToggleRevision}
          className={cn(
            "transition-colors",
            isRevision ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
          )}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Star className={cn("h-3.5 w-3.5", isRevision && "fill-current")} />
        </motion.button>
      </TableCell>
    </motion.tr>
  );
}

// Expandable Problem Set Section for All Sets View
function ProblemSetSection({
  problemSet,
  isExpanded,
  onToggle,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
  onOpenNote,
}: {
  problemSet: CPProblemSet;
  isExpanded: boolean;
  onToggle: () => void;
  isSolved: (problemId: number) => boolean;
  isRevision: (problemId: number) => boolean;
  toggleSolved: (problemId: number) => void;
  toggleRevision: (problemId: number) => void;
  onOpenNote: (problemId: number, title: string) => void;
}) {
  const track = cpTracks.find(t => t.id === problemSet.trackId);
  const completedCount = problemSet.problems.filter(p => isSolved(p.id)).length;
  const progressPercent = problemSet.problems.length > 0 
    ? Math.round((completedCount / problemSet.problems.length) * 100) 
    : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
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
                getTrackBadgeClass(problemSet.trackId)
              )}
            >
              {track?.name || problemSet.trackId}
            </Badge>
            <span className="font-medium text-sm truncate">{problemSet.title}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {completedCount} / {problemSet.problems.length}
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
              className="bg-muted/10"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/30">
                      <TableHead className="w-12 text-center text-xs">Status</TableHead>
                      <TableHead className="w-12 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Problem</TableHead>
                      <TableHead className="w-20 text-center text-xs hidden sm:table-cell">Difficulty</TableHead>
                      <TableHead className="w-20 text-center text-xs">Practice</TableHead>
                      <TableHead className="w-14 text-center text-xs">Notes</TableHead>
                      <TableHead className="w-14 text-center text-xs">Rev</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemSet.problems.map((problem, idx) => (
                      <ProblemRow
                        key={problem.id}
                        problem={problem}
                        problemSetId={problemSet.id}
                        index={idx}
                        isSolved={isSolved(problem.id)}
                        isRevision={isRevision(problem.id)}
                        onToggleSolved={() => toggleSolved(problem.id)}
                        onToggleRevision={() => toggleRevision(problem.id)}
                        onOpenNote={() => onOpenNote(problem.id, problem.title)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Track Section Component
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

  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problems.length, 0);
  const completedProblems = problemSets.reduce((acc, ps) => 
    acc + ps.problems.filter(p => isSolved(p.id)).length, 0);
  const progressPercent = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;
  const difficulty = getTrackDifficulty(trackId);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50 bg-muted/20"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            <Badge className={cn("text-xs shrink-0", track.color)}>
              {problemSets.length} sets
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{track.name}</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {completedProblems}/{totalProblems}
              </span>
              <Progress value={progressPercent} className="w-20 h-1.5" />
              <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
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
              {problemSets.map((ps) => (
                <ProblemSetSection
                  key={ps.id}
                  problemSet={ps}
                  isExpanded={expandedSets.includes(ps.id)}
                  onToggle={() => toggleSetExpansion(ps.id)}
                  isSolved={isSolved}
                  isRevision={isRevision}
                  toggleSolved={toggleSolved}
                  toggleRevision={toggleRevision}
                  onOpenNote={onOpenNote}
                />
              ))}
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
}

// Topic Section Component
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

  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problems.length, 0);
  const completedProblems = problemSets.reduce((acc, ps) => 
    acc + ps.problems.filter(p => isSolved(p.id)).length, 0);
  const progressPercent = totalProblems > 0 ? Math.round((completedProblems / totalProblems) * 100) : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50 bg-muted/20"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.4)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {problemSets.length} sets
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{topic.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {completedProblems}/{totalProblems}
              </span>
              <Progress value={progressPercent} className="w-20 h-1.5" />
              <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
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
              {problemSets.map((ps) => (
                <ProblemSetSection
                  key={ps.id}
                  problemSet={ps}
                  isExpanded={expandedSets.includes(ps.id)}
                  onToggle={() => toggleSetExpansion(ps.id)}
                  isSolved={isSolved}
                  isRevision={isRevision}
                  toggleSolved={toggleSolved}
                  toggleRevision={toggleRevision}
                  onOpenNote={onOpenNote}
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
  const { isSolved, isRevision, toggleSolved, toggleRevision, getTotalSolved, isLoading: isProgressLoading } = useCPProgress();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [expandedSets, setExpandedSets] = useState<number[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<string[]>(["preliminaries", "basics"]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>(["dynamic-programming", "graphs"]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  
  // Notes dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentNoteProblem, setCurrentNoteProblem] = useState<{ id: number; title: string } | null>(null);
  const [noteContent, setNoteContent] = useState("");

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
    setCurrentNoteProblem({ id: problemId, title });
    setNoteContent("");
    setNoteDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard/sheets")}
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
          <Badge variant="outline" className="hidden md:flex text-xs whitespace-nowrap">
            {completedCount}/{totalProblemCount} solved
          </Badge>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <div className="sticky top-20 p-4 w-64">
            <CPFilterSidebar
              selectedTrack={selectedTrack}
              onTrackChange={setSelectedTrack}
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              problemSetCounts={problemSetCounts}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-muted-foreground text-sm sm:text-base">
              Master algorithms through structured problem sets from Codeforces, AtCoder & ICPC World Finals.{" "}
              <a href="https://progvar.fun" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Learn more at ProgVar.fun
              </a>
            </p>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center">
                      <span className="text-lg font-bold">{progressPercent}%</span>
                    </div>
                    <div>
                      <p className="font-medium">Overall Progress</p>
                      <p className="text-sm text-muted-foreground">
                        {completedCount}/{totalProblemCount} problems · {cpProblemSets.length} sets
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-sm">Easy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-sm">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <span className="text-sm">Hard</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sign in prompt for unauthenticated users */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-primary shrink-0" />
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden h-9 w-9 shrink-0">
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
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex h-10 sm:h-9">
              <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">All Sets</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="by-track" className="gap-1.5 text-xs sm:text-sm">
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">By Track</span>
                <span className="sm:hidden">Track</span>
              </TabsTrigger>
              <TabsTrigger value="by-topic" className="gap-1.5 text-xs sm:text-sm">
                <Tags className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">By Topic</span>
                <span className="sm:hidden">Topic</span>
              </TabsTrigger>
            </TabsList>

            {/* All Sets View - Expandable sections with problems inside */}
            <TabsContent value="all" className="mt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {paginatedProblemSets.length > 0 ? (
                      paginatedProblemSets.map((ps) => (
                        <ProblemSetSection
                          key={ps.id}
                          problemSet={ps}
                          isExpanded={expandedSets.includes(ps.id)}
                          onToggle={() => toggleSetExpansion(ps.id)}
                          isSolved={isSolved}
                          isRevision={isRevision}
                          toggleSolved={toggleSolved}
                          toggleRevision={toggleRevision}
                          onOpenNote={openNoteDialog}
                        />
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No problem sets found matching your filters.</p>
                        <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
                      </div>
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
            <TabsContent value="by-track" className="mt-4">
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
                        <TrackSection
                          key={track.id}
                          trackId={track.id}
                          problemSets={trackSets}
                          isExpanded={expandedTracks.includes(track.id)}
                          onToggle={() => toggleTrackExpansion(track.id)}
                          expandedSets={expandedSets}
                          toggleSetExpansion={toggleSetExpansion}
                          isSolved={isSolved}
                          isRevision={isRevision}
                          toggleSolved={toggleSolved}
                          toggleRevision={toggleRevision}
                          onOpenNote={openNoteDialog}
                        />
                      );
                    })}
                    {filteredProblemSets.length === 0 && (
                      <div className="p-12 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No problem sets found matching your filters.</p>
                        <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* By Topic View - Grouped by Topic */}
            <TabsContent value="by-topic" className="mt-4">
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
                        <TopicSection
                          key={topic.id}
                          topicId={topic.id}
                          problemSets={topicSets}
                          isExpanded={expandedTopics.includes(topic.id)}
                          onToggle={() => toggleTopicExpansion(topic.id)}
                          expandedSets={expandedSets}
                          toggleSetExpansion={toggleSetExpansion}
                          isSolved={isSolved}
                          isRevision={isRevision}
                          toggleSolved={toggleSolved}
                          toggleRevision={toggleRevision}
                          onOpenNote={openNoteDialog}
                        />
                      );
                    })}
                    {filteredProblemSets.length === 0 && (
                      <div className="p-12 text-center">
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No problem sets found matching your filters.</p>
                        <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
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
    </div>
  );
};

export default CPProblemSetsView;
