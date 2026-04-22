import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GitCompare,
  CheckCircle2,
  Circle,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type RoadmapTree,
  type RoadmapTreeNode,
} from "@/data/roadmapTreesData";

// ── Helpers ──────────────────────────────────────────────────────────
const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

interface TopicInfo {
  id: string;
  title: string;
  section: string;
}

const collectTopics = (tree: RoadmapTree): TopicInfo[] => {
  const out: TopicInfo[] = [];
  tree.nodes.forEach((sectionNode) => {
    const leaves =
      sectionNode.children && sectionNode.children.length > 0
        ? flattenLeafNodes(sectionNode.children)
        : [sectionNode];
    leaves.forEach((leaf: RoadmapTreeNode) =>
      out.push({ id: leaf.id, title: leaf.title, section: sectionNode.title })
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

  // Section-level overlap (by normalized section name)
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

// ── Page ──────────────────────────────────────────────────────────────
const DashboardRoadmapCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialA = searchParams.get("a") ?? roadmapTrees[0]?.id ?? "";
  const initialB =
    searchParams.get("b") ?? roadmapTrees[1]?.id ?? roadmapTrees[0]?.id ?? "";

  const [aId, setAId] = useState(initialA);
  const [bId, setBId] = useState(initialB);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("a", aId);
    next.set("b", bId);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId]);

  const treeA = useMemo(
    () => roadmapTrees.find((t) => t.id === aId),
    [aId]
  );
  const treeB = useMemo(
    () => roadmapTrees.find((t) => t.id === bId),
    [bId]
  );

  const topicsA = useMemo(() => (treeA ? collectTopics(treeA) : []), [treeA]);
  const topicsB = useMemo(() => (treeB ? collectTopics(treeB) : []), [treeB]);

  const diff = useMemo(
    () => computeDiff(topicsA, topicsB),
    [topicsA, topicsB]
  );

  const sameRoadmap = aId === bId;

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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                  label="Topics in A"
                  value={topicsA.length}
                  icon={Layers}
                  tone="cyan"
                />
                <StatTile
                  label="Topics in B"
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

              {/* Side-by-side diff */}
              <div className="grid lg:grid-cols-3 gap-4">
                <DiffColumn
                  title={`Only in ${treeA.title}`}
                  emptyText="Every topic also exists in the other roadmap."
                  items={diff.onlyA.map((t) => ({
                    id: t.id,
                    title: t.title,
                    section: t.section,
                  }))}
                  accent="cyan"
                  icon={Circle}
                />
                <DiffColumn
                  title="Shared topics"
                  emptyText="No matching topics found between these roadmaps."
                  items={diff.shared.map((s) => ({
                    id: s.a.id,
                    title: s.a.title,
                    section: `${s.a.section}  ↔  ${s.b.section}`,
                  }))}
                  accent="emerald"
                  icon={CheckCircle2}
                />
                <DiffColumn
                  title={`Only in ${treeB.title}`}
                  emptyText="Every topic also exists in the other roadmap."
                  items={diff.onlyB.map((t) => ({
                    id: t.id,
                    title: t.title,
                    section: t.section,
                  }))}
                  accent="fuchsia"
                  icon={Circle}
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
const RoadmapSelect = ({ label, value, onChange, accent }: RoadmapSelectProps) => (
  <div className="space-y-1.5">
    <label className={cn("text-xs font-medium uppercase tracking-wide", accent)}>
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

interface DiffColumnProps {
  title: string;
  emptyText: string;
  items: { id: string; title: string; section: string }[];
  accent: "cyan" | "fuchsia" | "emerald";
  icon: React.ComponentType<{ className?: string }>;
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
  accent,
  icon: Icon,
}: DiffColumnProps) => (
  <Card className={cn("border-l-4", accentBorder[accent])}>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm flex items-center justify-between">
        <span className={cn("flex items-center gap-1.5", accentText[accent])}>
          <Icon className="h-4 w-4" />
          {title}
        </span>
        <Badge variant="secondary" className="text-[10px]">
          {items.length}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[420px] px-4 pb-4">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((it, i) => (
              <motion.li
                key={`${it.id}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.2) }}
                className="rounded-md border border-border/60 bg-card/50 px-2.5 py-1.5"
              >
                <div className="text-sm leading-snug">{it.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {it.section}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </CardContent>
  </Card>
);

export default DashboardRoadmapCompare;
