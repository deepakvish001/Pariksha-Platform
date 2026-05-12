import { useEffect, useState } from "react";

const LS_BOOKMARKS = "dsaPatterns:bookmarks:v1";
const LS_DONE = "dsaPatterns:done:v1";

const loadSet = (key: string): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
};

export interface UsePatternStorageReturn {
  bookmarks: Set<string>;
  done: Set<string>;
  toggleBookmark: (id: string) => void;
  toggleDone: (id: string) => void;
}

export function useDsaPatternStorage(): UsePatternStorageReturn {
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadSet(LS_BOOKMARKS));
  const [done, setDone] = useState<Set<string>>(() => loadSet(LS_DONE));

  useEffect(() => saveSet(LS_BOOKMARKS, bookmarks), [bookmarks]);
  useEffect(() => saveSet(LS_DONE, done), [done]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_BOOKMARKS) setBookmarks(loadSet(LS_BOOKMARKS));
      if (e.key === LS_DONE) setDone(loadSet(LS_DONE));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    bookmarks,
    done,
    toggleBookmark: (id) =>
      setBookmarks((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    toggleDone: (id) =>
      setDone((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
  };
}
