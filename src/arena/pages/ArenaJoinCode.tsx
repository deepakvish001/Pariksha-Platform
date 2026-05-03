import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlassPanel } from "../components/GlassPanel";
import { NeonButton } from "../components/NeonButton";
import { joinByCode } from "../hooks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ArenaJoinCode() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        const battleId = await joinByCode(code);
        navigate(`/arena/battle/${battleId}`, { replace: true });
      } catch (e) {
        setError((e as Error).message);
        setJoining(false);
      }
    })();
  }, [code, navigate]);

  async function retry() {
    if (!code) return;
    setJoining(true); setError(null);
    try {
      const battleId = await joinByCode(code);
      navigate(`/arena/battle/${battleId}`, { replace: true });
    } catch (e) {
      setError((e as Error).message);
      setJoining(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <GlassPanel glow={error ? "magenta" : "cyan"} className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-black">Joining Room</h1>
        <div className="font-mono text-3xl tracking-[0.3em] gradient-text">{code}</div>
        {joining ? (
          <div className="flex items-center justify-center gap-2 text-primary"><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</div>
        ) : (
          <>
            <p className="text-destructive text-sm">{error}</p>
            <div className="flex justify-center gap-2">
              <NeonButton onClick={retry}>Try Again</NeonButton>
              <NeonButton onClick={() => navigate("/arena")}>Back to Arena</NeonButton>
            </div>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
