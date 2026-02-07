import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  Code2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Bookmark,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import CPFilterSidebar from "@/components/library/CPFilterSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCPProgress } from "@/hooks/useCPProgress";
import {
  cpProblemSets,
  cpTracks,
  getTrackById,
  filterProblemSets,
  type CPProblemSet,
} from "@/data/competitiveProgrammingData";

type SortField = "track" | "title" | "progress";
type SortDirection = "asc" | "desc";

const CompetitiveProgramming = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortField, setSortField] = useState<SortField>("track");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    isLoading,
    isSolved,
    isRevision,
    toggleSolved,
    toggleRevision,
    getTotalSolved,
  } = useCPProgress();

  // Filter problem sets
  const filteredProblemSets = useMemo(() => {
    return filterProblemSets(selectedTrack, selectedTopic, searchQuery);
  }, [selectedTrack, selectedTopic, searchQuery]);

  // Sort problem sets
  const sortedProblemSets = useMemo(() => {
    const sorted = [...filteredProblemSets];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "track":
          const trackA = getTrackById(a.trackId)?.name || "";
          const trackB = getTrackById(b.trackId)?.name || "";
          comparison = trackA.localeCompare(trackB);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "progress":
          const progressA = isSolved(a.id) ? 100 : 0;
          const progressB = isSolved(b.id) ? 100 : 0;
          comparison = progressA - progressB;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredProblemSets, sortField, sortDirection, isSolved]);

  // Pagination
  const totalPages = Math.ceil(sortedProblemSets.length / itemsPerPage);
  const paginatedProblemSets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProblemSets.slice(start, start + itemsPerPage);
  }, [sortedProblemSets, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [selectedTrack, selectedTopic, searchQuery, itemsPerPage]);

  // Progress stats
  const progressStats = useMemo(() => {
    const total = cpProblemSets.length;
    const solved = getTotalSolved();
    const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;
    
    // Calculate total problems across all sets
    const totalProblems = cpProblemSets.reduce((sum, ps) => sum + ps.problemCount, 0);
    
    return { total, solved, percentage, totalProblems };
  }, [getTotalSolved]);

  const handleToggleSolved = async (problemSetId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const wasSolved = isSolved(problemSetId);
    await toggleSolved(problemSetId);

    if (!wasSolved) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#6ee7b7"],
      });
    }
  };

  const handleToggleRevision = async (problemSetId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }
    await toggleRevision(problemSetId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTrack("all");
    setSelectedTopic("all");
  }, []);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedTrack !== "all" || selectedTopic !== "all";

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
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
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shrink-0">
                <Code2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Competitive Programming</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Master algorithms through structured problem sets
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Filter Sidebar */}
          <CPFilterSidebar
            selectedTrack={selectedTrack}
            selectedTopic={selectedTopic}
            onTrackChange={setSelectedTrack}
            onTopicChange={setSelectedTopic}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 min-w-0">
            {/* Progress Card */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">Overall Progress</span>
                      <Badge variant="secondary" className="text-xs">
                        {progressStats.percentage}%
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{progressStats.solved}</span>
                      <span className="text-sm text-muted-foreground">/ {progressStats.total} sets completed</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Progress value={progressStats.percentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search and Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Mobile Filter Button */}
              <div className="lg:hidden">
                <CPFilterSidebar
                  selectedTrack={selectedTrack}
                  selectedTopic={selectedTopic}
                  onTrackChange={setSelectedTrack}
                  onTopicChange={setSelectedTopic}
                />
              </div>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problem sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Items per page */}
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(v) => setItemsPerPage(parseInt(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Show 10</SelectItem>
                  <SelectItem value="25">Show 25</SelectItem>
                  <SelectItem value="50">Show 50</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2">
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {paginatedProblemSets.length} of {sortedProblemSets.length} problem sets
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[140px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 -ml-3 font-medium"
                        onClick={() => handleSort("track")}
                      >
                        Track
                        {sortField === "track" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 -ml-3 font-medium"
                        onClick={() => handleSort("title")}
                      >
                        Problem Set
                        {sortField === "title" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[200px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 -ml-3 font-medium"
                        onClick={() => handleSort("progress")}
                      >
                        Progress
                        {sortField === "progress" ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProblemSets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No problem sets found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProblemSets.map((problemSet) => {
                      const track = getTrackById(problemSet.trackId);
                      const solved = isSolved(problemSet.id);
                      const revision = isRevision(problemSet.id);
                      const progressPercent = solved ? 100 : 0;
                      const solvedCount = solved ? problemSet.problemCount : 0;

                      return (
                        <TableRow
                          key={problemSet.id}
                          className={cn(
                            "transition-colors",
                            solved && "bg-emerald-500/5"
                          )}
                        >
                          <TableCell>
                            {track && (
                              <Badge
                                variant="secondary"
                                className={cn("text-xs font-medium", track.color)}
                              >
                                {track.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-medium",
                                solved && "text-emerald-600 dark:text-emerald-400"
                              )}>
                                {problemSet.title}
                              </span>
                              {problemSet.externalUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={problemSet.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-primary"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>Open problem set</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">
                                    {solvedCount} / {problemSet.problemCount}
                                  </span>
                                  <span className="text-xs font-medium">
                                    {progressPercent}%
                                  </span>
                                </div>
                                <Progress
                                  value={progressPercent}
                                  className={cn(
                                    "h-1.5",
                                    solved && "[&>div]:bg-emerald-500"
                                  )}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      solved && "text-emerald-500 hover:text-emerald-600"
                                    )}
                                    onClick={() => handleToggleSolved(problemSet.id)}
                                    disabled={isLoading}
                                  >
                                    <CheckCircle2
                                      className={cn(
                                        "h-4 w-4",
                                        solved && "fill-current"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {solved ? "Mark as incomplete" : "Mark as complete"}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      revision && "text-amber-500 hover:text-amber-600"
                                    )}
                                    onClick={() => handleToggleRevision(problemSet.id)}
                                    disabled={isLoading}
                                  >
                                    <Bookmark
                                      className={cn(
                                        "h-4 w-4",
                                        revision && "fill-current"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {revision ? "Remove from revision" : "Add to revision"}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={cn(
                        "cursor-pointer",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CompetitiveProgramming;
