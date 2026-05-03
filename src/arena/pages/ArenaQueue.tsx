import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { MatchmakingOrb } from "../components/MatchmakingOrb";
import { Button } from "@/components/ui/button";
import { leaveQueue } from "../hooks";

export default function ArenaQueue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { const t = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!user) return;
    // Listen for any battle inserted with us in it
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

  async function cancel() {
    if (user) await leaveQueue(user.id);
    navigate("/arena");
  }

  return (
    <GlassPanel glow="cyan" className="p-8 max-w-md mx-auto text-center">
      <MatchmakingOrb />
      <p className="font-mono text-2xl text-primary">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}</p>
      <p className="text-xs text-muted-foreground mt-2">Expanding search radius...</p>
      <Button variant="ghost" className="mt-6" onClick={cancel}>Cancel</Button>
    </GlassPanel>
  );
}
