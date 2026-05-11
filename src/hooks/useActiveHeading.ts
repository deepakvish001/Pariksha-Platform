import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/blog/extractToc";
import { getHeaderOffset } from "@/lib/blog/headerOffset";

/**
 * Tracks which TOC heading is currently "active" based on scroll position.
 * Picks the last heading whose top is above a fixed offset (so the section
 * the reader is actually reading wins, not a heading peeking in at the bottom).
 * If `offset` is omitted, the responsive header offset is used.
 */
export function useActiveHeading(items: TocItem[], offset?: number) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const off = offset ?? getHeaderOffset();
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - off <= 1) current = item.id;
        else break;
      }
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!items.length) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      let current = items[0].id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 1) current = item.id;
        else break;
      }
      // If we're at the very bottom, snap to the last heading.
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) current = items[items.length - 1].id;
      setActiveId(current);
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [items, offset]);

  return activeId;
}
