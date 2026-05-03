import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { MatchmakingOrb } from "../components/MatchmakingOrb";
import { Button } from "@/components/ui/button";
import { leaveQueue, joinQueue } from "../hooks";
import type { BattleDifficulty } from "../types";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

type Status = "searching" | "error" | "cancelled";

export default function ArenaQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const state = (location.state as { topic?: string | null; difficulty?: BattleDifficulty } | null) ?? {};
  const topic = state.topic ?? null;
  const difficulty: BattleDifficulty = state.difficulty ?? "medium";

  const [elapsed, setElapsed] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<Status>("searching");
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    if (status !== "searching") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  // Realtime: jump to battle when one is created with us in it
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`arena-match-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battles" }, (p) => {
        const b = p.new as { id: string; player_a: string; player_b: string };
        if (b.player_a === user.id || b.player_b === user.id) {
          navigate(`/arena/battle/${b.id}`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, navigate]);

  // Auto-retry matchmaking every 5s in case opponent is waiting
  useEffect(() => {
    if (!user || status !== "searching") return;
    cancelledRef.current = false;
    const tick = async () => {
      if (cancelledRef.current) return;
      setAttempts((n) => n + 1);
      try {
        const battleId = await joinQueue(topic, difficulty);
        if (battleId) navigate(`/arena/battle/${battleId}`);
      } catch (e) {
        setError((e as Error).message || "Matchmaking failed");
        setStatus("error");
      }
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => { cancelledRef.current = true; clearInterval(t); };
  }, [user, topic, difficulty, navigate, status]);

  async function cancel() {
    cancelledRef.current = true;
    if (user) await leaveQueue(user.id);
    setStatus("cancelled");
    navigate("/arena");
  }

  function retry() {
    setError(null);
    setAttempts(0);
    setStatus("searching");
  }

  if (status === "error") {
    return (
      <GlassPanel glow="magenta" className="p-8 max-w-md mx-auto text-center" data-testid="queue-error">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="mt-4 text-xl font-bold">Matchmaking failed</h2>
        <p className="mt-2 text-sm text-destructive break-words">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          We tried {attempts} time{attempts === 1 ? "" : "s"} before failing.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={retry}><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
          <Button variant="ghost" onClick={() => navigate("/arena")}>Back to Arena</Button>
        </div>
      </GlassPanel>
    );
  }

  const wait =
    elapsed < 15 ? "Searching at your Elo..." :
    elapsed < 45 ? "Expanding search radius..." :
    elapsed < 90 ? "Looking for any opponent..." :
    "Still searching — opponents may be scarce. Hang tight or try a different topic.";

  return (
    <GlassPanel glow="cyan" className="p-8 max-w-md mx-auto text-center" data-testid="queue-searching">
      <div className="flex justify-center gap-2 mb-2">
        <span className="rounded-full border border-primary/40 bg-primary/10 text-primary text-[10px] uppercase tracking-wider px-2 py-0.5">{difficulty}</span>
        {topic && <span className="rounded-full border border-border text-xs text-muted-foreground px-2 py-0.5 capitalize">{topic.replace("-", " ")}</span>}
      </div>
      <MatchmakingOrb />
      <p className="font-mono text-2xl text-primary" aria-label="elapsed-time">
        {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
      </p>
      <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" /> {wait}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1" data-testid="queue-attempts">
        Attempt {attempts || 1} · auto-retry every 5s
      </p>
      <Button variant="ghost" className="mt-6" onClick={cancel}>Cancel</Button>
    </GlassPanel>
  );
}
