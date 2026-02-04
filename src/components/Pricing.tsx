import { Check } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const plans = [
  {
    name: "EXPLORER",
    monthlyPrice: "₹29",
    yearlyPrice: "₹249",
    period: "/month",
    yearlyPeriod: "/year",
    description: "Great for students just getting started with productivity tracking and daily task management.",
    features: ["Basic task tracking", "Note taking", "Weekly analytics"],
    cta: "Get Started",
    featured: false,
    savings: "Save ₹99",
  },
  {
    name: "BUILDER",
    monthlyPrice: "₹49",
    yearlyPrice: "₹449",
    period: "/month",
    yearlyPeriod: "/year",
    description: "Ideal for students building consistent habits with advanced analytics and collaboration tools.",
    features: ["Everything in Explorer", "Advanced analytics", "Streak tracking", "Priority support"],
    cta: "Get Started",
    featured: true,
    savings: "Save ₹139",
  },
  {
    name: "ACHIEVER",
    monthlyPrice: "₹79",
    yearlyPrice: "₹699",
    period: "/month",
    yearlyPeriod: "/year",
    description: "For power users who want the complete experience with unlimited features and premium support.",
    features: ["Everything in Builder", "Unlimited storage", "Custom themes", "API access"],
    cta: "Go Unlimited",
    featured: false,
    savings: "Save ₹249",
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-24 bg-secondary/20">
      <div className="section-container">
        {/* Header */}
        <ScrollReveal>
          <h2 className="section-title">Choose Your Plan</h2>
          <p className="section-subtitle">
            Start free, scale when you're ready
          </p>
        </ScrollReveal>

        {/* Billing Toggle */}
        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 rounded-full bg-secondary border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Toggle billing period"
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary"
                animate={{ x: isYearly ? 26 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full"
              >
                Save up to 25%
              </motion.span>
            )}
          </div>
        </ScrollReveal>

        {/* Pricing Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} delay={index * 0.15}>
              <div className={`pricing-card h-full ${plan.featured ? "featured" : ""}`}>
                <div className="mb-6">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {plan.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <motion.span
                      key={isYearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-bold text-foreground"
                    >
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </motion.span>
                    <span className="text-muted-foreground">
                      {isYearly ? plan.yearlyPeriod : plan.period}
                    </span>
                  </div>
                  {isYearly && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-primary mt-1 inline-block"
                    >
                      {plan.savings}
                    </motion.span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-300 ${
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:scale-105"
                      : "border border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
