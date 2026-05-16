import { useMemo, useState } from "react";
import { Flag, ChevronDown, CheckCircle2, Circle, CircleDot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  answered: boolean;
  flagged: boolean;
  visited?: boolean;
}

interface PaletteSection {
  title: string;
  /** Global indices (into the flat questions array) that belong to this section. */
  indices: number[];
}

interface Props {
  items: PaletteItem[];
  currentIndex: number;
  onJump: (idx: number) => void;
  variant?: "rail" | "compact";
  sections?: PaletteSection[];
  /** When true, render the thin icon strip instead of the full rail. */
  collapsed?: boolean;
  /** Toggle expanded/collapsed (only meaningful for variant="rail"). */
  onToggleCollapsed?: () => void;
}

type Filter = "all" | "unanswered" | "flagged";

export function QuestionPalette({
  items,
  currentIndex,
  onJump,
  variant = "rail",
  sections,
  collapsed: collapsedRail = false,
  onToggleCollapsed,
}: Props) {
  const answered = items.filter((i) => i.answered).length;
  const flagged = items.filter((i) => i.flagged).length;
  const unanswered = items.length - answered;
  const compact = variant === "compact";

  const [filter, setFilter] = useState<Filter>("all");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const passes = (i: number) => {
    const it = items[i];
    if (!it) return false;
    if (filter === "unanswered") return !it.answered;
    if (filter === "flagged") return it.flagged;
    return true;
  };

  const effectiveSections = useMemo<PaletteSection[]>(() => {
    if (sections && sections.length > 0) return sections;
    return [{ title: "", indices: items.map((_, i) => i) }];
  }, [sections, items]);

  /* -------------------------------------------------------------------- */
  /* Compact / mobile sheet — keep the chip grid (denser on small screens) */
  /* -------------------------------------------------------------------- */
  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-card p-2.5">
        <div className="flex items-center justify-between mb-2 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Questions</span>
          <span className="tabular-nums">
            {answered}/{items.length}
          </span>
        </div>
        <div className="space-y-3">
          {effectiveSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {sec.title && (
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                  <span className="truncate">{sec.title}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <div className="grid gap-1.5 grid-cols-8">
                {sec.indices.map((i) => {
                  const it = items[i];
                  if (!it) return null;
                  const active = i === currentIndex;
                  const dim = !passes(i);
                  return (
                    <button
                      key={it.id}
                      onClick={() => onJump(i)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "relative h-8 rounded-md border text-xs font-semibold transition-all tabular-nums grid place-items-center",
                        dim && "opacity-30",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30"
                          : it.answered
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : it.visited
                          ? "border-dashed border-border bg-muted/30 text-muted-foreground"
                          : "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {i + 1}
                      {it.flagged && (
                        <Flag className="absolute -top-1 -right-1 h-3 w-3 fill-amber-500 text-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------- */
  /* Rail — sidebar-style vertical list                                   */
  /* -------------------------------------------------------------------- */
  const pct = items.length === 0 ? 0 : Math.round((answered / items.length) * 100);

  /* Collapsed rail — thin icon strip with toggle + flagged dots */
  if (collapsedRail) {
    return (
      <aside
        aria-label="Question navigator (collapsed)"
        className="flex flex-col items-center rounded-xl border border-border bg-card shadow-sm overflow-hidden max-h-[calc(100vh-9rem)] sticky top-20 w-[56px] py-2"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand question palette"
          title="Expand (])"
          className="h-9 w-9 grid place-items-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <div className="text-[10px] font-semibold tabular-nums text-muted-foreground mt-1">
          {answered}/{items.length}
        </div>
        <div className="h-1 w-8 rounded-full bg-muted overflow-hidden mt-1.5">
          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <nav className="flex-1 w-full overflow-y-auto mt-2 px-1 space-y-1">
          {items.map((it, i) => {
            const active = i === currentIndex;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onJump(i)}
                aria-current={active ? "true" : undefined}
                title={`Question ${i + 1}${it.flagged ? " (flagged)" : ""}`}
                className={cn(
                  "relative w-full h-7 rounded-md text-[10px] font-semibold tabular-nums grid place-items-center transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : it.answered
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                {i + 1}
                {it.flagged && (
                  <Flag className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Question navigator"
      className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden max-h-[calc(100vh-9rem)] sticky top-20"
    >
      {/* Header: progress */}
      <header className="px-3 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between text-xs mb-2 gap-2">
          <span className="font-semibold tracking-tight">Questions</span>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground tabular-nums">
              {answered}/{items.length} · {pct}%
            </span>
            {onToggleCollapsed && (
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse question palette"
                title="Collapse (])"
                className="h-6 w-6 grid place-items-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <StatPill label="Done" value={answered} tone="emerald" />
          <StatPill label="Left" value={unanswered} tone={unanswered > 0 ? "amber" : "muted"} />
          <StatPill label="Flag" value={flagged} tone={flagged > 0 ? "amber" : "muted"} />
        </div>
      </header>

      {/* Filter row (sticky-ish above scroll area) */}
      <div className="px-3 pt-2.5 pb-2 border-b border-border">
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-muted/40 border border-border text-[11px] font-medium">
          {(["all", "unanswered", "flagged"] as const).map((f) => {
            const count = f === "all" ? items.length : f === "unanswered" ? unanswered : flagged;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded px-1.5 py-1 capitalize transition-colors flex items-center justify-center gap-1",
                  filter === f
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{f}</span>
                <span className="tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable list of questions, grouped by section */}
      <nav className="flex-1 overflow-y-auto px-1.5 py-2 space-y-3">
        {effectiveSections.map((sec, sIdx) => {
          const visibleIndices = sec.indices.filter(passes);
          if (visibleIndices.length === 0 && filter !== "all") return null;
          const isCollapsed = !!collapsed[sIdx];
          const sectionDone = sec.indices.filter((i) => items[i]?.answered).length;
          return (
            <div key={sIdx}>
              {sec.title && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [sIdx]: !c[sIdx] }))}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform shrink-0",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  <span className="truncate flex-1 text-left">{sec.title}</span>
                  <span className="tabular-nums normal-case opacity-70">
                    {sectionDone}/{sec.indices.length}
                  </span>
                </button>
              )}
              {!isCollapsed && (
                <ul className="space-y-0.5 mt-1">
                  {sec.indices.map((i) => {
                    const it = items[i];
                    if (!it) return null;
                    const active = i === currentIndex;
                    const dim = !passes(i);
                    if (dim && filter !== "all") return null;
                    return (
                      <li key={it.id}>
                        <button
                          onClick={() => onJump(i)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "group w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors text-left",
                            active
                              ? "bg-primary/10 text-foreground ring-1 ring-primary/40"
                              : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
                          )}
                        >
                          {/* Status icon */}
                          <StatusIcon
                            answered={it.answered}
                            visited={!!it.visited}
                            active={active}
                          />
                          {/* Number */}
                          <span
                            className={cn(
                              "tabular-nums font-semibold w-6 shrink-0 text-[11px]",
                              active ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {/* Label */}
                          <span className="flex-1 truncate">
                            Question {i + 1}
                          </span>
                          {/* Flag */}
                          {it.flagged && (
                            <Flag className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                          {/* Active rail accent */}
                          {active && (
                            <span className="h-4 w-0.5 rounded-full bg-primary shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Legend footer */}
      <footer className="px-3 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground grid grid-cols-2 gap-x-3 gap-y-1">
        <LegendRow icon={<CheckCircle2 className="h-3 w-3 text-emerald-500" />} label="Answered" />
        <LegendRow icon={<CircleDot className="h-3 w-3 text-muted-foreground" />} label="Visited" />
        <LegendRow icon={<Circle className="h-3 w-3 text-muted-foreground/60" />} label="Not visited" />
        <LegendRow icon={<Flag className="h-3 w-3 fill-amber-500 text-amber-500" />} label="Flagged" />
      </footer>
    </aside>
  );
}

function StatusIcon({
  answered,
  visited,
  active,
}: {
  answered: boolean;
  visited: boolean;
  active: boolean;
}) {
  if (answered)
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (active)
    return <CircleDot className="h-3.5 w-3.5 text-primary shrink-0" />;
  if (visited)
    return <CircleDot className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />;
}

function LegendRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "muted";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-border bg-muted/40 text-muted-foreground";
  return (
    <div className={cn("rounded-md border px-1.5 py-1 text-center", toneClass)}>
      <div className="text-sm font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wide mt-1 opacity-80">{label}</div>
    </div>
  );
}
