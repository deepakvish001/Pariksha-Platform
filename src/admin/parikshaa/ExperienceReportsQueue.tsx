import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Check, X, EyeOff, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { REPORT_REASONS } from "@/components/experiences/ReportExperienceDialog";

type ReportStatus = "open" | "resolved" | "dismissed";

type ReportRow = {
  id: string;
  experience_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution_notes: string | null;
  created_at: string;
  experience?: {
    id: string;
    company_name: string;
    role: string;
    year: number;
    status: string;
    overall_text: string;
    user_id: string;
  } | null;
};

const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

const reasonColor: Record<string, string> = {
  spam: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  misinformation: "bg-red-500/15 text-red-500 border-red-500/30",
  plagiarism: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  offensive: "bg-red-500/15 text-red-500 border-red-500/30",
  personal_info: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  other: "bg-muted text-muted-foreground border-border",
};

function useReports(status: ReportStatus) {
  return useQuery({
    queryKey: ["admin-experience-reports", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_reports")
        .select("*, experience:interview_experiences(id, company_name, role, year, status, overall_text, user_id)")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as ReportRow[];
    },
  });
}

export function ExperienceReportsQueue() {
  const [tab, setTab] = useState<ReportStatus>("open");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isLoading } = useReports(tab);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => (data ?? []).filter((r) => reasonFilter === "all" || r.reason === reasonFilter),
    [data, reasonFilter]
  );

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const resolve = useMutation({
    mutationFn: async ({ id, status, hideExperience, experienceId }: { id: string; status: "resolved" | "dismissed"; hideExperience?: boolean; experienceId?: string }) => {
      const { error } = await supabase
        .from("experience_reports")
        .update({
          status,
          resolution_notes: notesById[id] || null,
          resolved_by: user?.id ?? null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
      if (hideExperience && experienceId) {
        const { error: e2 } = await supabase
          .from("interview_experiences")
          .update({ status: "rejected", moderation_notes: "Removed after community report" })
          .eq("id", experienceId);
        if (e2) throw e2;
      }
    },
    onSuccess: (_d, vars) => {
      toast({ title: vars.hideExperience ? "Resolved & experience hidden" : vars.status === "resolved" ? "Marked resolved" : "Dismissed" });
      qc.invalidateQueries({ queryKey: ["admin-experience-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-experiences"] });
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const bulk = useMutation({
    mutationFn: async ({ action }: { action: "resolve" | "dismiss" | "hide" }) => {
      const ids = Array.from(selected);
      const rows = filtered.filter((r) => ids.includes(r.id));
      if (rows.length === 0) return { count: 0, hidden: 0 };
      const newStatus: "resolved" | "dismissed" = action === "dismiss" ? "dismissed" : "resolved";

      const { error } = await supabase
        .from("experience_reports")
        .update({
          status: newStatus,
          resolved_by: user?.id ?? null,
          resolved_at: new Date().toISOString(),
          resolution_notes: action === "hide" ? "Bulk action: experience hidden" : null,
        })
        .in("id", ids);
      if (error) throw error;

      let hidden = 0;
      if (action === "hide") {
        const expIds = Array.from(
          new Set(
            rows
              .map((r) => r.experience?.id)
              .filter((id): id is string => !!id)
          )
        );
        if (expIds.length) {
          const { error: e2, count } = await supabase
            .from("interview_experiences")
            .update({ status: "rejected", moderation_notes: "Removed after community report" }, { count: "exact" })
            .in("id", expIds)
            .neq("status", "rejected");
          if (e2) throw e2;
          hidden = count ?? expIds.length;
        }
      }
      return { count: rows.length, hidden };
    },
    onSuccess: (res, vars) => {
      toast({
        title: `${res.count} report${res.count === 1 ? "" : "s"} ${vars.action === "dismiss" ? "dismissed" : "resolved"}`,
        description: vars.action === "hide" ? `${res.hidden} experience${res.hidden === 1 ? "" : "s"} hidden.` : undefined,
      });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-experience-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-experiences"] });
      qc.invalidateQueries({ queryKey: ["experiences"] });
    },
    onError: (e: any) => toast({ title: "Bulk action failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Flag className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Community reports</h2>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setSelected(new Set()); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reasons</SelectItem>
              {REPORT_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tab} onValueChange={(v) => { setTab(v as ReportStatus); setSelected(new Set()); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {tab === "open" && filtered.length > 0 && (
        <Card className="p-3 flex flex-wrap items-center gap-2 sticky top-2 z-10 bg-background/95 backdrop-blur">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
          <span className="text-sm text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : `${filtered.length} report${filtered.length === 1 ? "" : "s"}`}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={selected.size === 0 || bulk.isPending} onClick={() => bulk.mutate({ action: "dismiss" })} className="gap-1">
              {bulk.isPending && bulk.variables?.action === "dismiss" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Dismiss
            </Button>
            <Button size="sm" disabled={selected.size === 0 || bulk.isPending} onClick={() => bulk.mutate({ action: "resolve" })} className="gap-1">
              {bulk.isPending && bulk.variables?.action === "resolve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
            </Button>
            <Button size="sm" variant="destructive" disabled={selected.size === 0 || bulk.isPending} onClick={() => bulk.mutate({ action: "hide" })} className="gap-1">
              {bulk.isPending && bulk.variables?.action === "hide" ? <Loader2 className="size-4 animate-spin" /> : <EyeOff className="size-4" />} Hide experiences
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <Card className="h-32 animate-pulse bg-muted/30" />
      ) : !filtered.length ? (
        <Card className="p-10 text-center text-muted-foreground">No {tab} reports{reasonFilter !== "all" ? ` for "${reasonLabel(reasonFilter)}"` : ""}.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  {tab === "open" && (
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleOne(r.id)}
                      className="mt-1"
                      aria-label="Select report"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={reasonColor[r.reason]}>{reasonLabel(r.reason)}</Badge>
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="size-3" />{new Date(r.created_at).toLocaleDateString()}
                      </Badge>
                      {r.experience?.status === "rejected" && (
                        <Badge variant="outline" className="gap-1 border-red-500/30 text-red-500"><EyeOff className="size-3" /> Hidden</Badge>
                      )}
                    </div>
                    {r.experience ? (
                      <p className="text-sm mt-2">
                        <span className="font-medium">{r.experience.company_name}</span>
                        <span className="text-muted-foreground"> · {r.experience.role} · {r.experience.year}</span>
                      </p>
                    ) : (
                      <p className="text-sm mt-2 text-muted-foreground italic">Experience deleted</p>
                    )}
                  </div>
                </div>
                {r.experience && (
                  <Button asChild size="sm" variant="outline" className="gap-1">
                    <Link to={`/experiences/${r.experience.id}`} target="_blank">
                      <ExternalLink className="size-3.5" /> View
                    </Link>
                  </Button>
                )}
              </div>

              {r.details && (
                <div className="text-sm bg-muted/40 rounded-md p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Reporter details</p>
                  <p className="whitespace-pre-wrap">{r.details}</p>
                </div>
              )}

              {tab === "open" ? (
                <>
                  <Textarea
                    placeholder="Resolution notes (internal)"
                    rows={2}
                    value={notesById[r.id] ?? ""}
                    onChange={(e) => setNotesById((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })} disabled={resolve.isPending} className="gap-1">
                      <X className="size-4" /> Dismiss
                    </Button>
                    {r.experience && r.experience.status !== "rejected" && (
                      <Button size="sm" variant="destructive" onClick={() => resolve.mutate({ id: r.id, status: "resolved", hideExperience: true, experienceId: r.experience!.id })} disabled={resolve.isPending} className="gap-1">
                        <EyeOff className="size-4" /> Hide experience
                      </Button>
                    )}
                    <Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: "resolved" })} disabled={resolve.isPending} className="gap-1">
                      <Check className="size-4" /> Resolve
                    </Button>
                  </div>
                </>
              ) : (
                r.resolution_notes && (
                  <p className="text-xs text-muted-foreground italic">Notes: {r.resolution_notes}</p>
                )
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
