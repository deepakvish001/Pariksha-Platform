import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Loader2, Brain, ClipboardList, Trophy, Timer, Flame, Zap } from "lucide-react";
import { toast } from "sonner";

type Mode = "interview" | "assessment" | "contest";

interface ModeCfg {
  id: Mode;
  title: string;
  blurb: string;
  duration: number;
  icon: typeof Brain;
  tone: "magenta" | "cyan" | "lime";
}

const MODES: ModeCfg[] = [
  { id: "interview",  title: "Interview Sim",  blurb: "1 problem · realistic 30-min interview pressure.", duration: 1800, icon: Brain,         tone: "magenta" },
  { id: "assessment", title: "Assessment",     blurb: "Mixed difficulty OA-style timed run (60 min).",     duration: 3600, icon: ClipboardList, tone: "cyan" },
  { id: "contest",    title: "Contest Mode",   blurb: "ICPC-style scoring with penalty for wrong submits.", duration: 5400, icon: Trophy,        tone: "lime" },
];

interface Rating { mode: Mode; rating: number; tier: string; games_played: number; }

export default function ArenaSolo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    (async () => {
      const { data } = await supabase
        .from("solo_ratings")
        .select("mode, rating, tier, games_played")
        .eq("user_id", user.id);
      setRatings((data ?? []) as Rating[]);
      setLoading(false);
    })();
  }, [user, navigate]);

  async function start(mode: Mode, duration: number) {
    setBusy(mode);
    try {
      const { data, error } = await supabase.rpc("solo_start_session", {
        _mode: mode,
        _difficulty: difficulty,
        _duration_sec: duration,
      });
      if (error) throw error;
      navigate(`/arena/solo/session/${data}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <GlassPanel glow="magenta" className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
            <Flame className="h-3.5 w-3.5" /> Solo Arena
          </div>
          <h1 className="text-3xl md:text-4xl font-black gradient-text">Train under real pressure.</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Real interviews, OAs, and contests are timed. Practice the same way — pick a mode,
            beat the clock, climb the rating ladder.
          </p>
        </div>
      </GlassPanel>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Difficulty</span>
        {(["easy","medium","hard"] as const).map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`text-xs px-3 py-1 rounded-md border transition ${
              difficulty === d
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map(m => {
          const r = ratings.find(x => x.mode === m.id);
          const Icon = m.icon;
          return (
            <GlassPanel key={m.id} glow={m.tone} className="p-5 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-primary" />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</div>
                  <div className="text-lg font-black">{r?.rating ?? 1000}</div>
                  <div className="text-[10px] capitalize text-primary">{r?.tier ?? "bronze"}</div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.blurb}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />{Math.round(m.duration/60)}m</span>
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />XP + Rating</span>
              </div>
              <NeonButton
                tone={m.tone}
                className="w-full mt-auto"
                onClick={() => start(m.id, m.duration)}
                disabled={!!busy || loading}
              >
                {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Start ${m.title}`}
              </NeonButton>
            </GlassPanel>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate("/arena")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to Arena
        </button>
      </div>
    </div>
  );
}
