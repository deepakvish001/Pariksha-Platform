import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, RotateCcw, Copy, Check,
  Lightbulb, ListChecks, Layers, Variable as VarIcon, Sparkles, Clock, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
  const totalSteps = template.algorithm.length;

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
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground p-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Problem not found</h1>
          <p className="text-muted-foreground text-sm">
            The slug <span className="font-mono text-foreground">{slug}</span> is not in the DSA Studio index.
          </p>
          <Button asChild variant="outline">
            <Link to="/learn/dsa-studio">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to DSA Studio
            </Link>
          </Button>
        </div>
      </div>
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
                {template.stepLogic.map((s, i) => (
                  <li key={i} className={cn(
                    "text-sm border-l-2 pl-3 py-0.5 transition-colors",
                    i === step % template.stepLogic.length
                      ? "border-violet-400 text-foreground"
                      : "border-border/40 text-muted-foreground",
                  )}>
                    <span className="font-semibold text-violet-300 mr-1.5">{["Init","Step","Final"][i] ?? `Step ${i+1}`}:</span>
                    {s}
                  </li>
                ))}
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
              <pre className="text-[12px] leading-relaxed font-mono p-3 overflow-x-auto bg-background/40 max-h-[420px]">
                <code>{template.code[lang]}</code>
              </pre>
            </section>

            {/* Algorithm */}
            <section className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
              <div className="text-xs font-semibold flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
                ALGORITHM
              </div>
              <ol className="space-y-1.5">
                {template.algorithm.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      "h-5 w-5 grid place-items-center rounded-full text-[10px] font-bold shrink-0",
                      i === step ? "bg-violet-500 text-white" : "bg-muted/40 text-muted-foreground",
                    )}>{i + 1}</span>
                    <span className={cn(i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                  </li>
                ))}
              </ol>
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
