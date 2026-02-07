import { motion } from "framer-motion";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { cpTracks, cpTopics } from "@/data/competitiveProgrammingData";

interface CPFilterSidebarProps {
  selectedTrack: string;
  onTrackChange: (trackId: string) => void;
  selectedTopic: string;
  onTopicChange: (topicId: string) => void;
  problemSetCounts: Record<string, number>;
  onClearFilters: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const CPFilterSidebar = ({
  selectedTrack,
  onTrackChange,
  selectedTopic,
  onTopicChange,
  problemSetCounts,
  onClearFilters,
  isMobile = false,
  onClose,
}: CPFilterSidebarProps) => {
  const hasActiveFilters = selectedTrack !== "all" || selectedTopic !== "all";

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Track Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span>Track</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [data-state=open]&:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1">
          <Button
            variant={selectedTrack === "all" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => onTrackChange("all")}
          >
            All Tracks
            <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
              {problemSetCounts.total || 270}
            </Badge>
          </Button>
          {cpTracks.map((track) => (
            <Button
              key={track.id}
              variant={selectedTrack === track.id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start h-8 text-xs"
              onClick={() => onTrackChange(track.id)}
            >
              <span className={cn("h-2 w-2 rounded-full mr-2 shrink-0", track.color.split(" ")[0])} />
              <span className="truncate">{track.name}</span>
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">
                {problemSetCounts[track.id] || 0}
              </Badge>
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Topic Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span>Topic</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [data-state=open]&:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1">
          <Button
            variant={selectedTopic === "all" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start h-8 text-xs"
            onClick={() => onTopicChange("all")}
          >
            All Topics
          </Button>
          {cpTopics.map((topic) => (
            <Button
              key={topic.id}
              variant={selectedTopic === topic.id ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start h-8 text-xs"
              onClick={() => onTopicChange(topic.id)}
            >
              <span className="truncate">{topic.name}</span>
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border shadow-xl p-4"
      >
        <ScrollArea className="h-full">
          {content}
        </ScrollArea>
      </motion.div>
    );
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 glass-card rounded-xl p-4 border border-border/50">
        <ScrollArea className="h-[calc(100vh-10rem)]">
          {content}
        </ScrollArea>
      </div>
    </aside>
  );
};

export default CPFilterSidebar;
