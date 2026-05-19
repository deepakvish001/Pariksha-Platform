import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import {
  Copy, Eye, Ban, ExternalLink, Loader2, Share2, Globe, Smartphone, Monitor, CalendarIcon, X,
} from "lucide-react";
import { format, formatDistanceToNow, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

type ShareRow = {
  id: string;
  token: string;
  kind: "profile" | "shortlist";
  student_id: string | null;
  student_ids: string[] | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  message: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  allow_resume: boolean;
  allow_contact: boolean;
};

function statusOf(r: ShareRow) {
  if (r.revoked_at) return "Revoked" as const;
  if (new Date(r.expires_at) < new Date()) return "Expired" as const;
  return "Active" as const;
}

function buildUrl(token: string, kind: "profile" | "shortlist") {
  const path = kind === "profile" ? `/p/student/${token}` : `/p/shortlist/${token}`;
  return `${window.location.origin}${path}`;
}

function parseUA(ua: string | null): { label: string; icon: typeof Monitor } {
  if (!ua) return { label: "Unknown", icon: Monitor };
  const m = ua.toLowerCase();
  const browser = m.includes("edg/") ? "Edge"
    : m.includes("chrome/") ? "Chrome"
    : m.includes("firefox/") ? "Firefox"
    : m.includes("safari/") ? "Safari"
    : "Browser";
  const os = m.includes("iphone") || m.includes("ipad") ? "iOS"
    : m.includes("android") ? "Android"
    : m.includes("mac os") || m.includes("macintosh") ? "macOS"
    : m.includes("windows") ? "Windows"
    : m.includes("linux") ? "Linux"
    : "";
  const icon = m.includes("iphone") || m.includes("ipad") || m.includes("android") ? Smartphone : Monitor;
  return { label: os ? `${browser} on ${os}` : browser, icon };
}

export function SharesTab({ orgId }: { orgId: string }) {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "profile" | "shortlist">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Expired" | "Revoked">("all");
  const [days, setDays] = useState<"7" | "30" | "90" | "all" | "custom">("30");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const studentFilter = params.get("student");
  const [openShare, setOpenShare] = useState<ShareRow | null>(null);

  const shares = useQuery({
    queryKey: ["org-shares", orgId, days, studentFilter, customRange?.from?.toISOString(), customRange?.to?.toISOString()],
    refetchInterval: 30000,
    queryFn: async () => {
      let q = (supabase as any)
        .from("student_share_links")
        .select("id, token, kind, student_id, student_ids, recruiter_name, recruiter_email, message, created_at, expires_at, revoked_at, view_count, last_viewed_at, allow_resume, allow_contact")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (days === "custom") {
        if (customRange?.from) q = q.gte("created_at", startOfDay(customRange.from).toISOString());
        if (customRange?.to) q = q.lte("created_at", endOfDay(customRange.to).toISOString());
      } else if (days !== "all") {
        const since = new Date(Date.now() - Number(days) * 86400 * 1000).toISOString();
        q = q.gte("created_at", since);
      }
      if (studentFilter) q = q.contains("student_ids", [studentFilter]);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as ShareRow[];
    },
  });

  const allStudentIds = useMemo(() => {
    const s = new Set<string>();
    (shares.data || []).forEach((r) => {
      (r.student_ids || []).forEach((id) => id && s.add(id));
      if (r.student_id) s.add(r.student_id);
    });
    return Array.from(s);
  }, [shares.data]);

  const studentInfo = useQuery({
    enabled: allStudentIds.length > 0,
    queryKey: ["org-shares-info", orgId, allStudentIds.length, allStudentIds.slice(0, 5).join(",")],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("org_students")
        .select("id, full_name, email")
        .in("id", allStudentIds);
      if (error) throw error;
      const names: Record<string, string> = {};
      const emails: Record<string, string> = {};
      (data || []).forEach((s: any) => {
        names[s.id] = s.full_name || s.email?.split("@")[0] || "Student";
        emails[s.id] = s.email || "";
      });
      return { names, emails };
    },
  });
  const studentNames = { data: studentInfo.data?.names };
  const studentEmails = studentInfo.data?.emails || {};

  const filtered = useMemo(() => {
    const rows = shares.data || [];
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.kind !== typeFilter) return false;
      const st = statusOf(r);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        const inRec = (r.recruiter_name || "").toLowerCase().includes(s)
          || (r.recruiter_email || "").toLowerCase().includes(s);
        const inStu = (r.student_ids || [])
          .some((id) => (studentNames.data?.[id] || "").toLowerCase().includes(s));
        if (!inRec && !inStu) return false;
      }
      return true;
    });
  }, [shares.data, typeFilter, statusFilter, search, studentNames.data]);

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("student_share_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-shares", orgId] });
      toast.success("Link revoked");
    },
    onError: (e: any) => toast.error(e?.message || "Could not revoke"),
  });

  const copyLink = async (r: ShareRow) => {
    await navigator.clipboard.writeText(buildUrl(r.token, r.kind));
    toast.success("Link copied");
  };

  // KPIs
  const kpis = useMemo(() => {
    const list = shares.data || [];
    const active = list.filter((r) => statusOf(r) === "Active").length;
    const totalViews = list.reduce((sum, r) => sum + (r.view_count || 0), 0);
    const opened = list.filter((r) => (r.view_count || 0) > 0).length;
    return {
      total: list.length,
      active,
      totalViews,
      openRate: list.length ? Math.round((opened / list.length) * 100) : 0,
    };
  }, [shares.data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total shares", value: kpis.total },
          { label: "Active links", value: kpis.active },
          { label: "Total opens", value: kpis.totalViews },
          { label: "Open rate", value: `${kpis.openRate}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Share2 className="h-4 w-4 text-primary" /> Share links
          </div>
          {studentFilter && (
            <Badge variant="outline" className="gap-1">
              Filtered: {studentNames.data?.[studentFilter] || "student"}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => { params.delete("student"); setParams(params, { replace: true }); }}
              >×</button>
            </Badge>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipient or student…"
              className="h-9 w-56"
            />
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="shortlist">Shortlist</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={days}
              onValueChange={(v: any) => {
                setDays(v);
                if (v !== "custom") setCustomRange(undefined);
                else if (!customRange) setCustomRange({ from: new Date(Date.now() - 30 * 86400 * 1000), to: new Date() });
              }}
            >
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="custom">Custom range…</SelectItem>
              </SelectContent>
            </Select>
            {days === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 justify-start text-left font-normal gap-2",
                      !customRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {customRange?.from ? (
                      customRange.to ? (
                        <>{format(customRange.from, "MMM d")} – {format(customRange.to, "MMM d, yyyy")}</>
                      ) : (
                        format(customRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick dates</span>
                    )}
                    {customRange?.from && (
                      <X
                        className="h-3.5 w-3.5 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setCustomRange(undefined); }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={setCustomRange}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Student(s)</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead>Last opened</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shares.isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">No shares match these filters.</TableCell></TableRow>
              ) : filtered.map((r) => {
                const st = statusOf(r);
                const ids = r.student_ids?.length ? r.student_ids : (r.student_id ? [r.student_id] : []);
                const firstName = studentNames.data?.[ids[0]] || "—";
                const extra = ids.length > 1 ? ` +${ids.length - 1}` : "";
                return (
                  <TableRow key={r.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setOpenShare(r)}>
                    <TableCell>
                      <div className="font-medium text-sm truncate max-w-[180px]">{r.recruiter_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">{r.recruiter_email || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{r.kind === "profile" ? "Profile" : "Shortlist"}</Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="truncate max-w-[160px] text-left text-sm">
                            {firstName}{extra}
                          </TooltipTrigger>
                          {ids.length > 1 && (
                            <TooltipContent className="max-w-xs">
                              {ids.map((id) => studentNames.data?.[id] || id).join(", ")}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <div className="text-xs">{format(new Date(r.expires_at), "MMM d, yyyy")}</div>
                      <Badge variant={st === "Active" ? "default" : "secondary"} className="text-[10px] mt-0.5">{st}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{r.view_count || 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.last_viewed_at ? formatDistanceToNow(new Date(r.last_viewed_at), { addSuffix: true }) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(r)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpenShare(r)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {st === "Active" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                            onClick={() => revoke.mutate(r.id)} disabled={revoke.isPending}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ShareDetailsSheet
        share={openShare}
        studentNames={studentNames.data || {}}
        onClose={() => setOpenShare(null)}
      />
    </div>
  );
}

function ShareDetailsSheet({
  share, studentNames, onClose,
}: {
  share: ShareRow | null;
  studentNames: Record<string, string>;
  onClose: () => void;
}) {
  const views = useQuery({
    enabled: !!share,
    queryKey: ["share-views", share?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("student_share_views")
        .select("id, viewed_at, ip_hash, user_agent, referrer")
        .eq("share_id", share!.id)
        .order("viewed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as Array<{ id: string; viewed_at: string; ip_hash: string | null; user_agent: string | null; referrer: string | null }>;
    },
  });

  const stats = useMemo(() => {
    const list = views.data || [];
    const uniqueIps = new Set(list.map((v) => v.ip_hash).filter(Boolean)).size;
    return {
      total: list.length,
      unique: uniqueIps,
      first: list.length ? list[list.length - 1].viewed_at : null,
      last: list.length ? list[0].viewed_at : null,
    };
  }, [views.data]);

  if (!share) return null;
  const ids = share.student_ids?.length ? share.student_ids : (share.student_id ? [share.student_id] : []);
  const url = buildUrl(share.token, share.kind);

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            {share.kind === "profile" ? "Profile share" : "Shortlist share"}
          </SheetTitle>
          <SheetDescription>
            Sent {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })} · expires {format(new Date(share.expires_at), "PPP")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-md border border-border p-3 space-y-1 text-sm">
            <div><span className="text-muted-foreground">Recipient:</span> <strong>{share.recruiter_name || "Unnamed"}</strong></div>
            {share.recruiter_email && <div><span className="text-muted-foreground">Email:</span> {share.recruiter_email}</div>}
            <div><span className="text-muted-foreground">Student(s):</span> {ids.map((id) => studentNames[id] || id.slice(0, 8)).join(", ")}</div>
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant={share.allow_resume ? "default" : "secondary"} className="text-[10px]">
                {share.allow_resume ? "Resume on" : "Resume off"}
              </Badge>
              <Badge variant={share.allow_contact ? "default" : "secondary"} className="text-[10px]">
                {share.allow_contact ? "Contact on" : "Contact off"}
              </Badge>
            </div>
            {share.message && (
              <div className="pt-2 italic text-muted-foreground border-t border-border/60 mt-2">"{share.message}"</div>
            )}
            <div className="pt-2 flex items-center gap-2">
              <Input readOnly value={url} className="text-xs font-mono" />
              <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied"); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Opens", value: stats.total },
              { label: "Unique", value: stats.unique },
              { label: "First", value: stats.first ? formatDistanceToNow(new Date(stats.first), { addSuffix: true }) : "—" },
              { label: "Last", value: stats.last ? formatDistanceToNow(new Date(stats.last), { addSuffix: true }) : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border/50 p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
                <div className="text-sm font-medium mt-0.5 truncate">{s.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Open events</div>
            {views.isLoading ? (
              <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin inline" /></div>
            ) : (views.data || []).length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6 rounded-md border border-dashed border-border">
                No opens yet. We'll log every view here.
              </div>
            ) : (
              <div className="space-y-1.5">
                {(views.data || []).map((v) => {
                  const ua = parseUA(v.user_agent);
                  const Icon = ua.icon;
                  let host = "Direct";
                  try { if (v.referrer) host = new URL(v.referrer).hostname; } catch { /* ignore */ }
                  return (
                    <div key={v.id} className="flex items-center gap-3 rounded-md border border-border/50 p-2 text-xs">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{ua.label}</div>
                        <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>{format(new Date(v.viewed_at), "MMM d, HH:mm")}</span>
                          {v.ip_hash && <span className="font-mono">IP {v.ip_hash.slice(0, 6)}…</span>}
                          <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{host}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
