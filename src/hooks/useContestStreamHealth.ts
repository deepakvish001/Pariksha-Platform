import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StreamHealthState {
  webcamHealthy: boolean;
  screenHealthy: boolean;
  graceUntil: number | null;
}

/**
 * Subscriber for `contest_stream_health` rows belonging to a contest session.
 * Pulls the latest snapshot every 5s so the kiosk banner can react to grace
 * periods triggered by `contest_report_stream_health` server-side. Read-only —
 * does not duplicate any media tracks.
 */
export function useContestStreamHealth(sessionId: string | null | undefined) {
  const [state, setState] = useState<StreamHealthState>({
    webcamHealthy: true,
    screenHealthy: true,
    graceUntil: null,
  });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const fetchHealth = async () => {
      const { data } = await supabase
        .from("contest_stream_health" as never)
        .select("kind,healthy,grace_until")
        .eq("session_id", sessionId);
      if (cancelled || !data) return;
      const rows = data as { kind: string; healthy: boolean; grace_until: string | null }[];
      const webcam = rows.find((r) => r.kind === "webcam");
      const screen = rows.find((r) => r.kind === "screen");
      const grace = rows
        .map((r) => (r.grace_until ? new Date(r.grace_until).getTime() : null))
        .filter((v): v is number => !!v && v > Date.now())
        .sort((a, b) => a - b)[0] ?? null;
      setState({
        webcamHealthy: webcam ? webcam.healthy : true,
        screenHealthy: screen ? screen.healthy : true,
        graceUntil: grace,
      });
    };
    void fetchHealth();
    const id = window.setInterval(fetchHealth, 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  return state;
}
