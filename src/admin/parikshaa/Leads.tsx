import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

type Lead = {
  id: string;
  name: string;
  work_email: string;
  organization: string;
  org_type: string;
  team_size: string | null;
  message: string | null;
  source: string | null;
  status: "new" | "contacted" | "qualified" | "closed";
  created_at: string;
};

const STATUSES: Lead["status"][] = ["new", "contacted", "qualified", "closed"];

export default function ParikshaaLeads() {
  const [tab, setTab] = useState<Lead["status"]>("new");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["parikshaa-leads", tab],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from("b2b_leads")
        .select("*")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Lead[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["parikshaa-leads-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("b2b_leads").select("status");
      if (error) throw error;
      const out: Record<string, number> = { new: 0, contacted: 0, qualified: 0, closed: 0 };
      (data ?? []).forEach((r: any) => { out[r.status] = (out[r.status] ?? 0) + 1; });
      return out;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead["status"] }) => {
      const { error } = await supabase.from("b2b_leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parikshaa-leads"] });
      qc.invalidateQueries({ queryKey: ["parikshaa-leads-counts"] });
      toast({ title: "Lead updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <>
      <ShellHeader title="Leads & Growth" />
      <div className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Lead["status"])}>
          <TabsList>
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s} <span className="ml-1.5 text-xs text-muted-foreground">{counts?.[s] ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUSES.map((s) => (
            <TabsContent key={s} value={s} className="mt-4">
              <div className="rounded-lg border bg-card divide-y">
                {isLoading ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground"></div>
                ) : (data ?? []).length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No leads here.</div>
                ) : (
                  (data ?? []).map((l) => (
                    <div key={l.id} className="px-4 py-3 grid grid-cols-[1fr,auto] gap-4 items-start">
                      <div className="min-w-0 text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{l.name}</span>
                          <Badge variant="outline">{l.org_type}</Badge>
                          {l.team_size && <Badge variant="secondary">{l.team_size}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {l.organization} · <a className="underline" href={`mailto:${l.work_email}`}>{l.work_email}</a>
                        </div>
                        {l.message && <div className="text-xs text-foreground/80">{l.message}</div>}
                        <div className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()} · {l.source ?? "—"}</div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {STATUSES.filter((x) => x !== l.status).map((next) => (
                          <Button
                            key={next}
                            size="sm"
                            variant="outline"
                            className="capitalize"
                            onClick={() => update.mutate({ id: l.id, status: next })}
                          >
                            → {next}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
