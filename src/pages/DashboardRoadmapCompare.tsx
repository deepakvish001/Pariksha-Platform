import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  GitCompare,
  CheckCircle2,
  Circle,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
  X,
  Download,
  ArrowDownAZ,
  ListTree,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  roadmapTrees,
  flattenLeafNodes,
  flattenTreeNodes,
  type RoadmapTree,
  type RoadmapTreeNode,
} from "@/data/roadmapTreesData";
import { toast } from "sonner";

// ── Helpers ──────────────────────────────────────────────────────────
const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const STORAGE_KEY = "roadmap-compare-selection";

export type SortMode = "section" | "alpha";

interface TopicInfo {
  id: string;
  title: string;
  section: string;
}

const collectTopics = (tree: RoadmapTree, leafOnly: boolean): TopicInfo[] => {
  const out: TopicInfo[] = [];
  tree.nodes.forEach((sectionNode) => {
    const subtree = sectionNode.children ?? [];
    if (subtree.length === 0) {
      out.push({
        id: sectionNode.id,
        title: sectionNode.title,
        section: sectionNode.title,
      });
      return;
    }
    const nodes = leafOnly
      ? flattenLeafNodes(subtree)
      : flattenTreeNodes(subtree);
    nodes.forEach((n: RoadmapTreeNode) =>
      out.push({ id: n.id, title: n.title, section: sectionNode.title })
    );
  });
  return out;
};

interface DiffResult {
  shared: { a: TopicInfo; b: TopicInfo }[];
  onlyA: TopicInfo[];
  onlyB: TopicInfo[];
  sharedSections: { name: string; aCount: number; bCount: number }[];
}

const computeDiff = (a: TopicInfo[], b: TopicInfo[]): DiffResult => {
  const bMap = new Map<string, TopicInfo>();
  b.forEach((t) => bMap.set(norm(t.title), t));

  const shared: { a: TopicInfo; b: TopicInfo }[] = [];
  const onlyA: TopicInfo[] = [];
  const matchedKeys = new Set<string>();

  a.forEach((t) => {
    const key = norm(t.title);
    const match = bMap.get(key);
    if (match) {
      shared.push({ a: t, b: match });
      matchedKeys.add(key);
    } else {
      onlyA.push(t);
    }
  });

  const onlyB = b.filter((t) => !matchedKeys.has(norm(t.title)));

  const sectionMap = new Map<
    string,
    { name: string; aCount: number; bCount: number }
  >();
  a.forEach((t) => {
    const key = norm(t.section);
    const ex = sectionMap.get(key);
    if (ex) ex.aCount++;
    else sectionMap.set(key, { name: t.section, aCount: 1, bCount: 0 });
  });
  b.forEach((t) => {
    const key = norm(t.section);
    const ex = sectionMap.get(key);
    if (ex) ex.bCount++;
    else sectionMap.set(key, { name: t.section, aCount: 0, bCount: 1 });
  });

  const sharedSections = Array.from(sectionMap.values())
    .filter((s) => s.aCount > 0 && s.bCount > 0)
    .sort((x, y) => y.aCount + y.bCount - (x.aCount + x.bCount));

  return { shared, onlyA, onlyB, sharedSections };
};

// Group an item list by its section name, preserving insertion order.
const groupBySection = <T extends { section: string }>(
  items: T[]
): { section: string; items: T[] }[] => {
  const map = new Map<string, T[]>();
  items.forEach((it) => {
    const list = map.get(it.section);
    if (list) list.push(it);
    else map.set(it.section, [it]);
  });
  return Array.from(map.entries()).map(([section, items]) => ({
    section,
    items,
  }));
};

// ── localStorage persistence ─────────────────────────────────────────
const loadSelection = (): {
  a?: string;
  b?: string;
  leafOnly?: boolean;
  sortMode?: SortMode;
} => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveSelection = (sel: {
  a: string;
  b: string;
  leafOnly: boolean;
  sortMode: SortMode;
}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
  } catch {
    /* ignore */
  }
};

