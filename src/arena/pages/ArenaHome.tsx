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
import { Swords, Zap, KeyRound, Hash, Flame, Users, BarChart3, Target, Calendar, Trophy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DailyChallengeCard } from "../components/DailyChallengeCard";
import { DailyQuestsPanel } from "../components/DailyQuestsPanel";
import { DailyHistoryPanel } from "../components/DailyHistoryPanel";

const PREFS_KEY = "arena:home:prefs:v1";
type ArenaPrefs = {
  topic: string | null;
  difficulty: BattleDifficulty;
  roomDifficulty: BattleDifficulty;
  roomDuration: number;
  roomProblem: string;
};
const DEFAULT_PREFS: ArenaPrefs = {
  topic: null,
  difficulty: "medium",
  roomDifficulty: "medium",
  roomDuration: 900,
  roomProblem: "",
};
function loadPrefs(): ArenaPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function ArenaHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rating, loading } = useMyRating(user?.id);
  const initial = loadPrefs();
  const [topic, setTopic] = useState<string | null>(initial.topic);
  const [difficulty, setDifficulty] = useState<BattleDifficulty>(initial.difficulty);
  const [searching, setSearching] = useState(false);

  const [roomDifficulty, setRoomDifficulty] = useState<BattleDifficulty>(initial.roomDifficulty);
  const [roomDuration, setRoomDuration] = useState(initial.roomDuration);
  const [roomProblem, setRoomProblem] = useState(initial.roomProblem);
  const [problems, setProblems] = useState<Array<{ slug: string; title: string; difficulty: string }>>([]);
  const [creating, setCreating] = useState(false);

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => { if (user?.id) ensureRating(user.id); }, [user?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ topic, difficulty, roomDifficulty, roomDuration, roomProblem }),
      );
    } catch { /* ignore quota */ }
  }, [topic, difficulty, roomDifficulty, roomDuration, roomProblem]);

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

  const shortcuts = [
    { label: "Solo Practice", desc: "Timed interview-style runs", icon: Target, to: "/arena/solo" },
    { label: "Daily Challenge", desc: "One problem · everyone", icon: Calendar, to: "/arena/daily" },
    { label: "Rankings", desc: "Global Elo leaderboard", icon: Trophy, to: "/arena/leaderboard" },
    { label: "Friends", desc: "Challenge people you know", icon: Users, to: "/arena/friends" },
    { label: "Match History", desc: "Review past battles", icon: BarChart3, to: "/arena/history" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <GlassPanel glow="cyan" className="p-5 sm:p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,hsl(var(--primary)/0.25),transparent_60%)]" />
          <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Swords className="h-3.5 w-3.5" /> Battle Arena
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight gradient-text">Enter the Arena</h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
                1v1 real-time coding battles · Earn Elo · Climb the ladder
              </p>
            </div>
            {rating && (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-card/40 p-3 sm:p-4 backdrop-blur w-full md:w-auto">
                <EloBadge elo={rating.elo} />
                <div className="text-xs">
                  <div className="font-semibold text-foreground">{rating.wins}W · {rating.losses}L</div>
                  {rating.current_streak > 0 && (
                    <div className="text-primary mt-0.5">🔥 {rating.current_streak} streak</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      </motion.div>

      {/* DAILY HABIT */}
      <section className="space-y-3">
        <SectionHeader icon={Calendar} title="Daily Habit" subtitle="Keep your streak alive" />
        <DailyChallengeCard />
      </section>

      {/* PLAY MODES */}
      <section className="space-y-3">
        <SectionHeader icon={Swords} title="Play Now" subtitle="Choose how you want to battle" />
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Quick Match */}
          <GlassPanel className="p-5 space-y-4 flex flex-col">
            <ModeHeader icon={Zap} title="Quick Match" desc="Get matched at your Elo" />
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</label>
              <div className="mt-1.5 flex gap-1.5">
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
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Topic</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button onClick={() => setTopic(null)} className={`rounded-full border px-2.5 py-0.5 text-xs ${topic === null ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Any</button>
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setTopic(t)} className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${topic === t ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{t.replace("-", " ")}</button>
                ))}
              </div>
            </div>
            <div className="mt-auto pt-2">
              <NeonButton className="w-full" onClick={quickMatch} disabled={loading || searching}>
                <Swords className="mr-2 h-4 w-4" /> {searching ? "Searching..." : "Find Match"}
              </NeonButton>
            </div>
          </GlassPanel>

          {/* Create Room */}
          <GlassPanel className="p-5 space-y-4 flex flex-col">
            <ModeHeader icon={KeyRound} title="Create Room" desc="Invite anyone with a code" />
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Problem</label>
              <select value={roomProblem} onChange={(e) => setRoomProblem(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-card/60 p-2 text-sm">
                <option value="">— select problem —</option>
                {problems.map((p) => <option key={p.slug} value={p.slug}>{p.title} ({p.difficulty})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                <div className="mt-1.5 flex gap-1.5">
                  {(["easy", "medium", "hard"] as BattleDifficulty[]).map((d) => (
                    <button key={d} onClick={() => setRoomDifficulty(d)} className={`flex-1 rounded-md border px-1.5 py-1.5 text-[11px] capitalize ${roomDifficulty === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{d[0].toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Duration</label>
                <div className="mt-1.5 flex gap-1.5">
                  {[300, 600, 900, 1800].map((s) => (
                    <button key={s} onClick={() => setRoomDuration(s)} className={`flex-1 rounded-md border px-1 py-1.5 text-[11px] ${roomDuration === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{s / 60}m</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-auto pt-2">
              <NeonButton className="w-full" onClick={createRoom} disabled={creating}>
                <KeyRound className="mr-2 h-4 w-4" /> {creating ? "Creating..." : "Create Room"}
              </NeonButton>
            </div>
          </GlassPanel>

          {/* Join by Code */}
          <GlassPanel className="p-5 space-y-4 flex flex-col">
            <ModeHeader icon={Hash} title="Join by Code" desc="Enter a 6-character code" />
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono text-center text-2xl tracking-[0.4em] h-14"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <div className="mt-auto pt-2">
              <NeonButton className="w-full" onClick={handleJoin} disabled={joining || code.length < 4}>
                <Swords className="mr-2 h-4 w-4" /> {joining ? "Joining..." : "Join Battle"}
              </NeonButton>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="space-y-3">
        <SectionHeader icon={Flame} title="Explore" subtitle="Other ways to compete and improve" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {shortcuts.map((s) => (
            <button
              key={s.to}
              onClick={() => navigate(s.to)}
              className="group text-left rounded-xl border border-border bg-card/40 p-4 transition hover:border-primary/50 hover:bg-card/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-4 w-4" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="mt-3 text-sm font-semibold">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* PROGRESS */}
      <section className="space-y-3">
        <SectionHeader icon={Trophy} title="Your Progress" subtitle="Quests and recent activity" />
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <DailyQuestsPanel />
          <DailyHistoryPanel />
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ModeHeader({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
