import { useState, useMemo } from "react";
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
  Hash,
  X,
  CheckSquare,
  Square,
  Star,
  Loader2,
  List,
  Layers,
  Tags
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  cpTracks, 
  cpTopics, 
  cpProblemSets,
  type CPProblemSet 
} from "@/data/competitiveProgrammingData";
import CPFilterSidebar from "@/components/sheets/CPFilterSidebar";
import StreakCounter from "@/components/StreakCounter";
import { useCPProgress, getTrackDifficulty } from "@/hooks/useCPProgress";
import { useAuth } from "@/contexts/AuthContext";

type ViewTab = "all" | "by-track" | "by-topic";

// Get track badge color
function getTrackBadgeClass(trackId: string) {
  const track = cpTracks.find(t => t.id === trackId);
  return track?.color || "bg-muted text-muted-foreground";
}

// All Sets Row - Shows Track badge and Progress bar
function AllSetsTableRow({ 
  problemSet, 
  isSolved,
  problemCount,
}: { 
  problemSet: CPProblemSet; 
  isSolved: boolean;
  problemCount: number;
}) {
  const track = cpTracks.find(t => t.id === problemSet.trackId);
  const solvedCount = isSolved ? problemCount : 0;
  const progressPercent = problemCount > 0 ? Math.round((solvedCount / problemCount) * 100) : 0;

  return (
    <TableRow className={cn(
      "border-b border-border/30 transition-colors",
      isSolved ? "bg-primary/5" : "hover:bg-muted/30"
    )}>
      {/* Track Badge + Problem Set Title */}
      <TableCell className="py-3">
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-2 py-0.5 shrink-0 font-medium whitespace-nowrap",
              getTrackBadgeClass(problemSet.trackId)
            )}
          >
            {track?.name || problemSet.trackId}
          </Badge>
          {problemSet.externalUrl ? (
            <a
              href={problemSet.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "text-sm font-medium text-primary hover:underline transition-colors truncate",
                isSolved && "line-through text-muted-foreground"
              )}
            >
              {problemSet.title}
            </a>
          ) : (
            <span className={cn(
              "text-sm font-medium truncate",
              isSolved && "line-through text-muted-foreground"
            )}>
              {problemSet.title}
            </span>
          )}
        </div>
      </TableCell>
      
      {/* Progress Bar */}
      <TableCell className="w-40 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap w-20 text-right">
            {solvedCount} / {problemCount} ({progressPercent}%) solved
          </span>
          <Progress 
            value={progressPercent} 
            className="h-1.5 flex-1 min-w-16 max-w-24" 
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

