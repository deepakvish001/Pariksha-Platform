import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAdminContest } from "@/hooks/admin/useAdminContests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShieldAlert, Camera, RefreshCw, Flag, Ban, Sparkles, Mic, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { SimilarityTab } from "@/components/admin/contests/SimilarityTab";
import { VivaQueueTab } from "@/components/admin/contests/VivaQueueTab";
import { SideEyeTile } from "@/components/contests/SideEyeTile";
import { SideEyeScanTimeline } from "@/components/admin/contests/SideEyeScanTimeline";
import { SideEyeSettingsPanel } from "@/components/admin/contests/SideEyeSettingsPanel";

type Violation = {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  meta: any;
  created_at: string;
  full_name?: string | null;
};

type Snapshot = {
  id: string;
  user_id: string;
  storage_path: string;
  captured_at: string;
  full_name?: string | null;
  signed_url?: string;
};

const severityTone: Record<string, string> = {
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  flag: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  fatal: "bg-red-500/15 text-red-400 border-red-500/30",
};

const AdminContestProctor = () => {
  const { id } = useParams();
  const { data: contest } = useAdminContest(id);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string>("all");

  const violationsQuery = useQuery({
    queryKey: ["admin-contest-violations", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_violations")
        .select("id, user_id, type, severity, meta, created_at")
        .eq("contest_id", id!)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] as any[] };
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
      return (data ?? []).map((v: any) => ({ ...v, full_name: nameMap.get(v.user_id) ?? null })) as Violation[];
    },
  });

  const snapshotsQuery = useQuery({
    queryKey: ["admin-contest-snapshots", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_proctor_snapshots")
        .select("id, user_id, storage_path, captured_at")
        .eq("contest_id", id!)
        .order("captured_at", { ascending: false })
        .limit(120);
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] as any[] };
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
      const items = (data ?? []) as Snapshot[];
      const signed = await Promise.all(
        items.map(async (s) => {
          const { data: u } = await supabase.storage
            .from("contest-proctor")
            .createSignedUrl(s.storage_path, 60 * 10);
          return { ...s, signed_url: u?.signedUrl, full_name: nameMap.get(s.user_id) ?? null };
        })
      );
      return signed;
    },
  });

  type SessionRow = { id: string; user_id: string; started_at: string; user_agent: string | null; full_name?: string | null };
  const sessionsQuery = useQuery({
    queryKey: ["admin-contest-active-sessions", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contest_sessions")
        .select("id, user_id, started_at, user_agent")
        .eq("contest_id", id!)
        .eq("is_active", true)
        .order("started_at", { ascending: false });
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
        : { data: [] as any[] };
      const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
      return (data ?? []).map((s: any) => ({ ...s, full_name: nameMap.get(s.user_id) ?? null })) as SessionRow[];
    },
  });

  const forceEndSession = async (sessionId: string) => {
    const { error } = await supabase.rpc("contest_force_end_session" as never, { _session_id: sessionId } as never);
    if (error) toast.error(error.message);
    else { toast.success("Session ended"); sessionsQuery.refetch(); }
  };

  // Realtime updates
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`admin-proctor-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_violations", filter: `contest_id=eq.${id}` }, () => {
        violationsQuery.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_proctor_snapshots", filter: `contest_id=eq.${id}` }, () => {
        snapshotsQuery.refetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contest_sessions", filter: `contest_id=eq.${id}` }, () => {
        sessionsQuery.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const filteredViolations = useMemo(() => {
    const list = violationsQuery.data ?? [];
    return list.filter((v) => {
      if (severity !== "all" && v.severity !== severity) return false;
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        (v.full_name ?? "").toLowerCase().includes(q) ||
        v.user_id.includes(q) ||
        v.type.toLowerCase().includes(q)
      );
    });
  }, [violationsQuery.data, search, severity]);

  const stats = useMemo(() => {
    const list = violationsQuery.data ?? [];
    const byUser = new Map<string, number>();
    list.forEach((v) => byUser.set(v.user_id, (byUser.get(v.user_id) ?? 0) + 1));
    return {
      total: list.length,
      offenders: byUser.size,
      flagged: list.filter((v) => v.severity === "flag").length,
      fatal: list.filter((v) => v.severity === "fatal").length,
    };
  }, [violationsQuery.data]);

  const updateRegistration = async (userId: string, action: "flag" | "disqualify" | "clear") => {
    if (!id) return;
    const patch: Record<string, any> =
      action === "flag" ? { flagged: true } :
      action === "disqualify" ? { status: "disqualified", disqualified_at: new Date().toISOString() } :
      { flagged: false, disqualified_at: null, status: "registered" };
    const { error } = await supabase
      .from("contest_registrations")
      .update(patch)
      .eq("contest_id", id)
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else toast.success(action === "clear" ? "Cleared violations" : `User ${action}ed`);
  };

  return (
    <AdminShell>
      <Helmet><title>Proctor Review | Admin</title></Helmet>
      <div className="space-y-6 p-6">
        <Link to={`/admin/contests/${id}/registrations`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to registrations
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ShieldAlert className="h-6 w-6 text-amber-400" /> Proctor Review
            </h1>
            <p className="text-sm text-muted-foreground">{contest?.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => { violationsQuery.refetch(); snapshotsQuery.refetch(); }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={async () => {
              if (!id) return;
              const t = toast.loading("Generating integrity report…");
              const { data, error } = await supabase.functions.invoke("contest-integrity-report-generate", { body: { contest_id: id, publish: false } });
              toast.dismiss(t);
              if (error) toast.error(error.message);
              else toast.success(`Report updated (${data?.report?.total_participants ?? 0} participants)`);
            }}>
              Generate Report
            </Button>
            <Button size="sm" onClick={async () => {
              if (!id) return;
              if (!window.confirm("Publish this report to the public integrity page?")) return;
              const t = toast.loading("Publishing integrity report…");
              const { error } = await supabase.functions.invoke("contest-integrity-report-generate", { body: { contest_id: id, publish: true } });
              toast.dismiss(t);
              if (error) toast.error(error.message);
              else toast.success("Public integrity report published");
            }}>
              Generate &amp; Publish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Active sessions", value: sessionsQuery.data?.length ?? 0 },
            { label: "Total events", value: stats.total },
            { label: "Unique offenders", value: stats.offenders },
            { label: "Flagged events", value: stats.flagged },
            { label: "Fatal events", value: stats.fatal },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-semibold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="violations">
          <TabsList>
            <TabsTrigger value="violations"><ShieldAlert className="mr-2 h-4 w-4" />Violations</TabsTrigger>
            <TabsTrigger value="snapshots"><Camera className="mr-2 h-4 w-4" />Webcam snapshots</TabsTrigger>
            <TabsTrigger value="sessions">Active sessions</TabsTrigger>
            <TabsTrigger value="similarity"><Sparkles className="mr-2 h-4 w-4" />Similarity</TabsTrigger>
            <TabsTrigger value="viva"><Mic className="mr-2 h-4 w-4" />Viva queue</TabsTrigger>
            <TabsTrigger value="sideeye"><Smartphone className="mr-2 h-4 w-4" />Side cameras</TabsTrigger>
          </TabsList>

          <TabsContent value="violations" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search by name, user id, type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="flag">Flag</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto text-sm text-muted-foreground self-center">
                {filteredViolations.length} of {violationsQuery.data?.length ?? 0}
              </div>
            </div>
            <Card>
              {violationsQuery.isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : filteredViolations.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No violations recorded.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredViolations.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(v.created_at), "PP p")}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{v.full_name ?? "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground">{v.user_id.slice(0, 8)}…</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
                        <TableCell>
                          <Badge className={severityTone[v.severity] ?? severityTone.warn} variant="outline">{v.severity}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => updateRegistration(v.user_id, "flag")}>
                              <Flag className="mr-1 h-3.5 w-3.5" /> Flag
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateRegistration(v.user_id, "disqualify")}>
                              <Ban className="mr-1 h-3.5 w-3.5" /> DQ
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateRegistration(v.user_id, "clear")}>
                              Clear
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="snapshots">
            {snapshotsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
              </div>
            ) : (snapshotsQuery.data ?? []).length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">No webcam snapshots captured yet.</Card>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(snapshotsQuery.data ?? []).map((s) => (
                  <Card key={s.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted">
                      {s.signed_url ? (
                        <img src={s.signed_url} alt={`Snapshot ${s.user_id}`} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Unavailable</div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="truncate text-xs font-medium">{s.full_name ?? s.user_id.slice(0, 8)}</div>
                      <div className="text-[10px] text-muted-foreground">{format(new Date(s.captured_at), "PP p")}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              {sessionsQuery.isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : (sessionsQuery.data ?? []).length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">No active secure sessions right now.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sessionsQuery.data ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(s.started_at), "PP p")}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{s.full_name ?? "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground">{s.user_id.slice(0, 8)}…</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{s.user_agent ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => forceEndSession(s.id)}>
                              End session
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const t = toast.loading("Running similarity scan…");
                                const { data, error } = await supabase.functions.invoke("contest-similarity-scan", {
                                  body: { contest_id: id, autoflag_threshold: 0.85, autodq_threshold: 0.95 },
                                });
                                toast.dismiss(t);
                                if (error) toast.error("Similarity scan failed", { description: error.message });
                                else toast.success(`Similarity scan: ${(data as any)?.pairs ?? 0} pairs · ${(data as any)?.dq_users ?? 0} auto-DQ`);
                              }}
                            >
                              <Sparkles className="mr-1 h-3.5 w-3.5" /> Similarity
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const t = toast.loading("Running viva scan…");
                                const { data, error } = await supabase.functions.invoke("contest-viva-scan", {
                                  body: { contest_id: id, session_id: s.id },
                                });
                                toast.dismiss(t);
                                if (error) toast.error("Viva scan failed", { description: error.message });
                                else if ((data as any)?.enqueued_to_viva) toast.success("Enqueued to viva queue");
                                else toast.success("No viva action needed");
                              }}
                            >
                              <Mic className="mr-1 h-3.5 w-3.5" /> Viva
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={async () => {
                                const { error } = await supabase.rpc("contest_force_dq" as never, {
                                  _contest_id: id!, _user_id: s.user_id, _reason: "admin force-DQ from live monitor",
                                } as never);
                                if (error) toast.error(error.message);
                                else { toast.success("Disqualified"); sessionsQuery.refetch(); }
                              }}
                            >
                              Force DQ
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="similarity">
            {id && <SimilarityTab contestId={id} />}
          </TabsContent>
          <TabsContent value="viva">
            {id && <VivaQueueTab contestId={id} />}
          </TabsContent>
          <TabsContent value="sideeye" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4" /> Live side-camera streams
              </h3>
              {(sessionsQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(sessionsQuery.data ?? []).map((s: any) => (
                    <SideEyeTile key={s.id} sessionId={s.id} candidateName={s.user_id?.slice(0, 8)} />
                  ))}
                </div>
              )}
            </Card>
            {(sessionsQuery.data ?? []).map((s: any) => (
              <SideEyeScanTimeline key={`tl-${s.id}`} sessionId={s.id} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
};

export default AdminContestProctor;
