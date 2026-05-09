import { useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Search, Mail, Building2, Globe, Tag, Download } from "lucide-react";

type DemoRequest = {
  id: string;
  name: string;
  email: string;
  org: string;
  use_case: string;
  candidates: string;
  proctoring: string[] | null;
  reporting: string[] | null;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_page: string | null;
  status: "new" | "contacted" | "qualified" | "closed";
  created_at: string;
};

const STATUSES: DemoRequest["status"][] = ["new", "contacted", "qualified", "closed"];
const STATUS_VARIANT: Record<DemoRequest["status"], "default" | "secondary" | "outline"> = {
  new: "default",
  contacted: "secondary",
  qualified: "default",
  closed: "outline",
};

function toCsv(rows: DemoRequest[]): string {
  const headers = [
    "id", "created_at", "status", "name", "email", "org", "use_case",
    "candidates", "proctoring", "reporting", "utm_source", "utm_medium",
    "utm_campaign", "utm_term", "utm_content", "referrer", "landing_page", "notes",
  ];
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as never as Record<string, unknown>)[h])).join(","));
  }
  return lines.join("\n");
}

export default function DemoRequestsAdmin() {
  const [tab, setTab] = useState<DemoRequest["status"] | "all">("new");
  const [search, setSearch] = useState("");
  const [utmSource, setUtmSource] = useState<string>("__all__");
  const [utmCampaign, setUtmCampaign] = useState<string>("__all__");
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["demo-requests"],
    queryFn: async (): Promise<DemoRequest[]> => {
      const { data, error } = await supabase
        .from("demo_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as DemoRequest[];
    },
  });

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: rows.length, new: 0, contacted: 0, qualified: 0, closed: 0 };
    for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
    return out;
  }, [rows]);

  const utmSources = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.utm_source && s.add(r.utm_source));
    return Array.from(s).sort();
  }, [rows]);

  const utmCampaigns = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.utm_campaign && s.add(r.utm_campaign));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (utmSource !== "__all__" && (r.utm_source ?? "") !== utmSource) return false;
      if (utmCampaign !== "__all__" && (r.utm_campaign ?? "") !== utmCampaign) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.org.toLowerCase().includes(q) ||
        (r.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, tab, search, utmSource, utmCampaign]);

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DemoRequest["status"] }) => {
      const { error } = await supabase.from("demo_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["demo-requests"] });
      toast({ title: `Marked as ${vars.status}` });
    },
    onError: (e: unknown) =>
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      }),
  });

  const exportCsv = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demo-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <>
      <ShellHeader
        title="Demo Requests"
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="grid gap-3 md:grid-cols-[1fr,200px,200px] items-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, org, notes…"
              className="pl-9"
            />
          </div>
          <Select value={utmSource} onValueChange={setUtmSource}>
            <SelectTrigger>
              <SelectValue placeholder="UTM source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All sources</SelectItem>
              {utmSources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={utmCampaign} onValueChange={setUtmCampaign}>
            <SelectTrigger>
              <SelectValue placeholder="UTM campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All campaigns</SelectItem>
              {utmCampaigns.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as DemoRequest["status"] | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              All <span className="ml-1.5 text-xs text-muted-foreground">{counts.all}</span>
            </TabsTrigger>
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s} <span className="ml-1.5 text-xs text-muted-foreground">{counts[s] ?? 0}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <div className="rounded-lg border bg-card divide-y">
              {isLoading ? (
                <div className="px-4 py-6 text-sm text-muted-foreground"></div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No demo requests match these filters.
                </div>
              ) : (
                filtered.map((r) => (
                  <div key={r.id} className="px-4 py-4 grid gap-4 md:grid-cols-[1fr,auto] items-start">
                    <div className="min-w-0 space-y-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{r.name}</span>
                        <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">
                          {r.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{r.use_case}</Badge>
                        <Badge variant="secondary">{r.candidates}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {r.org}
                        </span>
                        <a className="inline-flex items-center gap-1 underline hover:text-foreground" href={`mailto:${r.email}`}>
                          <Mail className="h-3 w-3" /> {r.email}
                        </a>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      {(r.proctoring?.length || r.reporting?.length) && (
                        <div className="flex flex-wrap gap-1.5">
                          {(r.proctoring ?? []).map((p) => (
                            <Badge key={`p-${p}`} variant="outline" className="text-[10px]">
                              proctor: {p}
                            </Badge>
                          ))}
                          {(r.reporting ?? []).map((p) => (
                            <Badge key={`r-${p}`} variant="outline" className="text-[10px]">
                              report: {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {r.notes && (
                        <p className="text-xs text-foreground/80 whitespace-pre-line border-l-2 border-border pl-2">
                          {r.notes}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          src: <strong className="text-foreground/70">{r.utm_source ?? "—"}</strong> ·
                          med: <strong className="text-foreground/70">{r.utm_medium ?? "—"}</strong> ·
                          camp: <strong className="text-foreground/70">{r.utm_campaign ?? "—"}</strong>
                        </span>
                        {r.referrer && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[260px]">
                            <Globe className="h-3 w-3" /> {r.referrer}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0 min-w-[140px]">
                      {STATUSES.filter((s) => s !== r.status).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === "qualified" ? "default" : "outline"}
                          className="capitalize"
                          disabled={update.isPending}
                          onClick={() => update.mutate({ id: r.id, status: next })}
                        >
                          Mark {next}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
