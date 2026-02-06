import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Shield,
  TrendingUp,
  Heart,
  SortAsc,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type StyleFilter = "all" | "modern" | "traditional" | "creative" | "minimal" | "two-column";
export type SortOption = "downloads" | "name" | "date";
export type QuickFilter = "ats" | "popular" | "favorites" | null;

interface ResumeFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  styleFilter: StyleFilter;
  onStyleChange: (style: StyleFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  filteredCount: number;
  totalCount: number;
  showFavoritesFilter?: boolean;
  favoritesCount?: number;
}

const styleOptions: { value: StyleFilter; label: string }[] = [
  { value: "all", label: "All Styles" },
  { value: "modern", label: "Modern" },
  { value: "traditional", label: "Traditional" },
  { value: "creative", label: "Creative" },
  { value: "minimal", label: "Minimal" },
  { value: "two-column", label: "Two-Column" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "downloads", label: "Most Popular" },
  { value: "name", label: "Name A-Z" },
  { value: "date", label: "Recently Added" },
];

const ResumeFilterBar: React.FC<ResumeFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  styleFilter,
  onStyleChange,
  sortBy,
  onSortChange,
  quickFilter,
  onQuickFilterChange,
  filteredCount,
  totalCount,
  showFavoritesFilter = false,
  favoritesCount = 0,
}) => {
  const hasActiveFilters =
    searchQuery || styleFilter !== "all" || quickFilter !== null;

  const clearAllFilters = () => {
    onSearchChange("");
    onStyleChange("all");
    onQuickFilterChange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="sticky top-0 z-30 -mx-6 px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50"
    >
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 bg-background/60 border-border/50"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[140px]">
                <SortAsc className="h-4 w-4" />
                {sortOptions.find((s) => s.value === sortBy)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(sortBy === option.value && "bg-accent")}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStyleChange(option.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                styleFilter === option.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">Quick filters:</span>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onQuickFilterChange(quickFilter === "ats" ? null : "ats")
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              quickFilter === "ats"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            ATS Friendly
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onQuickFilterChange(quickFilter === "popular" ? null : "popular")
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              quickFilter === "popular"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Most Popular
          </motion.button>

          {/* Favorites Filter - Only show when user is logged in */}
          {showFavoritesFilter && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onQuickFilterChange(quickFilter === "favorites" ? null : "favorites")
              }
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                quickFilter === "favorites"
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              <Heart className="h-3.5 w-3.5" />
              Favorites
              {favoritesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500/20">
                  {favoritesCount}
                </span>
              )}
            </motion.button>
          )}

          {/* Filter Results Count */}
          <div className="flex-1" />
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary" className="font-normal">
                  {filteredCount} of {totalCount} templates
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ResumeFilterBar;
