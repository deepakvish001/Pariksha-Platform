import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Square, Play, Loader2, Sparkles, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Turn = { speaker: "interviewer" | "candidate"; text: string };
type Rubric = { criterion: string; score: number; feedback: string };
type Scorecard = {
  overall: number;
  verdict: string;
  summary: string;
  rubric: Rubric[];
  strengths: string[];
  improvements: string[];
  next_steps: string[];
  error?: string;
  raw?: string;
};

// Web Speech API typings (minimal)
type SR = any;
const SpeechRecognitionCtor: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function MockInterview() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("SDE-1");
  const [company, setCompany] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [partial, setPartial] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [scoring, setScoring] = useState(false);

  const recogRef = useRef<SR | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<Turn[]>([]);
  const endedRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { endedRef.current = ended; }, [ended]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const supported = useMemo(
    () => !!SpeechRecognitionCtor && typeof window !== "undefined" && "speechSynthesis" in window,
    [],
  );

  // Persist transcript
  const persist = useCallback(async (next: Turn[], extra?: Partial<{ status: string; scorecard: Scorecard; ended_at: string }>) => {
    if (!sessionIdRef.current) return;
    await supabase
      .from("mock_interview_sessions")
      .update({ transcript: next as any, ...(extra as any) })
      .eq("id", sessionIdRef.current);
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (mutedRef.current || !("speechSynthesis" in window)) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => /en[-_]?US|en[-_]?GB/i.test(v.lang) && /female|google|samantha|natural/i.test(v.name)) || voices.find(v => /en/i.test(v.lang));
      if (preferred) u.voice = preferred;
      u.onend = () => { setSpeaking(false); resolve(); };
      u.onerror = () => { setSpeaking(false); resolve(); };
      setSpeaking(true);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const stopListening = useCallback(() => {
    try { recogRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const askAI = useCallback(async (history: Turn[]): Promise<{ reply: string; isFinal: boolean } | null> => {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview-reply", {
        body: { mode: "turn", role, company: company || undefined, difficulty, transcript: history },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as any;
    } catch (e: any) {
      toast({ title: "Interviewer error", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setThinking(false);
    }
  }, [role, company, difficulty]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor || endedRef.current) return;
    const rec: SR = new SpeechRecognitionCtor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    let finalBuf = "";
    rec.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalBuf += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setPartial((finalBuf + interim).trim());
    };
    rec.onerror = (e: any) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast({ title: "Mic error", description: e.error, variant: "destructive" });
      }
    };
    rec.onend = async () => {
      setListening(false);
      const text = finalBuf.trim();
      setPartial("");
      if (!text || endedRef.current) return;
      const next = [...transcriptRef.current, { speaker: "candidate" as const, text }];
      setTranscript(next);
      await persist(next);
      const ai = await askAI(next);
      if (!ai) return;
      const aiTurn = [...next, { speaker: "interviewer" as const, text: ai.reply }];
      setTranscript(aiTurn);
      await persist(aiTurn);
      await speak(ai.reply);
      if (ai.isFinal) {
        setEnded(true);
        await persist(aiTurn, { status: "completed", ended_at: new Date().toISOString() });
      } else {
        startListening();
      }
    };

    recogRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e: any) {
      toast({ title: "Could not start mic", description: e.message, variant: "destructive" });
    }
  }, [askAI, persist, speak]);

  const beginInterview = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("mock_interview_sessions")
      .insert({ user_id: user.id, role, company: company || null, difficulty, status: "active", transcript: [] as any })
      .select("id")
      .single();
    if (error) { toast({ title: "Couldn't start", description: error.message, variant: "destructive" }); return; }

    setSessionId(data.id);
    setTranscript([]);
    setScorecard(null);
    setEnded(false);

    const ai = await askAI([]);
    if (!ai) return;
    const next = [{ speaker: "interviewer" as const, text: ai.reply }];
    setTranscript(next);
    await persist(next);
    await speak(ai.reply);
    if (!ai.isFinal) startListening();
  }, [user, role, company, difficulty, askAI, persist, speak, startListening]);

  const endInterview = useCallback(async () => {
    setEnded(true);
    stopListening();
    window.speechSynthesis?.cancel();
    setScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview-reply", {
        body: { mode: "score", role, company: company || undefined, difficulty, transcript: transcriptRef.current },
      });
      if (error) throw error;
      const sc = (data as any)?.scorecard as Scorecard;
      setScorecard(sc);
      await persist(transcriptRef.current, { status: "completed", scorecard: sc, ended_at: new Date().toISOString() });
    } catch (e: any) {
      toast({ title: "Scoring failed", description: e.message, variant: "destructive" });
    } finally {
      setScoring(false);
    }
  }, [stopListening, role, company, difficulty, persist]);

  const reset = useCallback(() => {
    stopListening();
    window.speechSynthesis?.cancel();
    setSessionId(null);
    setTranscript([]);
    setPartial("");
    setEnded(false);
    setScorecard(null);
  }, [stopListening]);

  useEffect(() => () => {
    try { recogRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }, []);

  if (!loading && !user) return <Navigate to="/auth?redirect=/mock-interview" replace />;

  if (!supported) {
    return (
      <div className="container max-w-2xl py-10">
        <Card className="p-8 text-center space-y-3">
          <h1 className="text-2xl font-bold">Mock Interview Studio</h1>
          <p className="text-muted-foreground">
            Your browser doesn't support live mic + speech. Please use Chrome, Edge, or Safari on desktop for the full voice experience.
          </p>
        </Card>
      </div>
    );
  }

  const inSession = !!sessionId;

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <Helmet><title>Mock Interview Studio — Voice AI Interviewer</title></Helmet>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="size-7 text-primary" /> Mock Interview Studio
          </h1>
          <p className="text-muted-foreground mt-1">Full-voice live mock interviews. Speak naturally — the AI replies out loud and scores you at the end.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setMuted((m) => !m)} className="gap-2">
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted ? "Muted" : "Voice on"}
        </Button>
      </div>

      {!inSession && (
        <Card className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. SDE-1, Data Analyst" />
            </div>
            <div>
              <Label>Company <span className="text-muted-foreground">(optional)</span></Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" />
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="lg" onClick={beginInterview} disabled={thinking} className="gap-2">
              {thinking ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Start interview
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Allow microphone access when prompted. The AI will speak first, then listen for your reply. Browser TTS quality varies — use Chrome/Edge for best results.
          </p>
        </Card>
      )}

      {inSession && (
        <>
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <span className={`size-2 rounded-full ${listening ? "bg-emerald-500 animate-pulse" : speaking ? "bg-blue-500 animate-pulse" : thinking ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`} />
              {listening ? "Listening" : speaking ? "Interviewer speaking" : thinking ? "Thinking" : ended ? "Ended" : "Idle"}
            </Badge>
            <span className="text-sm text-muted-foreground">{role}{company ? ` · ${company}` : ""} · {difficulty}</span>
            <div className="ml-auto flex gap-2">
              {!ended && (
                listening ? (
                  <Button size="sm" variant="outline" onClick={stopListening} className="gap-1"><MicOff className="size-4" /> Pause mic</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={startListening} disabled={thinking || speaking} className="gap-1"><Mic className="size-4" /> Resume mic</Button>
                )
              )}
              {!ended && (
                <Button size="sm" variant="destructive" onClick={endInterview} className="gap-1"><Square className="size-4" /> End & score</Button>
              )}
              {ended && (
                <Button size="sm" variant="outline" onClick={reset} className="gap-1"><RotateCcw className="size-4" /> New session</Button>
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {transcript.length === 0 && <p className="text-muted-foreground text-sm">Waiting for the interviewer to begin…</p>}
            {transcript.map((t, i) => (
              <div key={i} className={`flex ${t.speaker === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  t.speaker === "candidate"
                    ? "bg-primary/15 border border-primary/30"
                    : "bg-muted/50 border border-border"
                }`}>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    {t.speaker === "candidate" ? "You" : "Interviewer"}
                  </div>
                  {t.text}
                </div>
              </div>
            ))}
            {partial && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-primary/5 border border-primary/20 italic text-muted-foreground">
                  {partial}…
                </div>
              </div>
            )}
          </Card>

          {scoring && (
            <Card className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Scoring your interview…
            </Card>
          )}

          {scorecard && !scorecard.error && (
            <Card className="p-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">Scorecard</h2>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{scorecard.overall}<span className="text-base text-muted-foreground">/100</span></div>
                  <Badge variant="outline" className="mt-1 capitalize">{scorecard.verdict?.replace(/_/g, " ")}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{scorecard.summary}</p>
              <div className="grid md:grid-cols-2 gap-3">
                {scorecard.rubric?.map((r) => (
                  <div key={r.criterion} className="p-3 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{r.criterion}</span>
                      <span className="text-sm font-mono">{r.score}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.feedback}</p>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="font-medium text-emerald-500 mb-1">Strengths</div>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">{scorecard.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <div className="font-medium text-amber-500 mb-1">Improvements</div>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">{scorecard.improvements?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <div className="font-medium text-primary mb-1">Next steps</div>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground">{scorecard.next_steps?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>
            </Card>
          )}
          {scorecard?.error && (
            <Card className="p-6 text-sm text-destructive">Scoring response could not be parsed.</Card>
          )}
        </>
      )}
    </div>
  );
}
