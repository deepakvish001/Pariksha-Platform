import { motion } from "framer-motion";
import { Loader2, Sparkles, Check, Gift } from "lucide-react";
import { GlassPanel } from "./GlassPanel";
import { NeonButton } from "./NeonButton";
import { useUserDailyQuests, claimQuest } from "../dailyLoop";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Renders a player's three rotating daily quests with progress bars and a
 * Claim button that surfaces inline when a quest is completed but unclaimed.
 */
export function DailyQuestsPanel() {
  const { quests, loading, refresh } = useUserDailyQuests();
  const [claiming, setClaiming] = useState<string | null>(null);

  async function handleClaim(id: string) {
    setClaiming(id);
    try {
      const res = await claimQuest(id);
      if (res.xp) toast.success(`+${res.xp} XP claimed`);
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setClaiming(null);
    }
  }

  return (
    <GlassPanel className="p-5 space-y-3" data-testid="daily-quests-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Daily Quests
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase">resets at midnight UTC</span>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : quests.length === 0 ? (
        <p className="text-xs text-muted-foreground">No quests available right now.</p>
      ) : (
        <ul className="space-y-2.5">
          {quests.map((q, i) => {
            const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
            const done = q.completed;
            return (
              <motion.li
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-border bg-card/40 p-3 space-y-2"
                data-testid={`quest-row-${q.kind ?? "unknown"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{q.title ?? "Quest"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono">{q.progress}/{q.target}</div>
                    <div className="text-[10px] text-primary uppercase">+{q.xp_reward} XP</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${done ? "bg-lime-400" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {done && !q.claimed && (
                  <NeonButton
                    tone="lime"
                    size="sm"
                    onClick={() => handleClaim(q.id)}
                    disabled={claiming === q.id}
                    data-testid={`quest-claim-${q.id}`}
                    className="w-full"
                  >
                    {claiming === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                      <span className="inline-flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Claim {q.xp_reward} XP</span>
                    )}
                  </NeonButton>
                )}
                {q.claimed && (
                  <p className="flex items-center gap-1 text-[10px] text-lime-400 uppercase">
                    <Check className="h-3 w-3" /> Claimed
                  </p>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}
