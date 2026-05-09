import { supabase } from "@/integrations/supabase/client";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;
type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

const UTM_STORAGE_KEY = "lead_utm";
const SESSION_STORAGE_KEY = "lead_session_id";
const FIRST_TOUCH_KEY = "lead_utm_first";

function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Capture UTM params from the current URL and persist them.
 * Stores both the latest touch and the first touch for attribution. */
export function captureUtm(): Utm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 120);
  }
  const storage = safeStorage();
  if (storage && Object.keys(utm).length) {
    storage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    if (!storage.getItem(FIRST_TOUCH_KEY)) {
      storage.setItem(FIRST_TOUCH_KEY, JSON.stringify(utm));
    }
  }
  return getStoredUtm();
}

export function getStoredUtm(): Utm {
  const storage = safeStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

export function getSessionId(): string {
  const storage = safeStorage();
  if (!storage) return "anon";
  let id = storage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

/** Fire-and-forget conversion event recorder. Never throws. */
export async function trackLeadEvent(
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (typeof window === "undefined") return;
  const utm = getStoredUtm();
  try {
    await supabase.from("lead_events").insert({
      event_type: eventType,
      page: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      utm_source: utm.source ?? null,
      utm_medium: utm.medium ?? null,
      utm_campaign: utm.campaign ?? null,
      utm_term: utm.term ?? null,
      utm_content: utm.content ?? null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
      metadata,
    });
  } catch (err) {
    // Best-effort; never block the UI on tracking
    console.warn("[trackLeadEvent] failed", err);
  }
}
