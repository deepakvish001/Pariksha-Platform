import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { Loader2, Timer, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  mode: string;
  status: string;
  difficulty: string;
  duration_sec: number;
  started_at: string;
  ends_at: string;
  config: { problem_slugs?: string[] };
}

function fmt(sec: number) {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ArenaSoloSession() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState<"solved" | "giveup" | null>(null);
  const [focusLost, setFocusLost] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("solo_sessions")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (!alive) return;
      if (error || !data) { toast.error("Session not found"); navigate("/arena/solo"); return; }
      setSession(data as Session);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id, user, navigate]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Track tab-focus loss as a soft anti-cheat signal
  useEffect(() => {
    const onBlur = () => setFocusLost(c => c + 1);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const remaining = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((new Date(session.ends_at).getTime() - now) / 1000));
  }, [session, now]);

  const slug = session?.config?.problem_slugs?.[0];
  const expired = remaining <= 0;
  const tone = remaining < 60 ? "text-red-400" : remaining < 300 ? "text-amber-400" : "text-lime-400";

  // Auto-finalize on expiry
  useEffect(() => {
    if (!session || session.status !== "live" || !expired) return;
    void finalize(false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, session?.id]);

  async function markSolved() {
    if (!session || !slug) return;
    setBusy("solved");
    try {
      const { error: e1 } = await supabase.rpc("solo_record_attempt", {
        _session_id: session.id, _problem_slug: slug, _solved: true, _verdict: "accepted",
      });
      if (e1) throw e1;
      await finalize(true, false);
    } catch (e) { toast.error((e as Error).message); setBusy(null); }
  }

  async function giveUp() {
    if (!session) return;
    setBusy("giveup");
    await finalize(false, false);
  }

  async function finalize(_solved: boolean, _auto: boolean) {
    if (!session) return;
    try {
      // Persist focus_lost stat best-effort
      await supabase.from("solo_sessions").update({ focus_lost_count: focusLost }).eq("id", session.id);
      const { error } = await supabase.rpc("solo_finalize_session", { _session_id: session.id });
      if (error) throw error;
      navigate(`/arena/solo/session/${session.id}/report`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  }

  if (loading || !session) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (session.status !== "live") {
    return (
      <div className="max-w-xl mx-auto">
        <GlassPanel className="p-6 text-center space-y-3">
          <p>This session has already ended.</p>
          <NeonButton onClick={() => navigate(`/arena/solo/session/${session.id}/report`)}>View Report</NeonButton>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GlassPanel className="p-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{session.mode} · {session.difficulty}</div>
          <h1 className="text-lg font-bold">Solo Session in Progress</h1>
        </div>
        <div className={`flex items-center gap-2 font-mono text-2xl font-black ${tone}`}>
          <Timer className="h-5 w-5" />
          {fmt(remaining)}
        </div>
      </GlassPanel>

      <GlassPanel className="p-6 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your Problem</div>
          <h2 className="text-2xl font-black gradient-text">{slug}</h2>
        </div>
        <Link
          to={`/library/problems/${slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" /> Open problem in new tab
        </Link>

        <p className="text-xs text-muted-foreground">
          Solve it in the editor, then return here and confirm. Submissions are server-validated;
          tampering won't credit you. Auto-submit on timeout.
        </p>

        {focusLost > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Tab focus lost {focusLost}× (logged in report)
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <NeonButton tone="lime" onClick={markSolved} disabled={!!busy}>
            {busy === "solved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" />I Solved It</>}
          </NeonButton>
          <NeonButton tone="magenta" onClick={giveUp} disabled={!!busy}>
            {busy === "giveup" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4 mr-2" />Give Up</>}
          </NeonButton>
        </div>
      </GlassPanel>
    </div>
  );
}
