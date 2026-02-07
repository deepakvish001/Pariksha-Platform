import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  ExternalLink, 
  Filter,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Trophy,
  Hash,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import MobileFAB from "@/components/MobileFAB";

// Problem Set Row Component
function ProblemSetRow({ 
  problemSet, 
  index 
}: { 
  problemSet: CPProblemSet; 
  index: number;
}) {
  const getTopicName = (topicId: string) => {
    return cpTopics.find(t => t.id === topicId)?.name || topicId;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
    >
      {/* ID */}
      <TableCell className="w-14 text-center">
        <span className="text-xs font-medium text-muted-foreground">
          {problemSet.id}
        </span>
      </TableCell>
      
      {/* Title */}
      <TableCell className="font-medium min-w-0">
        <div className="flex flex-col gap-1">
          <span className="text-sm truncate">{problemSet.title}</span>
          <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 sm:hidden">
            {getTopicName(problemSet.topicId)}
          </Badge>
        </div>
      </TableCell>
      
      {/* Topic - hidden on mobile */}
      <TableCell className="hidden sm:table-cell w-48">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-full">
          {getTopicName(problemSet.topicId)}
        </Badge>
      </TableCell>
      
      {/* Problems Count */}
      <TableCell className="w-24 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Hash className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">{problemSet.problemCount}</span>
        </div>
      </TableCell>
      
      {/* Practice Link */}
      <TableCell className="w-28 text-center">
        {problemSet.externalUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.a
                  href={problemSet.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Practice</span>
                  <ExternalLink className="h-3 w-3" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent>Open on ProgVar.fun</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
}: {
  trackId: string;
  problemSets: CPProblemSet[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const track = cpTracks.find(t => t.id === trackId);
  if (!track) return null;

  const totalProblems = problemSets.reduce((acc, ps) => acc + ps.problemCount, 0);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <motion.div 
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/50"
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
            <Badge className={cn("text-xs shrink-0", track.color)}>
              {problemSets.length} sets
            </Badge>
            <span className="font-semibold text-sm sm:text-base truncate">{track.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
            <span className="hidden sm:inline">{totalProblems} problems</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-200",
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
                      <TableHead className="w-14 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Problem Set</TableHead>
                      <TableHead className="hidden sm:table-cell w-48 text-xs">Topic</TableHead>
                      <TableHead className="w-24 text-center text-xs">Problems</TableHead>
                      <TableHead className="w-28 text-center text-xs">Practice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {problemSets.map((ps, idx) => (
                      <ProblemSetRow key={ps.id} problemSet={ps} index={idx} />
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

const CPProblemSetsView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [expandedTracks, setExpandedTracks] = useState<string[]>(["preliminaries", "basics"]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  const toggleTrackExpansion = (trackId: string) => {
    setExpandedTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
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
          <Badge variant="outline" className="hidden md:flex text-xs whitespace-nowrap">
            {filteredProblemSets.length} Problem Sets
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
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Overall Progress</p>
                      <p className="text-sm text-muted-foreground">
                        {filteredProblemSets.length} sets · {totalProblems.toLocaleString()} problems
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{cpTracks.length}</p>
                      <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{cpTopics.length}</p>
                      <p className="text-xs text-muted-foreground">Topics</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">270</p>
                      <p className="text-xs text-muted-foreground">Sets</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search & Filters Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
          >
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problem sets..."
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
            </div>

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
                    {getTopicName(selectedTopic)}
                    <button onClick={() => setSelectedTopic("all")} className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </motion.div>

          {/* Problem Sets Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
                    />
                  );
                })}

                {/* Empty State */}
                {filteredProblemSets.length === 0 && (
                  <div className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No problem sets found matching your filters.
                    </p>
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Clear filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>

      <MobileFAB />
    </div>
  );
};

export default CPProblemSetsView;
