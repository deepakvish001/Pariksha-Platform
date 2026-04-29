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
 *
 * Robustness:
 *  - Retries the DOM lookup a few animation frames so late-mounted nodes
 *    (collapsed accordions, virtualised tables, language-tab editors) are
 *    found after the parent re-renders.
 *  - Walks up `[data-state="closed"]` ancestors and clicks their trigger so
 *    Radix accordions / collapsibles auto-expand the failing row before we
 *    scroll & focus it.
 *  - Prefers focusing the inner textarea > input > select > contenteditable,
 *    so the cursor lands in the exact editable surface.
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

  const openAncestorCollapsibles = (el: HTMLElement) => {
    // Walk up; for any collapsed Radix accordion/collapsible content, click its
    // associated trigger so the row expands before we focus inside.
    let node: HTMLElement | null = el;
    let safety = 12;
    while (node && safety-- > 0) {
      const closed = node.closest<HTMLElement>('[data-state="closed"]');
      if (!closed) break;
      // Radix marks the trigger with aria-controls pointing at the content id,
      // and the content carries the same id. So we can find the trigger by
      // querying for [aria-controls="<id>"]. Fall back to the previous sibling.
      const id = closed.id;
      let trigger: HTMLElement | null = null;
      if (id) trigger = document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(id)}"]`);
      if (!trigger) {
        const prev = closed.previousElementSibling as HTMLElement | null;
        if (prev?.matches('button, [role="button"]')) trigger = prev;
        else trigger = closed.parentElement?.querySelector<HTMLElement>('button[aria-expanded="false"]') ?? null;
      }
      trigger?.click();
      node = closed.parentElement;
    }
  };

  const focusInside = (el: HTMLElement) => {
    if (el.matches("textarea, input, select, [contenteditable]")) {
      (el as HTMLElement).focus({ preventScroll: true });
      return;
    }
    const focusable =
      el.querySelector<HTMLElement>("textarea") ??
      el.querySelector<HTMLElement>("input") ??
      el.querySelector<HTMLElement>("select") ??
      el.querySelector<HTMLElement>("[contenteditable]") ??
      el.querySelector<HTMLElement>("button");
    focusable?.focus({ preventScroll: true });
  };

  const flash = useCallback(
    (field: string) => {
      if (!field) return;
      setHighlightedField(field);

      const tryFind = (attempt: number) => {
        const el = document.querySelector<HTMLElement>(
          `[data-field="${CSS.escape(field)}"]`,
        );
        if (el) {
          // Auto-expand any collapsed parents (accordion rows, etc.).
          openAncestorCollapsibles(el);
          // Defer one more frame so the expand animation makes the node
          // visible before we measure and scroll.
          requestAnimationFrame(() => {
            const fresh =
              document.querySelector<HTMLElement>(
                `[data-field="${CSS.escape(field)}"]`,
              ) ?? el;
            fresh.scrollIntoView({ behavior: "smooth", block: "center" });
            focusInside(fresh);
          });
          return;
        }
        if (attempt < 8) {
          // Wait for tab content / collapsibles / language tabs to mount.
          requestAnimationFrame(() => tryFind(attempt + 1));
        }
      };
      requestAnimationFrame(() => tryFind(0));

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
