import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  ThumbsDown,
  Flag,
  FlagOff,
  Loader2,
  MessageSquare,
  RefreshCw,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Overview = {
  insight_key: string;
  insight_title: string;
  up_count: number;
  down_count: number;
  total_count: number;
  net_score: number;
  org_count: number;
  last_at: string;
  is_flagged: boolean;
  flag_reason: string | null;
  flagged_at: string | null;
};

type Response = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string | null;
  user_full_name: string | null;
  user_avatar_url: string | null;
  org_id: string;
  org_name: string | null;
  insight_key: string;
  insight_title: string;
  rating: "up" | "down";
  comment: string | null;
  total_count: number;
};

const PAGE_SIZE = 25;

export default function AiInsightFeedback() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"insights" | "responses">("insights");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | "up" | "down">(
    "all",
  );
  const [insightKeyFilter, setInsightKeyFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [flagTarget, setFlagTarget] = useState<Overview | null>(null);
  const [flagReason, setFlagReason] = useState("");

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [ratingFilter, insightKeyFilter]);

  const overview = useQuery({
    queryKey: ["admin", "ai-insight-overview"],
    queryFn: async (): Promise<Overview[]> => {
      const { data, error } = await supabase.rpc(
        "admin_get_ai_insight_overview",
        { _days: 90 },
      );
      if (error) throw error;
      return (data ?? []) as Overview[];
    },
  });

  const responses = useQuery({
    queryKey: [
      "admin",
      "ai-insight-responses",
      ratingFilter,
      insightKeyFilter,
      page,
    ],
    queryFn: async (): Promise<Response[]> => {
      const { data, error } = await supabase.rpc(
        "admin_list_ai_insight_feedback",
        {
          _limit: PAGE_SIZE,
          _offset: page * PAGE_SIZE,
          _rating: ratingFilter === "all" ? null : ratingFilter,
          _insight_key: insightKeyFilter,
          _org_id: null,
        },
      );
      if (error) throw error;
      return (data ?? []) as Response[];
    },
  });

  const setFlag = useMutation({
    mutationFn: async (vars: {
      insight_key: string;
      insight_title: string;
      reason: string | null;
      flagged: boolean;
    }) => {
      const { error } = await supabase.rpc("admin_set_insight_flag", {
        _insight_key: vars.insight_key,
        _insight_title: vars.insight_title,
        _reason: vars.reason,
        _flagged: vars.flagged,
      });
      if (error) throw error;
      return vars.flagged;
    },
    onSuccess: (flagged) => {
      toast.success(flagged ? "Insight flagged" : "Flag removed");
      qc.invalidateQueries({ queryKey: ["admin", "ai-insight-overview"] });
      setFlagTarget(null);
      setFlagReason("");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Could not update flag");
    },
  });

  const overviewRows = useMemo(() => {
    const rows = overview.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.insight_title.toLowerCase().includes(q) ||
        r.insight_key.toLowerCase().includes(q),
    );
  }, [overview.data, search]);

  const totalResponses = responses.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(Number(totalResponses) / PAGE_SIZE));

  const activeInsight = insightKeyFilter
    ? (overview.data ?? []).find((r) => r.insight_key === insightKeyFilter)
    : null;

  const onRefresh = () => {
    overview.refetch();
    responses.refetch();
  };

  return (
    <AdminShell>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            AI Insight Feedback
          </h1>
          <p className="text-sm text-muted-foreground">
            Review per-user thumbs feedback and flag low-quality insights so
            they stop appearing on dashboards.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${overview.isFetching || responses.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="insights">By insight</TabsTrigger>
          <TabsTrigger value="responses">
            Responses
            {insightKeyFilter && (
              <Badge variant="secondary" className="ml-2">
                filtered
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search insight title or key…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            {overview.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : overviewRows.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No feedback yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insight</TableHead>
                    <TableHead className="text-right">Up</TableHead>
                    <TableHead className="text-right">Down</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-right">Orgs</TableHead>
                    <TableHead className="text-right">Last</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviewRows.map((r) => (
                    <TableRow key={r.insight_key}>
                      <TableCell className="max-w-[360px]">
                        <div className="font-medium truncate">
                          {r.insight_title || r.insight_key}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate">
                          {r.insight_key}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {r.up_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className="bg-rose-500/10 text-rose-600 border-rose-500/20"
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {r.down_count}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          Number(r.net_score) > 0
                            ? "text-emerald-600"
                            : Number(r.net_score) < 0
                              ? "text-rose-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {Number(r.net_score) > 0 ? "+" : ""}
                        {r.net_score}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.org_count}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {r.last_at
                          ? formatDistanceToNow(new Date(r.last_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.is_flagged ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                            title={r.flag_reason ?? undefined}
                          >
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setInsightKeyFilter(r.insight_key);
                              setTab("responses");
                            }}
                            title="View responses for this insight"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
                          {r.is_flagged ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={setFlag.isPending}
                              onClick={() =>
                                setFlag.mutate({
                                  insight_key: r.insight_key,
                                  insight_title: r.insight_title,
                                  reason: null,
                                  flagged: false,
                                })
                              }
                              title="Remove flag"
                            >
                              <FlagOff className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setFlagTarget(r);
                                setFlagReason("");
                              }}
                              title="Flag as low-quality"
                            >
                              <Flag className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Select
                value={ratingFilter}
                onValueChange={(v) => setRatingFilter(v as typeof ratingFilter)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="up">👍 Up only</SelectItem>
                  <SelectItem value="down">👎 Down only</SelectItem>
                </SelectContent>
              </Select>
              {activeInsight && (
                <Badge
                  variant="secondary"
                  className="gap-2 max-w-[400px] truncate"
                >
                  Insight: {activeInsight.insight_title}
                  <button
                    className="ml-1 text-xs underline"
                    onClick={() => setInsightKeyFilter(null)}
                  >
                    clear
                  </button>
                </Badge>
              )}
              <div className="ml-auto text-xs text-muted-foreground">
                {responses.isFetching ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </span>
                ) : (
                  <>Total: {Number(totalResponses).toLocaleString()}</>
                )}
              </div>
            </div>

            {(responses.data ?? []).length === 0 && !responses.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No responses match these filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Org</TableHead>
                    <TableHead>Insight</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(responses.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(r.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={r.user_avatar_url ?? undefined}
                            />
                            <AvatarFallback>
                              {(r.user_full_name ?? r.user_email ?? "?")
                                .slice(0, 1)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {r.user_full_name ?? "—"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {r.user_email ?? r.user_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.org_name ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[320px]">
                        <button
                          className="text-left text-sm font-medium hover:underline truncate block w-full"
                          onClick={() => {
                            setInsightKeyFilter(r.insight_key);
                          }}
                          title={r.insight_title}
                        >
                          {r.insight_title}
                        </button>
                        {r.comment && (
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">
                            “{r.comment}”
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.rating === "up" ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Up
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-rose-500/10 text-rose-600 border-rose-500/20"
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Down
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!flagTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFlagTarget(null);
            setFlagReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag insight as low-quality</DialogTitle>
            <DialogDescription>
              Flagged insights are removed from rerank results and excluded
              from new generations across all organizations.
            </DialogDescription>
          </DialogHeader>
          {flagTarget && (
            <div className="space-y-3">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="text-sm font-medium">
                  {flagTarget.insight_title}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground mt-1 break-all">
                  {flagTarget.insight_key}
                </div>
              </div>
              <Textarea
                placeholder="Optional reason (e.g. inaccurate, off-topic, duplicate)…"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setFlagTarget(null);
                setFlagReason("");
              }}
              disabled={setFlag.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!flagTarget) return;
                setFlag.mutate({
                  insight_key: flagTarget.insight_key,
                  insight_title: flagTarget.insight_title,
                  reason: flagReason.trim() || null,
                  flagged: true,
                });
              }}
              disabled={setFlag.isPending || !flagTarget}
            >
              {setFlag.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Flag className="h-4 w-4 mr-2" />
              )}
              Flag insight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
