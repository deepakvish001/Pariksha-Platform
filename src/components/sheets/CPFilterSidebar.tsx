import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, Layers, Sparkles } from "lucide-react";
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
import { getTrackIcon, getTopicIcon, getTrackColors } from "@/data/cpIconMappings";
import { useState } from "react";

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
  const [trackOpen, setTrackOpen] = useState(true);
  const [topicOpen, setTopicOpen] = useState(true);

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Filter className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </motion.div>
          )}
          {isMobile && onClose && (
            <Button variant="ghost" size="icon" aria-label="Close filters" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Pills */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5"
          >
            {selectedTrack !== "all" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => onTrackChange("all")}
                >
                  {cpTracks.find(t => t.id === selectedTrack)?.name}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              </motion.div>
            )}
            {selectedTopic !== "all" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="secondary"
                  className="text-[10px] gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                  onClick={() => onTopicChange("all")}
                >
                  {cpTopics.find(t => t.id === selectedTopic)?.name}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Track Filter */}
      <Collapsible open={trackOpen} onOpenChange={setTrackOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors group">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Track</span>
          </div>
          <motion.div animate={{ rotate: trackOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2 space-y-1"
          >
            <Button
              variant={selectedTrack === "all" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start h-8 text-xs",
                selectedTrack === "all" && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => onTrackChange("all")}
            >
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              All Tracks
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
                {problemSetCounts.total || 270}
              </Badge>
            </Button>
            {cpTracks.map((track) => {
              const TrackIcon = getTrackIcon(track.id);
              const colors = getTrackColors(track.id);
              const isSelected = selectedTrack === track.id;
              
              return (
                <motion.div
                  key={track.id}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start h-8 text-xs group",
                      isSelected && cn(colors.bg, colors.text, "hover:opacity-90")
                    )}
                    onClick={() => onTrackChange(track.id)}
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full mr-2 shrink-0 transition-transform group-hover:scale-125",
                      colors.accent
                    )} />
                    <span className="truncate flex-1 text-left">{track.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "ml-auto text-[10px] px-1.5 py-0 shrink-0",
                        isSelected && colors.border
                      )}
                    >
                      {problemSetCounts[track.id] || 0}
                    </Badge>
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* Topic Filter */}
      <Collapsible open={topicOpen} onOpenChange={setTopicOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors group">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Topic</span>
          </div>
          <motion.div animate={{ rotate: topicOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2 space-y-1"
          >
            <Button
              variant={selectedTopic === "all" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start h-8 text-xs",
                selectedTopic === "all" && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => onTopicChange("all")}
            >
              All Topics
            </Button>
            {cpTopics.map((topic) => {
              const TopicIcon = getTopicIcon(topic.id);
              const isSelected = selectedTopic === topic.id;
              
              return (
                <motion.div
                  key={topic.id}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <Button
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start h-8 text-xs",
                      isSelected && "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => onTopicChange(topic.id)}
                  >
                    <TopicIcon className={cn(
                      "h-3.5 w-3.5 mr-2 shrink-0",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="truncate">{topic.name}</span>
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
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
    <div className="h-full flex flex-col p-4">
      <div className="glass-card rounded-xl p-4 border border-border/50 bg-gradient-to-b from-card to-card/50 h-full flex flex-col overflow-hidden">
        {/* Gradient accent at top */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <ScrollArea className="flex-1 -mr-2 pr-2">
          {content}
        </ScrollArea>
      </div>
    </div>
  );
};

export default CPFilterSidebar;
