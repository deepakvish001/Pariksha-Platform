import { Check, X, Sparkles, Shield, Zap, Heart } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const comparisons = [
  { feature: "500+ DSA Problems with Tracking", byteskill: true, others: false },
  { feature: "Competitive Programming Sheets", byteskill: true, others: false },
  { feature: "XP System & Achievements", byteskill: true, others: "Partial" },
  { feature: "GitHub-style Activity Heatmap", byteskill: true, others: false },
  { feature: "AI-Powered Learning Assistant", byteskill: true, others: "Partial" },
  { feature: "Company-wise Interview Prep", byteskill: true, others: false },
  { feature: "Resume Builder & Analyzer", byteskill: true, others: true },
  { feature: "Completely Free to Use", byteskill: true, others: false },
];

const reasons = [
  {
    title: "Built for Placements",
    description: "Every feature is designed with tech placement prep in mind — from DSA to system design to behavioral rounds.",
    icon: Sparkles,
    gradient: "from-primary to-orange-500",
  },
  {
    title: "Data-Driven Progress",
    description: "Track your journey with detailed analytics, streaks, and XP. See exactly where you stand and what to focus on.",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Gamified Learning",
    description: "Earn achievements, climb leaderboards, and maintain streaks. Learning is more fun when there's something to unlock.",
    icon: Heart,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "Privacy First",
    description: "Your data stays yours. We never sell your information and use industry-standard encryption for everything.",
    icon: Shield,
    gradient: "from-emerald-500 to-teal-500",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-secondary/20 to-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="section-container relative z-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Why
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Byteskill?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how we compare to other platforms and why thousands of students trust us
            </p>
          </div>
        </ScrollReveal>

        {/* Comparison Table */}
        <ScrollReveal delay={0.1}>
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl">
              {/* Header */}
              <div className="grid grid-cols-3 bg-gradient-to-r from-primary/10 to-orange-500/10 px-6 py-4 border-b border-border/50">
                <span className="text-sm font-bold text-foreground">Feature</span>
                <span className="text-sm font-bold text-center bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Byteskill</span>
                <span className="text-sm font-bold text-center text-muted-foreground">Others</span>
              </div>
              
              {/* Rows */}
              {comparisons.map((item, index) => (
                <motion.div
                  key={item.feature}
                  className="grid grid-cols-3 px-6 py-4 border-b border-border/30 last:border-0 items-center hover:bg-muted/20 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  viewport={{ once: true }}
                >
                  <span className="text-sm text-foreground font-medium">{item.feature}</span>
                  <div className="flex justify-center">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {item.others === true ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    ) : item.others === "Partial" ? (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">Partial</span>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="w-4 h-4 text-destructive" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {reasons.map((reason, index) => (
            <ScrollReveal key={reason.title} delay={0.1 + index * 0.1}>
              <motion.div
                className="group relative h-full p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${reason.gradient} p-3 mb-5 shadow-lg`}>
                  <reason.icon className="w-full h-full text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
