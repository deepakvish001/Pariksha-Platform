// Lightweight wrapper around gtag.js for custom GA4 event tracking.
// Safe no-op when gtag is unavailable (e.g. ad-blocker or SSR).

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params: EventParams = {}) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    // Strip undefined values — GA4 rejects them.
    const clean: EventParams = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined) clean[k] = v;
    window.gtag("event", name, clean);
  } catch {
    /* ignore */
  }
}

// Conventional GA4 event names where they exist; custom ones otherwise.
export const trackSignup = (method: "email" | "google" | string) =>
  trackEvent("sign_up", { method });

export const trackLogin = (method: "email" | "google" | string) =>
  trackEvent("login", { method });

export const trackContactClick = (channel: "email" | "phone" | "whatsapp" | string, location?: string) =>
  trackEvent("contact_click", { channel, location });

export const trackButtonPress = (label: string, location?: string) =>
  trackEvent("button_press", { label, location });

export const trackOutboundClick = (url: string, location?: string) =>
  trackEvent("outbound_click", { url, location });
