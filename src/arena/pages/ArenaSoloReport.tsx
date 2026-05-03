import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Loader2, Trophy, TrendingUp, TrendingDown, Zap, Clock, AlertTriangle } from "lucide-react";

interface Session {
  id: string;
  mode: string;
  difficulty: string;
  status: string;
  score: number;
  rating_delta: number;
  xp_awarded: number;
  duration_sec: number;
  started_at: string;
  completed_at: string | null;
  focus_lost_count: number;
  paste_count: number;
}

interface ProblemRow {
  problem_slug: string;
  attempts: number;
  wrong_submits: number;
  first_ac_at: string | null;
  time_to_ac_sec: number | null;
  awarded_score: number;
}

export default function ArenaSoloReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        supabase.from("solo_sessions").select("*").eq("id", id!).maybeSingle(),
        supabase.from("solo_session_problems").select("*").eq("session_id", id!).order("ord"),
      ]);
      setSession(s.data as Session);
      setProblems((p.data ?? []) as ProblemRow[]);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !session) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const positive = session.rating_delta >= 0;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GlassPanel glow={session.score > 50 ? "lime" : "magenta"} className="p-6 md:p-8 text-center space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
        <div className="relative">
          <Trophy className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-3xl md:text-4xl font-black gradient-text mt-2">
            {session.score > 0 ? "Session Complete" : "Better Luck Next Time"}
          </h1>
          <div className="text-5xl font-black mt-3">{session.score}<span className="text-base text-muted-foreground">/100</span></div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
            {session.mode} · {session.difficulty}
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-3 gap-3">
        <GlassPanel className="p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</div>
          <div className={`text-2xl font-black flex items-center justify-center gap-1 ${positive ? "text-lime-400" : "text-red-400"}`}>
            {positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {positive ? "+" : ""}{session.rating_delta}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">XP Earned</div>
          <div className="text-2xl font-black text-primary flex items-center justify-center gap-1">
            <Zap className="h-5 w-5" />+{session.xp_awarded}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</div>
          <div className="text-2xl font-black flex items-center justify-center gap-1">
            <Clock className="h-5 w-5" />{Math.round(session.duration_sec / 60)}m
          </div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Per-Problem Breakdown</h3>
        {problems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No problems recorded.</p>
        ) : (
          <div className="space-y-2">
            {problems.map(p => (
              <div key={p.problem_slug} className="flex items-center justify-between rounded-md border border-border bg-card/40 p-3">
                <div>
                  <div className="font-medium">{p.problem_slug}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.attempts} attempt{p.attempts === 1 ? "" : "s"} · {p.wrong_submits} wrong
                    {p.time_to_ac_sec != null && <> · solved in {Math.floor(p.time_to_ac_sec / 60)}m {p.time_to_ac_sec % 60}s</>}
                  </div>
                </div>
                <div className="text-lg font-black">{p.awarded_score}</div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {(session.focus_lost_count > 0 || session.paste_count > 0) && (
        <GlassPanel className="p-4 flex items-center gap-2 text-xs text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          Focus lost {session.focus_lost_count}×, pastes {session.paste_count}. Real interviews flag this — practice clean sessions.
        </GlassPanel>
      )}

      <div className="flex gap-2">
        <NeonButton className="flex-1" onClick={() => navigate("/arena/solo")}>Play Again</NeonButton>
        <NeonButton tone="cyan" className="flex-1" onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
      </div>
    </div>
  );
}
