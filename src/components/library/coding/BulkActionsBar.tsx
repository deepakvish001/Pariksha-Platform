import { Bookmark, BookmarkMinus, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Props {
  selectedCount: number;
  onSelectAllVisible: () => void;
  onBookmarkSelected: () => void;
  onUnbookmarkSelected: () => void;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onSelectAllVisible,
  onBookmarkSelected,
  onUnbookmarkSelected,
  onClearSelection,
}: Props) => {
  return (
    <Card className="p-2.5 mb-3 flex items-center justify-between gap-2 flex-wrap border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 text-sm">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {selectedCount} {selectedCount === 1 ? "problem" : "problems"} selected
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onSelectAllVisible} className="h-7 text-xs">
          Select all on page
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onBookmarkSelected}
          disabled={selectedCount === 0}
          className="h-7 text-xs gap-1"
        >
          <Bookmark className="h-3.5 w-3.5" />
          Bookmark
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUnbookmarkSelected}
          disabled={selectedCount === 0}
          className="h-7 text-xs gap-1"
        >
          <BookmarkMinus className="h-3.5 w-3.5" />
          Remove
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={selectedCount === 0}
          className="h-7 text-xs gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </Card>
  );
};
