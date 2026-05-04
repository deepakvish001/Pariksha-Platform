import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pause, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logSideEyeAction } from "./lib/adminAuditLog";

interface PauseRow {
  id: string;
  paused_at: string;
  resumed_at: string | null;
  reason: string | null;
}

/**
 * Pause/Resume button pair for a SideEye session.
 * Reflects current pause state from the most recent open pause row.
 */
export const SideEyePauseControls = ({ sessionId }: { sessionId: string }) => {
  const [openPause, setOpenPause] = useState<PauseRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState<null | "pause" | "resume">(null);

  const load = async () => {
    const { data } = await supabase
      .from("sideeye_session_pauses")
      .select("id, paused_at, resumed_at, reason")
      .eq("session_id", sessionId)
      .is("resumed_at", null)
      .order("paused_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOpenPause((data as PauseRow) ?? null);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`sideeye-pauses-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sideeye_session_pauses", filter: `session_id=eq.${sessionId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [sessionId]);

  const call = async (action: "pause" | "resume") => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("contest-sideeye-pause", {
        body: { sessionId, action, reason: action === "pause" ? (reason.trim() || null) : null },
      });
      if (error) throw error;
      toast.success(action === "pause" ? "Session paused" : "Session resumed");
      if (action === "pause") setReason("");
      await load();
    } catch (e: any) {
      toast.error(`${action} failed`, { description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (openPause) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="border-amber-500/40 text-amber-300">
          ⏸ Paused {new Date(openPause.paused_at).toLocaleTimeString()}
        </Badge>
        {openPause.reason && (
          <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
            “{openPause.reason}”
          </span>
        )}
        <Button size="sm" onClick={() => call("resume")} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          Resume
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Pause reason (optional)"
        className="h-8 text-xs max-w-[220px]"
      />
      <Button size="sm" variant="outline" onClick={() => call("pause")} disabled={busy}>
        {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Pause className="mr-1 h-3 w-3" />}
        Pause monitoring
      </Button>
    </div>
  );
};

export default SideEyePauseControls;
