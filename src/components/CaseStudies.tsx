import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  RefreshCw,
  ShieldCheck,
  Quote,
  Download,
  ChevronDown,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { trackLeadEvent } from "@/lib/leadTracking";

type MetricBreakdown = {
  label: string;
  value: string;
};

type Metric = {
  icon: typeof Clock;
  key: "time" | "rework" | "integrity";
  label: string;
  value: string;
  sub: string;
  detail: string;
  breakdown: MetricBreakdown[];
};

type Case = {
  company: string;
  sector: string;
  avatar: string;
  accent: string;
  quote: string;
  author: string;
  role: string;
  metrics: Metric[];
};

const cases: Case[] = [
  {
    company: "PES University",
    sector: "Placement Cell · 4,200 students",
    avatar: "PU",
    accent: "from-primary to-orange-500",
    quote:
      "We replaced three different tools with Parikshaa for campus drives. Our recruiters finally trust the results, and the placement team got their evenings back.",
    author: "Dr. Kavita Iyer",
    role: "Head of Placements",
    metrics: [
      {
        icon: Clock,
        key: "time",
        label: "Time saved per drive",
        value: "32 hrs",
        sub: "from 40h → 8h",
        detail:
          "Replaced manual paper-based shortlisting, separate proctoring tools, and Excel grading with one workflow. Auto-grading and instant exports cut report prep from 2 days to under an hour.",
        breakdown: [
          { label: "Test setup", value: "−6 hrs (templates + bulk invites)" },
          { label: "Live invigilation", value: "−14 hrs (auto-proctoring)" },
          { label: "Grading", value: "−9 hrs (auto + AI rubric)" },
          { label: "Report compilation", value: "−3 hrs (PDF/CSV exports)" },
        ],
      },
      {
        icon: RefreshCw,
        key: "rework",
        label: "Re-evaluations",
        value: "−87%",
        sub: "fewer disputes",
        detail:
          "Tamper-evident event logs and per-signal integrity reports gave the placement cell evidence to close disputes on the spot.",
        breakdown: [
          { label: "Disputed scores", value: "118 → 15 per drive" },
          { label: "Manual re-grades", value: "23 → 3 per drive" },
          { label: "Avg resolution time", value: "5 days → 6 hours" },
        ],
      },
      {
        icon: ShieldCheck,
        key: "integrity",
        label: "Integrity confidence",
        value: "98/100",
        sub: "auditor verified",
        detail:
          "External academic auditor verified the chain-of-custody log on a random sample of 200 attempts across 3 drives.",
        breakdown: [
          { label: "Tamper-evident chain", value: "100% verifiable" },
          { label: "Side Eye coverage", value: "92% of attempts" },
          { label: "Identity match score", value: "97 avg" },
        ],
      },
    ],
  },
  {
    company: "Razorpay",
    sector: "Tech Hiring · 400+ candidates / mo",
    avatar: "RP",
    accent: "from-blue-500 to-cyan-500",
    quote:
      "Side Eye proctoring is a game-changer for remote hiring. We screened 400+ candidates in a week with zero integrity disputes — setup took less than 10 minutes.",
    author: "Rohan Gupta",
    role: "Engineering Manager",
    metrics: [
      {
        icon: Clock,
        key: "time",
        label: "Hiring cycle cut",
        value: "−42%",
        sub: "13 days → 7.5",
        detail:
          "Pre-built coding rounds with auto-grading and instant integrity reports removed two interview rounds from the funnel.",
        breakdown: [
          { label: "Screen → shortlist", value: "5 days → 1 day" },
          { label: "Tech round prep", value: "−3 days" },
          { label: "Final loop scheduling", value: "−1.5 days" },
        ],
      },
      {
        icon: RefreshCw,
        key: "rework",
        label: "Manual re-screens",
        value: "−93%",
        sub: "auto-graded",
        detail:
          "Cross-submission similarity + AI fingerprinting flagged AI-generated answers before they reached the hiring manager.",
        breakdown: [
          { label: "AI-flagged submissions", value: "47 caught upstream" },
          { label: "Hiring-manager rescreens", value: "210 → 14 per month" },
          { label: "False-positive rate", value: "1.8%" },
        ],
      },
      {
        icon: ShieldCheck,
        key: "integrity",
        label: "Disputed results",
        value: "0",
        sub: "in last quarter",
        detail:
          "Public verifiable integrity reports shared with candidates removed objections — every flag is backed by a timestamped event.",
        breakdown: [
          { label: "Candidate appeals", value: "0 in Q3" },
          { label: "HM-overridden flags", value: "3 of 412" },
          { label: "Audit-pack downloads", value: "31 by candidates" },
        ],
      },
    ],
  },
  {
    company: "NIT Warangal",
    sector: "Internal assessments · 18 departments",
    avatar: "NW",
    accent: "from-emerald-500 to-teal-500",
    quote:
      "We run mid-sems and finals on Parikshaa now. The verifiable integrity reports made it an easy sell to the academic council.",
    author: "Prof. S. Rajan",
    role: "Dean, Academic Affairs",
    metrics: [
      {
        icon: Clock,
        key: "time",
        label: "Grading turnaround",
        value: "4× faster",
        sub: "same-day results",
        detail:
          "Auto-graded MCQ + coding sections plus AI-assisted rubric scoring on subjective answers shrank a 4-day grading window into a few hours.",
        breakdown: [
          { label: "MCQ + coding", value: "Instant" },
          { label: "Subjective (AI rubric)", value: "~2 hrs / 100 papers" },
          { label: "Faculty review", value: "−70% time" },
        ],
      },
      {
        icon: RefreshCw,
        key: "rework",
        label: "Re-evaluation requests",
        value: "−71%",
        sub: "vs paper exams",
        detail:
          "Per-question score breakdown plus model-answer access reduced re-evaluation requests across all 18 departments.",
        breakdown: [
          { label: "Re-eval requests", value: "1,240 → 360 per sem" },
          { label: "Appeals upheld", value: "8% (vs 22% on paper)" },
          { label: "Avg turnaround", value: "9 days → 2 days" },
        ],
      },
      {
        icon: ShieldCheck,
        key: "integrity",
        label: "Audit pass rate",
        value: "100%",
        sub: "council reviewed",
        detail:
          "Council-mandated quarterly audit reviewed sampled exams; chain-of-custody logs verified independently.",
        breakdown: [
          { label: "Audits passed", value: "4 of 4 in 2024" },
          { label: "Chain-of-custody breaks", value: "0" },
          { label: "Council approvals", value: "100%" },
        ],
      },
    ],
  },
];

