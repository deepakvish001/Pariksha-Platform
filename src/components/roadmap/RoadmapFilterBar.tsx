import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowUpDown, Filter, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  label: string;
  color: string;
}

interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface RoadmapFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  categories: Category[];
  sortOptions: SortOption[];
  totalRoadmaps: number;
  filteredCount: number;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const quickFilters = [
  { id: 'popular', label: 'Popular', icon: TrendingUp },
  { id: 'quick', label: 'Quick Start', icon: Clock },
  { id: 'recommended', label: 'For You', icon: Sparkles },
];

const RoadmapFilterBar: React.FC<RoadmapFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  categories,
  sortOptions,
  totalRoadmaps,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="max-w-6xl mx-auto mb-8 space-y-4"
    >
      {/* Glassmorphism Container */}
      <div className="glass-card rounded-2xl p-4 sm:p-6 border border-border/50">
        {/* Search and Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roadmaps..."
              className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-52 h-11 bg-background/50 border-border/50">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.03 }}
            >
              <Button
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "transition-all duration-200 h-9",
                  selectedCategory === category.id 
                    ? "shadow-md shadow-primary/20 scale-105" 
                    : "hover:scale-102 hover:border-primary/30 bg-background/50"
                )}
              >
                {category.id !== "all" && (
                  <span className={cn("h-2 w-2 rounded-full mr-2", category.color)} />
                )}
                {category.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Filters Indicator */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground glass-card px-4 py-2 rounded-full">
              <Filter className="h-3.5 w-3.5" />
              <span>
                Showing <span className="font-medium text-foreground">{filteredCount}</span> of {totalRoadmaps} roadmaps
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="h-8 px-3 text-xs hover:text-primary"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RoadmapFilterBar;
