import React from "react";
import { Search, Filter, X } from "lucide-react";
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
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Difficulty Filter */}
        <Select value={difficultyFilter} onValueChange={onDifficultyChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters & Results */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Showing {matchCount} of {totalCount} topics
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => onSearchChange("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {difficultyFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {difficultyFilter}
                <button onClick={() => onDifficultyChange("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {statusFilter.replace("-", " ")}
                <button onClick={() => onStatusChange("all")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoadmapToolbar;
