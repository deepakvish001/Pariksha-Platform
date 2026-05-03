import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { joinByCode } from "../hooks";
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
  const normalized = (code ?? "").trim().toUpperCase();
  const isValidFormat = CODE_RE.test(normalized);

  const [error, setError] = useState<ReturnType<typeof classifyError> | null>(null);
  const [joining, setJoining] = useState(isValidFormat);

  const attempt = useCallback(async () => {
    setJoining(true); setError(null);
    try {
      const battleId = await joinByCode(normalized);
      navigate(`/arena/battle/${battleId}`, { replace: true });
    } catch (e) {
      setError(classifyError((e as Error).message ?? ""));
      setJoining(false);
    }
  }, [normalized, navigate]);

  useEffect(() => {
    if (isValidFormat) attempt();
  }, [isValidFormat, attempt]);

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

  return (
    <div className="max-w-md mx-auto">
      <GlassPanel glow={error ? "magenta" : "cyan"} className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-black">Joining Room</h1>
        <div className="font-mono text-3xl tracking-[0.3em] gradient-text" data-testid="join-code">{normalized}</div>

        {joining && (
          <div className="flex items-center justify-center gap-2 text-primary" data-testid="join-loading">
            <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
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
              {error.kind !== "expired" && error.kind !== "self" && (
                <NeonButton onClick={attempt}>Try Again</NeonButton>
              )}
              <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
