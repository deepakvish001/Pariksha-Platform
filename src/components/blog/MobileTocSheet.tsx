import { useEffect, useRef, useState } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { scrollToHeading } from "@/lib/blog/scrollToHeading";
import type { TocItem } from "@/lib/blog/extractToc";

interface Props {
  items: TocItem[];
  activeId?: string;
  /** Stable key (e.g. post slug) used to persist last open/closed state. */
  storageKey?: string;
}

const INDENT: Record<number, string> = {
  2: "pl-0",
  3: "pl-4",
  4: "pl-8",
};

/** Mobile-only floating button + bottom sheet TOC. */
export function MobileTocSheet({ items, activeId, storageKey }: Props) {
  const lsKey = storageKey ? `blog:toc:mobile:${storageKey}` : null;
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined" && lsKey) {
      return window.localStorage.getItem(lsKey) === "1";
    }
    return false;
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (lsKey && typeof window !== "undefined") {
      window.localStorage.setItem(lsKey, open ? "1" : "0");
    }
    // Return focus to the trigger after closing for keyboard users.
    if (wasOpen.current && !open) {
      // Wait for the sheet's close animation/portal cleanup.
      setTimeout(() => triggerRef.current?.focus(), 150);
    }
    wasOpen.current = open;
  }, [open, lsKey]);

  if (items.length < 3) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          ref={triggerRef}
          size="sm"
          variant="secondary"
          className={cn(
            "lg:hidden fixed right-3 bottom-[68px] z-30 rounded-full shadow-lg",
            "border border-border bg-card/95 backdrop-blur",
          )}
          aria-label={`On this page · ${items.length} sections`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <List className="h-4 w-4 mr-1.5" />
          On this page
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[75vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>On this page</SheetTitle>
        </SheetHeader>
        <ol className="mt-3 space-y-1" role="list">
          {items.map((i, idx) => {
            const isActive = activeId === i.id;
            return (
              <li key={`${i.id}-${idx}`} className={INDENT[i.depth] ?? "pl-0"}>
                <a
                  href={`#${i.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    // Wait for the sheet close animation to release scroll lock.
                    setTimeout(() => scrollToHeading(i.id), 120);
                  }}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/80 hover:bg-muted/60",
                  )}
                >
                  {i.text}
                </a>
              </li>
            );
          })}
        </ol>
      </SheetContent>
    </Sheet>
  );
}
