import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Copy, Check,
  Lightbulb, ListChecks, Layers, Variable as VarIcon, Sparkles, Clock, Database, Search, X, ChevronUp, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DSA_TOPICS, type Diff } from "@/data/dsaStudioData";
import { TOPIC_TEMPLATES, FALLBACK_TEMPLATE, type LangId } from "@/data/dsaProblemTemplates";

const diffStyles: Record<Diff, string> = {
  Easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  Hard: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const LANGS: LangId[] = ["Java", "Python", "C++", "JavaScript"];
const STATUSES = ["Not started", "In progress", "Solved", "Revisit"] as const;

export default function DsaStudioProblem() {
  const { slug = "" } = useParams();

  const found = useMemo(() => {
    for (const topic of DSA_TOPICS) {
      for (const g of topic.groups) {
        const p = g.problems.find((x) => x.slug === slug);
        if (p) return { topic, group: g, problem: p };
      }
    }
    return null;
  }, [slug]);

  const template = useMemo(
    () => (found ? TOPIC_TEMPLATES[found.topic.id] ?? FALLBACK_TEMPLATE : FALLBACK_TEMPLATE),
    [found],
  );

  const [lang, setLang] = useState<LangId>("Java");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5 .. 2
  const [status, setStatus] = useState<typeof STATUSES[number]>("In progress");
  const [custom, setCustom] = useState("");
  const [algoQuery, setAlgoQuery] = useState("");
  const stepItemRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Auto-scroll the active algorithm step into view when `step` changes
  // (e.g. after jumping via search, dropdown, or keyboard).
  useEffect(() => {
    const el = stepItemRefs.current[step];
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [step]);
  const totalSteps = template.algorithm.length;

  // Tokenize the user's search query for fuzzy matching.
  const queryTokens = useMemo(
    () =>
      algoQuery
        .toLowerCase()
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [algoQuery],
  );

  // Subsequence match: returns indices in `text` where each char of `token` was found
  // in order, or null if not all chars matched. Used for typo / partial-word tolerance.
  const subseqIndices = (text: string, token: string): number[] | null => {
    const out: number[] = [];
    let ti = 0;
    for (let i = 0; i < text.length && ti < token.length; i++) {
      if (text[i] === token[ti]) {
        out.push(i);
        ti++;
      }
    }
    return ti === token.length ? out : null;
  };

  // Score a candidate string against the current query tokens.
  // Higher = more relevant. Returns 0 if nothing matched.
  const scoreText = (text: string): number => {
    if (queryTokens.length === 0) return 0;
    const lower = text.toLowerCase();
    let score = 0;
    const fullPhrase = queryTokens.join(" ");
    if (fullPhrase.length > 1 && lower.includes(fullPhrase)) score += 200;
    for (const tok of queryTokens) {
      if (!tok) continue;
      const idx = lower.indexOf(tok);
      if (idx !== -1) {
        score += 100;
        // Bonus for word-prefix matches.
        if (idx === 0 || /\W/.test(lower[idx - 1] ?? "")) score += 25;
      } else {
        const seq = subseqIndices(lower, tok);
        if (seq) {
          // Reward compactness: smaller span = closer to a real word match.
          const span = seq[seq.length - 1] - seq[0] + 1;
          const density = tok.length / Math.max(span, tok.length);
          score += Math.round(20 + density * 30);
        }
      }
    }
    return score;
  };

  // Highlight any matching token substrings inside `text`.
  // Tokens are sorted longest-first so overlapping highlights prefer the longer match.
  const highlightQuery = (text: string): React.ReactNode => {
    if (queryTokens.length === 0) return text;
    const lower = text.toLowerCase();
    const tokens = [...queryTokens].sort((a, b) => b.length - a.length);
    type Range = { start: number; end: number };
    const ranges: Range[] = [];
    for (const tok of tokens) {
      let from = 0;
      let idx = lower.indexOf(tok, from);
      while (idx !== -1) {
        const end = idx + tok.length;
        if (!ranges.some((r) => idx < r.end && end > r.start)) {
          ranges.push({ start: idx, end });
        }
        from = end;
        idx = lower.indexOf(tok, from);
      }
    }
    if (ranges.length === 0) return text;
    ranges.sort((a, b) => a.start - b.start);
    const out: React.ReactNode[] = [];
    let cursor = 0;
    let key = 0;
    for (const r of ranges) {
      if (r.start > cursor) out.push(text.slice(cursor, r.start));
      out.push(
        <mark key={key++} className="rounded-sm bg-amber-400/30 text-amber-200 px-0.5">
          {text.slice(r.start, r.end)}
        </mark>,
      );
      cursor = r.end;
    }
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  };


  // Restore last viewed step for this slug from localStorage
  useEffect(() => {
    if (!slug || totalSteps === 0) return;
    try {
      const raw = localStorage.getItem("dsaStudio:lastStep:v1");
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const saved = map[slug];
      if (typeof saved === "number" && saved >= 0 && saved < totalSteps) {
        setStep(saved);
      } else {
        setStep(0);
      }
    } catch {
      setStep(0);
    }
    setPlaying(false);
  }, [slug, totalSteps]);

  // Persist current step per slug
  useEffect(() => {
    if (!slug) return;
    try {
      const raw = localStorage.getItem("dsaStudio:lastStep:v1");
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      map[slug] = step;
      localStorage.setItem("dsaStudio:lastStep:v1", JSON.stringify(map));
    } catch {}
  }, [slug, step]);

  // animation auto-advance
  useEffect(() => {
    if (!playing) return;
    const ms = 1400 / speed;
    const id = setTimeout(() => {
      setStep((s) => (s + 1 >= totalSteps ? (setPlaying(false), s) : s + 1));
    }, ms);
    return () => clearTimeout(id);
  }, [playing, step, speed, totalSteps]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(template.code[lang]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!found) {
    const needle = slug.toLowerCase();
    const suggestions = DSA_TOPICS
      .flatMap((t) => t.groups.flatMap((g) => g.problems.map((p) => ({ ...p, topicLabel: t.label }))))
      .map((p) => {
        const s = p.slug.toLowerCase();
        let score = 0;
        if (s === needle) score = 100;
        else if (s.includes(needle) || needle.includes(s)) score = 60;
        else {
          const tokens = needle.split(/[-_\s]+/).filter(Boolean);
          score = tokens.reduce((acc, tok) => acc + (s.includes(tok) ? 10 : 0), 0);
        }
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.p);

    return (
      <main
        role="main"
        className="min-h-screen grid place-items-center bg-background text-foreground p-6"
      >
        <Helmet>
          <title>Problem not found · DSA Studio</title>
          <meta name="robots" content="noindex,follow" />
        </Helmet>
        <div className="w-full max-w-lg text-center space-y-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-8">
          <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-rose-300 font-mono text-lg font-bold">404</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">Problem not found</h1>
            <p className="text-muted-foreground text-sm">
              We couldn’t find a DSA Studio problem with the slug{" "}
              <span className="font-mono text-foreground break-all">“{slug || "—"}”</span>.
            </p>
          </div>

          {suggestions.length > 0 && (
            <div className="text-left space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Did you mean
              </div>
              <ul className="space-y-1">
                {suggestions.map((p) => (
                  <li key={p.slug}>
                    <Link
                      to={`/learn/dsa-studio/${p.slug}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-background/40 px-3 py-2 text-xs hover:bg-violet-500/10 hover:border-violet-500/40 transition-colors"
                    >
                      <span className="truncate text-foreground">{p.title}</span>
                      <Badge variant="outline" className={cn("h-5 text-[10px]", diffStyles[p.difficulty])}>
                        {p.difficulty}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link to="/learn/dsa-studio">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to DSA Studio
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-violet-500/90 hover:bg-violet-500 text-violet-50"
            >
              <Link to="/library/problems">Browse all problems</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const { topic, group, problem } = found;
  const example = template.examples[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 hover:text-violet-100"
            title="Returns to DSA Studio with your search, topic, tab, and priority filters preserved"
          >
            <Link to="/learn/dsa-studio" aria-label="Back to DSA Studio (filters preserved)">
              <ArrowLeft className="h-4 w-4" /> Back to DSA Studio
            </Link>
          </Button>
          <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent ml-1">
            {problem.title}
          </h1>
          <Badge variant="outline" className="h-5 text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10">
            LC #{problem.id}
          </Badge>
          <Badge variant="outline" className={cn("h-5 text-[10px]", diffStyles[problem.difficulty])}>
            {problem.difficulty.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="h-5 text-[10px] border-violet-500/40 text-violet-300 bg-violet-500/10">
            {topic.label} · {group.name}
          </Badge>
          <div className="flex-1" />
          <Button
            asChild
            size="sm"
            className="h-8 bg-emerald-500/90 hover:bg-emerald-500 text-emerald-50"
          >
            <Link to={`/library/problems/${problem.slug}`}>Practice now</Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof STATUSES[number])}
              className="h-8 rounded-md border border-border/50 bg-card/40 px-2 text-xs"
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-6 py-5 space-y-5 max-w-[1400px] mx-auto">
        {/* PROBLEM */}
        <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Problem</div>
          <p className="text-sm md:text-base leading-relaxed">
            <span className="font-semibold">{problem.title}.</span>{" "}
            Solve this <span className="text-violet-300">{topic.label.toLowerCase()}</span> problem
            categorized under <span className="text-foreground">{group.name}</span>. Apply the{" "}
            <span className="text-emerald-300">{template.approachTitle}</span> approach to derive the answer.
          </p>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Example 1</div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground">Input:</span>
              <code className="px-2 py-1 rounded bg-card/60 border border-border/40 text-foreground">{example.input}</code>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-muted-foreground">Output:</span>
              <code className="px-2 py-1 rounded bg-card/60 border border-border/40 text-emerald-300">{example.output}</code>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Constraints:</span> Generic — use the topic-specific bounds typical for {topic.label.toLowerCase()} problems.
          </div>
        </section>

        {/* TRY EXAMPLES */}
        <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Try Examples</div>
          <div className="flex flex-wrap gap-2">
            {template.examples.map((ex, i) => (
              <button
                key={i}
                className="text-xs px-2.5 py-1.5 rounded-md border border-border/40 bg-card/60 hover:border-primary/40 transition-colors"
              >
                <span className="text-sky-300">{ex.input}</span>
                <span className="mx-1.5 text-muted-foreground">→</span>
                <span className="text-emerald-300">{ex.output}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground shrink-0">Custom:</span>
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 1 2 1"
              className="h-8 bg-background/40 text-xs"
            />
            <Button size="sm" className="h-8 gap-1">
              <Play className="h-3 w-3" /> Run
            </Button>
          </div>
        </section>

        {/* PLAYER + CODE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Player */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-4">
              <div className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">▶ Prev / Next</span> = step-by-step.{" "}
                <span className="font-semibold text-foreground">Play</span> = auto-advance. Slider = speed.
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} className="h-9">
                  <SkipBack className="h-3.5 w-3.5 mr-1" /> Prev
                </Button>
                <Button size="sm" onClick={() => setPlaying((p) => !p)} className="h-9">
                  {playing ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                  {playing ? "Pause" : "Play"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))} className="h-9">
                  Next <SkipForward className="h-3.5 w-3.5 ml-1" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setStep(0); setPlaying(false); }} className="h-9">
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
                <div className="flex items-center gap-2 ml-auto min-w-[180px]">
                  <span className="text-xs text-muted-foreground">Speed</span>
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={0.5}
                    max={2}
                    step={0.25}
                    aria-label="Playback speed"
                    className="w-28"
                  />
                  <span className="text-[11px] text-muted-foreground w-10 text-right">{speed}x</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {step + 1} / {totalSteps}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 to-sky-500"
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </section>

            {/* Approach */}
            <section className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-sky-500/10 p-4 md:p-5 flex gap-3">
              <div className="h-10 w-10 grid place-items-center rounded-lg bg-violet-500/20 border border-violet-500/40 shrink-0">
                <Layers className="h-5 w-5 text-violet-300" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-violet-300">Approach</div>
                <div className="text-base font-semibold mt-0.5">{template.approachTitle}</div>
                <p className="text-sm text-muted-foreground mt-1.5">{template.approachBody}</p>
              </div>
            </section>

            {/* Visualization placeholder */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-4">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                STEP VISUALIZATION
              </div>
              <div className="rounded-lg border border-dashed border-border/40 bg-background/30 p-6 text-center text-xs text-muted-foreground">
                <div className="text-foreground text-sm font-medium mb-1">
                  Step {step + 1}: {template.algorithm[step]}
                </div>
                <div className="opacity-70">
                  Generic {topic.label.toLowerCase()} animation — visit Practice for the full interactive runner.
                </div>
              </div>
            </section>

            {/* Variables */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-3">
              <div className="text-xs font-semibold flex items-center gap-2">
                <VarIcon className="h-3.5 w-3.5 text-amber-400" />
                VARIABLES
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {template.variables.map((v) => (
                  <div key={v} className="rounded-lg border border-border/40 bg-background/40 p-3 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{v}</div>
                    <div className="text-base font-mono mt-1">—</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Step logic */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 md:p-5 space-y-3">
              <div className="text-xs font-semibold flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                STEP LOGIC
              </div>
              <ol className="space-y-2">
                {template.stepLogic.map((s, i) => {
                  const q = algoQuery.trim();
                  const isMatch = q ? scoreText(s) > 0 : false;
                  const isActive = i === step % template.stepLogic.length;
                  return (
                    <li
                      key={i}
                      className={cn(
                        "text-sm border-l-2 pl-3 py-0.5 transition-colors",
                        isActive
                          ? "border-violet-400 text-foreground"
                          : "border-border/40 text-muted-foreground",
                        isMatch && "border-amber-400 bg-amber-400/5 text-foreground",
                        q && !isMatch && !isActive && "opacity-50",
                      )}
                    >
                      <span className="font-semibold text-violet-300 mr-1.5">
                        {["Init", "Step", "Final"][i] ?? `Step ${i + 1}`}:
                      </span>
                      {highlightQuery(s)}
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>

          {/* Right column: Code + Algorithm + Why */}
          <aside className="space-y-5">
            {/* Code */}
            <section className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <div className="text-xs font-medium truncate">{problem.title}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyCode}
                    title="Copy"
                    className="text-[11px] px-2 py-1 rounded border border-border/40 hover:bg-muted/40 flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div className="flex border-b border-border/40 text-xs">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      "px-3 py-1.5 transition-colors",
                      lang === l
                        ? "bg-primary/10 text-primary font-semibold border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {(() => {
                const codeStr = template.code[lang];
                const lines = codeStr.split("\n");
                // Identify executable (non-trivial) line indices
                const isExec = (raw: string) => {
                  const t = raw.trim();
                  if (!t) return false;
                  if (t === "{" || t === "}" || t === "};" || t === "});") return false;
                  if (t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") || t.startsWith("*")) return false;
                  return true;
                };
                const execIdx = lines.map((l, i) => (isExec(l) ? i : -1)).filter((i) => i >= 0);
                const buckets: number[][] = Array.from({ length: totalSteps }, () => []);
                if (execIdx.length && totalSteps) {
                  execIdx.forEach((lineIdx, k) => {
                    const b = Math.min(totalSteps - 1, Math.floor((k * totalSteps) / execIdx.length));
                    buckets[b].push(lineIdx);
                  });
                }
                const highlighted = new Set(buckets[step] ?? []);
                const firstHl = buckets[step]?.[0];

                return (
                  <pre
                    className="text-[12px] leading-relaxed font-mono p-0 overflow-auto bg-background/40 max-h-[420px]"
                    aria-label={`Code lines for step ${step + 1}`}
                  >
                    <code className="block">
                      {lines.map((l, i) => (
                        <div
                          key={i}
                          ref={
                            i === firstHl
                              ? (el) => {
                                  if (el && typeof el.scrollIntoView === "function") {
                                    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                                  }
                                }
                              : undefined
                          }
                          className={cn(
                            "flex items-start gap-3 px-3 transition-colors",
                            highlighted.has(i)
                              ? "bg-violet-500/15 border-l-2 border-violet-400 text-foreground"
                              : "border-l-2 border-transparent text-muted-foreground/80",
                          )}
                        >
                          <span className="select-none w-7 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground/60 pt-[1px]">
                            {i + 1}
                          </span>
                          <span className="whitespace-pre">{l || " "}</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                );
              })()}
            </section>

            {/* Algorithm */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
              <div className="text-xs font-semibold flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
                <span>ALGORITHM</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-normal text-muted-foreground">
                  <span>Step {step + 1}/{totalSteps}</span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const raw = localStorage.getItem("dsaStudio:lastStep:v1");
                        const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
                        delete map[slug];
                        localStorage.setItem("dsaStudio:lastStep:v1", JSON.stringify(map));
                      } catch {}
                      setStep(0);
                      setPlaying(false);
                    }}
                    disabled={step === 0}
                    title="Clear saved step for this problem and restart from step 1"
                    aria-label="Reset to step 1"
                    className={cn(
                      "inline-flex items-center gap-1 h-6 px-2 rounded-md border border-border/50 bg-background/40 transition-colors",
                      "hover:bg-violet-500/10 hover:border-violet-500/40 hover:text-violet-200",
                      "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-background/40 disabled:hover:border-border/50 disabled:hover:text-muted-foreground",
                    )}
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                </span>
              </div>

              {/* Step search */}
              {(() => {
                const q = algoQuery.trim().toLowerCase();
                // Fuzzy-score every step (title + step-logic preview) and keep > 0.
                const scored = template.algorithm
                  .map((s, i) => {
                    const preview = template.stepLogic[i % template.stepLogic.length] || "";
                    const score = q ? Math.max(scoreText(s) * 1.2, scoreText(preview)) : 0;
                    return { i, score };
                  })
                  .filter((x) => x.score > 0);
                // Ranked list for the dropdown — best matches first.
                const ranked = [...scored].sort(
                  (a, b) => b.score - a.score || a.i - b.i,
                );
                // In-list iteration order — keeps Enter-to-jump intuitive (next step after current).
                const matches = [...scored]
                  .sort((a, b) => a.i - b.i)
                  .map((x) => x.i);
                const matchCount = matches.length;
                const renderHighlight = highlightQuery;

                return (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="search"
                          value={algoQuery}
                          onChange={(e) => setAlgoQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && matches.length > 0) {
                              e.preventDefault();
                              const target = e.shiftKey
                                ? ([...matches].reverse().find((m) => m < step) ?? matches[matches.length - 1])
                                : (matches.find((m) => m > step) ?? matches[0]);
                              setStep(target);
                              setPlaying(false);
                            } else if (e.key === "Escape") {
                              setAlgoQuery("");
                            }
                          }}
                          placeholder="Search steps… (Enter to jump)"
                          aria-label="Search algorithm steps"
                          className="w-full h-8 rounded-md border border-border/50 bg-background/40 pl-7 pr-7 text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                        />
                        {algoQuery && (
                          <button
                            type="button"
                            onClick={() => setAlgoQuery("")}
                            aria-label="Clear search"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center rounded-md border border-border/50 bg-background/40 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            if (!matches.length) return;
                            const prev = [...matches].reverse().find((m) => m < step) ?? matches[matches.length - 1];
                            setStep(prev);
                            setPlaying(false);
                          }}
                          disabled={matchCount === 0}
                          aria-label="Previous match"
                          title="Previous match (Shift+Enter)"
                          className="h-8 w-7 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <div className="w-px h-5 bg-border/50" />
                        <button
                          type="button"
                          onClick={() => {
                            if (!matches.length) return;
                            const next = matches.find((m) => m > step) ?? matches[0];
                            setStep(next);
                            setPlaying(false);
                          }}
                          disabled={matchCount === 0}
                          aria-label="Next match"
                          title="Next match (Enter)"
                          className="h-8 w-7 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {q && (
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          {matchCount === 0
                            ? "No matching steps"
                            : `${matchCount} match${matchCount === 1 ? "" : "es"} · current step ${matches.indexOf(step) >= 0 ? matches.indexOf(step) + 1 : "—"}/${matchCount}`}
                        </span>
                        {matchCount > 0 && (
                          <span className="text-muted-foreground/70">↑/↓ or Enter / Shift+Enter</span>
                        )}
                      </div>
                    )}
                    {q && matchCount > 0 && (() => {
                      const stepMs = 1400 / speed;
                      const fmt = (m: number) => {
                        const sec = Math.floor(m / 1000);
                        return `${String(Math.floor(sec / 60)).padStart(1, "0")}:${String(sec % 60).padStart(2, "0")}.${String(Math.floor((m % 1000) / 100))}`;
                      };
                      return (
                        <div
                          role="listbox"
                          aria-label="Matching steps"
                          className="rounded-md border border-amber-400/30 bg-background/80 backdrop-blur-sm divide-y divide-border/30 max-h-48 overflow-y-auto shadow-lg"
                        >
                          {ranked.map(({ i: mi, score }, rank) => {
                            const ms = Math.round(mi * stepMs);
                            const text = template.algorithm[mi];
                            const preview = template.stepLogic[mi % template.stepLogic.length] || "";
                            const isTop = rank === 0;
                            return (
                              <button
                                key={mi}
                                type="button"
                                role="option"
                                aria-selected={mi === step}
                                onClick={() => { setStep(mi); setPlaying(false); }}
                                className={cn(
                                  "w-full flex items-center gap-2 px-2 py-1.5 text-left text-xs",
                                  "hover:bg-amber-400/10 focus-visible:outline-none focus-visible:bg-amber-400/10",
                                  mi === step && "bg-violet-500/10",
                                )}
                                title={`Relevance score: ${score}`}
                              >
                                <span className={cn(
                                  "h-5 w-5 grid place-items-center rounded-full text-[10px] font-bold shrink-0",
                                  mi === step ? "bg-violet-500 text-white" : "bg-amber-400/20 text-amber-200",
                                )}>{mi + 1}</span>
                                <span className="flex-1 min-w-0 truncate text-foreground">
                                  {highlightQuery(text)}
                                  <span className="text-muted-foreground/70"> — {highlightQuery(preview)}</span>
                                </span>
                                {isTop && (
                                  <span className="shrink-0 text-[9px] uppercase tracking-widest text-amber-300/90 border border-amber-400/40 rounded px-1 py-0.5">
                                    Best
                                  </span>
                                )}
                                <span className="shrink-0 font-mono text-[10px] tabular-nums text-violet-300">
                                  {fmt(ms)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <ol className="space-y-1.5">
                      <TooltipProvider delayDuration={150}>
                        {template.algorithm.map((s, i) => {
                          const stepMs = 1400 / speed;
                          const ms = Math.round(i * stepMs);
                          const totalMs = Math.round((totalSteps - 1) * stepMs);
                          const fmt = (m: number) => {
                            const sec = Math.floor(m / 1000);
                            return `${String(Math.floor(sec / 60)).padStart(1, "0")}:${String(sec % 60).padStart(2, "0")}.${String(Math.floor((m % 1000) / 100))}`;
                          };
                          const preview = template.stepLogic[i % template.stepLogic.length];
                          const isMatch = q ? matches.includes(i) : false;
                          const dimmed = q && !isMatch;
                          return (
                            <li
                              key={i}
                              ref={(el) => { stepItemRefs.current[i] = el; }}
                              className={cn(dimmed && "opacity-40")}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => { setStep(i); setPlaying(false); }}
                                    aria-current={i === step ? "step" : undefined}
                                    aria-label={`Jump to step ${i + 1} at ${fmt(ms)}: ${s}`}
                                    className={cn(
                                      "w-full flex items-center gap-2 text-left text-xs rounded-md px-1.5 py-1 transition-colors",
                                      "hover:bg-violet-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
                                      i === step && "bg-violet-500/10 ring-1 ring-violet-500/30",
                                      isMatch && "ring-1 ring-amber-400/50 bg-amber-400/5",
                                    )}
                                  >
                                    <span className={cn(
                                      "h-5 w-5 grid place-items-center rounded-full text-[10px] font-bold shrink-0 transition-colors",
                                      i === step ? "bg-violet-500 text-white" : "bg-muted/40 text-muted-foreground",
                                    )}>{i + 1}</span>
                                    <span className={cn("flex-1 min-w-0", i === step ? "text-foreground" : "text-muted-foreground")}>
                                      {renderHighlight(s)}
                                    </span>
                                    <span
                                      className={cn(
                                        "shrink-0 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded",
                                        "border border-border/40 bg-background/60 text-muted-foreground",
                                        i === step && "border-violet-500/40 text-violet-300 bg-violet-500/10",
                                      )}
                                      title={`Jump to ${fmt(ms)} of ${fmt(totalMs)}`}
                                    >
                                      {fmt(ms)}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" align="center" className="max-w-[260px] text-xs">
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="font-semibold text-foreground">Step {i + 1} / {totalSteps}</span>
                                      <span className="font-mono text-[10px] text-violet-300">{fmt(ms)}</span>
                                    </div>
                                    <div className="text-foreground/90">{renderHighlight(s)}</div>
                                    <div className="pt-1 border-t border-border/40 text-muted-foreground">
                                      <span className="text-[10px] uppercase tracking-widest mr-1">Will show</span>
                                      {renderHighlight(preview)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/80">Click to jump here</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </li>
                          );
                        })}
                      </TooltipProvider>
                    </ol>
                  </>
                );
              })()}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="rounded-lg border border-border/40 bg-background/40 p-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" /> Time
                  </div>
                  <div className="text-sm font-mono text-violet-300 mt-1">{template.time}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/40 p-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1">
                    <Database className="h-3 w-3" /> Space
                  </div>
                  <div className="text-sm font-mono text-violet-300 mt-1">{template.space}</div>
                </div>
              </div>
            </section>

            {/* Why */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-2">
              <div className="text-xs font-semibold">WHY IT WORKS</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{template.whyItWorks}</p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
