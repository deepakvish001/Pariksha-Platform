import { useEffect, useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/blog/extractToc";

interface Props {
  items: TocItem[];
  className?: string;
}

function activate(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  window.history.replaceState(null, "", `#${id}`);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
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

  const onKey = (id: string) => (e: KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(id);
    }
  };

  return (
    <nav
      className={cn("text-sm border-l border-border pl-4", className)}
      aria-label="Table of contents"
    >
      <p
        id="toc-heading"
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
      >
        On this page
      </p>
      <ul aria-labelledby="toc-heading" className="space-y-2">
        {items.map((i) => {
          const isActive = active === i.id;
          return (
            <li key={i.id} className={cn(i.depth === 3 && "pl-3")}>
              <a
                href={`#${i.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  activate(i.id);
                }}
                onKeyDown={onKey(i.id)}
                className={cn(
                  "block leading-snug rounded-sm transition-colors",
                  "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isActive ? "text-primary font-medium" : "text-muted-foreground",
                )}
              >
                {i.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
