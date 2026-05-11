/** Smooth-scroll to a heading id with header offset; updates the URL hash without jump. */
export function scrollToHeading(id: string, offset = 88) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
  history.replaceState(null, "", `#${id}`);
  // Move keyboard focus for a11y, but don't yank the viewport.
  el.setAttribute("tabindex", "-1");
  (el as HTMLElement).focus({ preventScroll: true });
}
