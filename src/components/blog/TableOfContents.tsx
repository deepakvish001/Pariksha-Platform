import { useEffect, useLayoutEffect, useRef, useState, KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrollToHeading } from "@/lib/blog/scrollToHeading";
import type { TocItem } from "@/lib/blog/extractToc";

interface Props {
  items: TocItem[];
  activeId?: string;
  className?: string;
}

const PAD_LEFT: Record<number, string> = {
  2: "pl-3",
  3: "pl-6",
  4: "pl-9",
};

const TEXT_SIZE: Record<number, string> = {
  2: "text-[13px] font-medium",
  3: "text-[12.5px]",
  4: "text-[12px] text-muted-foreground",
};

/**
 * Sticky right-rail TOC with an animated active indicator bar
 * (Mintlify/Linear pattern). Nested H2 → H3 → H4.
 */
export function TableOfContents({ items, activeId, className }: Props) {
  const [filter, setFilter] = useState("");
  const listRef = useRef<HTMLOListElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null);
  const reduced = useReducedMotion();

  const filtered = filter.trim()
    ? items.filter((i) => i.text.toLowerCase().includes(filter.toLowerCase()))
    : items;

  // Measure active item position relative to the list to drive the indicator.
  useLayoutEffect(() => {
    if (!activeId || !listRef.current) return;
    const li = itemRefs.current.get(activeId);
    if (!li) return;
    const listRect = listRef.current.getBoundingClientRect();
    const liRect = li.getBoundingClientRect();
    setBar({ top: liRect.top - listRect.top, height: liRect.height });
  }, [activeId, filtered.length]);

  // Re-measure on resize (TOC width can change at lg breakpoint).
  useEffect(() => {
    const onR = () => {
      if (!activeId || !listRef.current) return;
      const li = itemRefs.current.get(activeId);
      if (!li) return;
      const listRect = listRef.current.getBoundingClientRect();
      const liRect = li.getBoundingClientRect();
      setBar({ top: liRect.top - listRect.top, height: liRect.height });
    };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, [activeId]);

  if (items.length < 3) return null;

  const onKey = (id: string) => (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      scrollToHeading(id);
    }
  };

  return (
    <nav className={cn("text-sm", className)} aria-label="Table of contents">
      <p
        id="toc-heading"
        className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3"
      >
        On this page
      </p>

      {items.length > 12 && (
        <div className="relative mb-2 px-3">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            aria-label="Filter sections"
            className={cn(
              "w-full h-7 pl-7 pr-2 rounded-md text-[12px] bg-muted/40",
              "border border-transparent focus:border-border focus:bg-background",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
            )}
          />
        </div>
      )}

      <div className="relative">
        {/* Static rail */}
        <div
          aria-hidden
          className="absolute left-3 top-0 bottom-0 w-px bg-border"
        />
        {/* Animated active indicator */}
        {bar && (
          <motion.div
            aria-hidden
            initial={false}
            animate={{ top: bar.top, height: bar.height }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 32 }
            }
            className="absolute left-3 w-[2px] -translate-x-px rounded-full bg-primary"
          />
        )}

        <ol
          ref={listRef}
          aria-labelledby="toc-heading"
          className="relative space-y-0.5 py-0.5"
          role="list"
        >
          {filtered.map((i) => {
            const isActive = activeId === i.id;
            return (
              <li
                key={i.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(i.id, el);
                  else itemRefs.current.delete(i.id);
                }}
              >
                <a
                  href={`#${i.id}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHeading(i.id);
                  }}
                  onKeyDown={onKey(i.id)}
                  className={cn(
                    "block py-1.5 pr-2 leading-snug rounded-r-md transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    PAD_LEFT[i.depth] ?? "pl-3",
                    TEXT_SIZE[i.depth] ?? "text-[13px]",
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {i.text}
                </a>
              </li>
            );
          })}
        </ol>

        {filter && filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            No sections match.
          </p>
        )}
      </div>
    </nav>
  );
}
