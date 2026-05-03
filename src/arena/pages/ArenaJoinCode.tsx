import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { joinByCode, peekCode, type CodePeek } from "../hooks";
import { AlertTriangle, Clock, Loader2, XCircle } from "lucide-react";

const CODE_RE = /^[A-Z0-9]{6}$/;

type ErrorKind = "invalid" | "expired" | "notfound" | "self" | "rating" | "unknown";

function classifyError(msg: string): { kind: ErrorKind; title: string; hint: string } {
  const m = msg.toLowerCase();
  if (m.includes("expire")) return { kind: "expired", title: "Room code expired", hint: "Codes are valid for 10 minutes. Ask your opponent to create a new room." };
  if (m.includes("not found") || m.includes("invalid code") || m.includes("no rows")) return { kind: "notfound", title: "Room not found", hint: "Double-check the code — it may have been cancelled or already used." };
  if (m.includes("self") || m.includes("own")) return { kind: "self", title: "Can't join your own room", hint: "Share the code with someone else to start a battle." };
  if (m.includes("rating")) return { kind: "rating", title: "Rating not ready", hint: "Visit the Arena home once so we can set up your Elo, then try again." };
  return { kind: "unknown", title: "Couldn't join the room", hint: msg || "Something went wrong. Please try again." };
}

