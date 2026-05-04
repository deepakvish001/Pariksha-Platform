import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps `window.fetch` and `XMLHttpRequest.open` for the contest kiosk
 * lifetime so any outbound request to a non-allowlisted host is logged
 * to `contest_network_audit`. We intentionally don't *block* requests —
 * blocking at runtime risks breaking the page itself if e.g. an ad-blocker
 * or extension injects a request. Instead we surface the audit to admins.
 *
 * The allowlist covers Supabase, the Lovable preview/published domains,
 * and the Fermion/Judge0 backends used for code execution.
 */
const ALLOW_HOSTS = [
  // Supabase project (anything *.supabase.co + lovable cloud edge fn host)
  "supabase.co",
  "supabase.in",
  // Lovable hosting
  "lovable.app",
  "lovable.dev",
  "lovableproject.com",
  // Localhost / preview
  "localhost",
  "127.0.0.1",
  // Code execution providers
  "fermion.one",
  "judge0.com",
  "rapidapi.com",
  // Self-origin is added dynamically
];

function isAllowed(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) return true;
    const host = u.host.toLowerCase();
    return ALLOW_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true; // malformed → don't bother auditing
  }
}

interface AuditEntry {
  url: string;
  host: string;
  method: string;
}

export function useFetchInterceptor(opts: {
  contestId: string | undefined;
  sessionId: string | null | undefined;
  enabled: boolean;
}) {
  const { contestId, sessionId, enabled } = opts;
  const { user } = useAuth();

  useEffect(() => {
    if (!enabled || !contestId || !sessionId || !user) return;

    const origFetch = window.fetch.bind(window);
    const origOpen = XMLHttpRequest.prototype.open;
    const recent = new Map<string, number>(); // url → last-logged ts (dedupe)

    const audit = (entry: AuditEntry) => {
      const now = Date.now();
      const last = recent.get(entry.url) ?? 0;
      if (now - last < 30_000) return; // dedupe within 30s
      recent.set(entry.url, now);
      void supabase
        .from("contest_network_audit" as never)
        .insert({
          contest_id: contestId,
          user_id: user.id,
          session_id: sessionId,
          host: entry.host,
          url: entry.url.slice(0, 1000),
          method: entry.method,
          blocked: false,
          page_path: window.location.pathname,
        } as never);
    };

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if (!isAllowed(url)) {
          const u = new URL(url, window.location.origin);
          audit({ url, host: u.host, method: (init?.method ?? "GET").toUpperCase() });
        }
      } catch { /* ignore audit errors */ }
      return origFetch(input as RequestInfo, init);
    };

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      ...rest: unknown[]
    ) {
      try {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (!isAllowed(urlStr)) {
          const u = new URL(urlStr, window.location.origin);
          audit({ url: urlStr, host: u.host, method: method.toUpperCase() });
        }
      } catch { /* ignore */ }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (origOpen as any).call(this, method, url, ...rest);
    } as typeof XMLHttpRequest.prototype.open;

    return () => {
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
    };
  }, [enabled, contestId, sessionId, user]);
}
