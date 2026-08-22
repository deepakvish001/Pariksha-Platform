import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, X, Bell } from "lucide-react";
import { toast } from "sonner";

interface AnomalyEvent {
  id: string;
  session_id: string;
  user_id: string;
  seq: number;
  storage_path: string | null;
  payload: any;
  created_at: string;
}

/**
 * Floating ticker that listens to `sideeye_evidence_chain` inserts in real time
 * and surfaces medium+ severity anomalies to admins watching the proctor page.
 */
export function SideEyeAnomalyTicker({ contestId }: { contestId: string }) {
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`sideeye-ticker-${contestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sideeye_evidence_chain",
          filter: "kind=eq.frame",
        },
        (payload) => {
          const row = payload.new as AnomalyEvent;
          const sev = row.payload?.severity;
          if (sev !== "medium" && sev !== "high" && sev !== "critical") return;
          setEvents((prev) => [row, ...prev].slice(0, 20));
          toast.warning(
            `SideEye ${sev}: ${row.payload?.summary?.notes ?? "anomaly detected"}`,
            { duration: sev === "critical" ? 10_000 : 5_000 },
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contestId]);

  if (events.length === 0) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-amber-500/40">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-500 animate-pulse" />
          <span className="text-sm font-semibold">Live SideEye anomalies</span>
          <Badge variant="outline" className="text-xs">{events.length}</Badge>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6"
            aria-label={collapsed ? "Expand anomaly list" : "Collapse anomaly list"}
            onClick={() => setCollapsed((c) => !c)}>
            <AlertTriangle className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6"
            aria-label="Dismiss all anomalies"
            onClick={() => setEvents([])}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {!collapsed && (
        <ScrollArea className="h-64">
          <ul className="divide-y">
            {events.map((e) => {
              const sev = e.payload?.severity ?? "info";
              const sevColor =
                sev === "critical" ? "text-destructive" :
                sev === "high" ? "text-amber-500" : "text-muted-foreground";
              return (
                <li key={e.id} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold uppercase ${sevColor}`}>{sev}</span>
                    <span className="text-muted-foreground">
                      {new Date(e.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-foreground/80 line-clamp-2">
                    {e.payload?.summary?.notes ?? "Side camera anomaly"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground truncate">
                    seq #{e.seq} · {e.user_id.slice(0, 8)}
                  </p>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </Card>
  );
}
