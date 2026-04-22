import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Search,
  Map as MapIcon,
  Layout,
  Server,
  Layers,
  Cloud,
  Smartphone,
  Brain,
  Database,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  GitCompare,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { roadmapTrees, countLeafNodes } from "@/data/roadmapTreesData";
import MobileFAB from "@/components/MobileFAB";

const iconMap: Record<string, LucideIcon> = {
  Layout,
  Server,
  Layers,
  Cloud,
  Smartphone,
  Brain,
  Database,
};

// Read leaf-only progress from localStorage. Full Stack flow mirrors its progress
// into `roadmap-progress-fullstack` so we can read every roadmap uniformly here.
const getRoadmapProgress = (roadmapId: string, totalLeaves: number) => {
  try {
    const raw = localStorage.getItem(`roadmap-progress-${roadmapId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const done = Object.values(parsed).filter((v) => v === true).length;
      return {
        done: Math.min(done, totalLeaves),
        percent: totalLeaves
          ? Math.min(100, Math.round((done / totalLeaves) * 100))
          : 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { done: 0, percent: 0 };
};

const categoryFilters = [
  { id: "all", label: "All Roadmaps" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend" },
  { id: "fullstack", label: "Full Stack" },
  { id: "devops", label: "DevOps" },
  { id: "mobile", label: "Mobile" },
  { id: "ai-ml", label: "AI & ML" },
  { id: "data", label: "Data" },
];

const DashboardRoadmaps = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const enrichedRoadmaps = useMemo(() => {
    return roadmapTrees.map((tree) => {
      const totalLeaves = countLeafNodes(tree.nodes);
      const Icon = iconMap[tree.icon] || MapIcon;
      const { done, percent } = getRoadmapProgress(tree.id, totalLeaves);
      return {
        ...tree,
        Icon,
        totalNodes: totalLeaves,
        completedNodes: done,
        progress: percent,
        sections: tree.nodes.length,
      };
    });
  }, []);

  const filteredRoadmaps = useMemo(() => {
    return enrichedRoadmaps.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || r.id === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [enrichedRoadmaps, searchQuery, activeTab]);

  const totalTopics = enrichedRoadmaps.reduce((acc, r) => acc + r.totalNodes, 0);
  const totalCompleted = enrichedRoadmaps.reduce(
    (acc, r) => acc + r.completedNodes,
    0
  );
  const overallPercent = totalTopics
    ? Math.round((totalCompleted / totalTopics) * 100)
    : 0;

  return (
    <>
      <Helmet>
        <title>Roadmaps | Byteskill</title>
        <meta
          name="description"
          content="Step-by-step learning roadmaps for Frontend, Backend, Full Stack, DevOps, Mobile, AI/ML, and Data Engineering."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative max-w-7xl mx-auto p-6 md:p-8 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Career Learning Paths
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Developer Roadmaps
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Curated step-by-step learning paths to become a job-ready
                developer. Track your progress and master each technology in
                the right order.
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                <StatPill
                  label="Roadmaps"
                  value={enrichedRoadmaps.length}
                  icon={MapIcon}
                />
                <StatPill
                  label="Topics"
                  value={totalTopics}
                  icon={Layers}
                />
                <StatPill
                  label="Completed"
                  value={totalCompleted}
                  icon={CheckCircle2}
                />
                <StatPill
                  label="Progress"
                  value={`${overallPercent}%`}
                  icon={Sparkles}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Filter bar */}
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((f) => {
                const isActive = activeTab === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveTab(f.id)}
                    className={cn(
                      "px-3 py-1.5 text-xs sm:text-sm rounded-full border transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          {filteredRoadmaps.length === 0 ? (
            <div className="text-center py-16">
              <MapIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No roadmaps match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoadmaps.map((r, idx) => (
                <RoadmapCard key={r.id} roadmap={r} index={idx} />
              ))}
            </div>
          )}
        </main>
      </div>

      <MobileFAB />
    </>
  );
};

// ── Subcomponents ──

interface StatPillProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

const StatPill = ({ label, value, icon: Icon }: StatPillProps) => (
  <div className="rounded-xl border border-border bg-card/50 backdrop-blur p-3 flex items-center gap-3">
    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="h-4.5 w-4.5" />
    </div>
    <div className="min-w-0">
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  </div>
);

interface RoadmapCardProps {
  roadmap: {
    id: string;
    title: string;
    description: string;
    color: string;
    Icon: LucideIcon;
    totalNodes: number;
    completedNodes: number;
    progress: number;
    sections: number;
  };
  index: number;
}

const RoadmapCard = ({ roadmap, index }: RoadmapCardProps) => {
  // Every roadmap now opens the same interactive flow view.
  const href =
    roadmap.id === "fullstack"
      ? "/dashboard/roadmap/fullstack"
      : `/dashboard/roadmaps/${roadmap.id}`;

  const Icon = roadmap.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link to={href} className="block h-full group">
        <Card className="h-full overflow-hidden border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 bg-card">
          {/* Gradient header */}
          <div
            className={cn(
              "h-24 bg-gradient-to-br relative overflow-hidden",
              roadmap.color
            )}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm hover:bg-white/30">
                {roadmap.sections} sections
              </Badge>
            </div>
            <div className="absolute -bottom-4 left-4">
              <div className="h-14 w-14 rounded-xl bg-white/95 dark:bg-card flex items-center justify-center shadow-lg ring-1 ring-black/5">
                <Icon className="h-7 w-7 text-foreground" />
              </div>
            </div>
          </div>

          <CardContent className="pt-8 pb-5 space-y-3">
            <div>
              <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
                {roadmap.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {roadmap.description}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {roadmap.completedNodes} / {roadmap.totalNodes} topics
                </span>
                <span className="font-medium text-foreground">
                  {roadmap.progress}%
                </span>
              </div>
              <Progress value={roadmap.progress} className="h-1.5" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                ⚡ Interactive Flow
              </Badge>
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Open
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default DashboardRoadmaps;
