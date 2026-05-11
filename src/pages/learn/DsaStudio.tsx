import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  Play,
  ExternalLink,
  Lock,
  Check,
  Bookmark,
  BookmarkCheck,
  ListChecks,
  Puzzle,
  Cpu,
  Wrench,
  AlertTriangle,
  Briefcase,
  Mic,
  Coffee,
  Target,
  Flame,
  Globe,
  Box,
  Type as TypeIcon,
  Grid3x3,
  Layers,
  GitBranch,
  Search as SearchIcon,
  Link2,
  Lightbulb,
  CalendarRange,
  Shuffle,
  Network,
  Activity,
  Zap,
  KeyRound,
  Hammer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Diff = "Easy" | "Medium" | "Hard";
type Priority = "P1" | "P2" | "P3";

interface Problem {
  id: number;
  title: string;
  tag: string;
  difficulty: Diff;
  priority: Priority;
  free?: boolean;
  slug: string;
}

interface Topic {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  groups: { name: string; problems: Problem[] }[];
  patterns: string[];
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TOPICS: Topic[] = [
  {
    id: "arrays",
    label: "Arrays",
    icon: Box,
    count: 18,
    patterns: ["Basics", "Two Pointers", "Subarray", "Hashing", "Rotation", "Sorting", "Sliding Window"],
    groups: [
      {
        name: "Basics",
        problems: [
          { id: 1929, title: "Concatenation of Array", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "concatenation-of-array" },
          { id: 1480, title: "Running Sum of 1d Array", tag: "prefix sum", difficulty: "Easy", priority: "P2", free: true, slug: "running-sum-of-1d-array" },
          { id: 1672, title: "Richest Customer Wealth", tag: "2D array", difficulty: "Easy", priority: "P3", free: true, slug: "richest-customer-wealth" },
          { id: 1470, title: "Shuffle the Array", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "shuffle-the-array" },
          { id: 832, title: "Flipping an Image", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "flipping-an-image" },
          { id: 2239, title: "Find Closest Number to Zero", tag: "basics", difficulty: "Easy", priority: "P3", free: true, slug: "find-closest-number-to-zero" },
        ],
      },
      {
        name: "Two Pointers",
        problems: [
          { id: 88, title: "Merge Sorted Array", tag: "two pointers", difficulty: "Easy", priority: "P1", free: true, slug: "merge-sorted-arrays" },
          { id: 26, title: "Remove Duplicates from Sorted Array", tag: "two pointers", difficulty: "Easy", priority: "P1", free: true, slug: "remove-duplicates-from-sorted-array" },
          { id: 977, title: "Squares of a Sorted Array", tag: "two pointers", difficulty: "Easy", priority: "P2", free: true, slug: "squares-of-a-sorted-array" },
          { id: 15, title: "Three Sum", tag: "two pointers", difficulty: "Medium", priority: "P1", slug: "three-sum" },
        ],
      },
    ],
  },
  { id: "strings", label: "Strings", icon: TypeIcon, count: 17, patterns: ["Basics", "Palindromes", "Sliding Window"], groups: [] },
  { id: "matrix", label: "Matrix", icon: Grid3x3, count: 9, patterns: ["Traversal", "Rotation"], groups: [] },
  { id: "stack", label: "Stack", icon: Layers, count: 8, patterns: ["Monotonic", "Valid Parentheses"], groups: [] },
  { id: "queue", label: "Queue", icon: Activity, count: 1, patterns: ["Deque"], groups: [] },
  { id: "binary-search", label: "Binary Search", icon: SearchIcon, count: 13, patterns: ["Lower bound", "Search Space"], groups: [] },
  { id: "linked-list", label: "Linked List", icon: Link2, count: 13, patterns: ["Reverse", "Cycle"], groups: [] },
  { id: "greedy", label: "Greedy", icon: Lightbulb, count: 5, patterns: ["Intervals"], groups: [] },
  { id: "intervals", label: "Intervals", icon: CalendarRange, count: 5, patterns: ["Merge", "Insert"], groups: [] },
  { id: "backtracking", label: "Backtracking", icon: Shuffle, count: 9, patterns: ["Permutations"], groups: [] },
  { id: "tree", label: "Tree", icon: GitBranch, count: 20, patterns: ["DFS", "BFS"], groups: [] },
  { id: "heap", label: "Heap", icon: Flame, count: 6, patterns: ["Top K"], groups: [] },
  { id: "graph", label: "Graph", icon: Network, count: 11, patterns: ["BFS", "DFS", "Union Find"], groups: [] },
  { id: "dp", label: "Dynamic Prog.", icon: Cpu, count: 15, patterns: ["1D", "2D", "Knapsack"], groups: [] },
  { id: "bit", label: "Bit Manip.", icon: Zap, count: 8, patterns: ["XOR Tricks"], groups: [] },
  { id: "trie", label: "Trie", icon: KeyRound, count: 2, patterns: ["Prefix"], groups: [] },
  { id: "design", label: "Design", icon: Hammer, count: 1, patterns: ["LRU"], groups: [] },
];

const REFERENCE = [
  { id: "patterns", label: "Common Patterns", icon: Puzzle, count: 43 },
  { id: "system", label: "System Design", icon: Cpu, badge: "NEW" },
  { id: "tricks", label: "Code Tricks", icon: Wrench },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle },
];

