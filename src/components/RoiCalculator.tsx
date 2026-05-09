import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Clock,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";

const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n).toLocaleString("en-IN")}`;

const RoiCalculator = () => {
  // Workload inputs
  const [candidates, setCandidates] = useState(500);
  const [rounds, setRounds] = useState(6);
  // Cost / accuracy inputs
  const [hourlyCost, setHourlyCost] = useState(800); // ₹ / hr blended reviewer cost
  const [manualMin, setManualMin] = useState(45); // mins/candidate manual review
  const [manualReworkPct, setManualReworkPct] = useState(18); // % candidates needing re-screen
  const [manualAccuracyPct, setManualAccuracyPct] = useState(78); // hire-quality signal
  const [parikshaaAccuracyPct, setParikshaaAccuracyPct] = useState(96);

  const [confirmation, setConfirmation] = useState(false);

  // Listen for the demo form's success event (only highlight when this section is the source)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail || {};
      if (detail.source === "roi_calculator") setConfirmation(true);
    };
    window.addEventListener("demo-form-submitted", handler as EventListener);
    return () => window.removeEventListener("demo-form-submitted", handler as EventListener);
  }, []);

  const result = useMemo(() => {
    const totalCandidates = candidates * rounds;
    const PARIKSHAA_MIN = 5; // ~5 min final review on flagged-only
    const PARIKSHAA_REWORK_PCT = 1.2;

    const manualHours = (totalCandidates * manualMin) / 60;
    const parikshaaHours = (totalCandidates * PARIKSHAA_MIN) / 60;
    const hoursSaved = Math.max(0, manualHours - parikshaaHours);

    const reworkManual = (totalCandidates * manualReworkPct) / 100;
    const reworkParikshaa = (totalCandidates * PARIKSHAA_REWORK_PCT) / 100;
    const reworkAvoided = Math.max(0, reworkManual - reworkParikshaa);
    const reworkPct =
      manualReworkPct > 0
        ? Math.max(0, (1 - PARIKSHAA_REWORK_PCT / manualReworkPct) * 100)
        : 0;

    const accuracyLift = Math.max(0, parikshaaAccuracyPct - manualAccuracyPct);
    const moneySaved = hoursSaved * hourlyCost;

    return {
      totalCandidates,
      hoursSaved,
      reworkAvoided,
      reworkPct,
      moneySaved,
      accuracyLift,
    };
  }, [candidates, rounds, hourlyCost, manualMin, manualReworkPct, manualAccuracyPct, parikshaaAccuracyPct]);

  const goToDemo = () => {
    const utm = getStoredUtm();
    const noteLines = [
      "Source: roi_calculator",
      "",
      "── ROI calculator inputs ──",
      `• Candidates per round: ${candidates}`,
      `• Rounds per year: ${rounds}`,
      `• Total candidates / yr: ${result.totalCandidates.toLocaleString("en-IN")}`,
      `• Manual review time: ${manualMin} min/candidate`,
      `• Manual rework rate: ${manualReworkPct}%`,
      `• Manual accuracy: ${manualAccuracyPct}% • Parikshaa accuracy: ${parikshaaAccuracyPct}%`,
      `• Blended hourly cost: ₹${hourlyCost}/hr`,
      "",
      "── Projected savings ──",
      `• Reviewer hours saved: ${Math.round(result.hoursSaved).toLocaleString("en-IN")} hrs/yr`,
      `• Rework reduced: −${Math.round(result.reworkPct)}% (${Math.round(result.reworkAvoided).toLocaleString("en-IN")} re-screens avoided)`,
      `• Accuracy lift: +${Math.round(result.accuracyLift)} pts`,
      `• Cost reclaimed: ${fmtCurrency(result.moneySaved)}`,
      "",
      `UTM: source=${utm?.source || "-"} medium=${utm?.medium || "-"} campaign=${utm?.campaign || "-"}`,
    ];
    const notes = noteLines.join("\n");

    void trackLeadEvent("roi_calculator_cta", {
      source: "roi_calculator",
      candidates,
      rounds,
      hourly_cost_inr: hourlyCost,
      manual_min: manualMin,
      manual_rework_pct: manualReworkPct,
      manual_accuracy_pct: manualAccuracyPct,
      parikshaa_accuracy_pct: parikshaaAccuracyPct,
      hours_saved: Math.round(result.hoursSaved),
      money_saved_inr: Math.round(result.moneySaved),
    });

    window.dispatchEvent(
      new CustomEvent("prefill-demo-form", {
        detail: { notes, source: "roi_calculator" },
      }),
    );
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="roi" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Calculator className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">ROI Calculator</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              See exactly what
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                {" "}Parikshaa saves you
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Tune the inputs to your reality — the estimate updates live.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {/* Inputs */}
            <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-7 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Your assumptions</p>

              <div className="space-y-6">
                <SliderRow
                  id="cand"
                  label="Candidates per round"
                  value={candidates}
                  min={50}
                  max={3000}
                  step={50}
                  onChange={setCandidates}
                />
                <SliderRow
                  id="rounds"
                  label="Hiring / placement rounds per year"
                  value={rounds}
                  min={1}
                  max={24}
                  step={1}
                  onChange={setRounds}
                />
                <SliderRow
                  id="hourly"
                  label="Blended reviewer cost"
                  value={hourlyCost}
                  min={200}
                  max={3000}
                  step={50}
                  format={(v) => `₹${v}/hr`}
                  onChange={setHourlyCost}
                />
                <SliderRow
                  id="manualmin"
                  label="Manual review time per candidate"
                  value={manualMin}
                  min={10}
                  max={120}
                  step={5}
                  format={(v) => `${v} min`}
                  onChange={setManualMin}
                />
                <SliderRow
                  id="rework"
                  label="Manual rework / re-screen rate"
                  value={manualReworkPct}
                  min={0}
                  max={50}
                  step={1}
                  format={(v) => `${v}%`}
                  onChange={setManualReworkPct}
                />
                <SliderRow
                  id="manualacc"
                  label="Manual hire-quality accuracy"
                  value={manualAccuracyPct}
                  min={40}
                  max={100}
                  step={1}
                  format={(v) => `${v}%`}
                  onChange={setManualAccuracyPct}
                />
                <SliderRow
                  id="parikacc"
                  label="Parikshaa accuracy (your guess)"
                  value={parikshaaAccuracyPct}
                  min={70}
                  max={100}
                  step={1}
                  format={(v) => `${v}%`}
                  onChange={setParikshaaAccuracyPct}
                />

                <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
                  Parikshaa baseline: <span className="text-foreground font-semibold">5 min</span> review on flagged-only,
                  <span className="text-foreground font-semibold"> 1.2%</span> rework rate.
                </div>
              </div>
            </div>

            {/* Outputs */}
            <div className="lg:col-span-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] via-card/60 to-orange-500/[0.05] backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Your projected savings</p>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Across <span className="text-foreground font-semibold">{result.totalCandidates.toLocaleString("en-IN")}</span>{" "}
                candidates / year.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <ResultCard
                  icon={Clock}
                  label="Reviewer hours saved"
                  value={`${Math.round(result.hoursSaved).toLocaleString("en-IN")} hrs`}
                  hint="Per year"
                />
                <ResultCard
                  icon={TrendingUp}
                  label="Rework reduced"
                  value={`−${Math.round(result.reworkPct)}%`}
                  hint={`${Math.round(result.reworkAvoided).toLocaleString("en-IN")} re-screens avoided`}
                />
                <ResultCard
                  icon={ShieldCheck}
                  label="Accuracy lift"
                  value={`+${Math.round(result.accuracyLift)} pts`}
                  hint={`${manualAccuracyPct}% → ${parikshaaAccuracyPct}%`}
                />
                <ResultCard
                  icon={ShieldCheck}
                  label="Integrity confidence"
                  value="99%"
                  hint="Tamper-evident scoring"
                />
              </div>

              <motion.div
                key={result.moneySaved}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-primary/30 bg-background/40 px-5 py-4 mb-5 mt-3"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Estimated cost reclaimed / year
                </p>
                <p className="text-3xl sm:text-4xl font-black mt-1 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent tabular-nums">
                  {fmtCurrency(result.moneySaved)}
                </p>
              </motion.div>

              <AnimatePresence mode="wait">
                {confirmation ? (
                  <motion.div
                    key="conf"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Your tailored ROI report is on its way.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        We'll walk you through these exact numbers on a 20-min demo within 1 business day.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    key="cta"
                    type="button"
                    onClick={goToDemo}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.01]"
                  >
                    Get my tailored ROI report
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              {!confirmation && (
                <p className="text-[11px] text-muted-foreground text-center mt-2">
                  We'll prefill these inputs into the demo form below.
                </p>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const SliderRow = ({
  id,
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) => (
  <div>
    <div className="flex items-baseline justify-between mb-1.5">
      <label htmlFor={id} className="text-xs sm:text-sm font-semibold text-foreground">
        {label}
      </label>
      <span className="text-base sm:text-lg font-black text-primary tabular-nums">
        {format ? format(value) : value.toLocaleString("en-IN")}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-primary"
    />
  </div>
);

const ResultCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
}) => (
  <div className="rounded-xl border border-border/50 bg-background/40 p-4">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
    </div>
    <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
  </div>
);

export default RoiCalculator;
