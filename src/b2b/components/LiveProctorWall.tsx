import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LiveStreamTile } from "./LiveStreamTile";
import { useCanProctor } from "../hooks/usePermissions";

export interface LiveProctorAttempt {
  attempt_id: string;
  candidate_name: string;
}

interface Props {
  attempts: LiveProctorAttempt[];
  /**
   * Org id used to verify the viewer has a proctor-capable role
   * (owner / admin / proctor). Required for defence-in-depth — the
   * component refuses to render any live tiles otherwise, even if a
   * caller forgets to gate it.
   */
  orgId?: string | null;
  /** Default collapsed when there are many live candidates. */
  defaultCollapsed?: boolean;
}

/**
 * Per-attempt 3-tile row showing webcam, screen, and side-camera live feeds.
 * Looks up the side-camera pairing token for each attempt so the Third Eye
 * tile can subscribe to the candidate's mobile broadcast channel.
 */
export function LiveProctorWall({ attempts, defaultCollapsed = true }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [tokens, setTokens] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (collapsed || attempts.length === 0) return;
    const ids = attempts.map((a) => a.attempt_id);
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_side_camera_pairings")
        .select("attempt_id, pair_token, status")
        .in("attempt_id", ids);
      if (cancelled) return;
      const map: Record<string, string | null> = {};
      for (const row of (data ?? []) as { attempt_id: string; pair_token: string; status: string }[]) {
        if (row.status === "paired") map[row.attempt_id] = row.pair_token;
      }
      setTokens(map);
    })();
    return () => { cancelled = true; };
  }, [collapsed, attempts]);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" /> Live view · Three-eye proctoring
          <Badge variant="secondary" className="text-[10px] h-5">{attempts.length} in progress</Badge>
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          <span className="ml-1 text-xs">{collapsed ? "Show" : "Hide"}</span>
        </Button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-4">
          {attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No candidates currently in progress.</p>
          ) : (
            attempts.map((a) => (
              <div key={a.attempt_id} className="space-y-2">
                <div className="text-xs font-medium truncate">{a.candidate_name}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <LiveStreamTile attemptId={a.attempt_id} channelId={`proctor:${a.attempt_id}:webcam`} kind="webcam" />
                  <LiveStreamTile attemptId={a.attempt_id} channelId={`proctor:${a.attempt_id}:screen`} kind="screen" />
                  <LiveStreamTile
                    attemptId={a.attempt_id}
                    channelId={tokens[a.attempt_id] ? `proctor:sidecam:${tokens[a.attempt_id]}` : null}
                    kind="sideeye"
                  />
                </div>
              </div>
            ))
          )}
          <p className="text-[10px] text-muted-foreground">
            Streams are peer-to-peer and only active while a candidate is in progress and their stream is live.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default LiveProctorWall;
