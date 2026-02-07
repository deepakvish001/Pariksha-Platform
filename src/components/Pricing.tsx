import { Check, Sparkles, Shield } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const plans = [
  {
    name: "FREE FOREVER",
    monthlyPrice: "₹0",
    yearlyPrice: "₹0",
    period: "/month",
    yearlyPeriod: "/year",
    description: "Perfect for students just getting started. Full access to core features forever.",
    features: [
      "500+ DSA Problems",
      "Progress Tracking",
      "Streak System",
      "Basic Analytics",
      "Community Access",
    ],
    cta: "Get Started Free",
    featured: false,
    savings: "",
    badge: "No Credit Card",
  },
  {
    name: "PRO",
    monthlyPrice: "₹49",
    yearlyPrice: "₹449",
    period: "/month",
    yearlyPeriod: "/year",
    description: "For serious aspirants. Advanced features and priority support.",
    features: [
      "Everything in Free",
      "Advanced Analytics",
      "AI-Powered Insights",
      "Resume Builder",
      "Priority Support",
      "Ad-Free Experience",
    ],
    cta: "Upgrade to Pro",
    featured: true,
    savings: "Save ₹139",
    badge: "Most Popular",
  },
  {
    name: "TEAM",
    monthlyPrice: "₹199",
    yearlyPrice: "₹1,799",
    period: "/month",
    yearlyPeriod: "/year",
    description: "For coding clubs and study groups. Collaborate and compete together.",
    features: [
      "Everything in Pro",
      "Team Dashboard",
      "Group Leaderboards",
      "Shared Collections",
      "Admin Controls",
      "Bulk Onboarding",
    ],
    cta: "Start Team Trial",
    featured: false,
    savings: "Save ₹589",
    badge: "For Teams",
  },
];

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              Simple, Transparent
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, scale when you're ready. No hidden fees.
            </p>
          </div>
        </ScrollReveal>

        {/* Billing Toggle */}
        <ScrollReveal delay={0.1}>
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 rounded-full bg-card border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Toggle billing period"
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-orange-500 shadow-lg"
                animate={{ x: isYearly ? 32 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
              >
                Save up to 25%
              </motion.span>
            )}
          </div>
        </ScrollReveal>

        {/* Pricing Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div 
                className={`relative h-full p-6 rounded-2xl transition-all duration-300 ${
                  plan.featured 
                    ? 'bg-card border-2 border-primary shadow-2xl shadow-primary/20' 
                    : 'bg-card/50 border border-border/50'
                }`}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Featured glow */}
                {plan.featured && (
                  <motion.div 
                    className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-orange-500 opacity-20 blur-lg -z-10"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Badge */}
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                  plan.featured 
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white' 
                    : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {plan.badge}
                </div>

                <div className="pt-4">
                  <span className="text-sm font-bold text-primary uppercase tracking-wider">
                    {plan.name}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <motion.span
                      key={isYearly ? "yearly" : "monthly"}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl sm:text-5xl font-black text-foreground"
                    >
                      {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </motion.span>
                    <span className="text-muted-foreground">
                      {isYearly ? plan.yearlyPeriod : plan.period}
                    </span>
                  </div>
                  {isYearly && plan.savings && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold text-primary mt-1 inline-block"
                    >
                      {plan.savings}
                    </motion.span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground my-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`w-full py-3.5 rounded-full font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.featured
                      ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105"
                      : "border-2 border-border text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {plan.featured && <Sparkles className="w-4 h-4" />}
                  {plan.cta}
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust badges */}
        <ScrollReveal delay={0.4}>
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>7-Day Money Back</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Pricing;