function downloadOnePager(c: Case) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>${c.company} — Parikshaa case study</title>
<style>
 body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;margin:48px;max-width:780px}
 h1{font-size:28px;margin:0 0 4px} .sector{color:#666;margin-bottom:24px}
 .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:24px 0}
 .card{border:1px solid #e5e5e5;border-radius:12px;padding:16px}
 .v{font-size:24px;font-weight:800;margin:4px 0}
 .l{font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.5px}
 .s{font-size:11px;color:#d97706;margin-top:2px}
 h3{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
 ul{padding-left:18px;margin:6px 0} li{margin:4px 0;font-size:13px}
 blockquote{border-left:3px solid #f97316;padding:8px 16px;color:#444;font-style:italic;margin:24px 0}
 .author{font-size:13px;color:#666}
 .footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;color:#888;font-size:11px}
 @media print{body{margin:24px}}
</style></head><body>
<h1>${c.company}</h1><div class="sector">${c.sector}</div>
<div class="grid">
 ${c.metrics
   .map(
     (m) => `
  <div class="card">
   <div class="l">${m.label}</div>
   <div class="v">${m.value}</div>
   <div class="s">${m.sub}</div>
  </div>`,
   )
   .join("")}
</div>
<blockquote>"${c.quote}"<br/><span class="author">— ${c.author}, ${c.role}</span></blockquote>
${c.metrics
  .map(
    (m) => `
 <h3>${m.label} — ${m.value}</h3>
 <p style="font-size:13px;color:#444;">${m.detail}</p>
 <ul>${m.breakdown.map((b) => `<li><strong>${b.label}:</strong> ${b.value}</li>`).join("")}</ul>`,
  )
  .join("")}
<div class="footer">Parikshaa · One-page customer summary · Generated ${new Date().toLocaleDateString()}</div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.company.replace(/\s+/g, "-").toLowerCase()}-parikshaa-one-pager.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const CaseStudies = () => {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const handleToggle = (company: string, metricKey: string) => {
    const key = `${company}:${metricKey}`;
    setOpenKey((prev) => {
      const next = prev === key ? null : key;
      if (next) {
        void trackLeadEvent("case_study_metric_expand", { company, metric: metricKey });
      }
      return next;
    });
  };

  const handleDownload = (c: Case) => {
    void trackLeadEvent("case_study_one_pager_download", { company: c.company });
    downloadOnePager(c);
  };

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        <ScrollReveal>
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Customer outcomes</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-tight">
              Proof, not{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                promises
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Real numbers from teams running Parikshaa today — tap any metric to see the breakdown,
              or download a one-page summary to share internally.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6">
          {cases.map((c, idx) => (
            <ScrollReveal key={c.company} delay={idx * 0.1}>
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-7 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.accent} flex items-center justify-center shrink-0`}
                  >
                    <span className="text-sm font-black text-white">{c.avatar}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{c.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.sector}</p>
                  </div>
                </div>

                {/* Metrics — expandable */}
                <div className="space-y-2 mb-5">
                  {c.metrics.map((m) => {
                    const key = `${c.company}:${m.key}`;
                    const isOpen = openKey === key;
                    return (
                      <div
                        key={m.key}
                        className="rounded-xl bg-background/60 border border-border/40 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggle(c.company, m.key)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-background/80 transition-colors"
                        >
                          <m.icon className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-foreground leading-none">
                              {m.value}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                              {m.label} · <span className="text-primary/80">{m.sub}</span>
                            </p>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="px-3 pb-3 pt-1 border-t border-border/40">
                                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                  {m.detail}
                                </p>
                                <ul className="space-y-1">
                                  {m.breakdown.map((b) => (
                                    <li
                                      key={b.label}
                                      className="text-[11px] text-foreground/80 flex justify-between gap-2"
                                    >
                                      <span className="text-muted-foreground">{b.label}</span>
                                      <span className="font-semibold text-foreground">
                                        {b.value}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Quote */}
                <div className="relative flex-1 mb-5">
                  <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6 italic">
                    "{c.quote}"
                  </p>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.author}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-colors shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    One-pager
                  </button>
                </div>
              </motion.article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
