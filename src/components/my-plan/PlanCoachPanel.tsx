import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Sparkles, Send, Square, RotateCcw, Bot, User as UserIcon,
  Flame, Play, CalendarClock, CalendarPlus, CheckCircle2, Loader2,
  AlarmClock, Rocket,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useCoachChat, type CoachAction, type CoachContext } from "@/hooks/useCoachChat";
import type { PlanTask, PlanTaskStatus } from "@/hooks/useStudyPlan";
import type { StudyProfile } from "@/hooks/useStudyProfile";

interface Props {
  tasks: PlanTask[];
  profile: StudyProfile | null;
  onUpdateTaskStatus: (taskId: string, status: PlanTaskStatus) => Promise<void> | void;
  onMoveTaskToDay: (taskId: string, day: string) => Promise<void>;
  onBulkMoveToDay?: (taskIds: string[], day: string) => Promise<Array<{ id: string; day_date: string }>>;
  onRestoreDays?: (snapshot: Array<{ id: string; day_date: string }>) => Promise<void>;
  onLogActivity?: (entry: { kind: "coach_action"; summary: string; detail?: string; count: number }) => void;
  trigger?: React.ReactNode;
}

const todayIsoFn = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10);
};
const tomorrowIsoFn = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const SUGGESTIONS = [
  "What should I do next right now?",
  "Summarize my upcoming streak and weak topics.",
  "Bulk-start the next 2-3 tasks for today.",
  "Snooze my overdue tasks to tomorrow.",
];

const ACTION_META: Record<CoachAction["kind"], { label: string; Icon: typeof Play }> = {
  start_today: { label: "Start now", Icon: Play },
  reschedule_today: { label: "Move to today", Icon: CalendarClock },
  reschedule_tomorrow: { label: "Move to tomorrow", Icon: CalendarPlus },
  mark_done: { label: "Mark done", Icon: CheckCircle2 },
  snooze_24h: { label: "Snooze 24h", Icon: AlarmClock },
  bulk_start_next: { label: "Start next batch", Icon: Rocket },
};

