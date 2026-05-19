import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  RefreshCw,
  Settings,
  ShieldAlert,
  Info,
  Loader2,
} from "lucide-react";

export type CameraErrorKind =
  | "denied"
  | "not_found"
  | "in_use"
  | "insecure"
  | "constraint"
  | "unknown";

/** Map a DOMException-ish error from getUserMedia to a friendly category. */
export function classifyCameraError(err: unknown): CameraErrorKind {
  const name = (err as { name?: string } | null)?.name ?? "";
  const msg = err instanceof Error ? err.message : String(err ?? "");
  if (name === "NotAllowedError" || /denied|permission/i.test(msg)) return "denied";
  if (name === "NotFoundError" || /not found|no device/i.test(msg)) return "not_found";
  if (name === "NotReadableError" || /in use|busy|tracksta/i.test(msg)) return "in_use";
  if (name === "SecurityError" || /insecure|https/i.test(msg)) return "insecure";
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") return "constraint";
  return "unknown";
}

function detectBrowser(): "chrome" | "edge" | "firefox" | "safari" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "edge";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Chrome\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "safari";
  return "other";
}

const TITLES: Record<CameraErrorKind, string> = {
  denied: "Camera permission was blocked",
  not_found: "No camera detected",
  in_use: "Camera is being used by another app",
  insecure: "Camera needs a secure connection",
  constraint: "Camera doesn't support the required settings",
  unknown: "We couldn't access your camera",
};

const SUMMARIES: Record<CameraErrorKind, string> = {
  denied:
    "You'll need to allow camera access in your browser to take this proctored test. It only takes a moment — your test starts as soon as it's granted.",
  not_found:
    "Your browser couldn't find a working camera. Plug in a webcam (or enable your built-in one), then retry.",
  in_use:
    "Another app — like Zoom, Meet, Teams or a recording tool — is holding the camera. Close it, then retry.",
  insecure:
    "Cameras only work on a secure (HTTPS) page. Open this link in a normal browser tab on https:// and try again.",
  constraint:
    "Your camera couldn't match the resolution we need. Try switching to a different camera if you have one.",
  unknown:
    "Something went wrong while starting your camera. Retry in a moment, and if it keeps failing, switch browsers or restart your device.",
};

function instructionsFor(kind: CameraErrorKind): string[] {
  if (kind !== "denied") return [];
  const b = detectBrowser();
  if (b === "chrome" || b === "edge") {
    return [
      "Click the camera / lock icon at the left of the address bar.",
      "Set Camera to “Allow”.",
      "Reload this page, then press Retry.",
    ];
  }
  if (b === "firefox") {
    return [
      "Click the camera icon at the left of the address bar.",
      "Remove the “Blocked temporarily” permission for Camera.",
      "Reload the page and press Retry.",
    ];
  }
  if (b === "safari") {
    return [
      "Open Safari → Settings → Websites → Camera.",
      "Set this site to “Allow”.",
      "Reload the page and press Retry.",
    ];
  }
  return [
    "Open your browser's site settings for this page.",
    "Allow camera access.",
    "Reload the page and press Retry.",
  ];
}

interface Props {
  error: unknown;
  onRetry: () => void | Promise<void>;
  busy?: boolean;
  /** Optional handler called when the candidate picks a different camera. */
  onDeviceChange?: (deviceId: string) => void | Promise<void>;
}

/**
 * Friendly, actionable help shown whenever getUserMedia fails. Detects the
 * cause, gives browser-specific recovery instructions, lets the candidate
 * pick a different camera if any are available, and offers a Retry button.
 */
export function CameraPermissionHelp({ error, onRetry, busy = false, onDeviceChange }: Props) {
  const kind = useMemo(() => classifyCameraError(error), [error]);
  const steps = instructionsFor(kind);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [permState, setPermState] = useState<PermissionState | null>(null);
  const errorMessage = error instanceof Error ? error.message : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const list = await navigator.mediaDevices?.enumerateDevices?.();
        if (!mounted || !list) return;
        setDevices(list.filter((d) => d.kind === "videoinput"));
      } catch {
        /* ignore */
      }
    };
    void load();
    return () => { mounted = false; };
  }, [error]);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perms = (navigator as any).permissions;
    if (!perms?.query) return;
    perms
      .query({ name: "camera" as PermissionName })
      .then((res: PermissionStatus) => {
        if (!mounted) return;
        setPermState(res.state);
        res.onchange = () => mounted && setPermState(res.state);
      })
      .catch(() => { /* unsupported */ });
    return () => { mounted = false; };
  }, [error]);

  const Icon = kind === "denied" ? ShieldAlert : kind === "not_found" ? CameraOff : AlertTriangle;
  const tone =
    kind === "denied"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <div className="space-y-3">
      <div className={`rounded-md border p-3 space-y-2 ${tone}`}>
        <div className="flex items-start gap-2.5">
          <Icon className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="space-y-1 min-w-0">
            <div className="text-sm font-semibold leading-tight">{TITLES[kind]}</div>
            <p className="text-xs leading-relaxed opacity-90">{SUMMARIES[kind]}</p>
            {errorMessage && (
              <p className="text-[11px] opacity-60 font-mono break-words">{errorMessage}</p>
            )}
          </div>
        </div>

        {steps.length > 0 && (
          <ol className="text-xs space-y-1 pl-7 list-decimal opacity-90">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        {permState === "denied" && kind !== "denied" && (
          <div className="text-[11px] inline-flex items-center gap-1.5 opacity-80">
            <Info className="h-3 w-3" />
            Browser still shows camera as blocked for this site.
          </div>
        )}
      </div>

      {devices.length > 1 && onDeviceChange && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Camera className="h-3.5 w-3.5" />
          <span>Use camera:</span>
          <select
            className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value);
              void onDeviceChange(e.target.value);
            }}
          >
            <option value="">Default</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void onRetry()} disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          {busy ? "Retrying…" : "Retry camera access"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={busy}
        >
          <Settings className="h-4 w-4 mr-1.5" />
          Reload page
        </Button>
        <a
          href="https://support.google.com/chrome/answer/2693767"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline self-center text-muted-foreground hover:text-foreground"
        >
          Need more help?
        </a>
      </div>
    </div>
  );
}

export default CameraPermissionHelp;
