import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Flag, ChevronDown, ShieldCheck, X, Clock } from "lucide-react";
import { useState } from "react";
import { REPORT_REASONS } from "@/components/experiences/ReportExperienceDialog";

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
};

const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

const statusMeta: Record<ReportRow["status"], { label: string; cls: string; icon: typeof Clock }> = {
  open: { label: "Under review", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: Clock },
  resolved: { label: "Resolved", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: ShieldCheck },
  dismissed: { label: "Dismissed", cls: "bg-muted text-muted-foreground border-border", icon: X },
};

interface Props {
  experienceId: string;
  /** Whether the current viewer is the author or an admin (used to copy-tune). */
  isAuthor?: boolean;
}

export function ExperienceReportHistory({ experienceId, isAuthor }: Props) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["experience-report-history", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_reports")
        .select("id, reason, details, status, resolution_notes, resolved_at, created_at")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReportRow[];
    },
  });

  if (isLoading || !data || data.length === 0) return null;

  const openCount = data.filter((r) => r.status === "open").length;

  return (
    <Card className="p-4 border-border/60">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full gap-3 group">
          <div className="flex items-center gap-2 min-w-0">
            <Flag className="size-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm">Report history</span>
            <Badge variant="secondary" className="text-xs">{data.length}</Badge>
            {openCount > 0 && (
              <Badge variant="outline" className={statusMeta.open.cls}>{openCount} open</Badge>
            )}
          </div>
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-3 space-y-3">
          {isAuthor && (
            <p className="text-xs text-muted-foreground">
              Reporter identities are hidden. Only you and the moderation team can see this panel.
            </p>
          )}
          {data.map((r) => {
            const meta = statusMeta[r.status];
            const Icon = meta.icon;
            return (
              <div key={r.id} className="rounded-md border border-border/60 p-3 space-y-2 bg-muted/20">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={meta.cls}>
                    <Icon className="size-3 mr-1" /> {meta.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{reasonLabel(r.reason)}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                {r.details && (
                  <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                    <span className="font-medium text-foreground">Reporter note: </span>{r.details}
                  </p>
                )}

                {r.status !== "open" && (
                  <div className="text-xs border-t border-border/40 pt-2 space-y-1">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Admin decision: </span>
                      {r.status === "resolved" ? "Resolved by moderators" : "Dismissed — no action taken"}
                      {r.resolved_at && ` · ${new Date(r.resolved_at).toLocaleDateString()}`}
                    </p>
                    {r.resolution_notes && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Notes: </span>{r.resolution_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