const TABS = [
  { id: "problems", label: "Problems", icon: ListChecks, accent: "text-sky-400" },
  { id: "patterns", label: "Common Patterns", icon: Puzzle, accent: "text-emerald-400" },
  { id: "system", label: "System Design", icon: Cpu, accent: "text-violet-400" },
  { id: "tricks", label: "Code Tricks", icon: Wrench, accent: "text-amber-400" },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle, accent: "text-orange-400" },
  { id: "jobs", label: "Jobs", icon: Briefcase, accent: "text-pink-400" },
  { id: "mock", label: "Mock Interview", icon: Mic, accent: "text-rose-400" },
  { id: "java", label: "Java", icon: Coffee, accent: "text-yellow-500" },
];

const SUB_TABS = [
  { id: "quiz", label: "Quiz", icon: Target, accent: "text-rose-400" },
  { id: "focus", label: "Focus", icon: Flame, accent: "text-orange-400" },
  { id: "explore", label: "Explore", icon: Globe, accent: "text-sky-400", badge: "AD" },
];

const SEQUENCE = [
  "Arrays", "Strings", "Matrix", "Stack", "Queue", "Binary Search", "Linked List", "Greedy",
  "Intervals", "Backtracking", "Tree", "Heap", "Graph", "Dynamic Programming", "Bit Manipulation", "Trie", "Design",
];

const PRIORITY_LEVELS = [
  { dot: "bg-rose-500", label: "P1 — Must Do", desc: "High interview frequency, core patterns" },
  { dot: "bg-amber-400", label: "P2 — Important", desc: "Commonly asked, good to know" },
  { dot: "bg-zinc-500", label: "P3 — Good to Know", desc: "Warmup / low frequency" },
];

const diffStyles: Record<Diff, string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

type PriorityFilter = "all" | "p1" | "p1p2" | "p3" | "free";

const LS_PREFS = "dsaStudio:prefs:v1";
const LS_SOLVED = "dsaStudio:solved:v1";
const LS_SAVED = "dsaStudio:saved:v1";

const loadJSON = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

interface Prefs {
  activeTopic: string;
  activeTab: string;
  search: string;
  priority: PriorityFilter;
}

const DEFAULT_PREFS: Prefs = {
  activeTopic: "arrays",
  activeTab: "problems",
  search: "",
  priority: "all",
};

