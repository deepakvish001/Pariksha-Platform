import { motion } from "framer-motion";
import { Clock, RefreshCw, ShieldCheck, Quote, ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const cases = [
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
      { icon: Clock, label: "Time saved per drive", value: "32 hrs", sub: "from 40h → 8h" },
      { icon: RefreshCw, label: "Re-evaluations", value: "−87%", sub: "fewer disputes" },
      { icon: ShieldCheck, label: "Integrity confidence", value: "98/100", sub: "auditor verified" },
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
      { icon: Clock, label: "Hiring cycle cut", value: "−42%", sub: "13 days → 7.5" },
      { icon: RefreshCw, label: "Manual re-screens", value: "−93%", sub: "auto-graded" },
      { icon: ShieldCheck, label: "Disputed results", value: "0", sub: "in last quarter" },
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
      { icon: Clock, label: "Grading turnaround", value: "4× faster", sub: "same-day results" },
      { icon: RefreshCw, label: "Re-evaluation requests", value: "−71%", sub: "vs paper exams" },
      { icon: ShieldCheck, label: "Audit pass rate", value: "100%", sub: "council reviewed" },
    ],
  },
];

const CaseStudies = () => {
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
              Proof, not <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">promises</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Real numbers from teams running Parikshaa today — time reclaimed, rework eliminated, and integrity their auditors actually trust.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-3 gap-6">
          {cases.map((c, idx) => (
            <ScrollReveal key={c.company} delay={idx * 0.1}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-7 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.accent} flex items-center justify-center shrink-0`}>
                    <span className="text-sm font-black text-white">{c.avatar}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{c.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.sector}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {c.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl bg-background/60 border border-border/40 p-3 text-center"
                    >
                      <m.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <p className="text-base sm:text-lg font-black text-foreground leading-none">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{m.label}</p>
                      <p className="text-[10px] text-primary/80 mt-0.5 leading-tight">{m.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className="relative flex-1 mb-5">
                  <Quote className="absolute -top-1 -left-1 w-6 h-6 text-primary/20" />
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6 italic">
                    "{c.quote}"
                  </p>
                </div>

                {/* Author */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.author}</p>
                    <p className="text-xs text-muted-foreground">{c.role}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary/60" />
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
