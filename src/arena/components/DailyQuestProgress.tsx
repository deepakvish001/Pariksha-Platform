import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Gift, Sparkles, Loader2 } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { useUserDailyQuests } from "../dailyLoop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Compact quest progress indicator on /arena/daily. Shows claimed vs
 * completed counts and live-updates as the player makes progress via the
 * Supabase Realtime channel on `arena_user_daily_quests`.
 */
export function DailyQuestProgress() {
  const { user } = useAuth();
  const { quests, loading, refresh } = useUserDailyQuests();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`quests:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "arena_user_daily_quests", filter: `user_id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refresh]);

  const total = quests.length;
  const completed = quests.filter((q) => q.completed).length;
  const claimed = quests.filter((q) => q.claimed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <GlassPanel className="p-4 space-y-3" data-testid="daily-quest-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-primary" /> Today's Quests
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-3 text-[11px] uppercase">
            <span className="text-muted-foreground">
              <span className="text-foreground font-mono">{completed}</span>/{total} done
            </span>
            <span className="text-lime-400 inline-flex items-center gap-1">
              <Gift className="h-3 w-3" /> <span className="font-mono">{claimed}</span> claimed
            </span>
          </div>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-gradient-to-r from-primary to-lime-400"
        />
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {quests.map((q) => (
          <li
            key={q.id}
            data-testid={`quest-tile-${q.id}`}
            className={`rounded-md border px-2 py-1.5 text-[11px] flex items-center gap-1.5 ${
              q.claimed
                ? "border-lime-500/40 bg-lime-500/10 text-lime-400"
                : q.completed
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card/40 text-muted-foreground"
            }`}
          >
            {q.claimed ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : null}
            <span className="truncate font-medium">{q.title ?? q.kind ?? "Quest"}</span>
            <span className="ml-auto font-mono">{q.progress}/{q.target}</span>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
