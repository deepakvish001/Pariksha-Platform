import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { cpTracks, cpTopics, getTrackCounts, getTopicCounts } from "@/data/competitiveProgrammingData";

interface CPFilterSidebarProps {
  selectedTrack: string;
  selectedTopic: string;
  onTrackChange: (trackId: string) => void;
  onTopicChange: (topicId: string) => void;
  className?: string;
}

const FilterContent = ({
  selectedTrack,
  selectedTopic,
  onTrackChange,
  onTopicChange,
}: Omit<CPFilterSidebarProps, "className">) => {
  const [isTracksOpen, setIsTracksOpen] = useState(true);
  const [isTopicsOpen, setIsTopicsOpen] = useState(true);
  
  const trackCounts = getTrackCounts();
  const topicCounts = getTopicCounts();

  const clearFilters = () => {
    onTrackChange("all");
    onTopicChange("all");
  };

  const hasActiveFilters = selectedTrack !== "all" || selectedTopic !== "all";

  return (
    <div className="space-y-4">
      {/* All Sets */}
      <div>
        <Button
          variant={selectedTrack === "all" && selectedTopic === "all" ? "default" : "ghost"}
          className="w-full justify-between h-10"
          onClick={clearFilters}
        >
          <span className="font-medium">All Sets</span>
          <Badge variant="secondary" className="ml-2">
            {trackCounts.all}
          </Badge>
        </Button>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={clearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}

      {/* By Track Section */}
      <Collapsible open={isTracksOpen} onOpenChange={setIsTracksOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-9 px-2"
          >
            <span className="text-sm font-semibold text-muted-foreground">By Track</span>
            {isTracksOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {cpTracks.map((track) => (
            <Button
              key={track.id}
              variant={selectedTrack === track.id ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-between h-8 px-3 text-xs font-normal",
                selectedTrack === track.id && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onTrackChange(track.id)}
            >
              <span className="truncate">{track.name}</span>
              <Badge variant="outline" className="ml-1 text-[10px] h-5 px-1.5">
                {trackCounts[track.id] || 0}
              </Badge>
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* By Topic Section */}
      <Collapsible open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between h-9 px-2"
          >
            <span className="text-sm font-semibold text-muted-foreground">By Topic</span>
            {isTopicsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {cpTopics.map((topic) => (
            <Button
              key={topic.id}
              variant={selectedTopic === topic.id ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-between h-8 px-3 text-xs font-normal",
                selectedTopic === topic.id && "bg-primary/10 text-primary font-medium"
              )}
              onClick={() => onTopicChange(topic.id)}
            >
              <span className="truncate">{topic.name}</span>
              <Badge variant="outline" className="ml-1 text-[10px] h-5 px-1.5">
                {topicCounts[topic.id] || 0}
              </Badge>
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export const CPFilterSidebar = ({
  selectedTrack,
  selectedTopic,
  onTrackChange,
  onTopicChange,
  className,
}: CPFilterSidebarProps) => {
  const hasActiveFilters = selectedTrack !== "all" || selectedTopic !== "all";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:block w-64 shrink-0 border-r border-border/40 bg-muted/20",
          className
        )}
      >
        <div className="sticky top-20 p-4">
          <ScrollArea className="h-[calc(100vh-120px)]">
            <FilterContent
              selectedTrack={selectedTrack}
              selectedTopic={selectedTopic}
              onTrackChange={onTrackChange}
              onTopicChange={onTopicChange}
            />
          </ScrollArea>
        </div>
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {(selectedTrack !== "all" ? 1 : 0) + (selectedTopic !== "all" ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filter Problem Sets</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            <FilterContent
              selectedTrack={selectedTrack}
              selectedTopic={selectedTopic}
              onTrackChange={onTrackChange}
              onTopicChange={onTopicChange}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CPFilterSidebar;
