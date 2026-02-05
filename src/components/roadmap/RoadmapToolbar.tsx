import React from "react";
import { Search, Filter, X, SlidersHorizontal, ListFilter } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface RoadmapToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  matchCount: number;
  totalCount: number;
}

const RoadmapToolbar: React.FC<RoadmapToolbarProps> = ({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
  matchCount,
  totalCount,
}) => {
  const hasFilters = searchQuery || difficultyFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onDifficultyChange("all");
    onStatusChange("all");
  };

  return (
    <div className="space-y-3">
      {/* Main toolbar row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input - takes more space */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics, skills, technologies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-10 rounded-xl border-2 border-border/60 focus:border-primary/50 transition-colors"
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

        {/* Filter group with visual separator */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground px-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-xs font-medium">Filters</span>
          </div>
          
          <div className="flex gap-2 flex-1 lg:flex-none">
            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={onDifficultyChange}>
              <SelectTrigger className={cn(
                "w-full lg:w-32 h-10 rounded-xl border-2 transition-colors",
                difficultyFilter !== "all" 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60"
              )}>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
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
                "w-full lg:w-36 h-10 rounded-xl border-2 transition-colors",
                statusFilter !== "all" 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/60"
              )}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
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
        <div className="flex items-center justify-between gap-4 px-3 py-2 rounded-xl bg-muted/40 border border-border/50">
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
