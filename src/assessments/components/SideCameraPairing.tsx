import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Smartphone, RefreshCw, CheckCircle2, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  attemptId: string;
  onPaired: () => void;
}

interface PairingMeta {
  pairingId: string;
  pairCode: string;
  pairToken: string;
  status: "pending" | "paired" | "disconnected" | "expired";
}

/**
 * "Third Eye" pairing widget. Shown during lockdown when the assessment
 * requires a side-camera. Generates a one-time URL + QR for the candidate's
 * phone to scan; polls for the phone to come online.
 */
export function SideCameraPairing({ attemptId, onPaired }: Props) {
  const [meta, setMeta] = useState<PairingMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assessment-sidecam`;

  const join = useMemo(
    () =>
      meta
        ? `${window.location.origin}/assessments/sidecam/${meta.pairToken}`
        : "",
    [meta],
  );

  const createPairing = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("assessment-sidecam?action=pair", {
        body: { attemptId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMeta(data as PairingMeta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start pairing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!meta) createPairing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  // Poll for status until paired
  useEffect(() => {
    if (!meta || meta.status === "paired") return;
    const id = window.setInterval(async () => {
      try {
        const r = await fetch(
          `${fnUrl}?action=status&token=${encodeURIComponent(meta.pairToken)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
            },
          },
        );
        const j = await r.json();
        if (j?.status && j.status !== meta.status) {
          setMeta({ ...meta, status: j.status });
          if (j.status === "paired") onPaired();
        }
      } catch {
        /* keep polling */
      }
    }, 2500);
    return () => window.clearInterval(id);
  }, [meta, fnUrl, onPaired]);

  if (loading && !meta) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing side-camera link…
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-destructive">{error}</div>
        <Button size="sm" variant="outline" onClick={createPairing}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Try again
        </Button>
      </div>
    );
  }

  if (!meta) return null;

  if (meta.status === "paired") {
    return (
      <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-5 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-full bg-emerald-500/20 grid place-items-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="absolute inset-0 rounded-full ring-2 ring-emerald-500/40 animate-ping" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Third Eye connected
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Keep your phone propped beside you for the entire test.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-white rounded-md border shrink-0">
          <QRCodeSVG value={join} size={140} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="rounded-md bg-[hsl(var(--secondary))]/60 border border-[hsl(var(--border))] px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pair code
              </div>
              <div className="font-mono text-lg tracking-[0.3em]">
                {meta.pairCode}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(join);
                toast.success("Pairing link copied");
              }}
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-[11px] inline-flex items-center gap-1.5 text-muted-foreground">
            <Smartphone className="h-3.5 w-3.5" />
            Waiting for phone to connect…
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Scan the QR with your phone camera — no sign-in needed. If the camera
        doesn't auto-open the link, type the pair code in the assessment app.
      </p>
    </div>
  );
}