// ── Page ──────────────────────────────────────────────────────────────
const DashboardRoadmapCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const stored = useMemo(loadSelection, []);

  const initialA =
    searchParams.get("a") ??
    stored.a ??
    roadmapTrees[0]?.id ??
    "";
  const initialB =
    searchParams.get("b") ??
    stored.b ??
    roadmapTrees[1]?.id ??
    roadmapTrees[0]?.id ??
    "";
  const initialLeafOnly =
    (searchParams.get("leaf") ?? (stored.leafOnly ? "1" : "0")) === "1";
  const initialQuery = searchParams.get("q") ?? "";
  const initialSort: SortMode =
    (searchParams.get("sort") as SortMode) === "alpha" ? "alpha" : "section";

  const [aId, setAId] = useState(initialA);
  const [bId, setBId] = useState(initialB);
  const [leafOnly, setLeafOnly] = useState(initialLeafOnly);
  const [query, setQuery] = useState(initialQuery);
  const [sortMode, setSortMode] = useState<SortMode>(initialSort);

  // Sync URL → state (handles back/forward navigation, refresh, deep links)
  const urlQuery = searchParams.get("q") ?? "";
  const urlA = searchParams.get("a");
  const urlB = searchParams.get("b");
  const urlLeaf = searchParams.get("leaf");
  const urlSort = searchParams.get("sort");
  useEffect(() => {
    if (urlQuery !== query) setQuery(urlQuery);
    if (urlA && urlA !== aId) setAId(urlA);
    if (urlB && urlB !== bId) setBId(urlB);
    if (urlLeaf !== null) {
      const next = urlLeaf === "1";
      if (next !== leafOnly) setLeafOnly(next);
    }
    if (urlSort === "alpha" || urlSort === "section") {
      if (urlSort !== sortMode) setSortMode(urlSort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery, urlA, urlB, urlLeaf, urlSort]);

  // Sync state → URL + localStorage. Use push for the search keyword so the
  // browser back/forward buttons step through search history; selectors and
  // toggle stay on `replace` to avoid history spam.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const prevQ = next.get("q") ?? "";
    next.set("a", aId);
    next.set("b", bId);
    next.set("leaf", leafOnly ? "1" : "0");
    next.set("sort", sortMode);
    if (query) next.set("q", query);
    else next.delete("q");
    const queryChanged = prevQ !== query;
    setSearchParams(next, { replace: !queryChanged });
    saveSelection({ a: aId, b: bId, leafOnly });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId, leafOnly, query, sortMode]);

  const clearFilter = () => setQuery("");

  const treeA = useMemo(() => roadmapTrees.find((t) => t.id === aId), [aId]);
  const treeB = useMemo(() => roadmapTrees.find((t) => t.id === bId), [bId]);

  const topicsA = useMemo(
    () => (treeA ? collectTopics(treeA, leafOnly) : []),
    [treeA, leafOnly]
  );
  const topicsB = useMemo(
    () => (treeB ? collectTopics(treeB, leafOnly) : []),
    [treeB, leafOnly]
  );

  const diff = useMemo(() => computeDiff(topicsA, topicsB), [topicsA, topicsB]);

  // Filtered (search-aware) versions
  const q = query.trim().toLowerCase();
  const matches = (t: TopicInfo) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    t.section.toLowerCase().includes(q);

  const filteredOnlyA = useMemo(
    () => diff.onlyA.filter(matches),
    [diff.onlyA, q]
  );
  const filteredOnlyB = useMemo(
    () => diff.onlyB.filter(matches),
    [diff.onlyB, q]
  );
  const filteredShared = useMemo(
    () => diff.shared.filter(({ a, b }) => matches(a) || matches(b)),
    [diff.shared, q]
  );

  const sameRoadmap = aId === bId;

  // ── PDF export ──
  const exportPdf = () => {
    if (!treeA || !treeB) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Roadmap Comparison", margin, y);
      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(90);
      doc.text(`${treeA.title}  vs  ${treeB.title}`, margin, y);
      y += 14;
      doc.setFontSize(9);
      doc.text(
        `Mode: ${leafOnly ? "Leaf topics only" : "All nodes"}  |  Generated ${new Date().toLocaleString()}`,
        margin,
        y
      );
      y += 18;
      doc.setTextColor(0);

      // Stats
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Summary", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const stats = [
        `Topics in ${treeA.title}: ${topicsA.length}`,
        `Topics in ${treeB.title}: ${topicsB.length}`,
        `Shared topics: ${diff.shared.length}`,
        `Shared sections: ${diff.sharedSections.length}`,
        `Only in ${treeA.title}: ${diff.onlyA.length}`,
        `Only in ${treeB.title}: ${diff.onlyB.length}`,
      ];
      stats.forEach((s) => {
        ensureSpace(14);
        doc.text(`• ${s}`, margin + 8, y);
        y += 14;
      });
      y += 8;

      const writeSectionGroup = (
        heading: string,
        groups: { section: string; items: TopicInfo[] }[]
      ) => {
        ensureSpace(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(heading, margin, y);
        y += 16;
        if (groups.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          doc.setTextColor(120);
          ensureSpace(14);
          doc.text("None", margin + 8, y);
          y += 14;
          doc.setTextColor(0);
          return;
        }
        groups.forEach((g) => {
          ensureSpace(16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(60);
          doc.text(`${g.section}  (${g.items.length})`, margin, y);
          y += 13;
          doc.setTextColor(0);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          g.items.forEach((it) => {
            const lines = doc.splitTextToSize(`• ${it.title}`, pageW - margin * 2 - 12);
            ensureSpace(lines.length * 11);
            doc.text(lines, margin + 12, y);
            y += lines.length * 11;
          });
          y += 4;
        });
        y += 6;
      };

      writeSectionGroup(
        `Shared topics (${filteredShared.length})`,
        groupBySection(filteredShared.map((s) => s.a))
      );
      writeSectionGroup(
        `Only in ${treeA.title} (${filteredOnlyA.length})`,
        groupBySection(filteredOnlyA)
      );
      writeSectionGroup(
        `Only in ${treeB.title} (${filteredOnlyB.length})`,
        groupBySection(filteredOnlyB)
      );

      doc.save(`roadmap-compare-${treeA.id}-vs-${treeB.id}.pdf`);
      toast.success("Comparison exported as PDF");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <>
      <Helmet>
        <title>Compare Roadmaps | Byteskill</title>
        <meta
          name="description"
          content="Compare two developer roadmaps side-by-side. See shared sections and topic differences to plan your learning path."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link to="/dashboard/roadmaps">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Roadmaps
              </Link>
            </Button>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <GitCompare className="h-3.5 w-3.5" />
                  Roadmap Comparison
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">
                  Compare two roadmaps
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  See which sections overlap and which topics are unique to each
                  path — pick smarter learning routes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPdf}
                disabled={sameRoadmap || !treeA || !treeB}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export PDF
              </Button>
            </div>

            {/* Selectors */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <RoadmapSelect
                label="Roadmap A"
                value={aId}
                onChange={setAId}
                accent="text-cyan-600 dark:text-cyan-400"
              />
              <RoadmapSelect
                label="Roadmap B"
                value={bId}
                onChange={setBId}
                accent="text-fuchsia-600 dark:text-fuchsia-400"
              />
            </div>

            {/* Search + leaf toggle + sort */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 pt-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter topics by keyword..."
                  className="pl-9 pr-9 bg-card"
                />
                {query && (
                  <button
                    onClick={clearFilter}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="self-start sm:self-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear filter
                </Button>
              )}
              <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
                <button
                  type="button"
                  onClick={() => setSortMode("section")}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-sm transition-colors",
                    sortMode === "section"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={sortMode === "section"}
                >
                  <ListTree className="h-3.5 w-3.5" />
                  By section
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode("alpha")}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-sm transition-colors",
                    sortMode === "alpha"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={sortMode === "alpha"}
                >
                  <ArrowDownAZ className="h-3.5 w-3.5" />
                  Alphabetical
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                <Switch
                  id="leaf-only"
                  checked={leafOnly}
                  onCheckedChange={setLeafOnly}
                />
                <Label
                  htmlFor="leaf-only"
                  className="text-xs cursor-pointer whitespace-nowrap"
                >
                  Leaf topics only
                </Label>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {sameRoadmap ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <GitCompare className="mx-auto h-10 w-10 mb-3 opacity-50" />
                Pick two different roadmaps to compare.
              </CardContent>
            </Card>
          ) : !treeA || !treeB ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                Select valid roadmaps above.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile
                  label={`Topics in A`}
                  value={topicsA.length}
                  icon={Layers}
                  tone="cyan"
                />
                <StatTile
                  label={`Topics in B`}
                  value={topicsB.length}
                  icon={Layers}
                  tone="fuchsia"
                />
                <StatTile
                  label="Shared topics"
                  value={diff.shared.length}
                  icon={CheckCircle2}
                  tone="emerald"
                />
                <StatTile
                  label="Shared sections"
                  value={diff.sharedSections.length}
                  icon={Sparkles}
                  tone="amber"
                />
              </div>

              {/* Shared sections band */}
              {diff.sharedSections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Shared sections ({diff.sharedSections.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {diff.sharedSections.map((s) => (
                      <Badge
                        key={s.name}
                        variant="outline"
                        className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                      >
                        {s.name}
                        <span className="ml-1.5 text-[10px] opacity-70">
                          {s.aCount} · {s.bCount}
                        </span>
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Side-by-side diff (grouped by section) */}
              <div className="grid lg:grid-cols-3 gap-4">
                <DiffColumn
                  title={`Only in ${treeA.title}`}
                  emptyText={
                    q
                      ? "No matching topics."
                      : "Every topic also exists in the other roadmap."
                  }
                  items={filteredOnlyA}
                  totalRaw={diff.onlyA.length}
                  accent="cyan"
                  icon={Circle}
                  sortMode={sortMode}
                  keyPrefix={`onlyA::${treeA.id}`}
                />
                <DiffColumn
                  title="Shared topics"
                  emptyText={
                    q
                      ? "No matching shared topics."
                      : "No matching topics found between these roadmaps."
                  }
                  items={filteredShared.map((s) => ({
                    id: s.a.id,
                    title: s.a.title,
                    section: s.a.section,
                    sub:
                      norm(s.a.section) === norm(s.b.section)
                        ? undefined
                        : `also in: ${s.b.section}`,
                  }))}
                  totalRaw={diff.shared.length}
                  accent="emerald"
                  icon={CheckCircle2}
                  sortMode={sortMode}
                  keyPrefix={`shared::${treeA.id}-${treeB.id}`}
                />
                <DiffColumn
                  title={`Only in ${treeB.title}`}
                  emptyText={
                    q
                      ? "No matching topics."
                      : "Every topic also exists in the other roadmap."
                  }
                  items={filteredOnlyB}
                  totalRaw={diff.onlyB.length}
                  accent="fuchsia"
                  icon={Circle}
                  sortMode={sortMode}
                  keyPrefix={`onlyB::${treeB.id}`}
                />
              </div>

              {/* Open shortcuts */}
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to={
                      treeA.id === "fullstack"
                        ? "/dashboard/roadmap/fullstack"
                        : `/dashboard/roadmaps/${treeA.id}`
                    }
                  >
                    Open {treeA.title}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to={
                      treeB.id === "fullstack"
                        ? "/dashboard/roadmap/fullstack"
                        : `/dashboard/roadmaps/${treeB.id}`
                    }
                  >
                    Open {treeB.title}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

// ── Subcomponents ────────────────────────────────────────────────────
interface RoadmapSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: string;
}
const RoadmapSelect = ({
  label,
  value,
  onChange,
  accent,
}: RoadmapSelectProps) => (
  <div className="space-y-1.5">
    <label
      className={cn("text-xs font-medium uppercase tracking-wide", accent)}
    >
      {label}
    </label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-card">
        <SelectValue placeholder="Select a roadmap" />
      </SelectTrigger>
      <SelectContent>
        {roadmapTrees.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "cyan" | "fuchsia" | "emerald" | "amber";
}
const toneMap: Record<StatTileProps["tone"], string> = {
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};
const StatTile = ({ label, value, icon: Icon, tone }: StatTileProps) => (
  <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
    <div
      className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
        toneMap[tone]
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  </div>
);

interface GroupedItem {
  id: string;
  title: string;
  section: string;
  sub?: string;
}

interface DiffColumnProps {
  title: string;
  emptyText: string;
  items: GroupedItem[];
  totalRaw: number;
  accent: "cyan" | "fuchsia" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
  sortMode: SortMode;
  /** Stable, unique-per-column prefix to avoid React key collisions across columns. */
  keyPrefix: string;
}
const accentBorder: Record<DiffColumnProps["accent"], string> = {
  cyan: "border-l-cyan-500/60",
  fuchsia: "border-l-fuchsia-500/60",
  emerald: "border-l-emerald-500/60",
};
const accentText: Record<DiffColumnProps["accent"], string> = {
  cyan: "text-cyan-600 dark:text-cyan-400",
  fuchsia: "text-fuchsia-600 dark:text-fuchsia-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};
const DiffColumn = ({
  title,
  emptyText,
  items,
  totalRaw,
  accent,
  icon: Icon,
  sortMode,
  keyPrefix,
}: DiffColumnProps) => {
  const groups = useMemo(() => {
    if (sortMode === "alpha") {
      const sorted = [...items].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
      return [{ section: "All topics (A → Z)", items: sorted }];
    }
    return groupBySection(items);
  }, [items, sortMode]);

  const visibleCount = groups.reduce((acc, g) => acc + g.items.length, 0);
  return (
    <Card className={cn("border-l-4", accentBorder[accent])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className={cn("flex items-center gap-1.5", accentText[accent])}>
            <Icon className="h-4 w-4" />
            {title}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {visibleCount}
            {visibleCount !== totalRaw && (
              <span className="opacity-60"> / {totalRaw}</span>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[460px] px-4 pb-4">
          {groups.length === 0 || visibleCount === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {emptyText}
            </p>
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div
                  key={`${keyPrefix}::group::${g.section}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-sm py-1 -mx-1 px-1 z-10">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.section}
                    </h4>
                    <span className="text-[10px] text-muted-foreground">
                      {g.items.length}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {g.items.map((it) => (
                      <motion.li
                        key={`${keyPrefix}::${g.section}::${it.id}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.12 }}
                        className="rounded-md border border-border/60 bg-card/50 px-2.5 py-1.5"
                      >
                        <div className="text-sm leading-snug">{it.title}</div>
                        {it.sub && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {it.sub}
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DashboardRoadmapCompare;
