import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown, List, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { scrollToHeading } from "@/lib/blog/scrollToHeading";
import type { TocItem } from "@/lib/blog/extractToc";

interface Props {
  items: TocItem[];
  readingTimeMin?: number;
  activeId?: string;
  className?: string;
}

const INDENT: Record<number, string> = {
  2: "pl-0",
  3: "pl-4",
  4: "pl-8",
};

const SIZE: Record<number, string> = {
  2: "text-sm font-medium",
  3: "text-[13px]",
  4: "text-[12px] text-muted-foreground",
};

/**
 * Notion-style inline TOC card placed before the article body.
 * Auto-collapses for long TOCs (>8 items); always-expanded for short ones.
 */
export function InlineToc({ items, readingTimeMin, activeId, className }: Props) {
  const [open, setOpen] = useState(items.length <= 8);
  const reduced = useReducedMotion();

  if (items.length < 3) return null;

  const onKey = (id: string) => (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      scrollToHeading(id);
    }
  };

  return (
    <aside
      aria-labelledby="inline-toc-heading"
      className={cn(
        "not-prose mb-8 rounded-xl border bg-card/40 backdrop-blur-sm",
        "shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="inline-toc-list"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-4 py-3 text-left",
          "rounded-xl hover:bg-muted/40 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <List className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
        <span id="inline-toc-heading" className="text-sm font-semibold">
          On this page
        </span>
        <span className="text-xs text-muted-foreground">
          · {items.length} {items.length === 1 ? "section" : "sections"}
        </span>
        {readingTimeMin ? (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            · <Clock className="h-3 w-3" /> {readingTimeMin} min
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="inline-toc-list"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ol className="px-4 pb-3 pt-1 space-y-1" role="list">
              {items.map((i, idx) => {
                const isActive = activeId === i.id;
                return (
                  <li key={`${i.id}-${idx}`} className={INDENT[i.depth] ?? "pl-0"}>
                    <a
                      href={`#${i.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToHeading(i.id);
                      }}
                      onKeyDown={onKey(i.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "group flex items-start gap-2 rounded-md px-2 py-1.5 leading-snug",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        SIZE[i.depth] ?? "text-sm",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-[7px] h-1 w-1 rounded-full shrink-0",
                          isActive ? "bg-primary" : "bg-muted-foreground/40",
                        )}
                      />
                      <span className="line-clamp-2">{i.text}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
