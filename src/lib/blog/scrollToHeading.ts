/** Smooth-scroll to a heading id with header offset; updates the URL hash without jump. */
export function scrollToHeading(id: string, offset = 88, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior });
  history.replaceState(null, "", `#${id}`);
  // Move keyboard focus for a11y, but don't yank the viewport.
  el.setAttribute("tabindex", "-1");
  (el as HTMLElement).focus({ preventScroll: true });
}

/**
 * Scrolls to the URL hash (if present) with the correct header offset.
 * Polls briefly because markdown content may render after mount.
 */
export function scrollToHashOnLoad(offset = 88, maxWaitMs = 1500) {
  if (typeof window === "undefined") return;
  const raw = window.location.hash;
  if (!raw || raw.length < 2) return;
  const id = decodeURIComponent(raw.slice(1));
  const start = performance.now();
  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "auto" });
      el.setAttribute("tabindex", "-1");
      (el as HTMLElement).focus({ preventScroll: true });
      return;
    }
    if (performance.now() - start < maxWaitMs) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
