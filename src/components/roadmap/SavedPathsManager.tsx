import React, { useState } from "react";
import {
  Save,
  FolderOpen,
  Trash2,
  Check,
  Plus,
  Edit2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SavedPath } from "@/hooks/useSavedPaths";
import { formatDistanceToNow } from "date-fns";

interface SavedPathsManagerProps {
  savedPaths: SavedPath[];
  activePath: SavedPath | null;
  currentOrders: Record<string, string[]>;
  hasCustomOrder: boolean;
  isSaving: boolean;
  onSavePath: (name: string, description: string, orders: Record<string, string[]>) => Promise<SavedPath | null>;
  onActivatePath: (pathId: string) => Promise<Record<string, string[]> | null>;
  onDeletePath: (pathId: string) => Promise<void>;
  onUpdatePath: (pathId: string, updates: { name?: string; description?: string }) => Promise<void>;
  trigger?: React.ReactNode;
}

// Visual thumbnail showing topic order
const PathThumbnail: React.FC<{ customOrders: Record<string, string[]> }> = ({ customOrders }) => {
  const allTopics = Object.values(customOrders).flat();
  const displayCount = Math.min(allTopics.length, 8);
  const hasMore = allTopics.length > 8;

  if (allTopics.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="italic">No custom order</span>
      </div>
    );
  }

  // Generate colors based on section index
  const sectionColors = [
    "bg-amber-400",
    "bg-violet-400", 
    "bg-emerald-400",
    "bg-blue-400",
    "bg-rose-400",
    "bg-cyan-400",
  ];

  // Build a map of topic to section color
  const topicColorMap: Record<string, string> = {};
  Object.entries(customOrders).forEach(([sectionId, topics], sectionIndex) => {
    const color = sectionColors[sectionIndex % sectionColors.length];
    topics.forEach(topic => {
      topicColorMap[topic] = color;
    });
  });

  return (
    <div className="flex items-center gap-0.5 mt-2">
      {allTopics.slice(0, displayCount).map((topicId, index) => (
        <div
          key={`${topicId}-${index}`}
          className={cn(
            "w-3 h-3 rounded-sm transition-transform hover:scale-125",
            topicColorMap[topicId] || "bg-muted-foreground"
          )}
          title={topicId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        />
      ))}
      {hasMore && (
        <span className="text-xs text-muted-foreground ml-1">
          +{allTopics.length - 8}
        </span>
      )}
    </div>
  );
};

// Expanded view showing full topic list
const PathTopicList: React.FC<{ customOrders: Record<string, string[]> }> = ({ customOrders }) => {
  const sections = Object.entries(customOrders);

  if (sections.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No topics in this path</p>;
  }

  const sectionColors = [
    "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
    "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
    "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
    "border-rose-400 bg-rose-50 dark:bg-rose-950/30",
    "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30",
  ];

  const dotColors = [
    "bg-amber-400",
    "bg-violet-400",
    "bg-emerald-400",
    "bg-blue-400",
    "bg-rose-400",
    "bg-cyan-400",
  ];

  return (
    <div className="space-y-2 mt-3">
      {sections.map(([sectionId, topics], sectionIndex) => (
        <div 
          key={sectionId}
          className={cn(
            "rounded-md border-l-2 p-2",
            sectionColors[sectionIndex % sectionColors.length]
          )}
        >
          <p className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">
            {sectionId.replace(/-/g, ' ')}
          </p>
          <div className="flex flex-wrap gap-1">
            {topics.map((topic, topicIndex) => (
              <div 
                key={`${topic}-${topicIndex}`}
                className="flex items-center gap-1 text-xs bg-background/80 rounded px-1.5 py-0.5 border"
              >
                <span className="font-medium text-muted-foreground">{topicIndex + 1}.</span>
                <span className="capitalize truncate max-w-[120px]">
                  {topic.replace(/-/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const SavedPathsManager: React.FC<SavedPathsManagerProps> = ({
  savedPaths,
  activePath,
  currentOrders,
  hasCustomOrder,
  isSaving,
  onSavePath,
  onActivatePath,
  onDeletePath,
  onUpdatePath,
  trigger,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingPath, setEditingPath] = useState<SavedPath | null>(null);
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = async () => {
    if (!name.trim()) return;
    
    const result = await onSavePath(name.trim(), description.trim(), currentOrders);
    if (result) {
      setName("");
      setDescription("");
      setShowSaveForm(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPath || !name.trim()) return;
    
    await onUpdatePath(editingPath.id, {
      name: name.trim(),
      description: description.trim(),
    });
    setEditingPath(null);
    setName("");
    setDescription("");
  };

  const startEditing = (path: SavedPath) => {
    setEditingPath(path);
    setName(path.name);
    setDescription(path.description || "");
    setShowSaveForm(false);
  };

  const cancelForm = () => {
    setShowSaveForm(false);
    setEditingPath(null);
    setName("");
    setDescription("");
  };

  const toggleExpanded = (pathId: string) => {
    setExpandedPathId(prev => prev === pathId ? null : pathId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Saved Paths</span>
            {savedPaths.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {savedPaths.length}
              </Badge>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Saved Learning Paths
          </DialogTitle>
          <DialogDescription>
            Save and manage multiple custom learning path configurations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save Current / Edit Form */}
          {(showSaveForm || editingPath) && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label htmlFor="path-name">Name</Label>
                <Input
                  id="path-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My DSA Focus Path"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="path-description">Description (optional)</Label>
                <Textarea
                  id="path-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this learning path..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={editingPath ? handleUpdate : handleSave}
                  disabled={!name.trim() || isSaving}
                  size="sm"
                  className="flex-1"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {editingPath ? "Update" : "Save Path"}
                </Button>
                <Button
                  onClick={cancelForm}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Save Current Button */}
          {!showSaveForm && !editingPath && hasCustomOrder && (
            <Button
              onClick={() => setShowSaveForm(true)}
              variant="outline"
              className="w-full gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Save Current Order as New Path
            </Button>
          )}

          {/* Saved Paths List */}
          {savedPaths.length > 0 ? (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2 pr-2">
                {savedPaths.map((path) => {
                  const isExpanded = expandedPathId === path.id;
                  const topicCount = Object.values(path.customOrders).flat().length;
                  const sectionCount = Object.keys(path.customOrders).length;

                  return (
                    <Collapsible
                      key={path.id}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(path.id)}
                    >
                      <div
                        className={cn(
                          "border rounded-lg transition-colors overflow-hidden",
                          path.isActive && "border-primary bg-primary/5"
                        )}
                      >
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{path.name}</span>
                                {path.isActive && (
                                  <Badge variant="default" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              {path.description && (
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                  {path.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {sectionCount} section{sectionCount !== 1 ? 's' : ''} • {topicCount} topic{topicCount !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(path.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              
                              {/* Thumbnail Preview */}
                              <PathThumbnail customOrders={path.customOrders} />
                            </div>
                            <div className="flex items-center gap-1">
                              {!path.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onActivatePath(path.id)}
                                  disabled={isSaving}
                                  className="h-8 px-2"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Use
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditing(path)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onDeletePath(path.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* Expand/Collapse Button */}
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 h-6 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Hide topics
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Show all topics
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        {/* Expanded Topic List */}
                        <CollapsibleContent>
                          <div className="px-3 pb-3 border-t bg-muted/20">
                            <PathTopicList customOrders={path.customOrders} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No saved paths yet</p>
              <p className="text-sm mt-1">
                {hasCustomOrder
                  ? 'Click "Save Current Order" to save your first path.'
                  : "Create a custom order first by enabling Reorder mode."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedPathsManager;
