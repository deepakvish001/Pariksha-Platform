import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { userId: string }

const ringColor = (s: number) =>
  s >= 85 ? "text-emerald-500" : s >= 70 ? "text-primary" : s >= 50 ? "text-amber-500" : "text-red-500";

export const PortfolioPanel = ({ userId }: Props) => {
  const { data } = useQuery({
    queryKey: ["portfolio-panel", userId],
    queryFn: async () => {
      const [settingsRes, prsRes, targetRes] = await Promise.all([
        supabase.from("portfolio_settings" as any).select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("placement_readiness_scores" as any).select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("target_companies" as any).select("*").eq("user_id", userId)
          .order("is_primary", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        settings: (settingsRes.data as any) ?? { is_public: true, show_prs: true, show_target_company: true },
        prs: prsRes.data as any,
        target: targetRes.data as any,
      };
    },
  });

  if (!data) return null;
  const { settings, prs, target } = data;
  if (!settings.is_public) return null;

  const showPrs = settings.show_prs && prs;
  const showTarget = settings.show_target_company && target;
  if (!showPrs && !showTarget) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {showPrs && (
        <Card className="p-4 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Placement Readiness</h3>
            <Badge variant="outline" className="capitalize text-[10px] ml-auto">{prs.level}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="3"
                  strokeDasharray={`${prs.score}, 100`} strokeLinecap="round"
                  className={ringColor(prs.score)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-xl font-bold", ringColor(prs.score))}>{prs.score}</span>
              </div>
            </div>
            <div className="text-xs space-y-0.5 text-muted-foreground">
              <div>DSA <span className="text-foreground font-medium">{prs.dsa_score}</span></div>
              <div>Contests <span className="text-foreground font-medium">{prs.contest_score}</span></div>
              <div>Consistency <span className="text-foreground font-medium">{prs.consistency_score}</span></div>
            </div>
          </div>
        </Card>
      )}
      {showTarget && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Targeting</h3>
          </div>
          <p className="text-lg font-bold">{target.company_name}</p>
          <p className="text-sm text-muted-foreground">{target.role}</p>
          <p className="text-xs text-muted-foreground mt-2">{target.timeline_weeks}-week prep plan</p>
        </Card>
      )}
    </div>
  );
};
