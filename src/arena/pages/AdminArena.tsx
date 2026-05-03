import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";

export default function AdminArena() {
  const [stats, setStats] = useState({ live: 0, queue: 0, ended: 0, players: 0 });
  useEffect(() => {
    (async () => {
      const [live, queue, ended, players] = await Promise.all([
        supabase.from("battles" as never).select("id", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("battle_queue" as never).select("user_id", { count: "exact", head: true }),
        supabase.from("battles" as never).select("id", { count: "exact", head: true }).eq("status", "ended"),
        supabase.from("player_ratings" as never).select("user_id", { count: "exact", head: true }),
      ]);
      setStats({ live: live.count ?? 0, queue: queue.count ?? 0, ended: ended.count ?? 0, players: players.count ?? 0 });
    })();
  }, []);
  const cards = [
    { label: "Live Battles", value: stats.live, glow: "lime" as const },
    { label: "In Queue", value: stats.queue, glow: "cyan" as const },
    { label: "Total Battles", value: stats.ended, glow: "magenta" as const },
    { label: "Ranked Players", value: stats.players, glow: "cyan" as const },
  ];
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-black">Arena Analytics</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <GlassPanel key={c.label} glow={c.glow} className="p-5">
            <div className="text-xs uppercase text-muted-foreground">{c.label}</div>
            <div className="text-3xl font-black mt-2">{c.value}</div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
