import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDbCodingProblem } from "@/hooks/useDbCodingProblem";
import { useBattle, useBattleEvents, emitEvent, recordSubmission, finishBattle } from "../hooks";
import { useBattleStore } from "../store";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { BattleTimer } from "../components/BattleTimer";
import { OpponentCard } from "../components/OpponentCard";
import { MonacoEditor } from "@/components/coding/MonacoEditor";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Send, Flag } from "lucide-react";
import { toast } from "sonner";

const LANG_OPTIONS: { id: number; key: string; label: string }[] = [
  { id: 71, key: "python", label: "Python" },
  { id: 54, key: "cpp", label: "C++" },
  { id: 62, key: "java", label: "Java" },
  { id: 63, key: "javascript", label: "JavaScript" },
];

interface OpponentInfo { name: string; avatar_url: string | null; elo: number; }

export default function BattleRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { battle } = useBattle(id);
  useBattleEvents(id);
  const { events, opponentTyping, opponentPassed, opponentTotal, myPassed, myTotal } = useBattleStore();

  const isPlayerA = battle?.player_a === user?.id;
  const opponentId = battle ? (isPlayerA ? battle.player_b : battle.player_a) : null;
  const opponentElo = battle ? (isPlayerA ? battle.elo_b_before : battle.elo_a_before) ?? 1000 : 1000;

  const { data: problem, isLoading: problemLoading } = useDbCodingProblem(battle?.problem_slug);
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null);
  const [lang, setLang] = useState(LANG_OPTIONS[0]);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string>("");
  const typingThrottleRef = useRef(0);

  // Load opponent profile
  useEffect(() => {
    if (!opponentId) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name,avatar_url").eq("user_id", opponentId).maybeSingle();
      setOpponent({
        name: data?.full_name ?? "Opponent",
        avatar_url: data?.avatar_url ?? null,
        elo: opponentElo,
      });
    })();
  }, [opponentId, opponentElo]);

  // Initialize starter code on language change
  useEffect(() => {
    if (!problem) return;
    const starter = problem.starterCode?.[lang.key as keyof typeof problem.starterCode];
    setCode(starter || "");
  }, [problem, lang.key]);

  // Throttled typing event
  function onCodeChange(v: string) {
    setCode(v);
    const now = Date.now();
    if (battle && user && now - typingThrottleRef.current > 2500) {
      typingThrottleRef.current = now;
      emitEvent(battle.id, user.id, "typing", {}).catch(() => {});
    }
  }

  // Battle ended -> redirect to result
  useEffect(() => {
    if (battle?.status === "ended") {
      const t = setTimeout(() => navigate(`/arena/result/${battle.id}`), 1500);
      return () => clearTimeout(t);
    }
  }, [battle?.status, battle?.id, navigate]);

  async function runOrSubmit(submit: boolean) {
    if (!battle || !user || !problem) return;
    setRunning(true);
    setOutput("");
    let passed = 0;
    const tests = problem.sampleTests || [];
    const total = tests.length;
    let firstFail = "";
    let lastTimeMs = 0;
    try {
      for (const t of tests) {
        const { data: resp, error } = await supabase.functions.invoke("run-code", {
          body: { source_code: code, language_id: lang.id, stdin: t.input, language: lang.key, problem_slug: problem.slug },
        });
        if (error) throw error;
        const r = resp as { ok: boolean; data?: { stdout?: string; stderr?: string; time?: number; status?: { description: string } }; error?: string };
        if (!r.ok || !r.data) throw new Error(r.error || "Execution failed");
        const out = (r.data.stdout || "").trim();
        const exp = (t.expected || "").trim();
        lastTimeMs = Math.round((r.data.time || 0) * 1000);
        if (out === exp) passed++;
        else if (!firstFail) firstFail = `Expected:\n${exp}\n\nGot:\n${out}\n${r.data.stderr ? "\n" + r.data.stderr : ""}`;
      }
      useBattleStore.getState().setMine(passed, total);
      setOutput(passed === total ? `✓ All ${total} tests passed (${lastTimeMs}ms)` : `✗ ${passed}/${total} tests passed\n\n${firstFail}`);

      if (submit) {
        await recordSubmission(battle.id, user.id, lang.key, code, passed, total, passed === total ? "accepted" : "wrong_answer", lastTimeMs);
        if (passed === total && total > 0) {
          await finishBattle(battle.id, user.id, "solved");
          toast.success("VICTORY! All tests passed!");
        } else {
          toast.warning(`Submission: ${passed}/${total} tests passed`);
        }
      } else {
        await emitEvent(battle.id, user.id, "test_run", { passed, total }).catch(() => {});
      }
    } catch (e) {
      setOutput((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function forfeit() {
    if (!battle || !user) return;
    if (!confirm("Forfeit this battle? Your opponent wins.")) return;
    await finishBattle(battle.id, null, "forfeit");
  }

  function onTimerExpire() {
    if (!battle || battle.status !== "live" || !user) return;
    // The first to call wins by tests-passed; simple: declare draw if no one solved
    finishBattle(battle.id, myPassed >= opponentPassed && myPassed > 0 ? user.id : null, "expired").catch(() => {});
  }

  if (!battle) return <div className="text-center py-20"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-3">
      <GlassPanel className="p-3 flex items-center gap-4">
        <BattleTimer endsAt={battle.ends_at} onExpire={onTimerExpire} />
        <div className="text-xs uppercase text-muted-foreground">{battle.difficulty} · {battle.topic || "any"}</div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={forfeit} className="text-red-400 hover:text-red-300">
            <Flag className="h-4 w-4 mr-1" /> Forfeit
          </Button>
        </div>
      </GlassPanel>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_320px]">
        {/* Problem */}
        <GlassPanel className="p-4 max-h-[75vh] overflow-y-auto">
          {problemLoading || !problem ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <h2 className="text-xl font-bold">{problem.title}</h2>
              <div className="prose prose-invert prose-sm mt-3 max-w-none whitespace-pre-wrap">{problem.description}</div>
              {problem.examples?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs uppercase text-primary/80">Examples</div>
                  {problem.examples.map((e, i) => (
                    <div key={i} className="rounded-md border border-border bg-card/60 p-2 text-xs font-mono">
                      <div><span className="text-muted-foreground">Input:</span> {e.input}</div>
                      <div><span className="text-muted-foreground">Output:</span> {e.output}</div>
                    </div>
                  ))}
                </div>
              )}
              {problem.constraints?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs uppercase text-primary/80 mb-1">Constraints</div>
                  <ul className="text-xs space-y-1 text-foreground/70">
                    {problem.constraints.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </GlassPanel>

        {/* Editor */}
        <div className="space-y-2">
          <GlassPanel className="p-2 flex items-center gap-2">
            <select
              value={lang.key}
              onChange={(e) => setLang(LANG_OPTIONS.find((l) => l.key === e.target.value)!)}
              className="bg-card/60 border border-border rounded px-2 py-1 text-xs"
            >
              {LANG_OPTIONS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => runOrSubmit(false)} disabled={running}>
                <Play className="h-3 w-3 mr-1" /> Run
              </Button>
              <NeonButton size="sm" onClick={() => runOrSubmit(true)} disabled={running} tone="lime">
                <Send className="h-3 w-3 mr-1" /> Submit
              </NeonButton>
            </div>
          </GlassPanel>
          <GlassPanel className="overflow-hidden">
            <div className="h-[55vh]">
              <MonacoEditor value={code} onChange={onCodeChange} language={lang.key === "cpp" ? "cpp" : lang.key} />
            </div>
          </GlassPanel>
          <GlassPanel className="p-3 max-h-32 overflow-y-auto">
            <div className="text-[10px] uppercase text-muted-foreground/60 mb-1">Console</div>
            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">{output || "Run your code to see output."}</pre>
          </GlassPanel>
        </div>

        {/* Opponent + events */}
        <div className="space-y-3">
          {opponent && (
            <OpponentCard
              name={opponent.name}
              avatarUrl={opponent.avatar_url}
              elo={opponent.elo}
              passed={opponentPassed}
              total={opponentTotal || (problem?.sampleTests.length ?? 0)}
              typing={opponentTyping}
            />
          )}
          <GlassPanel glow="cyan" className="p-4 space-y-2">
            <div className="text-xs uppercase text-primary/80">You</div>
            <div className="font-mono text-sm">{myPassed} / {myTotal || (problem?.sampleTests.length ?? 0)} passed</div>
          </GlassPanel>
          <GlassPanel className="p-3 max-h-64 overflow-y-auto">
            <div className="text-[10px] uppercase text-muted-foreground/60 mb-2">Live Feed</div>
            <ul className="space-y-1 text-xs">
              {events.slice(-12).reverse().map((e) => (
                <li key={e.id} className="text-muted-foreground">
                  <span className="text-primary">{e.kind}</span>{" "}
                  {e.kind === "submit" || e.kind === "test_run" ? `${(e.payload as { passed?: number }).passed}/${(e.payload as { total?: number }).total}` : ""}
                </li>
              ))}
              {events.length === 0 && <li className="text-muted-foreground/50">Waiting for action...</li>}
            </ul>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
