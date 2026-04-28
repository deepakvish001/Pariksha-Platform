import { useState } from "react";
import { Search, X, Check, ChevronsUpDown, LayoutGrid, List, Bookmark, ArrowDownUp } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table";
export type SortKey = "default" | "title" | "diff-asc" | "diff-desc" | "recent";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  difficulty: string;
  onDifficulty: (v: string) => void;
  topics: string[];
  selectedTopics: string[];
  onToggleTopic: (t: string) => void;
  onClearTopics: () => void;
  status: string;
  onStatus: (v: string) => void;
  sort: SortKey;
  onSort: (v: SortKey) => void;
  view: ViewMode;
  onView: (v: ViewMode) => void;
  bookmarked: boolean;
  onBookmarked: (v: boolean) => void;
  activeCount: number;
  onClearAll: () => void;
}

export const ProblemFiltersBar = (p: Props) => {
  const [topicOpen, setTopicOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, topic, or slug…"
            value={p.search}
            onChange={(e) => p.onSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={p.difficulty} onValueChange={p.onDifficulty}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={topicOpen} onOpenChange={setTopicOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="md:w-[180px] justify-between font-normal">
              <span className="truncate">
                {p.selectedTopics.length === 0
                  ? "All Topics"
                  : p.selectedTopics.length === 1
                    ? p.selectedTopics[0]
                    : `${p.selectedTopics.length} topics`}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[240px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search topics…" />
              <CommandList>
                <CommandEmpty>No topic found.</CommandEmpty>
                <CommandGroup>
                  {p.topics.map((t) => {
                    const checked = p.selectedTopics.includes(t);
                    return (
                      <CommandItem key={t} onSelect={() => p.onToggleTopic(t)} className="cursor-pointer">
                        <Check className={cn("h-4 w-4 mr-2", checked ? "opacity-100" : "opacity-0")} />
                        {t}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={p.status} onValueChange={p.onStatus}>
          <SelectTrigger className="w-full md:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="attempted">Attempted</SelectItem>
            <SelectItem value="todo">To-do</SelectItem>
          </SelectContent>
        </Select>

        <Select value={p.sort} onValueChange={(v) => p.onSort(v as SortKey)}>
          <SelectTrigger className="w-full md:w-[160px]">
            <ArrowDownUp className="h-3.5 w-3.5 mr-1 opacity-60" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default order</SelectItem>
            <SelectItem value="title">Title A→Z</SelectItem>
            <SelectItem value="diff-asc">Easy → Hard</SelectItem>
            <SelectItem value="diff-desc">Hard → Easy</SelectItem>
            <SelectItem value="recent">Recently attempted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={p.bookmarked ? "default" : "outline"}
          size="icon"
          onClick={() => p.onBookmarked(!p.bookmarked)}
          aria-label="Show bookmarked only"
          title="Bookmarked only"
        >
          <Bookmark className={cn("h-4 w-4", p.bookmarked && "fill-current")} />
        </Button>

        <ToggleGroup
          type="single"
          value={p.view}
          onValueChange={(v) => v && p.onView(v as ViewMode)}
          className="border rounded-md"
        >
          <ToggleGroupItem value="grid" size="sm" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" size="sm" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(p.activeCount > 0 || p.selectedTopics.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active:</span>
          {p.selectedTopics.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 pr-1">
              {t}
              <button
                type="button"
                onClick={() => p.onToggleTopic(t)}
                className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={p.onClearAll} className="h-6 text-xs gap-1">
            <X className="h-3 w-3" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
