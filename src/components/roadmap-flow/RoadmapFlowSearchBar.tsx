import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sections as fullStackSections } from '@/data/fullStackRoadmapData';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  sectionFilter: string;
  onSectionFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  /** Override sections list (defaults to Full Stack sections for backwards compat). */
  sections?: string[];
}

export default function RoadmapFlowSearchBar({
  search, onSearchChange, sectionFilter, onSectionFilterChange, statusFilter, onStatusFilterChange,
  sections,
}: Props) {
  const sectionList = sections ?? fullStackSections;
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search topics..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Select value={sectionFilter} onValueChange={onSectionFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px] h-9">
          <SelectValue placeholder="All Sections" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sections</SelectItem>
          {sectionList.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px] h-9">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="skipped">Skipped</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