export const PlanCoachPanel = ({
  tasks, profile, onUpdateTaskStatus, onMoveTaskToDay,
  onBulkMoveToDay, onRestoreDays, onLogActivity, trigger,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busyKeys, setBusyKeys] = useState<Set<string>>(new Set());
  const { messages, streaming, error, send, reset, stop, consumeAction } = useCoachChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const anyBusy = busyKeys.size > 0;

  // --- Header summary (streak + top topics) ---
  const summary = useMemo(() => {
    const today = todayIsoFn();

    // Streak
    const doneByDay = new Set(
      tasks.filter((t) => t.status === "done" && t.completed_at)
        .map((t) => (t.completed_at as string).slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
    if (!doneByDay.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
    while (doneByDay.has(cursor.toISOString().slice(0, 10))) {
      streak += 1; cursor.setDate(cursor.getDate() - 1);
    }

    // Topic breakdown
    const topicMap = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      if (t.status === "skipped") continue;
      const key = (t.topic || "Other").trim();
      const e = topicMap.get(key) ?? { total: 0, done: 0 };
      e.total += 1;
      if (t.status === "done") e.done += 1;
      topicMap.set(key, e);
    }
    const topics = Array.from(topicMap.entries())
      .map(([topic, v]) => ({ topic, total: v.total, done: v.done, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0 }))
      .filter((r) => r.total >= 1);

    const topStrong = [...topics].sort((a, b) => b.pct - a.pct || b.total - a.total).slice(0, 2);
    const topWeak = [...topics].filter((r) => r.total >= 2).sort((a, b) => a.pct - b.pct || b.total - a.total).slice(0, 2);

    const todays = tasks.filter((t) => t.day_date === today);
    return {
      streak,
      todayDone: todays.filter((t) => t.status === "done").length,
      todayTotal: todays.length,
      topStrong,
      topWeak,
    };
  }, [tasks]);

  // --- Coach context payload (now includes ids + overdue) ---
  const context: CoachContext = useMemo(() => {
    const today = todayIsoFn();

    const totals = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      skipped: tasks.filter((t) => t.status === "skipped").length,
      pending: tasks.filter((t) => t.status === "pending" || t.status === "in_progress" || t.status === "partial").length,
    };

    const todays = tasks.filter((t) => t.day_date === today);
    const todayBlock = {
      date: today,
      total: todays.length,
      done: todays.filter((t) => t.status === "done").length,
    };

    const upcomingDays: CoachContext["upcoming_days"] = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayTasks = tasks
        .filter((t) => t.day_date === iso)
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, 8)
        .map((t) => ({
          id: t.id, title: t.title, topic: t.topic, difficulty: t.difficulty,
          status: t.status, est_minutes: t.est_minutes,
        }));
      if (dayTasks.length > 0) upcomingDays.push({ date: iso, tasks: dayTasks });
    }

    const overdue = tasks
      .filter((t) => t.day_date < today && (t.status === "pending" || t.status === "in_progress" || t.status === "partial"))
      .sort((a, b) => a.day_date.localeCompare(b.day_date))
      .slice(0, 8)
      .map((t) => ({ id: t.id, title: t.title, topic: t.topic, day_date: t.day_date, est_minutes: t.est_minutes }));

    const topicMap = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      if (t.status === "skipped") continue;
      const key = (t.topic || "Other").trim();
      const e = topicMap.get(key) ?? { total: 0, done: 0 };
      e.total += 1;
      if (t.status === "done") e.done += 1;
      topicMap.set(key, e);
    }
    const weakTopics = Array.from(topicMap.entries())
      .map(([topic, v]) => ({ topic, total: v.total, done: v.done, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0 }))
      .filter((r) => r.total >= 2 && r.pct < 60)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);

    const sevenAgo = new Date(); sevenAgo.setHours(0, 0, 0, 0); sevenAgo.setDate(sevenAgo.getDate() - 7);
    const recentCompletions = tasks
      .filter((t) => t.status === "done" && t.completed_at && new Date(t.completed_at) >= sevenAgo)
      .sort((a, b) => (b.completed_at as string).localeCompare(a.completed_at as string))
      .slice(0, 8)
      .map((t) => ({
        date: (t.completed_at as string).slice(0, 10),
        title: t.title, topic: t.topic,
      }));

    return {
      goal: profile?.goal ?? null,
      level: profile?.level ?? null,
      target_date: profile?.target_date ?? null,
      weekday_minutes: profile?.weekday_minutes ?? null,
      weekend_minutes: profile?.weekend_minutes ?? null,
      streak_days: summary.streak,
      totals,
      today: todayBlock,
      upcoming_days: upcomingDays,
      weak_topics: weakTopics,
      recent_completions: recentCompletions,
      overdue,
    };
  }, [tasks, profile, summary.streak]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const handleSubmit = () => {
    if (!input.trim() || streaming) return;
    void send(input, context);
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (streaming) return;
    void send(text, context);
  };

  const offerStatusUndo = (
    snap: Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }>,
    label: string,
  ) => {
    toast({
      title: label,
      duration: 6000,
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            try {
              await Promise.all(
                snap.map((s) => onUpdateTaskStatus(s.id, s.status)),
              );
              toast({ title: "Undone", description: "Previous statuses restored." });
            } catch (e) {
              toast({
                title: "Couldn't undo", variant: "destructive",
                description: e instanceof Error ? e.message : "Unknown error",
              });
            }
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const offerMoveUndo = (snap: Array<{ id: string; day_date: string }>, label: string) => {
    if (!onRestoreDays) {
      toast({ title: label, duration: 5000 });
      return;
    }
    toast({
      title: label,
      duration: 6000,
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            try {
              await onRestoreDays(snap);
              toast({ title: "Undone", description: "Previous schedule restored." });
            } catch (e) {
              toast({
                title: "Couldn't undo", variant: "destructive",
                description: e instanceof Error ? e.message : "Unknown error",
              });
            }
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const runAction = async (messageId: string, action: CoachAction) => {
    const key = `${messageId}:${action.task_id}:${action.kind}`;
    setBusyKeys((cur) => new Set(cur).add(key));
    try {
      // Bulk start: handle a batch of task ids client-side.
      if (action.kind === "bulk_start_next") {
        const ids = (action.task_ids ?? []).filter((id) => tasks.some((t) => t.id === id));
        if (ids.length === 0) {
          toast({ title: "No tasks to start", description: "The suggestion referenced unknown tasks.", variant: "destructive" });
          consumeAction(messageId, action.task_id);
          return;
        }
        const today = todayIsoFn();
        // Snapshot prior days for undo
        const moveSnap: Array<{ id: string; day_date: string }> = tasks
          .filter((t) => ids.includes(t.id) && t.day_date !== today)
          .map((t) => ({ id: t.id, day_date: t.day_date }));
        const idsNeedingMove = moveSnap.map((s) => s.id);
        if (idsNeedingMove.length > 0 && onBulkMoveToDay) {
          await onBulkMoveToDay(idsNeedingMove, today);
        } else {
          // Fallback: move one by one
          for (const id of idsNeedingMove) await onMoveTaskToDay(id, today);
        }
        // Mark pending → in_progress (capture for undo)
        const statusSnap: Array<{ id: string; status: PlanTaskStatus; completed_at: string | null }> = tasks
          .filter((t) => ids.includes(t.id) && t.status === "pending")
          .map((t) => ({ id: t.id, status: t.status, completed_at: t.completed_at }));
        await Promise.all(statusSnap.map((s) => onUpdateTaskStatus(s.id, "in_progress")));

        const summary = `Started ${ids.length} task${ids.length === 1 ? "" : "s"} for today`;
        onLogActivity?.({ kind: "coach_action", summary, detail: action.reason, count: ids.length });

        if (statusSnap.length > 0) {
          offerStatusUndo(statusSnap, summary);
        } else if (moveSnap.length > 0) {
          offerMoveUndo(moveSnap, summary);
        } else {
          toast({ title: summary });
        }
        consumeAction(messageId, action.task_id);
        return;
      }

      const task = tasks.find((t) => t.id === action.task_id);
      if (!task) {
        toast({ title: "Task not found", description: "It may have been removed since the suggestion was made.", variant: "destructive" });
        consumeAction(messageId, action.task_id);
        return;
      }

      switch (action.kind) {
        case "start_today": {
          const moveSnap = task.day_date !== todayIsoFn() ? [{ id: task.id, day_date: task.day_date }] : [];
          if (moveSnap.length > 0) await onMoveTaskToDay(task.id, todayIsoFn());
          const statusSnap = task.status === "pending"
            ? [{ id: task.id, status: task.status, completed_at: task.completed_at }]
            : [];
          if (statusSnap.length > 0) await onUpdateTaskStatus(task.id, "in_progress");
          const label = `Started: ${task.title}`;
          onLogActivity?.({ kind: "coach_action", summary: label, detail: action.reason, count: 1 });
          if (statusSnap.length > 0) offerStatusUndo(statusSnap, label);
          else if (moveSnap.length > 0) offerMoveUndo(moveSnap, label);
          else toast({ title: label });
          break;
        }
        case "reschedule_today": {
          const snap = [{ id: task.id, day_date: task.day_date }];
          await onMoveTaskToDay(task.id, todayIsoFn());
          const label = `Moved to today: ${task.title}`;
          onLogActivity?.({ kind: "coach_action", summary: label, detail: action.reason, count: 1 });
          offerMoveUndo(snap, label);
          break;
        }
        case "reschedule_tomorrow":
        case "snooze_24h": {
          const snap = [{ id: task.id, day_date: task.day_date }];
          await onMoveTaskToDay(task.id, tomorrowIsoFn());
          const label = action.kind === "snooze_24h"
            ? `Snoozed 24h: ${task.title}`
            : `Moved to tomorrow: ${task.title}`;
          onLogActivity?.({ kind: "coach_action", summary: label, detail: action.reason, count: 1 });
          offerMoveUndo(snap, label);
          break;
        }
        case "mark_done": {
          const snap = [{ id: task.id, status: task.status, completed_at: task.completed_at }];
          await onUpdateTaskStatus(task.id, "done");
          const label = `Marked done: ${task.title}`;
          onLogActivity?.({ kind: "coach_action", summary: label, detail: action.reason, count: 1 });
          offerStatusUndo(snap, label);
          break;
        }
      }
      consumeAction(messageId, action.task_id);
    } catch (e) {
      toast({
        title: "Couldn't apply action", variant: "destructive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusyKeys((cur) => {
        const next = new Set(cur);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" aria-label="AI Coach">
            <Bot className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <SheetHeader className="p-4 border-b border-border/40 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> AI Coach
              </SheetTitle>
              <SheetDescription className="text-xs">
                Sees today's tasks, your streak, and weak topics. Suggests one-click next moves.
              </SheetDescription>
            </div>
          </div>

          {/* Live coach summary */}
          <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Flame className={cn("h-3.5 w-3.5", summary.streak > 0 ? "text-amber-500" : "text-muted-foreground")} />
                <span className="font-semibold tabular-nums">{summary.streak}</span>
                <span className="text-muted-foreground">day streak</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                Today: {summary.todayDone}/{summary.todayTotal}
              </span>
            </div>
            {(summary.topStrong.length > 0 || summary.topWeak.length > 0) && (
              <div className="space-y-1.5 pt-0.5">
                {summary.topStrong.slice(0, 2).map((t) => (
                  <div key={`s-${t.topic}`} className="space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="truncate font-medium text-green-600 dark:text-green-400">
                        ↑ {t.topic}
                      </span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {t.done}/{t.total} · {t.pct}%
                      </span>
                    </div>
                    <Progress value={t.pct} className="h-1 [&>div]:bg-green-500/70" />
                  </div>
                ))}
                {summary.topWeak.slice(0, 2).map((t) => (
                  <div key={`w-${t.topic}`} className="space-y-0.5">
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="truncate font-medium text-amber-600 dark:text-amber-400">
                        ↓ {t.topic}
                      </span>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {t.done}/{t.total} · {t.pct}%
                      </span>
                    </div>
                    <Progress value={t.pct} className="h-1 [&>div]:bg-amber-500/70" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollRef} className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Try one of these:</p>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSuggestion(s)}
                      className="text-left text-sm rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 px-3 py-2 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2",
                  m.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {m.role === "user" ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className="max-w-[85%] min-w-0 space-y-2">
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm",
                      m.role === "user"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/40 border border-border/40"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content || "…"}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>

                  {/* One-click action chips */}
                  {m.role === "assistant" && m.actions && m.actions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                        Suggested next actions
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {m.actions.map((a) => {
                          const meta = ACTION_META[a.kind];
                          const Icon = meta.Icon;
                          const key = `${m.id}:${a.task_id}:${a.kind}`;
                          const isBusy = busyKeys.has(key);
                          const disabled = streaming || (anyBusy && !isBusy);
                          return (
                            <div
                              key={a.task_id + a.kind}
                              className={cn(
                                "rounded-lg border border-border/50 bg-background/60 px-2.5 py-2 flex items-start gap-2 transition-opacity",
                                disabled && !isBusy && "opacity-50",
                              )}
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-medium truncate">{a.task_title}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{a.reason}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-7 px-2 text-xs shrink-0"
                                onClick={() => runAction(m.id, a)}
                                disabled={isBusy || disabled}
                                aria-busy={isBusy}
                              >
                                {isBusy
                                  ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  : <Icon className="h-3 w-3 mr-1" />}
                                {isBusy ? "Working…" : meta.label}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Coach is thinking…
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border/40 p-3 space-y-2">
          {messages.length > 0 && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                onClick={reset}
                disabled={streaming}
              >
                <RotateCcw className="h-3 w-3" /> New chat
              </button>
              {streaming && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={stop}
                >
                  <Square className="h-3 w-3" /> Stop
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={streaming ? "Coach is replying…" : "Ask about your plan…"}
              className="min-h-[44px] max-h-32 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={streaming}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || streaming}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
