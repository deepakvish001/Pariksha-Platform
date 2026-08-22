import { motion } from "framer-motion";
import { Search, X, Flame, Scissors } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryConfigs, OutreachCategory, OutreachPlatform, SuccessRate } from "@/data/coldOutreachData";

interface OutreachFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  platform: OutreachPlatform | 'all';
  onPlatformChange: (platform: OutreachPlatform | 'all') => void;
  category: OutreachCategory | 'all';
  onCategoryChange: (category: OutreachCategory | 'all') => void;
  successRate: SuccessRate | 'all';
  onSuccessRateChange: (rate: SuccessRate | 'all') => void;
  showPopular: boolean;
  onShowPopularChange: (show: boolean) => void;
  showShort: boolean;
  onShowShortChange: (show: boolean) => void;
}

const OutreachFilterBar = ({
  searchQuery,
  onSearchChange,
  platform,
  onPlatformChange,
  category,
  onCategoryChange,
  successRate,
  onSuccessRateChange,
  showPopular,
  onShowPopularChange,
  showShort,
  onShowShortChange,
}: OutreachFilterBarProps) => {
  const hasActiveFilters = 
    platform !== 'all' || 
    category !== 'all' || 
    successRate !== 'all' || 
    showPopular || 
    showShort ||
    searchQuery.length > 0;

  const clearFilters = () => {
    onSearchChange('');
    onPlatformChange('all');
    onCategoryChange('all');
    onSuccessRateChange('all');
    onShowPopularChange(false);
    onShowShortChange(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4 p-4 md:p-5 rounded-2xl bg-card/50 dark:bg-card/30 backdrop-blur-sm border border-border/50 dark:border-primary/15"
    >
      {/* Search and Platform Tabs Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search templates, tags, or use cases..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-background/80 dark:bg-background/50 border-border/60 dark:border-primary/20 focus:border-primary/50 dark:focus:border-primary/60 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 transition-all"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        
        <Tabs value={platform} onValueChange={(v) => onPlatformChange(v as OutreachPlatform | 'all')}>
          <TabsList className="h-11 bg-background/80 dark:bg-background/40 border border-border/50 dark:border-primary/20 rounded-xl p-1">
            <TabsTrigger 
              value="all" 
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg dark:data-[state=active]:shadow-primary/30"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="linkedin" 
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg dark:data-[state=active]:shadow-primary/30"
            >
              LinkedIn
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg dark:data-[state=active]:shadow-primary/30"
            >
              Email
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={(v) => onCategoryChange(v as OutreachCategory | 'all')}>
          <SelectTrigger className="w-[180px] h-10 rounded-xl bg-background/80 dark:bg-background/50 border-border/60 dark:border-primary/20 hover:border-primary/40 dark:hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl dark:border-primary/20">
            <SelectItem value="all">All Categories</SelectItem>
            {categoryConfigs.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={successRate} onValueChange={(v) => onSuccessRateChange(v as SuccessRate | 'all')}>
          <SelectTrigger className="w-[160px] h-10 rounded-xl bg-background/80 dark:bg-background/50 border-border/60 dark:border-primary/20 hover:border-primary/40 dark:hover:border-primary/50 transition-colors">
            <SelectValue placeholder="Success Rate" />
          </SelectTrigger>
          <SelectContent className="rounded-xl dark:border-primary/20">
            <SelectItem value="all">All Rates</SelectItem>
            <SelectItem value="high">High Success</SelectItem>
            <SelectItem value="medium">Medium Success</SelectItem>
            <SelectItem value="low">Low Success</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Badge
            variant={showPopular ? "default" : "outline"}
            className={`cursor-pointer h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              showPopular 
                ? "bg-gradient-to-r from-orange-500 to-amber-500 border-transparent text-white hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30 dark:shadow-orange-500/40" 
                : "hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 dark:border-primary/20"
            }`}
            onClick={() => onShowPopularChange(!showPopular)}
          >
            <Flame className="h-3.5 w-3.5 mr-1.5" />
            Popular
          </Badge>
          <Badge
            variant={showShort ? "default" : "outline"}
            className={`cursor-pointer h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              showShort 
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 border-transparent text-white hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/40" 
                : "hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 dark:border-primary/20"
            }`}
            onClick={() => onShowShortChange(!showShort)}
          >
            <Scissors className="h-3.5 w-3.5 mr-1.5" />
            Short
          </Badge>
        </div>

        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-xl h-10 px-4"
            >
              <X className="h-4 w-4 mr-1.5" />
              Clear all
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default OutreachFilterBar;
