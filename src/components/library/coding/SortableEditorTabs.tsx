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
  /**
   * Tab ids that must be presented as locked: visually disabled, no drag,
   * no keyboard activation, no pointer activation. Used during contests to
   * prevent re-entering reference panels.
   */
  lockedIds?: ReadonlyArray<EditorTabId>;
  /**
   * When true, drag-reorder is disabled for ALL tabs. Used during contests
   * so locked tabs can't be hidden / shuffled to indirectly reactivate.
   */
  reorderDisabled?: boolean;
  /**
   * Fired whenever a drag-reorder attempt is rejected (because reorder is
   * globally disabled or a locked tab was involved). Used by callers to
   * audit-log the attempt for trust scoring.
   */
  onBlockedReorder?: (reason: "reorder_disabled" | "locked_tab", info: {
    activeId: EditorTabId;
    overId: EditorTabId | null;
  }) => void;
}

interface SortableTriggerProps {
  id: EditorTabId;
  children: ReactNode;
  locked: boolean;
  reorderDisabled: boolean;
}

const SortableTrigger = ({ id, children, locked, reorderDisabled }: SortableTriggerProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: locked || reorderDisabled });

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
        // Radix Tabs honors `disabled` to skip arrow-key focus and ignore activation
        disabled={locked}
        aria-disabled={locked || undefined}
        aria-label={locked ? `${typeof children === "string" ? children : id} — locked during contest` : undefined}
        data-locked={locked || undefined}
        className={cn(
          "shrink-0 whitespace-nowrap select-none",
          isDragging && "ring-1 ring-primary/40",
          locked && "opacity-60 cursor-not-allowed text-muted-foreground hover:bg-transparent",
        )}
        // Only spread drag listeners when not locked / reorder allowed
        {...(locked || reorderDisabled ? {} : attributes)}
        {...(locked || reorderDisabled ? {} : listeners)}
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
  lockedIds,
  reorderDisabled = false,
}: SortableEditorTabsProps) => {
  const sensors = useSensors(
    // Require a small drag distance so plain clicks still switch tabs.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const lockedSet = new Set(lockedIds ?? []);

  const handleDragEnd = (event: DragEndEvent) => {
    if (reorderDisabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Block drag involving a locked tab in either position.
    if (lockedSet.has(active.id as EditorTabId) || lockedSet.has(over.id as EditorTabId)) return;
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
            <SortableTrigger
              key={id}
              id={id}
              locked={lockedSet.has(id)}
              reorderDisabled={reorderDisabled}
            >
              {renderLabel(id)}
            </SortableTrigger>
          ))}
        </TabsList>
      </SortableContext>
    </DndContext>
  );
};
