import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ChevronDown,
  Search,
  Star,
  Clock,
  Layers,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Map as MapIcon,
  Layout,
  Server,
  Cloud,
  Smartphone,
  Brain,
  Database,
  X,
  FileDown,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  getRoadmapTreeById,
  flattenLeafNodes,
  type RoadmapTreeNode,
} from "@/data/roadmapTreesData";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const LAST_ROADMAP_KEY = "last-opened-roadmap-id";

const iconMap: Record<string, LucideIcon> = {
  Layout,
  Server,
  Layers,
  Cloud,
  Smartphone,
  Brain,
  Database,
};

const difficultyStyles: Record<string, string> = {
  Easy: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const typeStyles: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  checkpoint: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  resource: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  optional: "bg-muted text-muted-foreground border-border",
};

const isLeaf = (node: RoadmapTreeNode) =>
  !node.children || node.children.length === 0;

const DashboardRoadmapDetail = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const roadmap = roadmapId ? getRoadmapTreeById(roadmapId) : undefined;

  const storageKey = `roadmap-progress-${roadmapId}`;
  const sectionsKey = `roadmap-open-sections-${roadmapId}`;
  const searchKey = `roadmap-search-${roadmapId}`;

  // Remember last opened roadmap so the sidebar link can restore it.
  useEffect(() => {
    if (!roadmapId) return;
    try {
      localStorage.setItem(LAST_ROADMAP_KEY, roadmapId);
    } catch {
      /* ignore */
    }
  }, [roadmapId]);

  // Hydrate from URL params first (sharing), fall back to localStorage.
  useEffect(() => {
    if (!roadmapId) return;
    setHydrated(false);
    try {
      const rawProgress = localStorage.getItem(storageKey);
      setCompleted(rawProgress ? JSON.parse(rawProgress) : {});

      const urlQ = searchParams.get("q");
      const urlOpen = searchParams.get("open");

      if (urlQ !== null) {
        setSearchQuery(urlQ);
      } else {
        const rawSearch = localStorage.getItem(searchKey);
        setSearchQuery(rawSearch ?? "");
      }

      if (urlOpen !== null) {
        const ids = urlOpen ? urlOpen.split(",").filter(Boolean) : [];
        const map: Record<string, boolean> = {};
        ids.forEach((id) => (map[id] = true));
        setOpenSections(map);
      } else {
        const rawSections = localStorage.getItem(sectionsKey);
        setOpenSections(rawSections ? JSON.parse(rawSections) : {});
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapId]);

  // Persist progress
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(completed));
    } catch {
      /* ignore */
    }
  }, [completed, storageKey, hydrated]);

  // Persist open sections + reflect into URL
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(sectionsKey, JSON.stringify(openSections));
    } catch {
      /* ignore */
    }
    const openIds = Object.entries(openSections)
      .filter(([, v]) => v)
      .map(([k]) => k);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (openIds.length) next.set("open", openIds.join(","));
        else next.delete("open");
        return next;
      },
      { replace: true }
    );
  }, [openSections, sectionsKey, hydrated, setSearchParams]);

  // Persist search + reflect into URL
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(searchKey, searchQuery);
    } catch {
      /* ignore */
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (searchQuery.trim()) next.set("q", searchQuery);
        else next.delete("q");
        return next;
      },
      { replace: true }
    );
  }, [searchQuery, searchKey, hydrated, setSearchParams]);

  // Auto-open first section only if no persisted preference exists
  useEffect(() => {
    if (!hydrated || !roadmap) return;
    if (Object.keys(openSections).length === 0 && roadmap.nodes[0]) {
      setOpenSections({ [roadmap.nodes[0].id]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, roadmap]);

  const allLeafNodes = useMemo(() => {
    if (!roadmap) return [] as RoadmapTreeNode[];
    return flattenLeafNodes(roadmap.nodes);
  }, [roadmap]);

  const totalLeaves = allLeafNodes.length;
  const completedCount = allLeafNodes.filter((n) => completed[n.id]).length;
  const progressPercent = totalLeaves
    ? Math.round((completedCount / totalLeaves) * 100)
    : 0;

  const toggleNode = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!roadmap) return;
    const map: Record<string, boolean> = {};
    roadmap.nodes.forEach((n) => (map[n.id] = true));
    setOpenSections(map);
  };

  const collapseAll = () => setOpenSections({});

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    try {
      localStorage.removeItem(searchKey);
    } catch {
      /* ignore */
    }
  }, [searchKey]);

  const performReset = () => {
    setCompleted({});
    setOpenSections(roadmap?.nodes[0] ? { [roadmap.nodes[0].id]: true } : {});
    setSearchQuery("");
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(sectionsKey);
      localStorage.removeItem(searchKey);
    } catch {
      /* ignore */
    }
    setResetDialogOpen(false);
    toast({
      title: "Roadmap reset",
      description: "Progress, expanded sections, and search were cleared.",
    });
  };

  const exportPDF = () => {
    if (!roadmap) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    const ensureSpace = (lineHeight = 16) => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeLine = (
      text: string,
      opts: { size?: number; bold?: boolean; indent?: number; color?: [number, number, number] } = {}
    ) => {
      const { size = 11, bold = false, indent = 0, color } = opts;
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      else doc.setTextColor(20, 20, 20);
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - indent);
      lines.forEach((line: string) => {
        ensureSpace(size + 4);
        doc.text(line, margin + indent, y);
        y += size + 4;
      });
    };

    // Header
    writeLine(`${roadmap.title} — Progress Report`, { size: 18, bold: true });
    writeLine(roadmap.description, { size: 10, color: [100, 100, 100] });
    y += 6;
    writeLine(
      `Progress: ${completedCount} / ${totalLeaves} topics  •  ${progressPercent}%  •  Generated ${new Date().toLocaleString()}`,
      { size: 10, color: [80, 80, 80] }
    );
    y += 10;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    // Sections
    roadmap.nodes.forEach((section, idx) => {
      const sectionLeaves = flattenLeafNodes([section]);
      const done = sectionLeaves.filter((n) => completed[n.id]).length;
      const pct = sectionLeaves.length
        ? Math.round((done / sectionLeaves.length) * 100)
        : 0;
      writeLine(
        `${idx + 1}. ${section.title}  —  ${done}/${sectionLeaves.length} (${pct}%)`,
        { size: 13, bold: true }
      );
      sectionLeaves.forEach((leaf) => {
        const mark = completed[leaf.id] ? "[x]" : "[ ]";
        writeLine(`${mark} ${leaf.title}`, { size: 10, indent: 16 });
      });
      y += 8;
    });

    doc.save(`${roadmap.id}-progress-${new Date().toISOString().split("T")[0]}.pdf`);
    toast({
      title: "PDF exported",
      description: "Your roadmap progress report has been downloaded.",
    });
  };

  if (!roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <MapIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Roadmap not found</h1>
          <Button onClick={() => navigate("/learn/roadmaps")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  const Icon = iconMap[roadmap.icon] || MapIcon;

  // Filter nodes by search
  const filterNodes = (nodes: RoadmapTreeNode[]): RoadmapTreeNode[] => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter((n) => {
      const matches = n.title.toLowerCase().includes(q);
      const childMatches = n.children
        ? filterNodes(n.children).length > 0
        : false;
      return matches || childMatches;
    });
  };

  const filteredSections = filterNodes(roadmap.nodes);

  return (
    <>
      <Helmet>
        <title>{roadmap.title} Roadmap | Parikshaa</title>
        <meta name="description" content={roadmap.description} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative border-b border-border overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-10",
              roadmap.color
            )}
          />
          <div className="relative max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            {/* Back button */}
            <Link
              to="/learn/roadmaps"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Roadmaps
            </Link>

            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Icon */}
              <div
                className={cn(
                  "h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0",
                  roadmap.color
                )}
              >
                <Icon className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {roadmap.title}
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    {roadmap.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    {roadmap.nodes.length} sections
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    {totalLeaves} topics
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Sparkles className="h-4 w-4" />
                    {completedCount} done
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Overall Progress
                    </span>
                    <span className="font-semibold text-foreground">
                      {progressPercent}%
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-6xl mx-auto p-3 md:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="pl-9 pr-9 h-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs"
              >
                Expand all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="text-xs"
              >
                Collapse all
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPDF}
                className="text-xs"
              >
                <FileDown className="h-3.5 w-3.5 mr-1" />
                Export PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Sections */}
        <main className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground">
                No topics match your search.
              </p>
              <Button variant="outline" size="sm" onClick={clearSearch}>
                <X className="h-3.5 w-3.5 mr-1" />
                Clear search
              </Button>
            </div>
          ) : (
            filteredSections.map((section, idx) => {
              const sectionLeaves = flattenLeafNodes([section]);
              const sectionDone = sectionLeaves.filter(
                (n) => completed[n.id]
              ).length;
              const sectionPct = sectionLeaves.length
                ? Math.round((sectionDone / sectionLeaves.length) * 100)
                : 0;
              const isOpen = openSections[section.id] ?? false;
              const isFullyDone = sectionPct === 100 && sectionLeaves.length > 0;

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className={cn(
                      "border transition-all overflow-hidden",
                      isFullyDone
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border bg-card"
                    )}
                  >
                    <Collapsible
                      open={isOpen}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full p-4 md:p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 font-semibold text-sm",
                              isFullyDone
                                ? "bg-emerald-500 text-white"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {isFullyDone ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              idx + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-base">
                                {section.title}
                              </h3>
                              {section.isRecommended && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                >
                                  <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                                  Recommended
                                </Badge>
                              )}
                              {section.estimatedTime && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                                  {section.estimatedTime}
                                </Badge>
                              )}
                            </div>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {section.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Progress
                                value={sectionPct}
                                className="h-1 flex-1"
                              />
                              <span className="text-[11px] text-muted-foreground tabular-nums w-14 text-right">
                                {sectionDone}/{sectionLeaves.length}
                              </span>
                            </div>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t border-border bg-muted/20">
                          {section.children?.map((child) => (
                            <RecursiveNode
                              key={child.id}
                              node={child}
                              completed={completed}
                              onToggle={toggleNode}
                              searchQuery={searchQuery}
                              depth={1}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              );
            })
          )}
        </main>
      </div>

      {/* Reset confirmation dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this roadmap?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your saved progress, expanded sections, and search
              query for <span className="font-medium">{roadmap.title}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset roadmap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// ── Recursive node renderer ──
interface RecursiveNodeProps {
  node: RoadmapTreeNode;
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
  searchQuery: string;
  depth: number;
}

const RecursiveNode = ({
  node,
  completed,
  onToggle,
  searchQuery,
  depth,
}: RecursiveNodeProps) => {
  const matchesSearch =
    !searchQuery.trim() ||
    node.title.toLowerCase().includes(searchQuery.toLowerCase());

  const childMatches = node.children
    ? node.children.some((c) =>
        flattenWithChildren(c).some((n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : false;

  if (searchQuery && !matchesSearch && !childMatches) return null;

  const leaf = isLeaf(node);

  return (
    <>
      <NodeRow
        node={node}
        isCompleted={leaf ? !!completed[node.id] : false}
        onToggle={() => leaf && onToggle(node.id)}
        depth={depth}
        isLeaf={leaf}
      />
      {node.children?.map((child) => (
        <RecursiveNode
          key={child.id}
          node={child}
          completed={completed}
          onToggle={onToggle}
          searchQuery={searchQuery}
          depth={depth + 1}
        />
      ))}
    </>
  );
};

const flattenWithChildren = (node: RoadmapTreeNode): RoadmapTreeNode[] => {
  const result = [node];
  node.children?.forEach((c) => result.push(...flattenWithChildren(c)));
  return result;
};

// ── Single topic row ──
interface NodeRowProps {
  node: RoadmapTreeNode;
  isCompleted: boolean;
  onToggle: () => void;
  depth: number;
  isLeaf: boolean;
}

const NodeRow = ({
  node,
  isCompleted,
  onToggle,
  depth,
  isLeaf: leaf,
}: NodeRowProps) => {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 md:px-5 py-3 border-b border-border/50 last:border-b-0 transition-colors group",
        leaf && "hover:bg-background",
        !leaf && "bg-muted/10",
        isCompleted && "bg-emerald-500/5"
      )}
      style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
    >
      {leaf ? (
        <button
          onClick={onToggle}
          aria-label={isCompleted ? "Mark as not done" : "Mark as done"}
          className="mt-0.5 shrink-0 transition-transform hover:scale-110"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
          )}
        </button>
      ) : (
        <div
          className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-primary/40"
          aria-hidden
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm",
              !leaf && "font-semibold text-foreground/90",
              isCompleted && leaf && "line-through text-muted-foreground"
            )}
          >
            {node.title}
          </span>
          {node.isRecommended && (
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
          )}
          {node.type && leaf && (
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] py-0 h-4 px-1.5 capitalize",
                typeStyles[node.type] || ""
              )}
            >
              {node.type}
            </Badge>
          )}
          {node.difficulty && leaf && (
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] py-0 h-4 px-1.5",
                difficultyStyles[node.difficulty] || ""
              )}
            >
              {node.difficulty}
            </Badge>
          )}
        </div>
        {node.description && leaf && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {node.description}
          </p>
        )}
        {node.resources && node.resources.length > 0 && leaf && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {node.resources.slice(0, 3).map((r, i) => (
              <a
                key={i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {r.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardRoadmapDetail;
