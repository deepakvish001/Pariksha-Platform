import { motion } from "framer-motion";
import { Search, Filter, Star, Code, Database, Cpu, Brain, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SheetsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
}

const tabs = [
  { id: "all", label: "All Sheets", icon: LayoutGrid },
  { id: "starred", label: "Starred", icon: Star },
  { id: "dsa", label: "DSA", icon: Code },
  { id: "sql", label: "SQL", icon: Database },
  { id: "system design", label: "System Design", icon: Cpu },
  { id: "ml", label: "ML", icon: Brain },
];

const SheetsFilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  activeTab, 
  onTabChange 
}: SheetsFilterBarProps) => {
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
        <Button variant="outline" className="gap-2 h-11 px-4 shrink-0">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
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
            </Button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SheetsFilterBar;
