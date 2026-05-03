import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { MatchmakingOrb } from "../components/MatchmakingOrb";
import { Button } from "@/components/ui/button";
import { leaveQueue, joinQueue } from "../hooks";
import type { BattleDifficulty } from "../types";

export default function ArenaQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const state = (location.state as { topic?: string | null; difficulty?: BattleDifficulty } | null) ?? {};
  const topic = state.topic ?? null;
  const difficulty: BattleDifficulty = state.difficulty ?? "medium";
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
    if (!user) return;
    const t = setInterval(async () => {
      try {
        const battleId = await joinQueue(topic, difficulty);
        if (battleId) navigate(`/arena/battle/${battleId}`);
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(t);
  }, [user, topic, difficulty, navigate]);

  async function cancel() {
    if (user) await leaveQueue(user.id);
    navigate("/arena");
  }

  const wait = elapsed < 15 ? "Searching at your Elo..." : elapsed < 45 ? "Expanding search radius..." : "Looking for any opponent...";

  return (
    <GlassPanel glow="cyan" className="p-8 max-w-md mx-auto text-center">
      <div className="flex justify-center gap-2 mb-2">
        <span className="rounded-full border border-primary/40 bg-primary/10 text-primary text-[10px] uppercase tracking-wider px-2 py-0.5">{difficulty}</span>
        {topic && <span className="rounded-full border border-border text-xs text-muted-foreground px-2 py-0.5 capitalize">{topic.replace("-", " ")}</span>}
      </div>
      <MatchmakingOrb />
      <p className="font-mono text-2xl text-primary">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}</p>
      <p className="text-xs text-muted-foreground mt-2">{wait}</p>
      <Button variant="ghost" className="mt-6" onClick={cancel}>Cancel</Button>
    </GlassPanel>
  );
}