export default function DsaStudio() {
  const initial = loadJSON<Prefs>(LS_PREFS, DEFAULT_PREFS);
  const [activeTopic, setActiveTopic] = useState(initial.activeTopic);
  const [activeTab, setActiveTab] = useState(initial.activeTab);
  const [search, setSearch] = useState(initial.search);
  const [priority, setPriority] = useState<PriorityFilter>(initial.priority);

  const [solved, setSolved] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(LS_SOLVED, [])),
  );
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(loadJSON<string[]>(LS_SAVED, [])),
  );

  useEffect(() => {
    window.localStorage.setItem(
      LS_PREFS,
      JSON.stringify({ activeTopic, activeTab, search, priority }),
    );
  }, [activeTopic, activeTab, search, priority]);

  useEffect(() => {
    window.localStorage.setItem(LS_SOLVED, JSON.stringify(Array.from(solved)));
  }, [solved]);
  useEffect(() => {
    window.localStorage.setItem(LS_SAVED, JSON.stringify(Array.from(saved)));
  }, [saved]);

  const toggleSet = (setter: typeof setSolved) => (slug: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  const toggleSolved = toggleSet(setSolved);
  const toggleSaved = toggleSet(setSaved);

  const topic = useMemo(() => TOPICS.find((t) => t.id === activeTopic) ?? TOPICS[0], [activeTopic]);

  const matchesPriority = (p: Problem) => {
    switch (priority) {
      case "all": return true;
      case "p1": return p.priority === "P1";
      case "p1p2": return p.priority === "P1" || p.priority === "P2";
      case "p3": return p.priority === "P3";
      case "free": return !!p.free;
    }
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return topic.groups
      .map((g) => ({
        ...g,
        problems: g.problems.filter((p) => {
          if (!matchesPriority(p)) return false;
          if (!q) return true;
          return p.title.toLowerCase().includes(q) || String(p.id).includes(q);
        }),
      }))
      .filter((g) => g.problems.length);
  }, [topic, search, priority]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link to="/learn" className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              DSA Studio
            </h1>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
            <span>Total: <span className="text-foreground font-semibold">170+</span></span>
            <span className="opacity-40">|</span>
            <span>Easy: <span className="text-emerald-400 font-semibold">60+</span></span>
            <span className="opacity-40">|</span>
            <span>Medium: <span className="text-amber-400 font-semibold">85+</span></span>
            <span className="opacity-40">|</span>
            <span>Hard: <span className="text-rose-400 font-semibold">25+</span></span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 grid place-items-center text-sm font-bold text-white">
            DV
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/40 min-h-[calc(100vh-57px)]">
          <div className="p-4 space-y-6">
            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Learning Path
              </p>
              <ul className="space-y-0.5">
                {TOPICS.map((t) => {
                  const Icon = t.icon;
                  const active = t.id === activeTopic;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveTopic(t.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{t.label}</span>
                        <span className={cn("text-xs", active ? "text-primary" : "text-muted-foreground/70")}>
                          {t.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Reference
              </p>
              <ul className="space-y-0.5">
                {REFERENCE.map((r) => {
                  const Icon = r.icon;
                  return (
                    <li key={r.id}>
                      <button
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 text-left truncate">{r.label}</span>
                        {r.count !== undefined && (
                          <span className="text-xs text-muted-foreground/70">{r.count}</span>
                        )}
                        {r.badge && (
                          <Badge className="h-4 px-1.5 text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {r.badge}
                          </Badge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-5">
          {/* Tabs row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary shadow-md shadow-primary/10"
                      : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : t.accent)} />
                  <span className="font-medium">{t.label}</span>
                </button>
              );
            })}
          </motion.div>

          <div className="flex flex-wrap gap-2">
            {SUB_TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <Icon className={cn("h-4 w-4", t.accent)} />
                  <span className="font-medium">{t.label}</span>
                  {t.badge && (
                    <Badge className="h-4 px-1.5 text-[9px] bg-violet-500/20 text-violet-400 border-violet-500/30">
                      {t.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Recommended sequence */}
          <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-400 mb-3">
              <ListChecks className="h-4 w-4" />
              Recommended Learning Sequence
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {SEQUENCE.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="px-3 py-1 rounded-md text-xs bg-muted/40 border border-border/40 text-muted-foreground">
                    {i + 1}. {s}
                  </span>
                  {i < SEQUENCE.length - 1 && <span className="text-muted-foreground/50 text-xs">→</span>}
                </span>
              ))}
            </div>
          </section>

          {/* Priority */}
          <section className="rounded-xl border border-border/40 bg-card/30 p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-muted-foreground font-medium">Priority:</span>
            {PRIORITY_LEVELS.map((p) => (
              <div key={p.label} className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", p.dot)} />
                <span className="font-semibold">{p.label}</span>
                <span className="text-muted-foreground text-xs">{p.desc}</span>
              </div>
            ))}
          </section>

          {/* Search & filters */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problem name or number..."
                className="pl-9 h-10 bg-card/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { id: "all", label: "All" },
                { id: "p1", label: "P1 Only", dot: "bg-rose-500" },
                { id: "p1p2", label: "P1 + P2", dot: "bg-amber-400" },
                { id: "p3", label: "P3 Only", dot: "bg-zinc-500" },
                { id: "free", label: "Free Only", icon: Lock },
              ] as { id: PriorityFilter; label: string; dot?: string; icon?: typeof Lock }[]).map((b) => {
                const active = priority === b.id;
                const Icon = b.icon;
                return (
                  <Button
                    key={b.id}
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => setPriority(b.id)}
                    className="h-10 gap-1.5"
                  >
                    {b.dot && <span className={cn("h-2 w-2 rounded-full", b.dot)} />}
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {b.label}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <span className="text-xs text-muted-foreground">STATUS</span>
                <span className="text-xs font-medium">All</span>
              </Button>
            </div>
          </div>

          {/* Topic header */}
          <div className="flex items-end justify-between flex-wrap gap-2 pt-2">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <topic.icon className="h-6 w-6 text-primary" />
                {topic.label}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {topic.patterns.join(" · ")}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{topic.count} problems</span>
          </div>

          {/* Groups */}
          {filteredGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/40 bg-card/20 p-10 text-center text-muted-foreground">
              No problems indexed for <span className="text-foreground font-medium">{topic.label}</span> yet — coming soon.
            </div>
          )}

          {filteredGroups.map((g) => (
            <section key={g.name} className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {g.problems.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2.5 hover:border-primary/40 hover:bg-card/60 transition-all cursor-pointer",
                      idx === 0 ? "border-primary/40" : "border-border/40",
                    )}
                  >
                    <button className="text-muted-foreground hover:text-amber-400 transition-colors">
                      <Star className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">#{p.id}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{p.tag}</div>
                    </div>
                    <Badge variant="outline" className={cn("h-5 text-[10px]", diffStyles[p.difficulty])}>
                      {p.difficulty}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                      <Play className="h-3 w-3 fill-current" />
                      <span className="text-[11px]">viz</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                      <ExternalLink className="h-3 w-3" />
                      <span className="text-[11px] ml-1">LC</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
