import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ProblemColumnId } from "@/hooks/useCodingProblemsTablePrefs";

export type SortDir = "asc" | "desc" | null;

interface Props {
  columnId: ProblemColumnId;
  label: React.ReactNode;
  width?: number;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  sortDir?: SortDir;
  onSortClick?: () => void;
  resizable?: boolean;
  onResize?: (px: number) => void;
  className?: string;
}

/**
 * A table header that supports:
 *  - 3-state sort cycling via a button (asc → desc → off) with an icon indicator.
 *  - Mouse / touch drag-resize via a thin handle on the right edge.
 *
 * Width is applied as inline style so persisted user widths survive refreshes.
 */
export const SortableResizableHeader = ({
  columnId,
  label,
  width,
  align = "left",
  sortable = false,
  sortDir = null,
  onSortClick,
  resizable = false,
  onResize,
  className,
}: Props) => {
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const draggingRef = useRef(false);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || !onResize) return;
      const dx = e.clientX - startXRef.current;
      onResize(startWidthRef.current + dx);
    },
    [onResize],
  );

  const stopDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopDrag);
    window.removeEventListener("pointercancel", stopDrag);
  }, [onPointerMove]);

  useEffect(() => () => stopDrag(), [stopDrag]);

  const startDrag = (e: React.PointerEvent) => {
    if (!resizable || !onResize) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = cellRef.current?.getBoundingClientRect().width ?? 0;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
  };

  const Icon =
    sortDir === "asc" ? ArrowUp : sortDir === "desc" ? ArrowDown : ArrowUpDown;

  const justify =
    align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

  return (
    <TableHead
      ref={cellRef}
      data-column={columnId}
      style={width ? { width: `${width}px` } : undefined}
      className={cn("relative select-none", className)}
    >
      <div className={cn("flex items-center gap-1", justify)}>
        {sortable && onSortClick ? (
          <button
            type="button"
            onClick={onSortClick}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1 -mx-1 py-0.5",
              "hover:bg-muted/60 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              sortDir && "text-foreground",
            )}
            aria-label={`Sort by ${typeof label === "string" ? label : columnId}`}
          >
            <span>{label}</span>
            <Icon
              className={cn(
                "h-3 w-3 transition-opacity",
                sortDir ? "opacity-100" : "opacity-40",
              )}
            />
          </button>
        ) : (
          <span>{label}</span>
        )}
      </div>

      {resizable && onResize && (
        <span
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onPointerDown={startDrag}
          onDoubleClick={(e) => {
            // double-click resets to auto by emitting -1 (caller resolves to default)
            e.stopPropagation();
          }}
          className={cn(
            "absolute top-0 right-0 h-full w-1.5 cursor-col-resize",
            "opacity-0 hover:opacity-100 transition-opacity",
            "bg-primary/40",
          )}
        />
      )}
    </TableHead>
  );
};
