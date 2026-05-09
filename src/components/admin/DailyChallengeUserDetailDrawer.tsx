import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface Attempt {
  id: string;
  battle_id: string | null;
  solved: boolean;
  solve_time_sec: number | null;
  xp_awarded: number;
  attempted_at: string;
  solved_at: string | null;
}
interface Submission {
  id: string;
  battle_id: string;
  problem_slug: string;
  verdict: string;
  passed: number;
  total: number;
  language: string;
  runtime_ms: number | null;
  created_at: string;
  matches_seeded: boolean;
}
interface Detail {
  user_id: string;
  challenge_date: string;
  seeded_problem_slug: string | null;
  bonus_xp: number | null;
  attempts: Attempt[];
  submissions: Submission[];
}
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  date: string | null;
  displayName?: string | null;
}

const PAGE_SIZE = 30;
const ATTEMPT_ROW_PX = 78;
const SUB_ROW_PX = 92;

/** Virtualized list with IntersectionObserver-driven infinite reveal. */
function VirtualList<T>({
  items,
  shown,
  onLoadMore,
  rowHeight,
  testIdEmpty,
  testIdSentinel,
  emptyText,
  renderItem,
  height = 280,
}: {
  items: T[];
  shown: number;
  onLoadMore: () => void;
  rowHeight: number;
  testIdEmpty: string;
  testIdSentinel: string;
  emptyText: string;
  renderItem: (item: T, i: number) => React.ReactNode;
  height?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visible = items.slice(0, shown);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 6,
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || shown >= items.length) return;
    const io = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && onLoadMore(),
      { root: parentRef.current, rootMargin: "120px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [shown, items.length, onLoadMore]);

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground" data-testid={testIdEmpty}>{emptyText}</p>;
  }

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto rounded border border-border/40"
      style={{ height }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            style={{
              position: "absolute", top: 0, left: 0, width: "100%",
              transform: `translateY(${row.start}px)`,
              padding: "4px 6px",
            }}
          >
            {renderItem(visible[row.index], row.index)}
          </div>
        ))}
      </div>
      {shown < items.length && (
        <div ref={sentinelRef} data-testid={testIdSentinel} className="flex items-center justify-center py-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          
        </div>
      )}
    </div>
  );
}

export function DailyChallengeUserDetailDrawer({ open, onOpenChange, userId, date, displayName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [attemptsShown, setAttemptsShown] = useState(PAGE_SIZE);
  const [subsShown, setSubsShown] = useState(PAGE_SIZE);

  async function load() {
    if (!userId || !date) return;
    setLoading(true);
    setError(null);
    setAttemptsShown(PAGE_SIZE);
    setSubsShown(PAGE_SIZE);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("admin_daily_challenge_user_detail", {
        _user_id: userId, _date: date,
      });
      if (error) throw error;
      setDetail(data as Detail);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load details");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setDetail(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId, date]);

  const allMismatch = useMemo(
    () => !!detail?.submissions.length && detail.submissions.every((s) => !s.matches_seeded),
    [detail],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid="daily-user-detail-drawer">
        <SheetHeader>
          <SheetTitle>Daily Review · {displayName ?? userId?.slice(0, 8) ?? "—"}</SheetTitle>
          <SheetDescription>
            {date ?? ""} · Seeded: <span className="font-mono">{detail?.seeded_problem_slug ?? "—"}</span>
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-4" data-testid="drawer-loading" role="status" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin" /> 
          </div>
        )}

        {!loading && error && (
          <div className="mt-4 flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-3 text-xs" data-testid="drawer-error" role="alert">
            <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p>Failed to load: {error}</p>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="space-y-4 mt-4">
            <section>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">
                Attempts ({detail.attempts.length})
              </h3>
              <VirtualList
                items={detail.attempts}
                shown={attemptsShown}
                onLoadMore={() => setAttemptsShown((n) => Math.min(n + PAGE_SIZE, detail.attempts.length))}
                rowHeight={ATTEMPT_ROW_PX}
                testIdEmpty="drawer-empty-attempts"
                testIdSentinel="drawer-load-more-attempts"
                emptyText={`This user has no recorded attempts for ${date}.`}
                renderItem={(a) => (
                  <div className="rounded border border-border/40 p-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{new Date(a.attempted_at).toLocaleString()}</span>
                      {a.solved ? (
                        <Badge variant="default" className="h-5 text-[10px]">+{a.xp_awarded} XP</Badge>
                      ) : (
                        <Badge variant="secondary" className="h-5 text-[10px]">Attempt</Badge>
                      )}
                    </div>
                    {a.solve_time_sec != null && (
                      <div className="text-muted-foreground">
                        Solve time: {Math.floor(a.solve_time_sec / 60)}m{String(a.solve_time_sec % 60).padStart(2, "0")}s
                      </div>
                    )}
                    {a.battle_id && <div className="text-muted-foreground font-mono truncate">battle: {a.battle_id}</div>}
                  </div>
                )}
              />
            </section>

            <section>
              <h3 className="text-xs uppercase text-muted-foreground mb-2">
                Submissions ({detail.submissions.length})
              </h3>
              <VirtualList
                items={detail.submissions}
                shown={subsShown}
                onLoadMore={() => setSubsShown((n) => Math.min(n + PAGE_SIZE, detail.submissions.length))}
                rowHeight={SUB_ROW_PX}
                testIdEmpty="drawer-empty-submissions"
                testIdSentinel="drawer-load-more-subs"
                emptyText={`No code submissions on ${date}.`}
                renderItem={(s) => (
                  <div className="rounded border border-border/40 p-2 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono truncate" title={s.problem_slug}>{s.problem_slug}</span>
                      <Badge variant={s.verdict === "AC" ? "default" : "destructive"} className="h-5 text-[10px]">
                        {s.verdict}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{s.language} · {s.passed}/{s.total}{s.runtime_ms != null && ` · ${s.runtime_ms}ms`}</span>
                      {s.matches_seeded ? (
                        <span className="inline-flex items-center gap-1 text-emerald-500" data-testid="sub-matches-seeded">
                          <CheckCircle2 className="h-3 w-3" /> matches seeded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-500" data-testid="sub-mismatch">
                          <AlertTriangle className="h-3 w-3" /> mismatch
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                )}
              />
            </section>

            {allMismatch && (
              <div className="flex items-start gap-2 rounded border border-destructive/40 bg-destructive/10 p-2 text-xs">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>None of this user's submissions match today's seeded problem. XP should not have been credited.</span>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
