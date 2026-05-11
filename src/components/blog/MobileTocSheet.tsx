import { useState } from "react";
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
}

const INDENT: Record<number, string> = {
  2: "pl-0",
  3: "pl-4",
  4: "pl-8",
};

/** Mobile-only floating button + bottom sheet TOC. */
export function MobileTocSheet({ items, activeId }: Props) {
  const [open, setOpen] = useState(false);
  if (items.length < 3) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className={cn(
            "lg:hidden fixed right-3 bottom-[68px] z-30 rounded-full shadow-lg",
            "border border-border bg-card/95 backdrop-blur",
          )}
          aria-label={`On this page · ${items.length} sections`}
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
