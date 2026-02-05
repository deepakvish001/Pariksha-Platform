import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import RoadmapNode from "./RoadmapNode";
import type { RoadmapTreeNode as NodeType } from "@/data/roadmapTreesData";

interface DraggableNodeProps {
  node: NodeType;
  depth: number;
  isExpanded: boolean;
  isCompleted: boolean;
  isInProgress: boolean;
  isOnProgressPath: boolean;
  isHighlighted: boolean;
  hasNote?: boolean;
  completedChildren?: number;
  totalChildren?: number;
  onToggle: () => void;
  onClick: () => void;
  onComplete: () => void;
  isDragEnabled?: boolean;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({
  node,
  depth,
  isExpanded,
  isCompleted,
  isInProgress,
  isOnProgressPath,
  isHighlighted,
  hasNote = false,
  completedChildren = 0,
  totalChildren = 0,
  onToggle,
  onClick,
  onComplete,
  isDragEnabled = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-center gap-1",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag Handle */}
      {isDragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className={cn(
            "flex-shrink-0 h-8 w-6 flex items-center justify-center",
            "cursor-grab active:cursor-grabbing",
            "text-muted-foreground/50 hover:text-muted-foreground",
            "rounded hover:bg-muted/50 transition-colors"
          )}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Node content */}
      <div className="flex-1">
        <RoadmapNode
          node={node}
          depth={isDragEnabled ? 0 : depth}
          isExpanded={isExpanded}
          isCompleted={isCompleted}
          isInProgress={isInProgress}
          isOnProgressPath={isOnProgressPath}
          isHighlighted={isHighlighted}
          hasNote={hasNote}
          completedChildren={completedChildren}
          totalChildren={totalChildren}
          onToggle={onToggle}
          onClick={onClick}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
};

export default DraggableNode;
