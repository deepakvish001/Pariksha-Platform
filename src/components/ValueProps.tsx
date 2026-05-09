import { motion } from "framer-motion";
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Code2,
  BarChart3,
  Zap,
  CheckCircle2,
} from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const pillars = [
  {
    icon: GraduationCap,
    eyebrow: "For Students",
    title: "Learn for free, forever",
    description:
      "Curated DSA, SQL, system design and aptitude sheets with progress tracking, streaks and an AI mentor.",
    points: ["1000+ curated problems", "Streaks & XP gamification", "AI doubt-solver"],
    accent: "from-primary/20 to-orange-500/10",
  },
  {
    icon: Briefcase,
    eyebrow: "For Teams",
    title: "Hire with proof, not promises",
    description:
      "Run real coding rounds with proctoring, integrity scoring and bulk invites — all in the browser.",
    points: ["4 question types in one test", "Browser & Side Eye proctoring", "Bulk CSV invites in <60s"],
    accent: "from-blue-500/15 to-primary/10",
  },
  {
    icon: ShieldCheck,
    eyebrow: "For Everyone",
    title: "Built on integrity",
    description:
      "Every assessment produces a verifiable integrity report. Every score on the leaderboard is earned.",
    points: ["Tamper-evident event log", "AI integrity scoring", "Public verify reports"],
    accent: "from-emerald-500/15 to-primary/10",
  },
];

const stats = [
  { icon: Code2, label: "Coding, MCQ, SQL & Subjective", value: "4 types" },
  { icon: BarChart3, label: "Trusted integrity score per attempt", value: "100%" },
  { icon: Zap, label: "Invite to live test", value: "<60s" },
  { icon: CheckCircle2, label: "Browser-based, zero install", value: "0 setup" },
];

const ValueProps = () => {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      {/* ambient orbs */}
      <div aria-hidden className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="section-container relative">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-4">
              One platform · Two outcomes
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-tight">
              Why thousands choose
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Parikshaa</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Free, serious learning for students. Real, proctored assessments for colleges and companies.
              No tradeoffs.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 pillar cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {pillars.map((p, idx) => (
            <ScrollReveal key={p.title} delay={0.1 * idx}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group relative h-full p-7 rounded-2xl bg-card/60 border border-border/60 backdrop-blur-sm overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-5 group-hover:scale-110 transition-transform">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">
                    {p.eyebrow}
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {p.description}
                  </p>
                  <ul className="space-y-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* supporting stat strip */}
        <ScrollReveal delay={0.3}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-sm">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ValueProps;
