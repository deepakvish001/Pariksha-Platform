import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { EloBadge } from "../components/EloBadge";
import { useMyRating, joinQueue, ensureRating, createCodeRoom, joinByCode } from "../hooks";
import { TOPICS, type BattleDifficulty } from "../types";
import { motion } from "framer-motion";
import { Swords, Zap, KeyRound, Hash, Flame, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { DailyQuestsPanel } from "../components/DailyQuestsPanel";

export default function ArenaHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rating, loading } = useMyRating(user?.id);
  const [topic, setTopic] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<BattleDifficulty>("medium");
  const [searching, setSearching] = useState(false);

  // Create-room state
  const [roomDifficulty, setRoomDifficulty] = useState<BattleDifficulty>("medium");
  const [roomDuration, setRoomDuration] = useState(900);
  const [roomProblem, setRoomProblem] = useState("");
  const [problems, setProblems] = useState<Array<{ slug: string; title: string; difficulty: string }>>([]);
  const [creating, setCreating] = useState(false);

  // Join-by-code state
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => { if (user?.id) ensureRating(user.id); }, [user?.id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("coding_problems").select("slug,title,difficulty").eq("is_published", true).order("title").limit(200);
      setProblems(data ?? []);
    })();
  }, []);

  async function quickMatch() {
    if (!user) { navigate("/login"); return; }
    setSearching(true);
    try {
      const battleId = await joinQueue(topic, difficulty);
      if (battleId) navigate(`/arena/battle/${battleId}`);
      else navigate("/arena/queue", { state: { topic, difficulty } });
    } catch (e) {
      toast.error((e as Error).message);
      setSearching(false);
    }
  }

  async function createRoom() {
    if (!user) { navigate("/login"); return; }
    if (!roomProblem) { toast.error("Pick a problem"); return; }
    setCreating(true);
    try {
      const { invite_id, code: newCode } = await createCodeRoom({ problemSlug: roomProblem, difficulty: roomDifficulty, duration: roomDuration });
      navigate(`/arena/room/${newCode}`, { state: { inviteId: invite_id } });
    } catch (e) {
      toast.error((e as Error).message);
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!user) { navigate("/login"); return; }
    if (code.trim().length < 4) { toast.error("Enter a valid code"); return; }
    setJoining(true);
    try {
      const battleId = await joinByCode(code);
      navigate(`/arena/battle/${battleId}`);
    } catch (e) {
      toast.error((e as Error).message);
      setJoining(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassPanel glow="cyan" className="p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.2),transparent_60%)]" />
          <h1 className="relative text-5xl font-black tracking-tight gradient-text">Enter the Arena</h1>
          <p className="relative mt-2 text-muted-foreground">1v1 real-time coding battles · Earn Elo · Climb the ladder</p>
          {rating && (
            <div className="relative mt-4 flex items-center justify-center gap-3">
              <EloBadge elo={rating.elo} />
              <span className="text-xs text-muted-foreground">
                {rating.wins}W · {rating.losses}L {rating.current_streak > 0 ? `· 🔥 ${rating.current_streak}` : ""}
              </span>
            </div>
          )}
        </GlassPanel>
      </motion.div>

      {/* Daily habit loop */}
      <DailyChallengeCard />

      {/* Three primary modes + daily quests */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Quick Match */}
        <GlassPanel className="p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Zap className="h-4 w-4" /> Quick Match
          </h2>
          <p className="text-xs text-muted-foreground">Get matched with a player at your Elo</p>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Difficulty</label>
            <div className="mt-2 flex gap-2">
              {(["easy", "medium", "hard"] as BattleDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize transition ${
                    difficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Topic</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => setTopic(null)} className={`rounded-full border px-2.5 py-0.5 text-xs ${topic === null ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Any</button>
              {TOPICS.map((t) => (
                <button key={t} onClick={() => setTopic(t)} className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${topic === t ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{t.replace("-", " ")}</button>
              ))}
            </div>
          </div>
          <NeonButton className="w-full" onClick={quickMatch} disabled={loading || searching}>
            <Swords className="mr-2 h-4 w-4" /> {searching ? "Searching..." : "Find Match"}
          </NeonButton>
        </GlassPanel>

        {/* Create Room */}
        <GlassPanel className="p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Create Room
          </h2>
          <p className="text-xs text-muted-foreground">Get a code & invite anyone to battle</p>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Problem</label>
            <select value={roomProblem} onChange={(e) => setRoomProblem(e.target.value)} className="mt-2 w-full rounded-md border border-border bg-card/60 p-2 text-sm">
              <option value="">— select problem —</option>
              {problems.map((p) => <option key={p.slug} value={p.slug}>{p.title} ({p.difficulty})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Difficulty</label>
            <div className="mt-2 flex gap-2">
              {(["easy", "medium", "hard"] as BattleDifficulty[]).map((d) => (
                <button key={d} onClick={() => setRoomDifficulty(d)} className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize ${roomDifficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase">Duration</label>
            <div className="mt-2 flex gap-2">
              {[300, 600, 900, 1800].map((s) => (
                <button key={s} onClick={() => setRoomDuration(s)} className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${roomDuration === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s / 60}m</button>
              ))}
            </div>
          </div>
          <NeonButton className="w-full" onClick={createRoom} disabled={creating}>
            <KeyRound className="mr-2 h-4 w-4" /> {creating ? "Creating..." : "Create Room"}
          </NeonButton>
        </GlassPanel>

        {/* Join by Code */}
        <GlassPanel className="p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Hash className="h-4 w-4" /> Join by Code
          </h2>
          <p className="text-xs text-muted-foreground">Enter a 6-character room code</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="ABC123"
            maxLength={6}
            className="font-mono text-center text-2xl tracking-[0.4em] h-14"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <NeonButton className="w-full" onClick={handleJoin} disabled={joining || code.length < 4}>
            <Swords className="mr-2 h-4 w-4" /> {joining ? "Joining..." : "Join Battle"}
          </NeonButton>
          <div className="pt-2 border-t border-border space-y-2">
            <button onClick={() => navigate("/arena/leaderboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Flame className="h-3.5 w-3.5 text-primary" /> Leaderboard</button>
            <button onClick={() => navigate("/arena/friends")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><Users className="h-3.5 w-3.5" /> Friends</button>
            <button onClick={() => navigate("/arena/history")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><BarChart3 className="h-3.5 w-3.5" /> History</button>
          </div>
        </GlassPanel>
      </div>

      <DailyQuestsPanel />
    </div>
  );
}
