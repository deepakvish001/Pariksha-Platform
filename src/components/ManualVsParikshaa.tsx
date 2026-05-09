import { Check, X, Clock, ShieldCheck, FileSpreadsheet, Users, Gauge, Zap } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const rows = [
  {
    icon: Clock,
    capability: "Time to launch a hiring round",
    manual: "2–5 days (forms, sheets, emails, scheduling)",
    parikshaa: "Under 60 seconds — paste emails, hit send",
    parikshaaWin: true,
  },
  {
    icon: ShieldCheck,
    capability: "Cheating prevention",
    manual: "Honor system + a proctor on Zoom",
    parikshaa: "Tab-switch, fullscreen, multi-face, voice, Side Eye phone camera",
    parikshaaWin: true,
  },
  {
    icon: Gauge,
    capability: "Integrity scoring",
    manual: "Subjective — depends on who's watching",
    parikshaa: "0–100 score with tamper-evident event log",
    parikshaaWin: true,
  },
  {
    icon: FileSpreadsheet,
    capability: "Reports & exports",
    manual: "Manually compiled spreadsheets, hours of work",
    parikshaa: "Auto PDF + CSV per candidate and per round",
    parikshaaWin: true,
  },
  {
    icon: Users,
    capability: "Scaling to 500+ candidates",
    manual: "Breaks — too many calls, too many tabs",
    parikshaa: "Parallel kiosk mode, no proctor required",
    parikshaaWin: true,
  },
  {
    icon: Zap,
    capability: "Auto-grading code, SQL & MCQs",
    manual: "Reviewer reads each submission line by line",
    parikshaa: "Run-against-tests, instant scoring, similarity clusters",
    parikshaaWin: true,
  },
];

const ManualVsParikshaa = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Manual workflow vs Parikshaa</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              Stop hiring on
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> hope and spreadsheets.</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Here's what changes the day you replace your DIY assessment workflow with Parikshaa.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="max-w-5xl mx-auto bg-card/60 border border-border/60 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
            {/* Header row */}
            <div className="grid grid-cols-12 bg-gradient-to-r from-primary/10 to-orange-500/10 border-b border-border/50">
              <div className="col-span-12 sm:col-span-4 px-4 sm:px-6 py-4 text-sm font-bold text-foreground">
                Capability
              </div>
              <div className="hidden sm:block col-span-4 px-4 sm:px-6 py-4 text-sm font-bold text-muted-foreground border-l border-border/50">
                Manual workflow
              </div>
              <div className="hidden sm:block col-span-4 px-4 sm:px-6 py-4 text-sm font-bold border-l border-border/50">
                <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  Parikshaa
                </span>
              </div>
            </div>

            {rows.map((row, idx) => (
              <motion.div
                key={row.capability}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-12 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-12 sm:col-span-4 px-4 sm:px-6 py-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <row.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground pt-1.5">{row.capability}</span>
                </div>

                <div className="col-span-12 sm:col-span-4 px-4 sm:px-6 py-4 sm:border-l border-border/40 flex items-start gap-2">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manual:</span>
                  <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5 hidden sm:block" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{row.manual}</span>
                </div>

                <div className="col-span-12 sm:col-span-4 px-4 sm:px-6 py-4 sm:border-l border-border/40 flex items-start gap-2 bg-primary/[0.03]">
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-primary">Parikshaa:</span>
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5 hidden sm:block" />
                  <span className="text-sm text-foreground font-medium leading-relaxed">{row.parikshaa}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Teams typically save <span className="text-foreground font-semibold">12–18 hours per hiring round</span> after switching from manual workflows.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ManualVsParikshaa;
