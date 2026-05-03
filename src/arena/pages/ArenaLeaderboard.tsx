import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { EloBadge } from "../components/EloBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface Row { user_id: string; elo: number; wins: number; losses: number; current_streak: number; profile?: { full_name: string | null; avatar_url: string | null } }

export default function ArenaLeaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("player_ratings" as never).select("user_id,elo,wins,losses,current_streak").order("elo", { ascending: false }).limit(100);
      const players = (data ?? []) as Row[];
      const ids = players.map((p) => p.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,full_name,avatar_url").in("user_id", ids);
        const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
        for (const r of players) r.profile = map.get(r.user_id) as Row["profile"];
      }
      setRows(players);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <GlassPanel glow="cyan" className="p-6 flex items-center gap-3">
        <Trophy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-black">Global Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Top 100 arena players by Elo</p>
        </div>
      </GlassPanel>
      <GlassPanel className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground/60 border-b border-border">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-right">W/L</th>
                <th className="p-3 text-right">Streak</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.user_id} className="border-b border-white/5 hover:bg-muted/30">
                  <td className="p-3 font-mono text-muted-foreground">{i + 1}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarImage src={r.profile?.avatar_url ?? undefined} /><AvatarFallback>{(r.profile?.full_name ?? "??").slice(0, 2)}</AvatarFallback></Avatar>
                      <span className="font-medium">{r.profile?.full_name ?? "Anonymous"}</span>
                    </div>
                  </td>
                  <td className="p-3"><EloBadge elo={r.elo} /></td>
                  <td className="p-3 text-right font-mono text-xs text-muted-foreground">{r.wins}/{r.losses}</td>
                  <td className="p-3 text-right">{r.current_streak > 0 ? <span className="text-orange-400">🔥 {r.current_streak}</span> : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground/60">Be the first to play!</td></tr>}
            </tbody>
          </table>
        )}
      </GlassPanel>
    </div>
  );
}
