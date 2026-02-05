import React, { useState, useMemo } from "react";
import { Merge, ArrowRight, Shuffle, ArrowUp, ArrowDown, Undo2, Redo2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SavedPath } from "@/hooks/useSavedPaths";

type MergeStrategy = "interleave" | "prioritize-first" | "prioritize-second";

interface MergePathsDialogProps {
  savedPaths: SavedPath[];
  onMerge: (
    pathId1: string,
    pathId2: string,
    name: string,
    strategy: MergeStrategy
  ) => Promise<SavedPath | null>;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  trigger?: React.ReactNode;
}

const formatTopicName = (topicId: string) => {
  return topicId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const MergePathsDialog: React.FC<MergePathsDialogProps> = ({
  savedPaths,
  onMerge,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [path1Id, setPath1Id] = useState<string>("");
  const [path2Id, setPath2Id] = useState<string>("");
  const [strategy, setStrategy] = useState<MergeStrategy>("interleave");
  const [mergedName, setMergedName] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);

  const path1 = savedPaths.find((p) => p.id === path1Id);
  const path2 = savedPaths.find((p) => p.id === path2Id);

  // Generate default name when paths are selected
  React.useEffect(() => {
    if (path1 && path2 && !mergedName) {
      setMergedName(`${path1.name} + ${path2.name}`);
    }
  }, [path1, path2, mergedName]);

  // Preview the merged result
  const mergePreview = useMemo(() => {
    if (!path1 || !path2) return {};

    const preview: Record<string, string[]> = {};
    const allSections = new Set([
      ...Object.keys(path1.customOrders),
      ...Object.keys(path2.customOrders),
    ]);

    allSections.forEach((sectionId) => {
      const order1 = path1.customOrders[sectionId] || [];
      const order2 = path2.customOrders[sectionId] || [];

      if (order1.length === 0) {
        preview[sectionId] = order2;
      } else if (order2.length === 0) {
        preview[sectionId] = order1;
      } else {
        const merged: string[] = [];
        const seen = new Set<string>();

        if (strategy === "interleave") {
          const maxLen = Math.max(order1.length, order2.length);
          for (let i = 0; i < maxLen; i++) {
            if (i < order1.length && !seen.has(order1[i])) {
              merged.push(order1[i]);
              seen.add(order1[i]);
            }
            if (i < order2.length && !seen.has(order2[i])) {
              merged.push(order2[i]);
              seen.add(order2[i]);
            }
          }
        } else if (strategy === "prioritize-first") {
          order1.forEach((id) => {
            if (!seen.has(id)) {
              merged.push(id);
              seen.add(id);
            }
          });
          order2.forEach((id) => {
            if (!seen.has(id)) {
              merged.push(id);
              seen.add(id);
            }
          });
        } else {
          order2.forEach((id) => {
            if (!seen.has(id)) {
              merged.push(id);
              seen.add(id);
            }
          });
          order1.forEach((id) => {
            if (!seen.has(id)) {
              merged.push(id);
              seen.add(id);
            }
          });
        }

        preview[sectionId] = merged;
      }
    });

    return preview;
  }, [path1, path2, strategy]);

  const handleMerge = async () => {
    if (!path1Id || !path2Id || !mergedName.trim()) return;

    setIsMerging(true);
    const result = await onMerge(path1Id, path2Id, mergedName.trim(), strategy);
    setIsMerging(false);

    if (result) {
      setIsOpen(false);
      setPath1Id("");
      setPath2Id("");
      setMergedName("");
      setStrategy("interleave");
    }
  };

  const resetDialog = () => {
    setPath1Id("");
    setPath2Id("");
    setMergedName("");
    setStrategy("interleave");
  };

  const sectionColors = [
    "bg-amber-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetDialog();
      }}
    >
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-1.5">
              <Merge className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Merge</span>
            </Button>
          )}
        </DialogTrigger>
        
        {/* Undo/Redo buttons outside dialog */}
        {(canUndo || canRedo) && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canUndo}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUndo?.();
                  }}
                >
                  <Undo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo last merge</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canRedo}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRedo?.();
                  }}
                >
                  <Redo2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo last merge</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            Merge Learning Paths
          </DialogTitle>
          <DialogDescription>
            Combine two saved paths into a new unified path.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Path Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Path</Label>
              <Select value={path1Id} onValueChange={setPath1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select path..." />
                </SelectTrigger>
                <SelectContent>
                  {savedPaths.map((path) => (
                    <SelectItem
                      key={path.id}
                      value={path.id}
                      disabled={path.id === path2Id}
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

            <div className="space-y-2">
              <Label>Second Path</Label>
              <Select value={path2Id} onValueChange={setPath2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select path..." />
                </SelectTrigger>
                <SelectContent>
                  {savedPaths.map((path) => (
                    <SelectItem
                      key={path.id}
                      value={path.id}
                      disabled={path.id === path1Id}
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

          {/* Merge Strategy */}
          {path1 && path2 && (
            <>
              <div className="space-y-3">
                <Label>Merge Strategy</Label>
                <RadioGroup
                  value={strategy}
                  onValueChange={(v) => setStrategy(v as MergeStrategy)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <label
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === "interleave"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value="interleave" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <Shuffle className="h-3.5 w-3.5" />
                        Interleave
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Alternate between both
                      </p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === "prioritize-first"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value="prioritize-first" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <ArrowUp className="h-3.5 w-3.5" />
                        First Priority
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {path1?.name} order first
                      </p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                      strategy === "prioritize-second"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value="prioritize-second" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <ArrowDown className="h-3.5 w-3.5" />
                        Second Priority
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {path2?.name} order first
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="merge-name">Merged Path Name</Label>
                <Input
                  id="merge-name"
                  value={mergedName}
                  onChange={(e) => setMergedName(e.target.value)}
                  placeholder="Enter a name for the merged path..."
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5" />
                  Preview
                </Label>
                <ScrollArea className="h-[180px] border rounded-lg">
                  <div className="p-3 space-y-3">
                    {Object.entries(mergePreview).map(
                      ([sectionId, topics], idx) => (
                        <div key={sectionId} className="space-y-1.5">
                          <p className="text-xs font-medium text-muted-foreground capitalize">
                            {sectionId.replace(/-/g, " ")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {topics.slice(0, 8).map((topicId, topicIdx) => (
                              <Badge
                                key={topicId}
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  path1?.customOrders[sectionId]?.includes(
                                    topicId
                                  ) &&
                                    path2?.customOrders[sectionId]?.includes(
                                      topicId
                                    )
                                    ? "bg-muted"
                                    : path1?.customOrders[sectionId]?.includes(
                                        topicId
                                      )
                                    ? "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                                    : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                )}
                              >
                                {topicIdx + 1}. {formatTopicName(topicId)}
                              </Badge>
                            ))}
                            {topics.length > 8 && (
                              <Badge variant="outline" className="text-xs">
                                +{topics.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    )}
                    {Object.keys(mergePreview).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No sections to preview
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />
                  From first path
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-3 mr-1" />
                  From second path
                  <span className="inline-block w-2 h-2 rounded-full bg-muted ml-3 mr-1" />
                  In both
                </p>
              </div>
            </>
          )}

          {/* Empty state */}
          {(!path1 || !path2) && (
            <div className="text-center py-8 text-muted-foreground">
              <Merge className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select two paths to merge</p>
              <p className="text-sm mt-1">
                Choose paths from the dropdowns above to preview the merge.
              </p>
            </div>
          )}

          {savedPaths.length < 2 && (
            <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
              <p className="font-medium">Not enough paths to merge</p>
              <p className="text-sm mt-1">
                Save at least two custom learning paths to use merge.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={
              !path1Id || !path2Id || !mergedName.trim() || isMerging
            }
          >
            {isMerging ? "Merging..." : "Merge Paths"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergePathsDialog;
