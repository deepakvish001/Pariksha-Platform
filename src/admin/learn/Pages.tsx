import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { LearnHeader } from "./LearnShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Upload,
  ExternalLink,
  Search,
  CheckCircle2,
  Eye,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useAdminProblems,
  useTogglePublish,
} from "@/hooks/useAdminProblems";
import {
  useAdminUsers,
  useReports,
  useResolveReport,
  useAdminAIContent,
  useToggleAIContentPublic,
  useDailyChallengeSchedule,
  useBroadcast,
} from "@/hooks/admin/useAdminControl";
import { formatDistanceToNow } from "date-fns";

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const FullLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Button asChild variant="outline" size="sm">
    <Link to={to}>
      <ExternalLink className="mr-2 h-3.5 w-3.5" />
      {children}
    </Link>
  </Button>
);

const RangeBadge = () => {
  const [params] = useSearchParams();
  const range = params.get("range");
  if (!range) return null;
  return (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
      Last {range}
    </Badge>
  );
};

/** URL-synced debounced search input. Resets page param on change. */
function useUrlSearch(key = "q", debounceMs = 300) {
  const [params, setParams] = useSearchParams();
  const urlValue = params.get(key) ?? "";
  const [value, setValue] = useState(urlValue);

  useEffect(() => {
    const t = setTimeout(() => {
      const current = new URLSearchParams(window.location.search);
      const trimmed = value.trim();
      const before = current.get(key) ?? "";
      if (trimmed === before) return;
      if (trimmed) current.set(key, trimmed);
      else current.delete(key);
      current.delete("page");
      setParams(current, { replace: true });
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { value, setValue, applied: urlValue };
}

function usePageParam() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    setParams(next, { replace: true });
  };
  return { page, setPage };
}

const Pager = ({
  page,
  setPage,
  hasPrev,
  hasNext,
  label,
}: {
  page: number;
  setPage: (p: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
  label: string;
}) => (
  <div className="flex items-center justify-between gap-2 pt-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        disabled={!hasPrev}
        onClick={() => setPage(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="text-xs text-muted-foreground px-2">Page {page}</span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        disabled={!hasNext}
        onClick={() => setPage(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

const PAGE_SIZE = 20;

/* ────────────── Problems ────────────── */
export function LearnProblems() {
  const { value: q, setValue: setQ, applied } = useUrlSearch("q");
  const { page, setPage } = usePageParam();
  const { data, isLoading, isFetching } = useAdminProblems(applied);
  const toggle = useTogglePublish();

  const total = data?.length ?? 0;
  const start = (page - 1) * PAGE_SIZE;
  const rows = (data ?? []).slice(start, start + PAGE_SIZE);
  const hasNext = start + PAGE_SIZE < total;
  const hasPrev = page > 1;

  return (
    <>
      <LearnHeader
        title="Coding Problems"
        actions={
          <>
            <RangeBadge />
            <FullLink to="/admin/problems">Open full editor</FullLink>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/problems/import">
                <Upload className="mr-2 h-3.5 w-3.5" /> Import
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/problems/new">
                <Plus className="mr-2 h-3.5 w-3.5" /> New
              </Link>
            </Button>
          </>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search problems…"
            className="pl-8 h-9"
          />
        </div>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>{applied ? `No problems matching "${applied}".` : "No problems yet."}</Empty>
        ) : (
          <>
            <div className="rounded-lg border bg-card divide-y">
              {rows.map((p) => (
                <div
                  key={p.slug}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/problems/${p.slug}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {p.title}
                      </Link>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {p.difficulty}
                      </Badge>
                      {p.is_published ? (
                        <Badge className="text-[10px]">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Draft</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground truncate">
                      {p.slug} · updated{" "}
                      {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={p.is_published ? "outline" : "default"}
                    onClick={() =>
                      toggle.mutate({ slug: p.slug, publish: !p.is_published })
                    }
                    disabled={toggle.isPending}
                  >
                    {p.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              ))}
            </div>
            <Pager
              page={page}
              setPage={setPage}
              hasPrev={hasPrev}
              hasNext={hasNext}
              label={`Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total}${
                isFetching ? " · refreshing…" : ""
              }`}
            />
          </>
        )}
      </div>
    </>
  );
}

/* ────────────── Users ────────────── */
export function LearnUsers() {
  const { value: q, setValue: setQ, applied } = useUrlSearch("q");
  const { page, setPage } = usePageParam();
  // Fetch one extra row to detect a next page without a count query.
  const limit = PAGE_SIZE + 1;
  const offset = (page - 1) * PAGE_SIZE;
  const { data, isLoading, isFetching } = useAdminUsers(applied, limit, offset);
  const all = (data ?? []) as any[];
  const rows = all.slice(0, PAGE_SIZE);
  const hasNext = all.length > PAGE_SIZE;
  const hasPrev = page > 1;

  return (
    <>
      <LearnHeader
        title="Users"
        actions={
          <>
            <RangeBadge />
            <FullLink to="/admin/users">Open full users console</FullLink>
          </>
        }
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email or name…"
            className="pl-8 h-9"
          />
        </div>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>{applied ? `No users matching "${applied}".` : "No users found."}</Empty>
        ) : (
          <>
            <div className="rounded-lg border bg-card divide-y">
              {rows.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u.full_name || u.username || u.email || u.user_id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email ?? "—"} · L{u.current_level ?? 0} · {u.total_xp ?? 0} XP
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                    {(u.roles ?? []).slice(0, 2).map((r: string) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Pager
              page={page}
              setPage={setPage}
              hasPrev={hasPrev}
              hasNext={hasNext}
              label={`Showing ${offset + 1}–${offset + rows.length}${
                isFetching ? " · refreshing…" : ""
              }`}
            />
          </>
        )}
      </div>
    </>
  );
}

/* ────────────── Daily Challenge ────────────── */
export function LearnDaily() {
  const { data, isLoading } = useDailyChallengeSchedule();
  const upcoming = (data ?? []).slice(0, 10);
  return (
    <>
      <LearnHeader
        title="Daily Challenge"
        actions={<FullLink to="/admin/daily-challenge">Open scheduler</FullLink>}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Upcoming</p>
          <p className="mt-1 text-3xl font-bold">{upcoming.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">scheduled challenges</p>
        </Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : upcoming.length === 0 ? (
          <Empty>
            No upcoming challenges scheduled.{" "}
            <Link to="/admin/daily-challenge" className="underline">
              Schedule one
            </Link>
          </Empty>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {upcoming.map((d: any) => (
              <div key={d.challenge_date} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <div className="text-sm font-medium">{d.challenge_date}</div>
                  <div className="text-xs text-muted-foreground">{d.problem_slug}</div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/problems/${d.problem_slug}`}>
                    <Eye className="mr-2 h-3.5 w-3.5" /> View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ────────────── AI Content ────────────── */
export function LearnAIContent() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useAdminAIContent(q);
  const toggle = useToggleAIContentPublic();
  const rows = ((data ?? []) as any[]).slice(0, 20);

  return (
    <>
      <LearnHeader
        title="AI Content"
        actions={<><RangeBadge /><FullLink to="/admin/ai-content">Open full moderation</FullLink></>}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title…"
            className="pl-8 h-9"
          />
        </div>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>No AI content.</Empty>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {rows.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.content_type} · {c.topic ?? "—"} · ♥ {c.likes_count ?? 0}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.is_public ? (
                    <Badge className="text-[10px]">Public</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Private</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toggle.mutate({ id: c.id, isPublic: !c.is_public })
                    }
                    disabled={toggle.isPending}
                  >
                    {c.is_public ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ────────────── Reports ────────────── */
export function LearnReports() {
  const { data, isLoading } = useReports("open");
  const resolve = useResolveReport();
  const rows = ((data ?? []) as any[]).slice(0, 20);

  return (
    <>
      <LearnHeader
        title="Open Reports"
        actions={<><RangeBadge /><FullLink to="/admin/reports">Open full queue</FullLink></>}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Open</p>
          <p
            className={`mt-1 text-3xl font-bold ${
              rows.length > 0 ? "text-destructive" : ""
            }`}
          >
            {data?.length ?? 0}
          </p>
        </Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>No open reports. Nice.</Empty>
        ) : (
          <div className="rounded-lg border bg-card divide-y">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.reason ?? "Reported"}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {r.entity_type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.details ?? "No details"} ·{" "}
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolve.mutate({ id: r.id, status: "dismissed" })}
                    disabled={resolve.isPending}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => resolve.mutate({ id: r.id, status: "resolved" })}
                    disabled={resolve.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Resolve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ────────────── Broadcast ────────────── */
export function LearnBroadcast() {
  const broadcast = useBroadcast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const send = () => {
    if (!title.trim() || !message.trim()) return;
    broadcast.mutate(
      { audience: { kind: "all" }, title: title.trim(), message: message.trim() },
      {
        onSuccess: () => {
          setTitle("");
          setMessage("");
        },
      },
    );
  };

  return (
    <>
      <LearnHeader
        title="Broadcast"
        actions={<FullLink to="/admin/broadcast">Open full composer</FullLink>}
      />
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        <Card className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short headline…"
              maxLength={120}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you want learners to know?"
              rows={4}
              maxLength={500}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Sends to <strong>all learners</strong>. For targeted audiences, use the full composer.
            </p>
            <Button
              size="sm"
              onClick={send}
              disabled={broadcast.isPending || !title.trim() || !message.trim()}
            >
              <Send className="mr-2 h-3.5 w-3.5" />
              {broadcast.isPending ? "Sending…" : "Send to all"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
