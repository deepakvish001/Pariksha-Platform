import React from "react";
import { motion } from "framer-motion";
import {
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
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SectionInfo {
  id: string;
  title: string;
  completed: number;
  total: number;
}

interface RoadmapControlsBarProps {
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
}

const ControlButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tooltip?: string;
  variant?: 'default' | 'primary' | 'amber' | 'violet' | 'success';
  className?: string;
}> = ({ active, onClick, icon, label, tooltip, variant = 'default', className }) => {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
        !active && "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        active && variant === 'default' && "bg-primary/15 text-primary border border-primary/30",
        active && variant === 'primary' && "bg-primary/15 text-primary border border-primary/30",
        active && variant === 'amber' && "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
        active && variant === 'violet' && "bg-violet-100 text-violet-700 border border-violet-300 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
        active && variant === 'success' && "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
        className
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

const ControlGroup: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
  <div className="flex items-center gap-1">
    {label && (
      <span className="hidden lg:inline text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mr-1">
        {label}
      </span>
    )}
    {children}
  </div>
);

const Divider: React.FC = () => (
  <div className="hidden sm:block w-px h-6 bg-border/50 mx-1" />
);

const RoadmapControlsBar: React.FC<RoadmapControlsBarProps> = ({
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
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* View Mode Toggle - Segmented Control Style */}
      <ControlGroup label="View">
        <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/40">
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
            <span className="hidden sm:inline">List</span>
          </button>
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
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      </ControlGroup>

      <Divider />

      {/* Display Options */}
      <ControlGroup label="Display">
        <ControlButton
          active={isCompactMode}
          onClick={() => onCompactModeChange(!isCompactMode)}
          icon={<Minimize2 className="h-3.5 w-3.5" />}
          label={isCompactMode ? "Normal" : "Compact"}
          tooltip="Toggle compact mode (C)"
        />
        <ControlButton
          active={isFocusMode}
          onClick={() => onFocusModeChange(!isFocusMode)}
          icon={<Focus className="h-3.5 w-3.5" />}
          label={isFocusMode ? "Exit" : "Focus"}
          variant="violet"
          tooltip="Focus on current section (F)"
        />
      </ControlGroup>

      {/* Focus Mode Navigation - Only visible in focus mode */}
      {isFocusMode && onNavigateFocus && (
        <>
          <Divider />
          <ControlGroup>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <button
                onClick={() => onNavigateFocus('up')}
                disabled={focusedSectionIndex === 0}
                className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </button>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 min-w-[3rem] text-center">
                {focusedSectionIndex + 1} / {totalSections}
              </span>
              <button
                onClick={() => onNavigateFocus('down')}
                disabled={focusedSectionIndex >= totalSections - 1}
                className="p-1 rounded hover:bg-violet-100 dark:hover:bg-violet-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </button>
            </div>
          </ControlGroup>
        </>
      )}

      <Divider />

      {/* Customization */}
      <ControlGroup label="Order">
        <ControlButton
          active={isDragEnabled}
          onClick={() => onDragEnabledChange(!isDragEnabled)}
          icon={<GripVertical className="h-3.5 w-3.5" />}
          label={isDragEnabled ? "Done" : "Reorder"}
          variant="amber"
          tooltip="Drag to reorder topics"
        />
        
        {isDragEnabled && canUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-primary"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
        )}

        {isDragEnabled && hasCustomOrder && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetOrder}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className={cn("h-3.5 w-3.5", isSaving && "animate-spin")} />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </ControlGroup>

      <Divider />

      {/* Navigation */}
      <ControlGroup>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              "bg-muted/50 text-muted-foreground border border-border/40 hover:text-foreground hover:bg-muted"
            )}>
              <Navigation className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Jump</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
              <Navigation className="h-3 w-3" />
              Quick Navigation
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sections.map((section, index) => {
              const percentage = Math.round((section.completed / section.total) * 100) || 0;
              const isComplete = percentage === 100;
              
              return (
                <DropdownMenuItem 
                  key={section.id}
                  onClick={() => onJumpToSection(section.id)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className={cn(
                    "flex-shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    isComplete 
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isComplete && "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {section.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {section.completed}/{section.total} • {percentage}%
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-10">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          isComplete ? "bg-emerald-500" : "bg-primary"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Expand/Collapse Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}>
              <ChevronsUpDown className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Sections</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExpandAll}>
              <ChevronDown className="h-3.5 w-3.5 mr-2" />
              Expand All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCollapseAll}>
              <ChevronUp className="h-3.5 w-3.5 mr-2" />
              Collapse All
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ControlGroup>
    </div>
  );
};

export default RoadmapControlsBar;
