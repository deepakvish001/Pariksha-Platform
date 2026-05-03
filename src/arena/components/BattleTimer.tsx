import { useEffect, useState } from "react";

export function BattleTimer({ endsAt, onExpire }: { endsAt: string | null; onExpire?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return null;
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);
  const danger = remaining < 60_000;
  if (remaining === 0 && onExpire) {
    queueMicrotask(onExpire);
  }
  return (
    <div
      className={`font-mono text-2xl font-bold tabular-nums ${danger ? "text-red-400 animate-pulse" : "text-cyan-300"}`}
      style={{ textShadow: danger ? "0 0 10px rgba(239,68,68,0.6)" : "0 0 10px rgba(34,211,238,0.5)" }}
    >
      {mm.toString().padStart(2, "0")}:{ss.toString().padStart(2, "0")}
    </div>
  );
}
