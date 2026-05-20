import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Smartphone, RefreshCw, CheckCircle2, Loader2, Copy, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  attemptId: string;
  onPaired: () => void;
  onUnpaired?: () => void;
}

interface PairingMeta {
  pairingId: string;
  pairCode: string;
  pairToken: string;
  status: "pending" | "paired" | "disconnected" | "expired";
  lastSeenAt?: string | null;
}

// If we haven't heard from the phone for this long, treat as disconnected.
const STALE_MS = 15_000;

/**
 * "Third Eye" pairing widget. Shown during preflight when the assessment
 * requires a side-camera. Generates a one-time URL + QR for the candidate's
 * phone to scan; polls for the phone status continuously so disconnects
 * surface immediately.
 */
export function SideCameraPairing({ attemptId, onPaired, onUnpaired }: Props) {
  const [meta, setMeta] = useState<PairingMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const wasPairedRef = useRef(false);

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
    wasPairedRef.current = false;
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

  // Keep polling status forever (even after paired) so disconnects show live.
  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    const poll = async () => {
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
        if (cancelled) return;
        const nextStatus = (j?.status ?? meta.status) as PairingMeta["status"];
        const nextLastSeen = (j?.lastSeenAt ?? null) as string | null;
        if (nextStatus !== meta.status || nextLastSeen !== meta.lastSeenAt) {
          setMeta({ ...meta, status: nextStatus, lastSeenAt: nextLastSeen });
        }
      } catch {
        /* keep polling */
      }
    };
    poll();
    const id = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [meta, fnUrl]);

  // Tick clock so "Last seen Xs ago" + freshness check stay live.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Derive effective connection state from server status + freshness.
  const lastSeenMs = meta?.lastSeenAt ? new Date(meta.lastSeenAt).getTime() : 0;
  const ageMs = lastSeenMs ? nowTick - lastSeenMs : Infinity;
  const isStale = meta?.status === "paired" && lastSeenMs > 0 && ageMs > STALE_MS;
  const effectivelyPaired = meta?.status === "paired" && !isStale;
  const effectivelyDown =
    meta?.status === "disconnected" || meta?.status === "expired" || isStale;

  // Fire pair/unpair transitions exactly once per change.
  useEffect(() => {
    if (effectivelyPaired && !wasPairedRef.current) {
      wasPairedRef.current = true;
      onPaired();
    } else if (!effectivelyPaired && wasPairedRef.current) {
      wasPairedRef.current = false;
      onUnpaired?.();
    }
  }, [effectivelyPaired, onPaired, onUnpaired]);

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

  if (effectivelyPaired) {
    const secs = lastSeenMs ? Math.max(0, Math.round(ageMs / 1000)) : null;
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
            {secs !== null && (
              <span className="ml-1 opacity-70">· Last frame {secs}s ago</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (effectivelyDown) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-full bg-amber-500/20 grid place-items-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Third Eye disconnected
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isStale
                ? "We stopped receiving frames from your phone. Reopen the link or scan a new QR to reconnect."
                : "The pairing on your phone was closed. Generate a new QR code to reconnect."}
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={createPairing}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Generate new pairing
        </Button>
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
