import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const comparisons = [
  {
    feature: "Student-focused design",
    byteskill: true,
    others: false,
  },
  {
    feature: "Built for Indian academic system",
    byteskill: true,
    others: false,
  },
  {
    feature: "Streak & gamification",
    byteskill: true,
    others: "Partial",
  },
  {
    feature: "Advanced analytics",
    byteskill: true,
    others: "Partial",
  },
  {
    feature: "Affordable pricing in INR",
    byteskill: true,
    others: false,
  },
  {
    feature: "Placement preparation tools",
    byteskill: true,
    others: false,
  },
  {
    feature: "Offline mode",
    byteskill: true,
    others: true,
  },
];

const reasons = [
  {
    title: "Built by Students, for Students",
    description: "We understand the unique challenges of Indian college life — from placement prep to exam stress. Byteskill is designed with your journey in mind.",
    icon: "🎓",
  },
  {
    title: "Data-Driven Insights",
    description: "Our AI-powered analytics help you understand your productivity patterns and optimize your study schedule for maximum efficiency.",
    icon: "📊",
  },
  {
    title: "Gamification That Works",
    description: "Streaks, achievements, and leaderboards make staying consistent actually fun. Compete with friends and celebrate your wins.",
    icon: "🎮",
  },
  {
    title: "Privacy First",
    description: "Your data stays yours. We use industry-standard encryption and never sell your information to third parties.",
    icon: "🔒",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="section-container">
        <ScrollReveal>
          <h2 className="section-title">Why choose Byteskill?</h2>
          <p className="section-subtitle">
            See how we compare to generic productivity tools
          </p>
        </ScrollReveal>

        {/* Comparison Table */}
        <ScrollReveal delay={0.1}>
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-secondary/50 px-6 py-4">
                <span className="text-sm font-semibold text-muted-foreground">Feature</span>
                <span className="text-sm font-semibold text-center gradient-text">Byteskill</span>
                <span className="text-sm font-semibold text-center text-muted-foreground">Others</span>
              </div>
              
              {/* Rows */}
              {comparisons.map((item, index) => (
                <motion.div
                  key={item.feature}
                  className="grid grid-cols-3 px-6 py-4 border-t border-border items-center"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <span className="text-sm text-foreground">{item.feature}</span>
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {item.others === true ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    ) : item.others === "Partial" ? (
                      <span className="text-xs text-muted-foreground">Partial</span>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reasons.map((reason, index) => (
            <ScrollReveal key={reason.title} delay={0.1 + index * 0.1}>
              <motion.div
                className="card-dark h-full"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl mb-4">{reason.icon}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{reason.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{reason.description}</p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
