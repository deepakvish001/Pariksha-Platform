import { motion } from "framer-motion";
import { TrendingUp, Clock, IndianRupee, Award } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const outcomes = [
  {
    icon: TrendingUp,
    stat: "3.2×",
    label: "more interview calls",
    sub: "vs. students not using Byteskill",
    accent: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: Clock,
    stat: "60s",
    label: "to launch a live test",
    sub: "Bulk invite, proctor, score — done",
    accent: "from-primary/20 to-orange-500/10",
    iconColor: "text-primary",
  },
  {
    icon: IndianRupee,
    stat: "₹0",
    label: "for every student feature",
    sub: "Free forever — no card, no trial",
    accent: "from-amber-500/20 to-yellow-500/10",
    iconColor: "text-amber-400",
  },
  {
    icon: Award,
    stat: "99%",
    label: "integrity score per attempt",
    sub: "AI proctoring + tamper-evident logs",
    accent: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
  },
];

const Outcomes = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-background">
      <div aria-hidden className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-4">
              Real outcomes · Real numbers
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4 leading-tight">
              Results that pay back —
              <span className="block bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                from week one.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Stop measuring activity. Start measuring offers, hires, and time saved.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {outcomes.map((o, i) => (
            <ScrollReveal key={o.label} delay={0.05 * i}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative group h-full p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${o.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-background/60 border border-border/60 mb-5 ${o.iconColor}`}>
                    <o.icon className="w-5 h-5" />
                  </div>
                  <p className="text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none mb-2">
                    {o.stat}
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-1">{o.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.sub}</p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Outcomes;
