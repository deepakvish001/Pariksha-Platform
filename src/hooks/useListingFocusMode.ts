import { useCallback, useEffect, useState } from "react";

const KEY = "byteskill:coding-problems-focus-mode:v1";

const read = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Persisted "Focus Mode" toggle for the /library/problems listing page.
 * When enabled, ancillary sections (recommendations, stats header, topic
 * mastery chips) are hidden so users can concentrate on the table.
 */
export const useListingFocusMode = () => {
  const [focusMode, setFocusMode] = useState<boolean>(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, focusMode ? "1" : "0");
    } catch {
      /* ignore quota */
    }
  }, [focusMode]);

  const toggle = useCallback(() => setFocusMode((v) => !v), []);

  return { focusMode, setFocusMode, toggle };
};