export default function ArenaJoinCode() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const normalized = (code ?? "").trim().toUpperCase();
  const isValidFormat = CODE_RE.test(normalized);

  // Test/dev override: ?now=<unix-ms> shifts the local clock so e2e tests can
  // verify near-expiry styling without waiting 9+ real-world minutes.
  const clockOverride = (() => {
    const raw = searchParams.get("now");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);
  const [joining, setJoining] = useState(false);
  const [peek, setPeek] = useState<CodePeek | null>(null);
  const [peeking, setPeeking] = useState(isValidFormat);
  const [now, setNow] = useState(() => clockOverride ?? Date.now());
  const autoJoinedRef = useRef(false);

  // Tick clock every second for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(clockOverride ?? Date.now()), 1000);
    return () => clearInterval(t);
  }, [clockOverride]);

  // Initial peek so we can render expiry + decide whether to auto-join
  useEffect(() => {
    if (!isValidFormat) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await peekCode(normalized);
        if (cancelled) return;
        if (!row) { setError(classifyError("not found")); setPeeking(false); return; }
        setPeek(row);
        if (row.status !== "pending") {
          setError(classifyError(row.status === "accepted" ? "not found" : row.status));
        }
      } catch (e) {
        if (!cancelled) setError(classifyError((e as Error).message ?? ""));
      } finally {
        if (!cancelled) setPeeking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isValidFormat, normalized]);

  const expiresMs = peek ? new Date(peek.expires_at).getTime() : null;
  const remainingMs = expiresMs != null ? Math.max(0, expiresMs - now) : null;
  const expired = remainingMs === 0 || (peek && expiresMs != null && expiresMs <= now);
  const nearExpiry = remainingMs != null && remainingMs > 0 && remainingMs < 60_000;
  const mm = remainingMs != null ? Math.floor(remainingMs / 60000) : 0;
  const ss = remainingMs != null ? Math.floor((remainingMs % 60000) / 1000) : 0;

  const attempt = useCallback(async () => {
    if (expired) return;
    setJoining(true); setError(null);
    try {
      const battleId = await joinByCode(normalized);
      navigate(`/arena/battle/${battleId}`, { replace: true });
    } catch (e) {
      setError(classifyError((e as Error).message ?? ""));
      setJoining(false);
    }
  }, [normalized, navigate, expired]);

  // Auto-join once peek says the code is valid and unexpired.
  useEffect(() => {
    if (autoJoinedRef.current) return;
    if (!peek || error || expired) return;
    if (peek.status !== "pending") return;
    autoJoinedRef.current = true;
    attempt();
  }, [peek, error, expired, attempt]);

  // Surface an expiry error the moment the local countdown crosses zero.
  useEffect(() => {
    if (expired && peek && !error) {
      setError(classifyError("code expired"));
    }
  }, [expired, peek, error]);

  if (!isValidFormat) {
    return (
      <div className="max-w-md mx-auto">
        <GlassPanel glow="magenta" className="p-8 text-center space-y-4" data-testid="join-invalid">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <h1 className="text-2xl font-black">Invalid room code</h1>
          <p className="text-sm text-muted-foreground">
            Codes must be exactly 6 letters or numbers. You provided{" "}
            <code className="font-mono text-foreground">{normalized || "(empty)"}</code>.
          </p>
          <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
        </GlassPanel>
      </div>
    );
  }

  // While we're auto-joining, render an invisible skeleton matching the
  // BattleRoom grid so the browser pre-allocates the column widths and the
  // visible card stays centered without causing a layout jolt on transition.
  return (
    <div className="relative">
      {(joining || peeking) && !error && !expired && (
        <div
          aria-hidden
          data-testid="join-skeleton"
          className="pointer-events-none invisible absolute inset-0 grid gap-3 grid-cols-1 xl:grid-cols-[minmax(320px,28rem)_minmax(0,1fr)_minmax(280px,20rem)]"
        >
          <div className="min-w-0 xl:min-w-[320px] h-[75vh]" />
          <div className="min-w-0 h-[75vh]" />
          <div className="h-[75vh]" />
        </div>
      )}
      <div className="max-w-md mx-auto relative">
        <GlassPanel glow={error || expired ? "magenta" : "cyan"} className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-black">Joining Room</h1>
        <div className="font-mono text-3xl tracking-[0.3em] gradient-text" data-testid="join-code">{normalized}</div>

        {/* Countdown timer — visible the moment we know the expiry */}
        {remainingMs != null && !error && (
          <div
            data-testid="join-countdown"
            className={`flex items-center justify-center gap-1.5 font-mono text-sm ${
              expired || nearExpiry ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {expired ? (
              <span>Code has expired</span>
            ) : (
              <span>Expires in {mm}:{ss.toString().padStart(2, "0")}</span>
            )}
          </div>
        )}

        {peeking && (
          <div className="flex items-center justify-center gap-2 text-primary" data-testid="join-peeking">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking room…
          </div>
        )}

        {joining && !error && !expired && (
          <div className="flex items-center justify-center gap-2 text-primary" data-testid="join-loading">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
          </div>
        )}

        {/* Expired-but-no-server-error state: show explicit message + disabled CTA */}
        {expired && !error && (
          <div className="space-y-3" data-testid="join-expired">
            <div className="flex flex-col items-center gap-2">
              <Clock className="h-9 w-9 text-destructive" />
              <p className="text-base font-bold text-destructive">Room code expired</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                This code is no longer valid. Ask your opponent to create a new room.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <NeonButton disabled data-testid="join-disabled">Join Battle</NeonButton>
              <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-3" data-testid={`join-error-${error.kind}`}>
            <div className="flex flex-col items-center gap-2">
              {error.kind === "expired" ? (
                <Clock className="h-9 w-9 text-destructive" />
              ) : (
                <XCircle className="h-9 w-9 text-destructive" />
              )}
              <p className="text-base font-bold text-destructive">{error.title}</p>
              <p className="text-xs text-muted-foreground max-w-xs">{error.hint}</p>
            </div>
            <div className="flex justify-center gap-2">
              {error.kind === "expired" ? (
                <NeonButton disabled data-testid="join-disabled">Join Battle</NeonButton>
              ) : error.kind !== "self" ? (
                <NeonButton onClick={attempt}>Try Again</NeonButton>
              ) : null}
              <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
            </div>
          </div>
        )}
      </GlassPanel>
      </div>
    </div>
  );
}
