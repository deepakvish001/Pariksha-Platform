import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/blog/extractToc";

interface Props {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: Props) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  return (
    <nav
      className={cn(
        "text-sm border-l border-border/60 pl-4",
        className,
      )}
      aria-label="Table of contents"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </p>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.id}
            className={cn(i.depth === 3 && "pl-3")}
          >
            <a
              href={`#${i.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(i.id);
                if (el) {
                  window.history.replaceState(null, "", `#${i.id}`);
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className={cn(
                "block leading-snug transition-colors hover:text-foreground",
                active === i.id
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
