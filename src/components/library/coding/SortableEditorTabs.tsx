import { type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { EditorTabId } from "@/hooks/useEditorTabsLayout";

interface SortableEditorTabsProps {
  order: EditorTabId[];
  onReorder: (next: EditorTabId[]) => void;
  renderLabel: (id: EditorTabId) => ReactNode;
  className?: string;
}

interface SortableTriggerProps {
  id: EditorTabId;
  children: ReactNode;
}

const SortableTrigger = ({ id, children }: SortableTriggerProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="shrink-0 touch-none">
      <TabsTrigger
        value={id}
        className={cn(
          "shrink-0 whitespace-nowrap select-none",
          isDragging && "ring-1 ring-primary/40",
        )}
        {...attributes}
        {...listeners}
      >
        {children}
      </TabsTrigger>
    </div>
  );
};

export const SortableEditorTabs = ({
  order,
  onReorder,
  renderLabel,
  className,
}: SortableEditorTabsProps) => {
  const sensors = useSensors(
    // Require a small drag distance so plain clicks still switch tabs.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(active.id as EditorTabId);
    const to = order.indexOf(over.id as EditorTabId);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(order, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={horizontalListSortingStrategy}>
        <TabsList
          className={cn(
            "rounded-none justify-start bg-transparent border-0 h-10 px-2 w-max min-w-full flex-nowrap gap-0",
            className,
          )}
        >
          {order.map((id) => (
            <SortableTrigger key={id} id={id}>
              {renderLabel(id)}
            </SortableTrigger>
          ))}
        </TabsList>
      </SortableContext>
    </DndContext>
  );
};
