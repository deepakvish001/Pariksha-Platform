import { motion } from "framer-motion";
import { Search, Star, Code, Database, Cpu, LayoutGrid, ArrowUpDown, TrendingUp, Hash, Gauge, Swords, Network, HardDrive, ServerCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SortOption = "default" | "progress-desc" | "progress-asc" | "problems-desc" | "problems-asc" | "difficulty";

interface SheetsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  sheetCounts?: Record<string, number>;
}

const tabs = [
  { id: "all", label: "All Sheets", icon: LayoutGrid },
  { id: "starred", label: "Starred", icon: Star },
  { id: "dsa", label: "DSA", icon: Code },
  { id: "cp", label: "CP", icon: Swords },
  { id: "sql", label: "SQL", icon: Database },
  { id: "dbms", label: "DBMS", icon: ServerCog },
  { id: "cn", label: "CN", icon: Network },
  { id: "os", label: "OS", icon: HardDrive },
  { id: "system design", label: "System Design", icon: Cpu },
];

const sortOptions = [
  { id: "default" as SortOption, label: "Default", icon: LayoutGrid },
  { id: "progress-desc" as SortOption, label: "Most Progress", icon: TrendingUp },
  { id: "progress-asc" as SortOption, label: "Least Progress", icon: TrendingUp },
  { id: "problems-desc" as SortOption, label: "Most Problems", icon: Hash },
  { id: "problems-asc" as SortOption, label: "Fewest Problems", icon: Hash },
  { id: "difficulty" as SortOption, label: "By Difficulty", icon: Gauge },
];

const SheetsFilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  activeTab, 
  onTabChange,
  sortBy,
  onSortChange,
  sheetCounts,
}: SheetsFilterBarProps) => {
  const currentSort = sortOptions.find(s => s.id === sortBy) || sortOptions[0];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sheets by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 bg-card/50 border-border/50 focus:border-primary/50"
          />
        </div>
        
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-11 px-4 shrink-0" aria-label={`Sort: ${currentSort.label}`}>
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">{currentSort.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={cn(
                  "gap-2 cursor-pointer",
                  sortBy === option.id && "bg-primary/10 text-primary"
                )}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = sheetCounts?.[tab.id];
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "gap-1.5 h-9 transition-all duration-200",
                isActive 
                  ? "shadow-md shadow-primary/20" 
                  : "bg-card/50 hover:bg-card border-border/50"
              )}
            >
              <Icon className={cn(
                "h-3.5 w-3.5",
                isActive && tab.id === "starred" && "fill-current"
              )} />
              <span className="text-xs font-medium">{tab.label}</span>
              {count !== undefined && (
                <span className={cn(
                  "text-[10px] font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SheetsFilterBar;
