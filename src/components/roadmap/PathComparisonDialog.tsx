import React, { useState, useMemo } from "react";
import {
  GitCompare,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SavedPath } from "@/hooks/useSavedPaths";

interface PathComparisonDialogProps {
  savedPaths: SavedPath[];
  trigger?: React.ReactNode;
}

interface ComparisonResult {
  sectionId: string;
  leftOrder: string[];
  rightOrder: string[];
  differences: {
    type: "added" | "removed" | "moved" | "same";
    topicId: string;
    leftIndex?: number;
    rightIndex?: number;
  }[];
}

const formatTopicName = (topicId: string) => {
  return topicId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const PathComparisonDialog: React.FC<PathComparisonDialogProps> = ({
  savedPaths,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [leftPathId, setLeftPathId] = useState<string>("");
  const [rightPathId, setRightPathId] = useState<string>("");

  const leftPath = savedPaths.find((p) => p.id === leftPathId);
  const rightPath = savedPaths.find((p) => p.id === rightPathId);

  // Calculate differences between two paths
  const comparison = useMemo((): ComparisonResult[] => {
    if (!leftPath || !rightPath) return [];

    const allSections = new Set([
      ...Object.keys(leftPath.customOrders),
      ...Object.keys(rightPath.customOrders),
    ]);

    const results: ComparisonResult[] = [];

    allSections.forEach((sectionId) => {
      const leftOrder = leftPath.customOrders[sectionId] || [];
      const rightOrder = rightPath.customOrders[sectionId] || [];

      const differences: ComparisonResult["differences"] = [];
      const allTopics = new Set([...leftOrder, ...rightOrder]);

      allTopics.forEach((topicId) => {
        const leftIndex = leftOrder.indexOf(topicId);
        const rightIndex = rightOrder.indexOf(topicId);

        if (leftIndex === -1) {
          differences.push({ type: "added", topicId, rightIndex });
        } else if (rightIndex === -1) {
          differences.push({ type: "removed", topicId, leftIndex });
        } else if (leftIndex !== rightIndex) {
          differences.push({ type: "moved", topicId, leftIndex, rightIndex });
        } else {
          differences.push({ type: "same", topicId, leftIndex, rightIndex });
        }
      });

      // Sort by position in left path, then right path
      differences.sort((a, b) => {
        const aPos = a.leftIndex ?? a.rightIndex ?? 0;
        const bPos = b.leftIndex ?? b.rightIndex ?? 0;
        return aPos - bPos;
      });

      results.push({ sectionId, leftOrder, rightOrder, differences });
    });

    return results;
  }, [leftPath, rightPath]);

  // Calculate summary stats
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let moved = 0;
    let same = 0;

    comparison.forEach((section) => {
      section.differences.forEach((diff) => {
        if (diff.type === "added") added++;
        else if (diff.type === "removed") removed++;
        else if (diff.type === "moved") moved++;
        else same++;
      });
    });

    return { added, removed, moved, same, total: added + removed + moved + same };
  }, [comparison]);

  const swapPaths = () => {
    const temp = leftPathId;
    setLeftPathId(rightPathId);
    setRightPathId(temp);
  };

  const sectionColors = [
    "border-amber-400",
    "border-violet-400",
    "border-emerald-400",
    "border-blue-400",
    "border-rose-400",
    "border-cyan-400",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <GitCompare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Compare</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Compare Learning Paths
          </DialogTitle>
          <DialogDescription>
            See differences between two saved paths side by side.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Path Selectors */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={leftPathId} onValueChange={setLeftPathId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first path..." />
                </SelectTrigger>
                <SelectContent>
                  {savedPaths.map((path) => (
                    <SelectItem
                      key={path.id}
                      value={path.id}
                      disabled={path.id === rightPathId}
                    >
                      {path.name}
                      {path.isActive && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={swapPaths}
              disabled={!leftPathId || !rightPathId}
              className="shrink-0"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Select value={rightPathId} onValueChange={setRightPathId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second path..." />
                </SelectTrigger>
                <SelectContent>
                  {savedPaths.map((path) => (
                    <SelectItem
                      key={path.id}
                      value={path.id}
                      disabled={path.id === leftPathId}
                    >
                      {path.name}
                      {path.isActive && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Active
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comparison Results */}
          {leftPath && rightPath ? (
            <>
              {/* Stats Summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-muted-foreground">Same:</span>
                  <span className="font-medium">{stats.same}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Moved:</span>
                  <span className="font-medium">{stats.moved}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Added:</span>
                  <span className="font-medium">{stats.added}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">Removed:</span>
                  <span className="font-medium">{stats.removed}</span>
                </div>
              </div>

              {/* Side by Side Comparison */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {comparison.map((section, sectionIndex) => (
                    <div
                      key={section.sectionId}
                      className={cn(
                        "rounded-lg border-l-4 p-3 bg-card",
                        sectionColors[sectionIndex % sectionColors.length]
                      )}
                    >
                      <h4 className="font-medium text-sm mb-3 capitalize">
                        {section.sectionId.replace(/-/g, " ")}
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Path Column */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium mb-2">
                            {leftPath.name}
                          </p>
                          {section.leftOrder.map((topicId, index) => {
                            const diff = section.differences.find(
                              (d) => d.topicId === topicId
                            );
                            return (
                              <div
                                key={`${topicId}-left`}
                                className={cn(
                                  "flex items-center gap-2 text-xs p-1.5 rounded",
                                  diff?.type === "removed" &&
                                    "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300",
                                  diff?.type === "moved" &&
                                    "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
                                  diff?.type === "same" &&
                                    "bg-muted/50"
                                )}
                              >
                                <span className="w-5 text-center font-mono text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <span className="flex-1 truncate">
                                  {formatTopicName(topicId)}
                                </span>
                                {diff?.type === "removed" && (
                                  <Minus className="h-3 w-3 text-rose-500" />
                                )}
                                {diff?.type === "moved" && diff.rightIndex !== undefined && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400">
                                    → {diff.rightIndex + 1}
                                  </span>
                                )}
                                {diff?.type === "same" && (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Path Column */}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium mb-2">
                            {rightPath.name}
                          </p>
                          {section.rightOrder.map((topicId, index) => {
                            const diff = section.differences.find(
                              (d) => d.topicId === topicId
                            );
                            return (
                              <div
                                key={`${topicId}-right`}
                                className={cn(
                                  "flex items-center gap-2 text-xs p-1.5 rounded",
                                  diff?.type === "added" &&
                                    "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300",
                                  diff?.type === "moved" &&
                                    "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
                                  diff?.type === "same" &&
                                    "bg-muted/50"
                                )}
                              >
                                <span className="w-5 text-center font-mono text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <span className="flex-1 truncate">
                                  {formatTopicName(topicId)}
                                </span>
                                {diff?.type === "added" && (
                                  <Plus className="h-3 w-3 text-blue-500" />
                                )}
                                {diff?.type === "moved" && diff.leftIndex !== undefined && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400">
                                    ← {diff.leftIndex + 1}
                                  </span>
                                )}
                                {diff?.type === "same" && (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {comparison.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No sections to compare.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select two paths to compare</p>
              <p className="text-sm mt-1">
                Choose paths from the dropdowns above to see their differences.
              </p>
            </div>
          )}

          {savedPaths.length < 2 && (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
              <p className="font-medium">Not enough paths to compare</p>
              <p className="text-sm mt-1">
                Save at least two custom learning paths to use comparison.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PathComparisonDialog;