// Paginated All Sets View Component
function AllSetsView({
  problemSets,
  isSolved,
  searchQuery,
  onSearchChange,
  onClearSearch,
}: {
  problemSets: CPProblemSet[];
  isSolved: (id: number) => boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [problemSets.length, itemsPerPage]);

  const totalPages = Math.ceil(problemSets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSets = problemSets.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Search and Show controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground shrink-0">Search:</span>
          <div className="relative flex-1 sm:w-64">
            <Input
              placeholder=""
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 pr-14"
            />
            {searchQuery && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClearSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="text-xs font-medium">
                    <div className="flex items-center gap-1">
                      Track
                      <ChevronDown className="h-3 w-3" />
                      Problem Set
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-40 text-xs font-medium text-right">
                    <div className="flex items-center justify-end gap-1">
                      Your Progress
                      <ChevronDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSets.map((ps) => (
                  <AllSetsTableRow 
                    key={ps.id} 
                    problemSet={ps} 
                    isSolved={isSolved(ps.id)}
                    problemCount={ps.problemCount}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          
          {problemSets.length === 0 && (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No problem sets found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, problemSets.length)} of {problemSets.length} entries
          </p>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {getPageNumbers().map((page, idx) => 
              page === "ellipsis" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              )
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

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

// Problem Set Row for Track/Topic sections
function ProblemSetRow({ 
  problemSet, 
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  difficulty,
}: { 
  problemSet: CPProblemSet; 
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  difficulty: "Easy" | "Medium" | "Hard";
}) {
  const getTopicName = (topicId: string) => {
    return cpTopics.find(t => t.id === topicId)?.name || topicId;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.015 }}
      className={cn(
        "group transition-colors border-b border-border/30 last:border-0",
        isSolved ? "bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      {/* Status Checkbox */}
      <TableCell className="w-12 text-center">
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
                <CheckSquare className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TableCell>
      
      {/* ID */}
      <TableCell className="w-12 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          {problemSet.id}
        </span>
      </TableCell>
      
      {/* Title */}
      <TableCell className="font-medium min-w-0">
        <motion.span
          className={cn(
            "text-sm truncate block transition-colors",
            isSolved && "line-through text-muted-foreground"
          )}
          animate={{ opacity: isSolved ? 0.7 : 1 }}
        >
          {problemSet.title}
        </motion.span>
        {/* Mobile-only topic badge */}
        <div className="flex gap-1.5 mt-1 sm:hidden">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {getTopicName(problemSet.topicId)}
          </Badge>
          <DifficultyBadge difficulty={difficulty} />
        </div>
      </TableCell>
      
      {/* Topic - hidden on mobile */}
      <TableCell className="hidden sm:table-cell w-44">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-full">
          {getTopicName(problemSet.topicId)}
        </Badge>
      </TableCell>
      
      {/* Problems Count */}
      <TableCell className="w-20 text-center">
        <div className="flex items-center justify-center gap-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{problemSet.problemCount}</span>
        </div>
      </TableCell>
      
      {/* Practice Link */}
      <TableCell className="w-24 text-center">
        {problemSet.externalUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problemSet.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <ExternalLink className="h-3 w-3" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Open on ProgVar.fun</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      {/* Revision Star */}
      <TableCell className="w-14 text-center">
        <motion.button
          onClick={onToggleRevision}
          className={cn(
            "transition-colors",
            isRevision ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
          )}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
        </motion.button>
      </TableCell>
      
      {/* Difficulty - hidden on mobile */}
      <TableCell className="hidden sm:table-cell w-20 text-center">
        <DifficultyBadge difficulty={difficulty} />
      </TableCell>
    </motion.tr>
  );
}

// Track Section Component
function TrackSection({
  trackId,
  problemSets,
  isExpanded,
  onToggle,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
}: {
  trackId: string;
  problemSets: CPProblemSet[];
  isExpanded: boolean;
  onToggle: () => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
}) {
  const track = cpTracks.find(t => t.id === trackId);
  if (!track) return null;

  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problemCount, 0);
  const completedSets = problemSets.filter(ps => isSolved(ps.id)).length;
  const progressPercent = problemSets.length > 0 ? Math.round((completedSets / problemSets.length) * 100) : 0;
  const difficulty = getTrackDifficulty(trackId);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            <Badge className={cn("text-xs shrink-0", track.color)}>
              {completedSets}/{problemSets.length}
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{track.name}</span>
            <DifficultyBadge difficulty={difficulty} />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {progressPercent > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <Progress value={progressPercent} className="w-16 h-1.5" />
                <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground hidden md:inline">{totalProblems} problems</span>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/30">
                      <TableHead className="w-12 text-center text-xs">Status</TableHead>
                      <TableHead className="w-12 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Problem Set</TableHead>
                      <TableHead className="hidden sm:table-cell w-44 text-xs">Topic</TableHead>
                      <TableHead className="w-20 text-center text-xs">Problems</TableHead>
                      <TableHead className="w-24 text-center text-xs">Practice</TableHead>
                      <TableHead className="w-14 text-center text-xs">Rev</TableHead>
                      <TableHead className="hidden sm:table-cell w-20 text-center text-xs">Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemSets.map((ps, idx) => (
                      <ProblemSetRow 
                        key={ps.id} 
                        problemSet={ps} 
                        index={idx}
                        isSolved={isSolved(ps.id)}
                        isRevision={isRevision(ps.id)}
                        onToggleSolved={() => toggleSolved(ps.id)}
                        onToggleRevision={() => toggleRevision(ps.id)}
                        difficulty={getTrackDifficulty(ps.trackId)}
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

// Topic Section Component
function TopicSection({
  topicId,
  problemSets,
  isExpanded,
  onToggle,
  isSolved,
  isRevision,
  toggleSolved,
  toggleRevision,
}: {
  topicId: string;
  problemSets: CPProblemSet[];
  isExpanded: boolean;
  onToggle: () => void;
  isSolved: (id: number) => boolean;
  isRevision: (id: number) => boolean;
  toggleSolved: (id: number) => void;
  toggleRevision: (id: number) => void;
}) {
  const topic = cpTopics.find(t => t.id === topicId);
  if (!topic) return null;

  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problemCount, 0);
  const completedSets = problemSets.filter(ps => isSolved(ps.id)).length;
  const progressPercent = problemSets.length > 0 ? Math.round((completedSets / problemSets.length) * 100) : 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.div>
            <Badge variant="secondary" className="text-xs shrink-0">
              {completedSets}/{problemSets.length}
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{topic.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {progressPercent > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <Progress value={progressPercent} className="w-16 h-1.5" />
                <span className="text-xs text-muted-foreground w-8">{progressPercent}%</span>
              </div>
            )}
            <span className="text-xs text-muted-foreground hidden md:inline">{totalProblems} problems</span>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/30">
                      <TableHead className="w-12 text-center text-xs">Status</TableHead>
                      <TableHead className="w-12 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Problem Set</TableHead>
                      <TableHead className="hidden sm:table-cell w-44 text-xs">Track</TableHead>
                      <TableHead className="w-20 text-center text-xs">Problems</TableHead>
                      <TableHead className="w-24 text-center text-xs">Practice</TableHead>
                      <TableHead className="w-14 text-center text-xs">Rev</TableHead>
                      <TableHead className="hidden sm:table-cell w-20 text-center text-xs">Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemSets.map((ps, idx) => (
                      <TopicProblemSetRow 
                        key={ps.id} 
                        problemSet={ps} 
                        index={idx}
                        isSolved={isSolved(ps.id)}
                        isRevision={isRevision(ps.id)}
                        onToggleSolved={() => toggleSolved(ps.id)}
                        onToggleRevision={() => toggleRevision(ps.id)}
                        difficulty={getTrackDifficulty(ps.trackId)}
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

// Topic Problem Set Row - shows Track instead of Topic
function TopicProblemSetRow({ 
  problemSet, 
  index,
  isSolved,
  isRevision,
  onToggleSolved,
  onToggleRevision,
  difficulty,
}: { 
  problemSet: CPProblemSet; 
  index: number;
  isSolved: boolean;
  isRevision: boolean;
  onToggleSolved: () => void;
  onToggleRevision: () => void;
  difficulty: "Easy" | "Medium" | "Hard";
}) {
  const getTrackName = (trackId: string) => {
    return cpTracks.find(t => t.id === trackId)?.name || trackId;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.015 }}
      className={cn(
        "group transition-colors border-b border-border/30 last:border-0",
        isSolved ? "bg-primary/5" : "hover:bg-muted/50"
      )}
    >
      <TableCell className="w-12 text-center">
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
                <CheckSquare className="h-5 w-5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="unchecked"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </TableCell>
      
      <TableCell className="w-12 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          {problemSet.id}
        </span>
      </TableCell>
      
      <TableCell className="font-medium min-w-0">
        <motion.span
          className={cn(
            "text-sm truncate block transition-colors",
            isSolved && "line-through text-muted-foreground"
          )}
          animate={{ opacity: isSolved ? 0.7 : 1 }}
        >
          {problemSet.title}
        </motion.span>
        <div className="flex gap-1.5 mt-1 sm:hidden">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {getTrackName(problemSet.trackId)}
          </Badge>
          <DifficultyBadge difficulty={difficulty} />
        </div>
      </TableCell>
      
      <TableCell className="hidden sm:table-cell w-44">
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0 truncate max-w-full",
            getTrackBadgeClass(problemSet.trackId)
          )}
        >
          {getTrackName(problemSet.trackId)}
        </Badge>
      </TableCell>
      
      <TableCell className="w-20 text-center">
        <div className="flex items-center justify-center gap-1">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{problemSet.problemCount}</span>
        </div>
      </TableCell>
      
      <TableCell className="w-24 text-center">
        {problemSet.externalUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problemSet.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <ExternalLink className="h-3 w-3" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Open on ProgVar.fun</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>

      <TableCell className="w-14 text-center">
        <motion.button
          onClick={onToggleRevision}
          className={cn(
            "transition-colors",
            isRevision ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
          )}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Star className={cn("h-4 w-4", isRevision && "fill-current")} />
        </motion.button>
      </TableCell>
      
      <TableCell className="hidden sm:table-cell w-20 text-center">
        <DifficultyBadge difficulty={difficulty} />
      </TableCell>
    </motion.tr>
  );
}

const CPProblemSetsView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSolved, isRevision, toggleSolved, toggleRevision, getTotalSolved, isLoading: isProgressLoading } = useCPProgress();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [expandedTracks, setExpandedTracks] = useState<string[]>(["preliminaries", "basics"]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>(["dynamic-programming", "graphs"]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("all");

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
        ps.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrack = selectedTrack === "all" || ps.trackId === selectedTrack;
      const matchesTopic = selectedTopic === "all" || ps.topicId === selectedTopic;
      return matchesSearch && matchesTrack && matchesTopic;
    });
  }, [searchQuery, selectedTrack, selectedTopic]);

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

  const getTopicName = (topicId: string) => {
    return cpTopics.find(t => t.id === topicId)?.name || topicId;
  };

  const totalProblems = filteredProblemSets.reduce((acc, ps) => acc + ps.problemCount, 0);
  const completedCount = getTotalSolved();
  const progressPercent = cpProblemSets.length > 0 ? Math.round((completedCount / cpProblemSets.length) * 100) : 0;
  const hasActiveFilters = selectedTrack !== "all" || selectedTopic !== "all";

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
            {completedCount}/{cpProblemSets.length} completed
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
                        {completedCount}/{cpProblemSets.length} sets · {totalProblems.toLocaleString()} problems
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

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
                      {(selectedTrack !== "all" ? 1 : 0) + (selectedTopic !== "all" ? 1 : 0)}
                    </Badge>
                  )}
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
          </div>

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

            {/* All Sets View - Paginated table like ProgVar */}
            <TabsContent value="all" className="mt-4">
              <AllSetsView
                problemSets={filteredProblemSets}
                isSolved={isSolved}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={() => setSearchQuery("")}
              />
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
                          isSolved={isSolved}
                          isRevision={isRevision}
                          toggleSolved={toggleSolved}
                          toggleRevision={toggleRevision}
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
                          isSolved={isSolved}
                          isRevision={isRevision}
                          toggleSolved={toggleSolved}
                          toggleRevision={toggleRevision}
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
    </div>
  );
};

export default CPProblemSetsView;
