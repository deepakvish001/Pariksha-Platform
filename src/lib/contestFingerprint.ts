/**
 * Lightweight client fingerprint used to detect mid-session device swaps.
 * NOT a security boundary — we only flag changes; we don't use this to
 * identify users. Combine with the heartbeat RPC's drift check.
 */
export interface ContestFingerprint {
  ua: string;
  screen: { w: number; h: number; dpr: number };
  tz: string;
  canvasHash: string;
}

async function sha256(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-ctx";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 100, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("byteskill-contest", 2, 2);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("byteskill-contest", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "no-canvas";
  }
}

export async function computeContestFingerprint(): Promise<ContestFingerprint> {
  const canvasData = canvasFingerprint();
  const canvasHash = await sha256(canvasData);
  return {
    ua: navigator.userAgent,
    screen: {
      w: window.screen.width,
      h: window.screen.height,
      dpr: window.devicePixelRatio || 1,
    },
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    canvasHash,
  };
}
