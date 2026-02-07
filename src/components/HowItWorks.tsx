import { UserPlus, Target, Briefcase, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in seconds. No credit card required. Start with full access to all features.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    icon: Target,
    title: "Track Progress",
    description: "Practice DSA, build streaks, earn XP, and watch your skills grow with detailed analytics.",
    gradient: "from-primary to-orange-500",
  },
  {
    number: "03",
    icon: Briefcase,
    title: "Land Your Dream Job",
    description: "Ace interviews with company-specific prep, polished resume, and the confidence of consistent practice.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              How It
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Works</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your placement preparation
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden md:block absolute top-20 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
            
            {steps.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.15}>
                <motion.div 
                  className="relative text-center"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {/* Step number badge */}
                  <motion.div 
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    STEP {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div 
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.gradient} p-5 shadow-xl mb-6`}
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  >
                    <step.icon className="w-full h-full text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                  {/* Arrow connector - mobile and between items */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-20 -right-6 w-12 items-center justify-center text-primary/50">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mobile arrow indicators */}
        <div className="md:hidden flex flex-col items-center gap-4 mt-8">
          <motion.div 
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-4 h-4 text-primary rotate-90" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
