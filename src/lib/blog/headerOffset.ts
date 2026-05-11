/**
 * Responsive header offset for deep-link scrolling and active-section detection.
 * Mobile has a slimmer sticky header than desktop, plus the reading-progress bar.
 * Returns a single value to keep callers simple.
 */
export function getHeaderOffset(): number {
  if (typeof window === "undefined") return 88;
  // Tailwind `lg` breakpoint = 1024px. Below that we use the mobile header.
  return window.innerWidth >= 1024 ? 88 : 64;
}
