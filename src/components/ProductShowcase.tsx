import { motion } from "framer-motion";
import { Activity, ShieldCheck, Code2, BarChart3, Users, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const callouts = [
  { icon: Code2, label: "Coding · MCQ · SQL · Subjective" },
  { icon: ShieldCheck, label: "AI proctoring + Side Eye" },
  { icon: BarChart3, label: "Live leaderboards & analytics" },
  { icon: Users, label: "Bulk CSV invites in <60s" },
];

const ProductShowcase = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-background">
      <div aria-hidden className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 -right-20 w-[450px] h-[450px] bg-orange-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="section-container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-4">
              <Sparkles className="w-3.5 h-3.5" /> See it in action
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-5 leading-tight">
              One dashboard.
              <span className="block bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Every signal you need.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Launch tests, watch live attempts, score automatically and export verifiable reports — without juggling five tools.
            </p>

            <ul className="space-y-3 mb-8">
              {callouts.map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-foreground">
                  <span className="inline-flex w-9 h-9 rounded-lg bg-primary/10 text-primary items-center justify-center flex-shrink-0">
                    <c.icon className="w-4.5 h-4.5" />
                  </span>
                  <span className="text-sm sm:text-base font-medium">{c.label}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
              >
                Try the dashboard free
              </Link>
              <Link
                to="/b2b"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:border-primary/50 transition-all"
              >
                Book a demo
              </Link>
            </div>
          </ScrollReveal>

          {/* Right: stylized product mock */}
          <ScrollReveal delay={0.15}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-orange-500/10 to-transparent rounded-3xl blur-2xl" aria-hidden />

              <div className="relative rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-card/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">app.byteskill.dev/admin</span>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Header KPIs */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Live attempts", value: "248", color: "text-emerald-400" },
                      { label: "Avg. score", value: "76%", color: "text-primary" },
                      { label: "Integrity", value: "99%", color: "text-violet-400" },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl border border-border/60 bg-background/40 p-3">
                        <p className={`text-xl sm:text-2xl font-bold ${k.color} tabular-nums`}>{k.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{k.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary" /> Submissions / hour
                      </p>
                      <span className="text-[10px] text-muted-foreground">Today</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {[35, 55, 40, 70, 60, 85, 75, 95, 80, 90, 65, 78].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: i * 0.04 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary/70 to-orange-500/70"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent attempts */}
                  <div className="rounded-xl border border-border/60 bg-background/40 divide-y divide-border/40">
                    {[
                      { name: "Aarav S.", role: "Backend · DSA", score: "92", tag: "Pass", tagClass: "bg-emerald-500/15 text-emerald-400" },
                      { name: "Priya M.", role: "Frontend · MCQ", score: "78", tag: "Review", tagClass: "bg-amber-500/15 text-amber-400" },
                      { name: "Rohan K.", role: "SQL · Subjective", score: "85", tag: "Pass", tagClass: "bg-emerald-500/15 text-emerald-400" },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center gap-3 px-3.5 py-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-500 grid place-items-center text-[10px] font-bold text-primary-foreground">
                          {row.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground truncate">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{row.role}</p>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">{row.score}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.tagClass}`}>{row.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ProductShowcase;
