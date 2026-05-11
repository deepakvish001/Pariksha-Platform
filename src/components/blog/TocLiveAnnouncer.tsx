import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/blog/extractToc";

/**
 * Visually-hidden polite live region that announces the current TOC section
 * to screen readers when the active heading changes (scroll or deep-link).
 * Debounced so rapid scrolling doesn't spam the SR queue.
 */
export function TocLiveAnnouncer({
  items,
  activeId,
  delay = 350,
}: {
  items: TocItem[];
  activeId?: string;
  delay?: number;
}) {
  const [message, setMessage] = useState("");
  const lastAnnounced = useRef<string>("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!activeId) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (activeId === lastAnnounced.current) return;
      const item = items.find((i) => i.id === activeId);
      if (!item) return;
      lastAnnounced.current = activeId;
      setMessage(`Now reading: ${item.text}`);
    }, delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [activeId, items, delay]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
