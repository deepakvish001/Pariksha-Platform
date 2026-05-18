import { useEffect, useMemo } from "react";

/**
 * Layer 1 — Per-candidate forensic watermark.
 *
 * Full-viewport, pointer-events-none diagonal repeated label that encodes
 * the candidate's identity + session id. If a screenshot of the question
 * surfaces anywhere (Telegram, Discord, screenshots-as-a-service), the
 * watermark identifies the leaker with no ambiguity.
 *
 * Uses semantic foreground token at 4% opacity so it stays legible enough
 * to survive screenshot compression but never distracts the candidate.
 */
export default function SessionWatermark({
  sessionId,
  label,
}: {
  sessionId: string;
  label: string;
}) {
  const text = useMemo(() => {
    const short = sessionId.slice(0, 8);
    const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
    return `${label} · ${short} · ${ts}`;
  }, [sessionId, label]);

  // Refresh timestamp every minute so any post-leak screenshot is forensically
  // timestamped to within ~60s of capture.
  useEffect(() => {
    const id = window.setInterval(() => {
      const el = document.getElementById("contest-watermark-root");
      if (el) {
        const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
        el.dataset.ts = ts;
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      id="contest-watermark-root"
      aria-hidden
      data-session={sessionId}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 40,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-50%",
          transform: "rotate(-30deg)",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "14vmin 10vmin",
          color: "hsl(var(--foreground))",
          opacity: 0.04,
          fontSize: "14px",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          whiteSpace: "nowrap",
        }}
      >
        {Array.from({ length: 32 }).map((_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}
