import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface LockedAuxPanelProps {
  label: string;
  endsAt: string | null;
}

/**
 * Shown in place of contest-restricted reference panels (Notes, My Solution,
 * Reference, Run history) while a contest is live. Surfaces a live countdown
 * to the contest end so the participant knows when the panel will unlock.
 */
export function LockedAuxPanel({ label, endsAt }: LockedAuxPanelProps) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  let countdown = "";
  if (endsAt) {
    const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
    const h = Math.floor(remaining / 3600_000);
    const m = Math.floor((remaining % 3600_000) / 60_000);
    const s = Math.floor((remaining % 60_000) / 1000);
    countdown =
      h > 0
        ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
        : `${m}m ${String(s).padStart(2, "0")}s`;
  }

  return (
    <Card className="p-8 text-center border-amber-500/30 bg-amber-500/5">
      <Lock className="mx-auto h-8 w-8 text-amber-500" />
      <p className="mt-3 text-sm font-medium">
        🔒 {label} is locked during the contest
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {endsAt ? `Unlocks in ${countdown}` : "Unlocks when the contest ends"}
      </p>
    </Card>
  );
}

export default LockedAuxPanel;
