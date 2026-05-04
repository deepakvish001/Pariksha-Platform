import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps `window.fetch`, `XMLHttpRequest.open`, `WebSocket`, and
 * `RTCPeerConnection` for the contest kiosk lifetime so any outbound
 * connection to a non-allowlisted host is logged to
 * `contest_network_audit`. We intentionally don't *block* requests at
 * runtime (an ad-blocker or extension can break the page), but we mark
 * each row with a severity so admin alerts can fan out:
 *   - info: out-of-allowlist HTTP request
 *   - warn: WebSocket to non-allowlisted host
 *   - high: RTCPeerConnection (data-channel exfil) or known AI host
 *
 * Tier 4 hardening: also tags the page path so admins can see which
 * contest screen the call originated from.
 */
const ALLOW_HOSTS = [
  "supabase.co",
  "supabase.in",
  "lovable.app",
  "lovable.dev",
  "lovableproject.com",
  "localhost",
  "127.0.0.1",
  "fermion.one",
  "judge0.com",
  "rapidapi.com",
];

// Hosts we treat as "high severity" — known LLM / coding-help endpoints
// that have no business being called from inside a contest kiosk.
const HIGH_SEVERITY_PATTERNS = [
  /openai\.com$/i,
  /anthropic\.com$/i,
  /\.googleapis\.com$/i, // includes generativelanguage
  /perplexity\.ai$/i,
  /poe\.com$/i,
  /chatgpt\.com$/i,
  /copilot\.microsoft\.com$/i,
  /(^|\.)bard\.google\.com$/i,
  /you\.com$/i,
  /huggingface\.co$/i,
  /replicate\.com$/i,
  /codeium\.com$/i,
  /tabnine\.com$/i,
  /(leetcode|geeksforgeeks|hackerrank|codeforces)\.com$/i,
];

function isAllowed(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin) return true;
    const host = u.host.toLowerCase();
    return ALLOW_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return true;
  }
}

function severityFor(host: string, transport: "http" | "ws" | "rtc"): "info" | "warn" | "high" {
  if (transport === "rtc") return "high";
  if (HIGH_SEVERITY_PATTERNS.some((p) => p.test(host))) return "high";
  if (transport === "ws") return "warn";
  return "info";
}

interface AuditEntry {
  url: string;
  host: string;
  method: string;
  severity: "info" | "warn" | "high";
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
    const origWebSocket = window.WebSocket;
    const origRTC = window.RTCPeerConnection;
    const recent = new Map<string, number>();

    const audit = (entry: AuditEntry) => {
      const now = Date.now();
      const key = `${entry.severity}:${entry.url}`;
      const last = recent.get(key) ?? 0;
      // High-severity events bypass the dedupe window (10s instead of 30s)
      const window_ms = entry.severity === "high" ? 10_000 : 30_000;
      if (now - last < window_ms) return;
      recent.set(key, now);
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
          severity: entry.severity,
          page_path: window.location.pathname,
        } as never);
    };

    // ---- fetch ----
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
          audit({
            url,
            host: u.host,
            method: (init?.method ?? "GET").toUpperCase(),
            severity: severityFor(u.host, "http"),
          });
        }
      } catch { /* ignore */ }
      return origFetch(input as RequestInfo, init);
    };

    // ---- XHR ----
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
          audit({
            url: urlStr,
            host: u.host,
            method: method.toUpperCase(),
            severity: severityFor(u.host, "http"),
          });
        }
      } catch { /* ignore */ }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (origOpen as any).call(this, method, url, ...rest);
    } as typeof XMLHttpRequest.prototype.open;

    // ---- WebSocket ----
    const PatchedWS = function (this: WebSocket, url: string | URL, protocols?: string | string[]) {
      try {
        const urlStr = typeof url === "string" ? url : url.toString();
        if (!isAllowed(urlStr)) {
          const u = new URL(urlStr, window.location.origin);
          audit({
            url: urlStr,
            host: u.host,
            method: "WS",
            severity: severityFor(u.host, "ws"),
          });
        }
      } catch { /* ignore */ }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (origWebSocket as any)(url, protocols);
    } as unknown as typeof WebSocket;
    PatchedWS.prototype = origWebSocket.prototype;
    Object.assign(PatchedWS, origWebSocket);
    window.WebSocket = PatchedWS;

    // ---- RTCPeerConnection (data-channel exfil) ----
    if (origRTC) {
      const PatchedRTC = function (this: RTCPeerConnection, ...args: unknown[]) {
        audit({
          url: "rtc:peer-connection",
          host: "webrtc",
          method: "RTC",
          severity: "high",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (origRTC as any)(...args);
      } as unknown as typeof RTCPeerConnection;
      PatchedRTC.prototype = origRTC.prototype;
      Object.assign(PatchedRTC, origRTC);
      window.RTCPeerConnection = PatchedRTC;
    }

    return () => {
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
      window.WebSocket = origWebSocket;
      if (origRTC) window.RTCPeerConnection = origRTC;
    };
  }, [enabled, contestId, sessionId, user]);
}
