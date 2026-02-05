import React, { useState } from "react";
import {
  History,
  Plus,
  Trash2,
  Play,
  Copy,
  Merge,
  Undo2,
  Redo2,
  Clock,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PathOperation, PathOperationType } from "@/hooks/useSavedPaths";
import { formatDistanceToNow } from "date-fns";

interface PathHistoryPanelProps {
  operations: PathOperation[];
  onClear: () => void;
}

const operationConfig: Record<
  PathOperationType,
  { icon: React.ElementType; label: string; color: string }
> = {
  create: {
    icon: Plus,
    label: "Created",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  delete: {
    icon: Trash2,
    label: "Deleted",
    color: "text-rose-500 bg-rose-500/10",
  },
  activate: {
    icon: Play,
    label: "Activated",
    color: "text-blue-500 bg-blue-500/10",
  },
  deactivate: {
    icon: X,
    label: "Deactivated",
    color: "text-muted-foreground bg-muted",
  },
  update: {
    icon: Clock,
    label: "Updated",
    color: "text-amber-500 bg-amber-500/10",
  },
  duplicate: {
    icon: Copy,
    label: "Duplicated",
    color: "text-violet-500 bg-violet-500/10",
  },
  merge: {
    icon: Merge,
    label: "Merged",
    color: "text-cyan-500 bg-cyan-500/10",
  },
  "undo-merge": {
    icon: Undo2,
    label: "Undo Merge",
    color: "text-orange-500 bg-orange-500/10",
  },
  "redo-merge": {
    icon: Redo2,
    label: "Redo Merge",
    color: "text-teal-500 bg-teal-500/10",
  },
};

const PathHistoryPanel: React.FC<PathHistoryPanelProps> = ({
  operations,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 relative"
        >
          <History className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">History</span>
          {operations.length > 0 && (
            <Badge
              variant="secondary"
              className="h-4 min-w-4 px-1 text-[10px] absolute -top-1.5 -right-1.5"
            >
              {operations.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h4 className="font-medium text-sm flex items-center gap-1.5">
            <History className="h-4 w-4" />
            Recent Operations
          </h4>
          {operations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {operations.length > 0 ? (
            <div className="p-2 space-y-1">
              {operations.map((op) => {
                const config = operationConfig[op.type];
                const Icon = config.icon;

                return (
                  <div
                    key={op.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
                        config.color
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {op.pathName}
                      </p>
                      {op.details && (
                        <p className="text-xs text-muted-foreground truncate">
                          {op.details}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(op.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <History className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No recent operations</p>
              <p className="text-xs mt-1">
                Path changes will appear here
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default PathHistoryPanel;
