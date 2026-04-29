import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Square, RotateCcw, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoachChat, type CoachContext } from "@/hooks/useCoachChat";
import type { PlanTask } from "@/hooks/useStudyPlan";
import type { StudyProfile } from "@/hooks/useStudyProfile";

interface Props {
  tasks: PlanTask[];
  profile: StudyProfile | null;
  trigger?: React.ReactNode;
}

const todayIso = () => {
  const d = new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10);
};

const SUGGESTIONS = [
  "What should I do next right now?",
  "Why is my plan structured this way?",
  "I have less time this week — what should I cut?",
  "Make tomorrow easier on me.",
];

export const PlanCoachPanel = ({ tasks, profile, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, streaming, error, send, reset, stop } = useCoachChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the context payload sent to the edge function on every send.
  const context: CoachContext = useMemo(() => {
    const today = todayIso();

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

    // Streak
    const doneByDay = new Set(
      tasks.filter((t) => t.status === "done" && t.completed_at)
        .map((t) => (t.completed_at as string).slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date(); cursor.setHours(0,0,0,0);
    if (!doneByDay.has(cursor.toISOString().slice(0,10))) cursor.setDate(cursor.getDate() - 1);
    while (doneByDay.has(cursor.toISOString().slice(0,10))) {
      streak += 1; cursor.setDate(cursor.getDate() - 1);
    }

    // Upcoming 4 days (today + 3)
    const upcomingDays: CoachContext["upcoming_days"] = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0,10);
      const dayTasks = tasks
        .filter((t) => t.day_date === iso)
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, 8) // cap per day
        .map((t) => ({
          title: t.title, topic: t.topic, difficulty: t.difficulty,
          status: t.status, est_minutes: t.est_minutes,
        }));
      if (dayTasks.length > 0) upcomingDays.push({ date: iso, tasks: dayTasks });
    }

    // Weak topics
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

    // Recent completions (last 7 days, max 8)
    const sevenAgo = new Date(); sevenAgo.setHours(0,0,0,0); sevenAgo.setDate(sevenAgo.getDate() - 7);
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
      streak_days: streak,
      totals,
      today: todayBlock,
      upcoming_days: upcomingDays,
      weak_topics: weakTopics,
      recent_completions: recentCompletions,
    };
  }, [tasks, profile]);

  // Auto-scroll on new tokens
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Bot className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">AI Coach</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <SheetHeader className="p-4 border-b border-border/40 space-y-0.5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI Coach
          </SheetTitle>
          <SheetDescription className="text-xs">
            Ask anything about your plan. I can see today's tasks, your streak, and weak topics.
          </SheetDescription>
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
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[85%] min-w-0",
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
              </div>
            ))}

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
