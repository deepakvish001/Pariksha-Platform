import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives inline field highlighting in the Problem Editor.
 *
 * Components opt in by rendering an element with `data-field="<fieldId>"`.
 * Calling `flash(fieldId)` scrolls the matching element into view and adds a
 * temporary ring + background to make the failing field obvious.
 *
 * The hook also exposes `highlightedField` so consumers can reactively style
 * their own components (e.g. add a destructive border) when the user clicks
 * an issue in the publish checklist.
 */
export const useFieldHighlight = (durationMs = 2200) => {
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHighlightedField(null);
  }, []);

  const flash = useCallback(
    (field: string) => {
      if (!field) return;
      setHighlightedField(field);
      // Wait one frame so the matching tab has a chance to render the field.
      requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(
          `[data-field="${CSS.escape(field)}"]`,
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          // If it's an input/textarea, focus it for immediate keyboard editing.
          const focusable = el.matches("input, textarea, select, [contenteditable]")
            ? (el as HTMLElement)
            : el.querySelector<HTMLElement>("input, textarea, select, [contenteditable]");
          focusable?.focus({ preventScroll: true });
        }
      });
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setHighlightedField(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  return { highlightedField, flash, clear };
};

/**
 * Returns the Tailwind utility classes that visualise a "currently failing" field.
 * Apply on any element that already has a `data-field` attribute.
 */
export const fieldHighlightClass = (
  field: string | undefined,
  highlighted: string | null,
): string =>
  field && highlighted === field
    ? "ring-2 ring-destructive ring-offset-2 ring-offset-background bg-destructive/5 transition-shadow"
    : "";
