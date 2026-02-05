import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  List,
  LayoutGrid,
  Minimize2,
  Focus,
  GripVertical,
  Undo2,
  RotateCcw,
  Navigation,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Check,
  Filter,
  Zap,
  TrendingUp,
  ExternalLink,
  StickyNote,
  Sparkles,
  Settings2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type QuickFilter = "none" | "has-resources" | "has-notes" | "recommended" | "near-complete";

interface SectionInfo {
  id: string;
  title: string;
  completed: number;
  total: number;
}

interface RoadmapUnifiedHeaderProps {
  // Search & Filters
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficultyFilter: string;
  onDifficultyChange: (difficulty: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  matchCount: number;
  totalCount: number;
  
  // Layout controls
  layoutMode: 'vertical' | 'horizontal';
  onLayoutModeChange: (mode: 'vertical' | 'horizontal') => void;
  isCompactMode: boolean;
  onCompactModeChange: (value: boolean) => void;
  isFocusMode: boolean;
  onFocusModeChange: (value: boolean) => void;
  
  // Drag controls
  isDragEnabled: boolean;
  onDragEnabledChange: (value: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  hasCustomOrder: boolean;
  onResetOrder: () => void;
  isSaving: boolean;
  
  // Navigation
  sections: SectionInfo[];
  onJumpToSection: (sectionId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  
  // Focus mode navigation
  focusedSectionIndex?: number;
  totalSections?: number;
  onNavigateFocus?: (direction: 'up' | 'down') => void;
  
  // Mobile
  isMobile?: boolean;
}

const quickFilterOptions: { value: QuickFilter; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "none", label: "All Topics", icon: null, description: "Show all topics" },
  { value: "near-complete", label: "Near Completion", icon: <TrendingUp className="h-3.5 w-3.5" />, description: "Sections at 75%+ progress" },
  { value: "has-resources", label: "Has Resources", icon: <ExternalLink className="h-3.5 w-3.5" />, description: "Topics with learning resources" },
  { value: "has-notes", label: "Has Notes", icon: <StickyNote className="h-3.5 w-3.5" />, description: "Topics with your notes" },
  { value: "recommended", label: "Recommended", icon: <Sparkles className="h-3.5 w-3.5" />, description: "AI-recommended topics" },
];

const RoadmapUnifiedHeader: React.FC<RoadmapUnifiedHeaderProps> = ({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  statusFilter,
  onStatusChange,
  quickFilter,
  onQuickFilterChange,
  matchCount,
  totalCount,
  layoutMode,
  onLayoutModeChange,
  isCompactMode,
  onCompactModeChange,
  isFocusMode,
  onFocusModeChange,
  isDragEnabled,
  onDragEnabledChange,
  canUndo,
  onUndo,
  hasCustomOrder,
  onResetOrder,
  isSaving,
  sections,
  onJumpToSection,
  onExpandAll,
  onCollapseAll,
  focusedSectionIndex = 0,
  totalSections = 0,
  onNavigateFocus,
  isMobile = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  
  const hasActiveFilters = searchQuery || difficultyFilter !== "all" || statusFilter !== "all" || quickFilter !== "none";
  const activeFilterCount = [
    searchQuery ? 1 : 0,
    difficultyFilter !== "all" ? 1 : 0,
    statusFilter !== "all" ? 1 : 0,
    quickFilter !== "none" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    onSearchChange("");
    onDifficultyChange("all");
    onStatusChange("all");
    onQuickFilterChange("none");
  };

  const activeQuickFilter = quickFilterOptions.find(f => f.value === quickFilter);

  return (
    <div className="space-y-0">
      {/* Main Header Row - Always visible */}
      <div className="flex items-center gap-2 p-3 pb-2">
        {/* Search - Primary */}
        <div className="relative flex-1 min-w-0 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={isMobile ? "Search..." : "Search topics..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm bg-muted/40 border-border/50 focus:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Popover open={showFilters} onOpenChange={setShowFilters}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all",
                hasActiveFilters
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Filters</h4>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {matchCount} of {totalCount} topics
              </p>
            </div>
            
            <div className="p-3 space-y-4">
              {/* Quick Filters */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Filter</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onQuickFilterChange(option.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-lg text-left transition-all",
                        quickFilter === option.value
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center",
                        option.value === "near-complete" && "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400",
                        option.value === "has-resources" && "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
                        option.value === "has-notes" && "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
                        option.value === "recommended" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
                        option.value === "none" && "bg-muted text-muted-foreground"
                      )}>
                        {option.icon || <Layers className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{option.description}</p>
                      </div>
                      {quickFilter === option.value && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                  <Select value={difficultyFilter} onValueChange={onDifficultyChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All" />
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
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="not-started">Not Started</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border/50" />

        {/* View Toggle - Segmented */}
        <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/40">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onLayoutModeChange('vertical')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  layoutMode === 'vertical' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">List</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">List view (L)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onLayoutModeChange('horizontal')}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  layoutMode === 'horizontal' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Cards</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Card grid view (G)</TooltipContent>
          </Tooltip>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onCompactModeChange(!isCompactMode)}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg transition-all",
                  isCompactMode
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isCompactMode ? "Normal view (C)" : "Compact view (C)"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onFocusModeChange(!isFocusMode)}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-lg transition-all",
                  isFocusMode
                    ? "bg-violet-100 text-violet-600 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Focus className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isFocusMode ? "Exit focus mode (F)" : "Focus mode (F)"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-6 bg-border/50" />

        {/* Reorder Toggle */}
        <div className="hidden md:flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDragEnabledChange(!isDragEnabled)}
                className={cn(
                  "flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-all",
                  isDragEnabled
                    ? "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <GripVertical className="h-4 w-4" />
                <span className="hidden lg:inline">{isDragEnabled ? "Done" : "Reorder"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Drag to reorder topics
            </TooltipContent>
          </Tooltip>

          <AnimatePresence>
            {isDragEnabled && (canUndo || hasCustomOrder) && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1 overflow-hidden"
              >
                {canUndo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onUndo}
                    disabled={isSaving}
                    className="h-8 px-2"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                {hasCustomOrder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetOrder}
                    disabled={isSaving}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", isSaving && "animate-spin")} />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-6 bg-border/50" />

        {/* Navigation Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-medium transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
            )}>
              <Navigation className="h-4 w-4" />
              <span className="hidden lg:inline">Jump</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              Quick Navigation
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExpandAll} className="text-xs">
              <ChevronDown className="h-3.5 w-3.5 mr-2" />
              Expand All Sections
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCollapseAll} className="text-xs">
              <ChevronUp className="h-3.5 w-3.5 mr-2" />
              Collapse All Sections
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {sections.map((section, index) => {
              const percentage = Math.round((section.completed / section.total) * 100) || 0;
              const isComplete = percentage === 100;
              
              return (
                <DropdownMenuItem 
                  key={section.id}
                  onClick={() => onJumpToSection(section.id)}
                  className="flex items-center gap-2.5 py-2"
                >
                  <div className={cn(
                    "flex-shrink-0 h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                    isComplete 
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium truncate",
                      isComplete && "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {section.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-8 h-1 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          isComplete ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {percentage}%
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Bar - Only shown when filters active */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 pb-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                <span className="font-semibold text-foreground">{matchCount}</span> of {totalCount}
              </span>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 h-6 text-xs font-normal">
                    "{searchQuery.length > 15 ? searchQuery.slice(0, 15) + '...' : searchQuery}"
                    <button onClick={() => onSearchChange("")} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {quickFilter !== "none" && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "gap-1 h-6 text-xs font-normal",
                      quickFilter === "near-complete" && "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
                      quickFilter === "has-resources" && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
                      quickFilter === "has-notes" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                      quickFilter === "recommended" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    )}
                  >
                    {activeQuickFilter?.icon}
                    {activeQuickFilter?.label}
                    <button onClick={() => onQuickFilterChange("none")} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {difficultyFilter !== "all" && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "gap-1 h-6 text-xs font-normal",
                      difficultyFilter === "Easy" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                      difficultyFilter === "Medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                      difficultyFilter === "Hard" && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                    {difficultyFilter}
                    <button onClick={() => onDifficultyChange("all")} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1 h-6 text-xs font-normal capitalize">
                    {statusFilter.replace("-", " ")}
                    <button onClick={() => onStatusChange("all")} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>

              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-destructive whitespace-nowrap ml-auto"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus Mode Navigation Bar */}
      <AnimatePresence>
        {isFocusMode && onNavigateFocus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 py-2 px-3 bg-violet-50/50 dark:bg-violet-900/10 border-t border-violet-200/50 dark:border-violet-800/50">
              <Focus className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Focus Mode
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-800/40">
                <button
                  onClick={() => onNavigateFocus('up')}
                  disabled={focusedSectionIndex === 0}
                  className="p-1 rounded hover:bg-violet-200 dark:hover:bg-violet-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </button>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 min-w-[3rem] text-center tabular-nums">
                  {focusedSectionIndex + 1} / {totalSections}
                </span>
                <button
                  onClick={() => onNavigateFocus('down')}
                  disabled={focusedSectionIndex >= totalSections - 1}
                  className="p-1 rounded hover:bg-violet-200 dark:hover:bg-violet-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                </button>
              </div>
              <button
                onClick={() => onFocusModeChange(false)}
                className="text-xs text-violet-500 hover:text-violet-700 dark:hover:text-violet-300"
              >
                Exit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoadmapUnifiedHeader;
