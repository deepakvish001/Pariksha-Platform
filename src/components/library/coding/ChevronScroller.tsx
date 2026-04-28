import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChevronScrollerProps {
  children: ReactNode;
  className?: string;
  /** Pixels to scroll per chevron click. Defaults to 60% of visible width. */
  step?: number;
}

/**
 * Wraps a horizontally-scrollable row with left/right chevron buttons that
 * appear only when content overflows. Hides the native scrollbar.
 */
export function ChevronScroller({ children, className, step }: ChevronScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c as Element));
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = step ?? Math.max(120, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className={cn("relative flex items-center min-w-0", className)}>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          className="absolute left-0 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-accent transition-colors backdrop-blur"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "flex-1 min-w-0 overflow-x-auto overflow-y-hidden scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth",
          canScrollLeft && "pl-8",
          canScrollRight && "pr-8",
        )}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          className="absolute right-0 z-10 h-7 w-7 flex items-center justify-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-accent transition-colors backdrop-blur"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
