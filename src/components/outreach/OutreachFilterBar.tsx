import { Search, Filter, X } from "lucide-react";
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
    <div className="space-y-4">
      {/* Search and Platform Tabs Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates, tags, or use cases..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={platform} onValueChange={(v) => onPlatformChange(v as OutreachPlatform | 'all')}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={(v) => onCategoryChange(v as OutreachCategory | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryConfigs.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={successRate} onValueChange={(v) => onSuccessRateChange(v as SuccessRate | 'all')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Success Rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rates</SelectItem>
            <SelectItem value="high">High Success</SelectItem>
            <SelectItem value="medium">Medium Success</SelectItem>
            <SelectItem value="low">Low Success</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Badge
            variant={showPopular ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => onShowPopularChange(!showPopular)}
          >
            🔥 Popular
          </Badge>
          <Badge
            variant={showShort ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/80 transition-colors"
            onClick={() => onShowShortChange(!showShort)}
          >
            ✂️ Short & Sweet
          </Badge>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default OutreachFilterBar;
