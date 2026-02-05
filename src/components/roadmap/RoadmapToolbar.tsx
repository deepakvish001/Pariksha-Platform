import React from "react";
import { Search, X, SlidersHorizontal, ListFilter, Sparkles, ExternalLink, StickyNote, Zap, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type QuickFilter = "none" | "has-resources" | "has-notes" | "recommended" | "near-complete";

interface RoadmapToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  quickFilter?: QuickFilter;
  onQuickFilterChange?: (filter: QuickFilter) => void;
  matchCount: number;
  totalCount: number;
}

const quickFilterOptions: { value: QuickFilter; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "none", label: "No Quick Filter", icon: null, description: "Show all topics" },
  { value: "near-complete", label: "Near Completion", icon: <TrendingUp className="h-3.5 w-3.5" />, description: "Topics in sections at 75%+ progress" },
  { value: "has-resources", label: "Has Resources", icon: <ExternalLink className="h-3.5 w-3.5" />, description: "Topics with learning resources" },
  { value: "has-notes", label: "Has Notes", icon: <StickyNote className="h-3.5 w-3.5" />, description: "Topics with your personal notes" },
  { value: "recommended", label: "Recommended", icon: <Sparkles className="h-3.5 w-3.5" />, description: "AI-recommended next topics" },
];

const RoadmapToolbar: React.FC<RoadmapToolbarProps> = ({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
  quickFilter = "none",
  onQuickFilterChange,
  matchCount,
  totalCount,
}) => {
  const hasFilters = searchQuery || difficultyFilter !== "all" || statusFilter !== "all" || quickFilter !== "none";

  const clearFilters = () => {
    onSearchChange("");
    onDifficultyChange("all");
    onStatusChange("all");
    onQuickFilterChange?.("none");
  };

  const activeQuickFilter = quickFilterOptions.find(f => f.value === quickFilter);

  return (
    <div className="space-y-3 flex-1">
      {/* Main toolbar row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics, skills, technologies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-9 rounded-lg border border-border/60 focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filter group */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground px-2">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Filters</span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {/* Quick Filter Dropdown */}
            {onQuickFilterChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all",
                    quickFilter !== "none" 
                      ? "border-violet-400/60 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700" 
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}>
                    <Zap className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {quickFilter !== "none" ? activeQuickFilter?.label : "Quick Filter"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
                  <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Quick Filters
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickFilterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onQuickFilterChange(option.value)}
                      className={cn(
                        "flex items-start gap-3 cursor-pointer py-2",
                        quickFilter === option.value && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 h-6 w-6 rounded-md flex items-center justify-center mt-0.5",
                        option.value === "near-complete" && "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",
                        option.value === "has-resources" && "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
                        option.value === "has-notes" && "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
                        option.value === "recommended" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
                        option.value === "none" && "bg-muted text-muted-foreground"
                      )}>
                        {option.icon || <X className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          quickFilter === option.value && "text-primary"
                        )}>
                          {option.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          {option.description}
                        </p>
                      </div>
                      {quickFilter === option.value && (
                        <div className="flex-shrink-0 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-[10px]">✓</span>
                        </div>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={onDifficultyChange}>
              <SelectTrigger className={cn(
                "w-full lg:w-28 h-9 rounded-lg border text-xs transition-colors",
                difficultyFilter !== "all" 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60"
              )}>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Easy">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Easy
                  </span>
                </SelectItem>
                <SelectItem value="Medium">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Medium
                  </span>
                </SelectItem>
                <SelectItem value="Hard">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Hard
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className={cn(
                "w-full lg:w-32 h-9 rounded-lg border text-xs transition-colors",
                statusFilter !== "all" 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60"
              )}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Completed
                  </span>
                </SelectItem>
                <SelectItem value="in-progress">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    In Progress
                  </span>
                </SelectItem>
                <SelectItem value="not-started">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                    Not Started
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasFilters && (
        <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <ListFilter className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium">
              <span className="text-primary">{matchCount}</span>
              <span className="text-muted-foreground"> of {totalCount} topics</span>
            </span>
            
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {searchQuery && (
                <Badge 
                  variant="secondary" 
                  className="gap-1 rounded-lg bg-background border border-border/60 hover:bg-muted transition-colors"
                >
                  <span className="max-w-[120px] truncate">"{searchQuery}"</span>
                  <button 
                    onClick={() => onSearchChange("")}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {quickFilter !== "none" && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 rounded-lg bg-violet-50 border border-violet-300/60 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                >
                  {activeQuickFilter?.icon}
                  {activeQuickFilter?.label}
                  <button 
                    onClick={() => onQuickFilterChange?.("none")}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {difficultyFilter !== "all" && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "gap-1.5 rounded-lg bg-background border transition-colors",
                    difficultyFilter === "Easy" && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                    difficultyFilter === "Medium" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                    difficultyFilter === "Hard" && "border-rose-500/40 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {difficultyFilter}
                  <button 
                    onClick={() => onDifficultyChange("all")}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "gap-1.5 rounded-lg bg-background border transition-colors capitalize",
                    statusFilter === "completed" && "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
                    statusFilter === "in-progress" && "border-amber-500/40 text-amber-600 dark:text-amber-400",
                    statusFilter === "not-started" && "border-border/60"
                  )}
                >
                  {statusFilter.replace("-", " ")}
                  <button 
                    onClick={() => onStatusChange("all")}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoadmapToolbar;
