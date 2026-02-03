import { Check } from "lucide-react";

const plans = [
  {
    name: "EXPLORER",
    price: "₹29",
    period: "/month",
    description: "Great for students just getting started with productivity tracking and daily task management.",
    features: ["Basic task tracking", "Note taking", "Weekly analytics"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "BUILDER",
    price: "₹49",
    period: "/month",
    description: "Ideal for students building consistent habits with advanced analytics and collaboration tools.",
    features: ["Everything in Explorer", "Advanced analytics", "Streak tracking", "Priority support"],
    cta: "Get Started",
    featured: true,
  },
  {
    name: "EXPLORER",
    price: "₹79",
    period: "/month",
    description: "For power users who want the complete experience with unlimited features and premium support.",
    features: ["Everything in Builder", "Unlimited storage", "Custom themes", "API access"],
    cta: "Go Unlimited",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="section-container">
        {/* Header */}
        <h2 className="section-title">Choose Your Plan</h2>
        <p className="section-subtitle">
          Start free, scale when you're ready
        </p>

        {/* Pricing Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card ${plan.featured ? "featured" : ""}`}
            >
              <div className="mb-6">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {plan.name}
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
