import { useCallback, useEffect, useState } from "react";

const PINNED_KEY = "admin:sidebar:pinned";
const RECENT_KEY = "admin:sidebar:recent";
const GROUPS_KEY = "admin:sidebar:groups";
const RECENT_MAX = 6;

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useAdminSidebarPrefs(currentPath: string) {
  const [pinned, setPinned] = useState<string[]>(() => read(PINNED_KEY, []));
  const [recent, setRecent] = useState<string[]>(() => read(RECENT_KEY, []));
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    read(GROUPS_KEY, {})
  );

  // Track recent visits (only /admin/* paths, exclude root /admin)
  useEffect(() => {
    if (!currentPath.startsWith("/admin")) return;
    setRecent((prev) => {
      const next = [currentPath, ...prev.filter((p) => p !== currentPath)].slice(
        0,
        RECENT_MAX
      );
      write(RECENT_KEY, next);
      return next;
    });
  }, [currentPath]);

  const togglePin = useCallback((to: string) => {
    setPinned((prev) => {
      const next = prev.includes(to) ? prev.filter((p) => p !== to) : [...prev, to];
      write(PINNED_KEY, next);
      return next;
    });
  }, []);

  const setGroupOpen = useCallback((label: string, open: boolean) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: open };
      write(GROUPS_KEY, next);
      return next;
    });
  }, []);

  const resetPinned = useCallback(() => {
    setPinned([]);
    write(PINNED_KEY, []);
  }, []);

  const resetRecent = useCallback(() => {
    setRecent([]);
    write(RECENT_KEY, []);
  }, []);

  return {
    pinned,
    recent,
    openGroups,
    togglePin,
    setGroupOpen,
    resetPinned,
    resetRecent,
    isPinned: (to: string) => pinned.includes(to),
  };
}
