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
  Trophy
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
import { useIsMobile } from "@/hooks/use-mobile";

const CPProblemSetsView = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  const getTrackInfo = (trackId: string) => {
    return cpTracks.find(t => t.id === trackId);
  };

  const getTopicName = (topicId: string) => {
    return cpTopics.find(t => t.id === topicId)?.name || topicId;
  };

  const totalProblems = filteredProblemSets.reduce((acc, ps) => acc + ps.problemCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/dashboard/sheets")}
            className="gap-1"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="hidden sm:inline">Sheets</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">Competitive Programming</h1>
          </div>
          <StreakCounter variant="mini" />
          <Badge variant="outline" className="hidden sm:flex text-xs whitespace-nowrap">
            {filteredProblemSets.length} Problem Sets
          </Badge>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-20 p-4">
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
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
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Problem Sets</p>
                      <p className="text-sm text-muted-foreground">
                        {filteredProblemSets.length} sets · {totalProblems.toLocaleString()} problems
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{cpTracks.length}</p>
                      <p className="text-xs text-muted-foreground">Tracks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{cpTopics.length}</p>
                      <p className="text-xs text-muted-foreground">Topics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

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
                placeholder="Search problem sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden h-10 w-10">
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
          {(selectedTrack !== "all" || selectedTopic !== "all") && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">Filters:</span>
              {selectedTrack !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {getTrackInfo(selectedTrack)?.name}
                  <button onClick={() => setSelectedTrack("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedTopic !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {getTopicName(selectedTopic)}
                  <button onClick={() => setSelectedTopic("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                Clear all
              </Button>
            </motion.div>
          )}

          {/* Problem Sets by Track */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {cpTracks.map((track) => {
              const trackSets = groupedByTrack[track.id] || [];
              if (trackSets.length === 0) return null;
              
              const isExpanded = expandedTracks.includes(track.id);
              
              return (
                <Card key={track.id} className="overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleTrackExpansion(track.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge className={cn("text-xs", track.color)}>
                            {trackSets.length} sets
                          </Badge>
                          <span className="font-medium text-sm sm:text-base">{track.name}</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t border-border/50">
                        {trackSets.map((problemSet, idx) => (
                          <motion.div
                            key={problemSet.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              "flex items-center justify-between p-3 sm:p-4 hover:bg-muted/30 transition-colors",
                              idx !== trackSets.length - 1 && "border-b border-border/30"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                                {problemSet.id}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{problemSet.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {getTopicName(problemSet.topicId)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {problemSet.problemCount} problems
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {problemSet.externalUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-1.5 text-xs shrink-0"
                              >
                                <a 
                                  href={problemSet.externalUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Practice</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </motion.div>

          {/* Empty State */}
          {filteredProblemSets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No problem sets found matching your filters.
              </p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            </motion.div>
          )}
        </main>
      </div>

      <MobileFAB />
    </div>
  );
};

export default CPProblemSetsView;
