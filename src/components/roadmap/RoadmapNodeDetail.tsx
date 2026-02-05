import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Check, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  X, 
  BookOpen, 
  Video, 
  FileText, 
  Wrench,
  GraduationCap,
  Gauge,
  Target,
  ChevronRight,
  Lightbulb,
  Code,
  Globe,
  Youtube,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Layers,
  StickyNote,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";
import type { RoadmapTreeNode, RoadmapResource } from "@/data/roadmapTreesData";

interface RoadmapNodeDetailProps {
  node: RoadmapTreeNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCompleted: boolean;
  onComplete: () => void;
  // Notes props
  initialNote?: string;
  onSaveNote?: (note: string) => void;
  onDeleteNote?: () => void;
  isSavingNote?: boolean;
  isDeletingNote?: boolean;
}

const difficultyConfig = {
  Easy: { 
    color: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    icon: "🟢",
    description: "Beginner-friendly topic"
  },
  Medium: { 
    color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    icon: "🟡",
    description: "Requires foundational knowledge"
  },
  Hard: { 
    color: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700",
    icon: "🔴",
    description: "Advanced topic"
  },
};

const nodeTypeConfig = {
  primary: { label: "Core Topic", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Target },
  secondary: { label: "Subtopic", color: "bg-muted text-muted-foreground", icon: ChevronRight },
  checkpoint: { label: "Milestone", color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300", icon: CheckCircle2 },
  resource: { label: "Resource", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", icon: BookOpen },
  optional: { label: "Optional", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", icon: Lightbulb },
};

const resourceTypeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  article: { icon: FileText, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  video: { icon: Video, color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  course: { icon: GraduationCap, color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  docs: { icon: BookOpen, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  tool: { icon: Wrench, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
};

// Resource card component
const ResourceCard: React.FC<{ resource: RoadmapResource; index: number }> = ({ resource, index }) => {
  const config = resourceTypeConfig[resource.type] || resourceTypeConfig.article;
  const IconComponent = config.icon;
  
  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl border-2 border-border/60",
        "bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-md",
        "transition-all duration-200"
      )}
    >
      <div className={cn("flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center", config.color)}>
        <IconComponent className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {resource.title}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </motion.a>
  );
};

// Section header component
const SectionHeader: React.FC<{ icon: React.ElementType; title: string; count?: number }> = ({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <h4 className="font-semibold text-sm">{title}</h4>
    {count !== undefined && (
      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{count}</Badge>
    )}
  </div>
);

const RoadmapNodeDetail: React.FC<RoadmapNodeDetailProps> = ({
  node,
  open,
  onOpenChange,
  isCompleted,
  onComplete,
  initialNote = "",
  onSaveNote,
  onDeleteNote,
  isSavingNote = false,
  isDeletingNote = false,
}) => {
  const [noteText, setNoteText] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  
  // Reset note text when node changes or initial note updates
  useEffect(() => {
    setNoteText(initialNote);
    setIsEditing(false);
  }, [initialNote, node?.id]);

  const handleSaveNote = () => {
    if (onSaveNote && noteText.trim()) {
      onSaveNote(noteText.trim());
      setIsEditing(false);
    }
  };

  const handleDeleteNote = () => {
    if (onDeleteNote) {
      onDeleteNote();
      setNoteText("");
      setIsEditing(false);
    }
  };

  if (!node) return null;

  const nodeType = nodeTypeConfig[node.type];
  const NodeTypeIcon = nodeType.icon;
  const { icon: TopicIcon, gradient } = getNodeIcon(node.title, node.type);
  const difficulty = node.difficulty ? difficultyConfig[node.difficulty] : null;
  const childrenCount = node.children?.length || 0;
  const resourcesCount = node.resources?.length || 0;
  const hasNote = noteText.trim().length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header Section */}
            <SheetHeader className="space-y-4">
              {/* Topic Icon and Title */}
              <div className="flex items-start gap-4">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                    `bg-gradient-to-br ${gradient}`
                  )}
                >
                  <TopicIcon className="h-7 w-7 text-white drop-shadow-sm" />
                </motion.div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-xs gap-1", nodeType.color)}>
                      <NodeTypeIcon className="h-3 w-3" />
                      {nodeType.label}
                    </Badge>
                    {node.isRecommended && (
                      <Badge className="text-xs gap-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/40 dark:text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <SheetTitle className="text-xl leading-tight">{node.title}</SheetTitle>
                </div>
              </div>

              {/* Description */}
              {node.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {node.description}
                </p>
              )}

              {/* Meta Info Cards */}
              <div className="grid grid-cols-2 gap-2">
                {difficulty && (
                  <div className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border",
                    difficulty.color
                  )}>
                    <Gauge className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{node.difficulty}</p>
                      <p className="text-[10px] opacity-80 truncate">{difficulty.description}</p>
                    </div>
                  </div>
                )}
                {node.estimatedTime && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-700">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{node.estimatedTime}</p>
                      <p className="text-[10px] opacity-80">Estimated time</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {resourcesCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{resourcesCount} resource{resourcesCount !== 1 && 's'}</span>
                  </div>
                )}
                {childrenCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    <span>{childrenCount} subtopic{childrenCount !== 1 && 's'}</span>
                  </div>
                )}
              </div>
            </SheetHeader>

            <Separator />

            {/* Learning Resources */}
            {resourcesCount > 0 && (
              <div>
                <SectionHeader icon={BookOpen} title="Learning Resources" count={resourcesCount} />
                <div className="space-y-2">
                  {node.resources!.map((resource, index) => (
                    <ResourceCard key={index} resource={resource} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Default Resources when none specified */}
            {resourcesCount === 0 && (
              <div>
                <SectionHeader icon={Globe} title="Find Resources" />
                <p className="text-xs text-muted-foreground mb-3">
                  No specific resources added yet. Try these search options:
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(node.title + ' tutorial guide')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl border-2 border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium group-hover:text-primary">Search tutorials</p>
                      <p className="text-xs text-muted-foreground">Find articles and guides</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(node.title + ' tutorial')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl border-2 border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                      <Youtube className="h-5 w-5 text-red-700 dark:text-red-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium group-hover:text-primary">Watch videos</p>
                      <p className="text-xs text-muted-foreground">Learn on YouTube</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                  <a
                    href={`https://github.com/search?q=${encodeURIComponent(node.title)}&type=repositories`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-xl border-2 border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Code className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium group-hover:text-primary">Explore code</p>
                      <p className="text-xs text-muted-foreground">Find projects on GitHub</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                </div>
              </div>
            )}

            {/* Subtopics */}
            {childrenCount > 0 && (
              <>
                <Separator />
                <div>
                  <SectionHeader icon={Layers} title="Subtopics to Cover" count={childrenCount} />
                  <div className="space-y-1.5">
                    {node.children!.map((child, index) => (
                      <motion.div
                        key={child.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <Circle className="h-2 w-2 text-primary flex-shrink-0" />
                        <span className="text-sm flex-1">{child.title}</span>
                        {child.difficulty && (
                          <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", difficultyConfig[child.difficulty].color)}>
                            {child.difficulty}
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Personal Notes Section */}
            {onSaveNote && (
              <>
                <Separator />
                <div>
                  <SectionHeader icon={StickyNote} title="Personal Notes" />
                  <div className="space-y-3">
                    {isEditing || !hasNote ? (
                      <>
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add your personal notes, key takeaways, or reminders..."
                          className="min-h-[100px] text-sm resize-none"
                          onFocus={() => setIsEditing(true)}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveNote}
                            disabled={isSavingNote || !noteText.trim()}
                            className="gap-1.5"
                          >
                            {isSavingNote ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                            Save Note
                          </Button>
                          {hasNote && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setNoteText(initialNote);
                                setIsEditing(false);
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="relative group">
                        <div 
                          onClick={() => setIsEditing(true)}
                          className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                        >
                          <p className="text-sm text-violet-900 dark:text-violet-100 whitespace-pre-wrap">
                            {noteText}
                          </p>
                          <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-2">
                            Click to edit
                          </p>
                        </div>
                        {onDeleteNote && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleDeleteNote}
                            disabled={isDeletingNote}
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {isDeletingNote ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Learning Tips */}
            <Separator />
            <div>
              <SectionHeader icon={Lightbulb} title="Learning Tips" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-600">💡</span>
                  <p className="text-xs">Take notes as you learn. Writing helps reinforce concepts.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-600">🎯</span>
                  <p className="text-xs">Practice with hands-on projects to solidify your understanding.</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Button */}
            <div className="pb-2">
              <Button
                onClick={onComplete}
                variant={isCompleted ? "outline" : "default"}
                size="lg"
                className={cn(
                  "w-full gap-2 h-12 text-base font-semibold",
                  isCompleted 
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400" 
                    : "bg-gradient-to-r from-primary to-primary/90 shadow-lg hover:shadow-xl"
                )}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Completed - Click to Undo
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RoadmapNodeDetail;
