import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, ExternalLink, Sparkles, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { RoadmapTreeNode } from "@/data/roadmapTreesData";

interface RoadmapNodeDetailProps {
  node: RoadmapTreeNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCompleted: boolean;
  onComplete: () => void;
}

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Hard: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

const nodeTypeLabels = {
  primary: "Core Topic",
  secondary: "Subtopic",
  checkpoint: "Milestone",
  resource: "Resource",
  optional: "Optional",
};

const RoadmapNodeDetail: React.FC<RoadmapNodeDetailProps> = ({
  node,
  open,
  onOpenChange,
  isCompleted,
  onComplete,
}) => {
  if (!node) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {nodeTypeLabels[node.type]}
                </Badge>
                {node.isRecommended && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommended
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl">{node.title}</SheetTitle>
            </div>
          </div>

          {node.description && (
            <SheetDescription className="text-base">
              {node.description}
            </SheetDescription>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2">
            {node.difficulty && (
              <Badge variant="outline" className={difficultyColors[node.difficulty]}>
                {node.difficulty}
              </Badge>
            )}
            {node.estimatedTime && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {node.estimatedTime}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        {/* Learning Resources */}
        {node.resources && node.resources.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold">Learning Resources</h4>
            <div className="space-y-2">
              {node.resources.map((resource, index) => (
                <motion.a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    "hover:bg-muted transition-colors group"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {resource.type}
                    </Badge>
                    <span className="text-sm">{resource.title}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Default Resources when none specified */}
        {(!node.resources || node.resources.length === 0) && (
          <div className="space-y-4">
            <h4 className="font-semibold">Suggested Resources</h4>
            <div className="space-y-2">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(node.title + ' tutorial')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">article</Badge>
                  <span className="text-sm">Search for tutorials</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(node.title + ' tutorial')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">video</Badge>
                  <span className="text-sm">Watch on YouTube</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </a>
            </div>
          </div>
        )}

        {/* Children Preview */}
        {node.children && node.children.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <h4 className="font-semibold">Subtopics ({node.children.length})</h4>
              <div className="space-y-1">
                {node.children.map((child, index) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground py-1"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                    <span>{child.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="my-6" />

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={onComplete}
            variant={isCompleted ? "outline" : "default"}
            className="w-full gap-2"
          >
            {isCompleted ? (
              <>
                <X className="h-4 w-4" />
                Mark as Incomplete
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Mark as Complete
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RoadmapNodeDetail;
