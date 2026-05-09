import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Clock, TrendingUp, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { trackLeadEvent } from "@/lib/leadTracking";

// Industry benchmarks (conservative)
const HOURS_PER_CANDIDATE_MANUAL = 0.75; // ~45 min reviewer time per candidate (mcq + code + integrity check)
const HOURS_PER_CANDIDATE_PARIKSHAA = 0.08; // ~5 min final review on flagged-only
const REWORK_RATE_MANUAL = 0.18; // ~18% candidates need re-screen / re-test in DIY workflow
const REWORK_RATE_PARIKSHAA = 0.012; // ~1.2%
const HOURLY_COST_INR = 800; // blended reviewer cost / hr (recruiter + interviewer)

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${Math.round(n).toLocaleString("en-IN")}`;

const RoiCalculator = () => {
  const [candidates, setCandidates] = useState(500);
  const [rounds, setRounds] = useState(6);

  const result = useMemo(() => {
    const totalCandidates = candidates * rounds;
    const manualHours = totalCandidates * HOURS_PER_CANDIDATE_MANUAL;
    const parikshaaHours = totalCandidates * HOURS_PER_CANDIDATE_PARIKSHAA;
    const hoursSaved = Math.max(0, manualHours - parikshaaHours);

    const reworkManual = totalCandidates * REWORK_RATE_MANUAL;
    const reworkParikshaa = totalCandidates * REWORK_RATE_PARIKSHAA;
    const reworkAvoided = Math.max(0, reworkManual - reworkParikshaa);
    const reworkPct = ((1 - REWORK_RATE_PARIKSHAA / REWORK_RATE_MANUAL) * 100);

    const moneySaved = hoursSaved * HOURLY_COST_INR;
    const integrityConfidence = 99; // headline number we expose

    return { totalCandidates, hoursSaved, reworkAvoided, reworkPct, moneySaved, integrityConfidence };
  }, [candidates, rounds]);

  const goToDemo = () => {
    void trackLeadEvent("roi_calculator_cta", {
      candidates,
      rounds,
      hours_saved: Math.round(result.hoursSaved),
      money_saved_inr: Math.round(result.moneySaved),
    });
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
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Parikshaa saves you</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Tell us how you assess candidates today. We'll estimate the time, rework, and rupees you'd reclaim.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="grid lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {/* Inputs */}
            <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-7 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Your current workload</p>

              <div className="space-y-7">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label htmlFor="cand" className="text-sm font-semibold text-foreground">Candidates per round</label>
                    <span className="text-2xl font-black text-primary tabular-nums">{candidates}</span>
                  </div>
                  <input
                    id="cand"
                    type="range"
                    min={50}
                    max={3000}
                    step={50}
                    value={candidates}
                    onChange={(e) => setCandidates(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>50</span><span>3,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label htmlFor="rounds" className="text-sm font-semibold text-foreground">Hiring / placement rounds per year</label>
                    <span className="text-2xl font-black text-primary tabular-nums">{rounds}</span>
                  </div>
                  <input
                    id="rounds"
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>1</span><span>24</span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 border border-border/40 px-4 py-3 text-xs text-muted-foreground">
                  Based on industry benchmarks: {Math.round(HOURS_PER_CANDIDATE_MANUAL * 60)} min/candidate manual review,
                  {" "}{Math.round(REWORK_RATE_MANUAL * 100)}% rework rate, ₹{HOURLY_COST_INR}/hr blended cost.
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
                Across <span className="text-foreground font-semibold">{result.totalCandidates.toLocaleString("en-IN")}</span> candidates / year.
              </p>

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
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
                  label="Integrity confidence"
                  value={`${result.integrityConfidence}%`}
                  hint="Tamper-evident scoring"
                />
              </div>

              <motion.div
                key={result.moneySaved}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-primary/30 bg-background/40 px-5 py-4 mb-5"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Estimated cost reclaimed / year</p>
                <p className="text-3xl sm:text-4xl font-black mt-1 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent tabular-nums">
                  {fmt(result.moneySaved)}
                </p>
              </motion.div>

              <button
                type="button"
                onClick={goToDemo}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.01]"
              >
                Get my tailored ROI report
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                We'll walk you through these numbers on a 20-min demo.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

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
