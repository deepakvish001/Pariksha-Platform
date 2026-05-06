import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface RiskRow {
  score: number;
  side_camera_count: number;
  screen_count: number;
  presence_count: number;
  high_severity_count: number;
  false_positive_count: number;
}

/**
 * Unified risk score for a contest session — fuses side-camera, screen and
 * presence findings (minus reviewer-confirmed false positives) into a 0-100
 * composite. Auto-refreshes every 30s while mounted.
 */
export function SideEyeUnifiedRiskBadge({ sessionId }: { sessionId: string }) {
  const [row, setRow] = useState<RiskRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc("sideeye_unified_risk_score" as never, {
        _session_id: sessionId,
      } as never);
      if (cancelled || !data) return;
      const first = Array.isArray(data) ? (data[0] as RiskRow) : (data as RiskRow);
      if (first) setRow(first);
    };
    load();
    const id = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [sessionId]);

  if (!row) {
    return (
      <Badge variant="outline" className="gap-1">
        <ShieldQuestion className="h-3 w-3" />
        Risk —
      </Badge>
    );
  }

  const score = row.score;
  const tone =
    score >= 70 ? "bg-red-500/15 text-red-500 border-red-500/40" :
    score >= 40 ? "bg-amber-500/15 text-amber-500 border-amber-500/40" :
                  "bg-emerald-500/15 text-emerald-500 border-emerald-500/40";
  const Icon = score >= 70 ? ShieldAlert : score >= 40 ? ShieldQuestion : ShieldCheck;

  return (
    <HoverCard openDelay={120}>
      <HoverCardTrigger asChild>
        <Badge variant="outline" className={`gap-1 cursor-help ${tone}`}>
          <Icon className="h-3 w-3" />
          Risk {score}/100
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 text-sm">
        <div className="font-medium mb-2">Unified risk breakdown</div>
        <ul className="space-y-1 text-xs">
          <li className="flex justify-between"><span>Side camera findings</span><span>{row.side_camera_count}</span></li>
          <li className="flex justify-between"><span>Screen findings</span><span>{row.screen_count}</span></li>
          <li className="flex justify-between"><span>Presence findings</span><span>{row.presence_count}</span></li>
          <li className="flex justify-between"><span>High severity</span><span>{row.high_severity_count}</span></li>
          <li className="flex justify-between text-emerald-500">
            <span>False positives (–6 each)</span><span>{row.false_positive_count}</span>
          </li>
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Score capped 0–100. Updated every 30s.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
