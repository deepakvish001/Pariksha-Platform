import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import type { Battle } from "../types";

export default function ArenaHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Battle[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("battles" as never).select("*").or(`player_a.eq.${user.id},player_b.eq.${user.id}`).order("created_at", { ascending: false }).limit(50);
      setRows((data ?? []) as Battle[]);
    })();
  }, [user]);
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <GlassPanel glow="cyan" className="p-4"><h1 className="text-xl font-black">Battle History</h1></GlassPanel>
      <GlassPanel className="p-2">
        {rows.length === 0 && <div className="p-6 text-center text-muted-foreground/60">No battles yet.</div>}
        {rows.map((b) => {
          const won = b.winner_id === user?.id;
          const draw = !b.winner_id;
          return (
            <Link key={b.id} to={`/arena/result/${b.id}`} className="flex items-center gap-3 rounded p-3 hover:bg-muted/30 border-b border-white/5 last:border-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${won ? "bg-lime-500/20 text-lime-300" : draw ? "bg-primary/20 text-primary" : "bg-red-500/20 text-red-300"}`}>{won ? "WIN" : draw ? "DRAW" : "LOSS"}</span>
              <span className="text-sm flex-1 truncate">{b.problem_slug}</span>
              <span className="text-xs text-muted-foreground/60">{new Date(b.created_at).toLocaleDateString()}</span>
            </Link>
          );
        })}
      </GlassPanel>
    </div>
  );
}
