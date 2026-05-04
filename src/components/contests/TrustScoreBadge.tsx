import { useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { TrustScore } from "@/hooks/useContestTrustScore";

export function TrustScoreBadge({ trust }: { trust: TrustScore | null }) {
  const [open, setOpen] = useState(false);
  if (!trust) {
    return (
      <Badge variant="outline" className="border-border text-muted-foreground">
        <ShieldCheck className="mr-1 h-3 w-3" /> Trust …
      </Badge>
    );
  }
  const tone =
    trust.risk === "low" ? "border-emerald-400/40 text-emerald-300"
    : trust.risk === "medium" ? "border-amber-400/40 text-amber-300"
    : "border-red-400/50 text-red-300";
  const Icon = trust.risk === "low" ? ShieldCheck : trust.risk === "medium" ? ShieldAlert : ShieldX;
  return (
    <>
      <button onClick={() => setOpen(true)} type="button">
        <Badge variant="outline" className={`${tone} cursor-pointer`}>
          <Icon className="mr-1 h-3 w-3" /> Trust {trust.score}
        </Badge>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trust score: {trust.score}/100 ({trust.risk})</DialogTitle>
            <DialogDescription>
              Last evaluated {new Date(trust.computedAt).toLocaleTimeString()}. Score is
              continuously recomputed from your violations, webcam snapshots and screen
              recording. Submissions are blocked when it falls below the contest threshold.
            </DialogDescription>
          </DialogHeader>
          {trust.reasons.length > 0 ? (
            <ul className="ml-5 list-disc space-y-1 text-sm">
              {trust.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No issues flagged.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
