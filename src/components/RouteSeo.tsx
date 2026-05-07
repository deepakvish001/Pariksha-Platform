import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Keeps canonical, og:url, twitter:url in sync with the current route,
 * and rewrites any JSON-LD blocks that hardcoded a base URL to use
 * the current production origin (so it works across preview / published / custom domains).
 */
const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    if (selector.startsWith("link")) {
      (el as HTMLLinkElement).rel = "canonical";
    } else {
      const m = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (m) (el as HTMLMetaElement).setAttribute(m[1], m[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const HARDCODED_HOSTS = [
  "https://exact-web-sight.lovable.app",
  "http://exact-web-sight.lovable.app",
];

const rewriteJsonLdOrigin = (origin: string) => {
  const blocks = document.head.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]',
  );
  blocks.forEach((b) => {
    let txt = b.textContent ?? "";
    let changed = false;
    HARDCODED_HOSTS.forEach((h) => {
      if (txt.includes(h)) {
        txt = txt.split(h).join(origin);
        changed = true;
      }
    });
    if (changed) b.textContent = txt;
  });
};

export const RouteSeo = () => {
  const loc = useLocation();

  useEffect(() => {
    const origin = window.location.origin;
    const url = origin + loc.pathname + loc.search;

    setMeta('link[rel="canonical"]', "href", origin + loc.pathname);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:url"]', "content", url);

    // Sync OG/Twitter title with current document.title (set per page).
    const title = document.title;
    if (title) {
      setMeta('meta[property="og:title"]', "content", title);
      setMeta('meta[name="twitter:title"]', "content", title);
    }

    rewriteJsonLdOrigin(origin);
  }, [loc.pathname, loc.search]);

  return null;
};

export default RouteSeo;
