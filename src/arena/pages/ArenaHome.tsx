import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { EloBadge } from "../components/EloBadge";
import { useMyRating, joinQueue, ensureRating } from "../hooks";
import { TOPICS, type BattleDifficulty } from "../types";
import { motion } from "framer-motion";
import { Swords, Zap, Target, Flame } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function ArenaHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rating, loading } = useMyRating(user?.id);
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<BattleDifficulty>("medium");
  const [searching, setSearching] = useState(false);

  useEffect(() => { if (user?.id) ensureRating(user.id); }, [user?.id]);

  async function quickMatch() {
    if (!user) { navigate("/login"); return; }
    setSearching(true);
    try {
      const battleId = await joinQueue(topic, difficulty);
      if (battleId) {
        navigate(`/arena/battle/${battleId}`);
      } else {
        navigate("/arena/queue");
      }
    } catch (e) {
      toast.error((e as Error).message);
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassPanel glow="cyan" className="p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.2),transparent_60%)]" />
          <h1 className="relative text-5xl font-black tracking-tight bg-gradient-to-br from-white via-cyan-200 to-fuchsia-300 bg-clip-text text-transparent">
            Enter the Arena
          </h1>
          <p className="relative mt-2 text-white/60">1v1 real-time coding battles · Earn Elo · Climb the ladder</p>
          {rating && (
            <div className="relative mt-4 flex items-center justify-center gap-3">
              <EloBadge elo={rating.elo} />
              <span className="text-xs text-white/50">
                {rating.wins}W · {rating.losses}L · {rating.current_streak > 0 ? `🔥 ${rating.current_streak}` : ""}
              </span>
            </div>
          )}
        </GlassPanel>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassPanel className="p-5 md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Quick Match
          </h2>
          <div>
            <label className="text-xs text-white/50 uppercase">Difficulty</label>
            <div className="mt-2 flex gap-2">
              {(["easy", "medium", "hard"] as BattleDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition ${
                    difficulty === d ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase">Topic (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => setTopic(null)} className={`rounded-full border px-3 py-1 text-xs ${topic === null ? "border-cyan-400 text-cyan-300" : "border-white/10 text-white/50"}`}>
                Any
              </button>
              {TOPICS.map((t) => (
                <button key={t} onClick={() => setTopic(t)} className={`rounded-full border px-3 py-1 text-xs capitalize ${topic === t ? "border-cyan-400 text-cyan-300" : "border-white/10 text-white/50 hover:text-white"}`}>
                  {t.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
          <NeonButton size="lg" className="w-full" onClick={quickMatch} disabled={loading || searching}>
            <Swords className="mr-2 h-4 w-4" /> {searching ? "Searching..." : "Find Match"}
          </NeonButton>
        </GlassPanel>

        <GlassPanel glow="magenta" className="p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-2">
            <Target className="h-4 w-4" /> Other Modes
          </h2>
          <button onClick={() => navigate("/arena/private")} className="block w-full rounded-md border border-white/10 p-3 text-left hover:border-fuchsia-400/50 transition">
            <div className="font-bold">Private Match</div>
            <div className="text-xs text-white/50">Challenge a friend</div>
          </button>
          <button onClick={() => navigate("/arena/leaderboard")} className="block w-full rounded-md border border-white/10 p-3 text-left hover:border-cyan-400/50 transition">
            <div className="font-bold flex items-center gap-2"><Flame className="h-4 w-4 text-orange-400" /> Leaderboard</div>
            <div className="text-xs text-white/50">Top 100 players</div>
          </button>
          <button onClick={() => navigate("/arena/history")} className="block w-full rounded-md border border-white/10 p-3 text-left hover:border-lime-400/50 transition">
            <div className="font-bold">My Battle History</div>
            <div className="text-xs text-white/50">Recent matches & replays</div>
          </button>
        </GlassPanel>
      </div>
    </div>
  );
}
