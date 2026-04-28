import { useCallback, useEffect, useState } from "react";

const KEY = "byteskill:coding-bookmarks";

const read = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const write = (s: Set<string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(s)));
    window.dispatchEvent(new CustomEvent("coding-bookmarks-changed"));
  } catch {
    /* ignore */
  }
};

export const useCodingProblemBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => read());

  useEffect(() => {
    const sync = () => setBookmarks(read());
    window.addEventListener("coding-bookmarks-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("coding-bookmarks-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      write(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((slug: string) => bookmarks.has(slug), [bookmarks]);

  return { bookmarks, toggle, isBookmarked };
};
