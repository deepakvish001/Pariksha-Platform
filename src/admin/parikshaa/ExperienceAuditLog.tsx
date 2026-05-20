import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScrollText, ExternalLink, Search, User as UserIcon } from "lucide-react";

type AuditRow = {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_slug: string | null;
  diff: Record<string, any> | null;
  created_at: string;
};

const actionColor = (a: string) => {
  if (a.includes("approved") || a.includes("resolved")) return "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  if (a.includes("rejected") || a.includes("hidden")) return "bg-red-500/15 text-red-500 border-red-500/30";
  if (a.includes("dismissed")) return "bg-muted text-muted-foreground border-border";
  if (a.includes("pending")) return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-primary/15 text-primary border-primary/30";
};

export function ExperienceAuditLog() {
  const [entity, setEntity] = useState<"all" | "experience_report" | "interview_experience">("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["experience-audit-log", entity],
    queryFn: async () => {
      let query = supabase
        .from("admin_audit_log")
        .select("id, actor_id, action, entity_type, entity_slug, diff, created_at")
        .in("entity_type", entity === "all" ? ["experience_report", "interview_experience"] : [entity])
        .order("created_at", { ascending: false })
        .limit(300);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
  });

  const actorIds = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.actor_id))), [data]);
  const { data: actors } = useQuery({
    queryKey: ["audit-actors", actorIds],
    enabled: actorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", actorIds);
      if (error) throw error;
      return new Map(data.map((p: any) => [p.id, p]));
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((r) => {
      const blob = `${r.action} ${r.entity_slug ?? ""} ${JSON.stringify(r.diff ?? {})}`.toLowerCase();
      return blob.includes(term);
    });
  }, [data, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ScrollText className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Moderation audit log</h2>
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action, notes, company…" className="pl-8 w-64" />
          </div>
          <Select value={entity} onValueChange={(v) => setEntity(v as any)}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              <SelectItem value="experience_report">Reports</SelectItem>
              <SelectItem value="interview_experience">Experiences</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Card className="h-32 animate-pulse bg-muted/30" />
      ) : !filtered.length ? (
        <Card className="p-10 text-center text-muted-foreground">No audit entries yet.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const actor = actors?.get(r.actor_id);
            const expId = r.diff?.experience_id ?? (r.entity_type === "interview_experience" ? r.entity_slug : null);
            const company = r.diff?.company_name;
            const role = r.diff?.role;
            const fromTo = r.diff?.from_status && r.diff?.to_status
              ? `${r.diff.from_status} → ${r.diff.to_status}`
              : null;
            return (
              <Card key={r.id} className="p-3 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={actionColor(r.action)}>{r.action}</Badge>
                    {fromTo && <Badge variant="secondary" className="text-xs">{fromTo}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <UserIcon className="size-3" />
                      {actor?.username ? `@${actor.username}` : actor?.full_name || r.actor_id.slice(0, 8)}
                    </span>
                    {company && (
                      <span className="ml-2">
                        on <span className="font-medium">{company}</span>
                        {role && <span className="text-muted-foreground"> · {role}</span>}
                      </span>
                    )}
                  </p>
                  {(r.diff?.resolution_notes || r.diff?.moderation_notes) && (
                    <p className="text-xs text-muted-foreground italic">
                      “{r.diff.resolution_notes ?? r.diff.moderation_notes}”
                    </p>
                  )}
                  {r.diff?.reason && (
                    <p className="text-xs text-muted-foreground">Reason: {r.diff.reason}</p>
                  )}
                </div>
                {expId && (
                  <Button asChild size="sm" variant="ghost" className="gap-1 shrink-0">
                    <Link to={`/experiences/${expId}`} target="_blank">
                      <ExternalLink className="size-3.5" /> View
                    </Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
