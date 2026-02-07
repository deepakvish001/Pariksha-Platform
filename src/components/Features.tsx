import { 
  Code2, 
  Brain, 
  Target, 
  Flame, 
  BarChart3, 
  Map, 
  Trophy,
  FileText,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
  Zap,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const features = [
  // Large featured cards
  {
    icon: Code2,
    title: "DSA Practice Sheets",
    description: "500+ curated problems from Striver, Love Babbar, and NeetCode sheets with progress tracking, notes, and revision markers.",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/20",
    size: "large",
  },
  {
    icon: MessageSquare,
    title: "Astra AI Assistant",
    description: "Get instant help with coding problems, interview prep, career guidance, and personalized learning recommendations.",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/20",
    size: "large",
  },
  // Medium cards
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize growth with detailed analytics and GitHub-style heatmaps",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/20",
    size: "medium",
  },
  {
    icon: Trophy,
    title: "Achievements & XP",
    description: "Unlock 50+ achievements and showcase your profile on leaderboards",
    gradient: "from-yellow-500 to-amber-500",
    bgGlow: "bg-yellow-500/20",
    size: "medium",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "ATS-friendly templates with AI-powered analysis and suggestions",
    gradient: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/20",
    size: "medium",
  },
  {
    icon: Map,
    title: "Learning Roadmaps",
    description: "Structured paths for SDE, Data Science, DevOps, and more",
    gradient: "from-indigo-500 to-purple-500",
    bgGlow: "bg-indigo-500/20",
    size: "medium",
  },
  // Small cards
  {
    icon: Brain,
    title: "Core CS Subjects",
    description: "Master OS, DBMS, CN, and OOPs",
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/20",
    size: "small",
  },
  {
    icon: Target,
    title: "Company-wise Prep",
    description: "FAANG & startup interview questions",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/20",
    size: "small",
  },
  {
    icon: Flame,
    title: "Streak System",
    description: "Build consistency with daily streaks",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20",
    size: "small",
  },
  {
    icon: Briefcase,
    title: "Job Portal Access",
    description: "Curated job boards & referrals",
    gradient: "from-sky-500 to-blue-500",
    bgGlow: "bg-sky-500/20",
    size: "small",
  },
  {
    icon: GraduationCap,
    title: "Aptitude Prep",
    description: "1000+ questions & mock tests",
    gradient: "from-lime-500 to-green-500",
    bgGlow: "bg-lime-500/20",
    size: "small",
  },
  {
    icon: Sparkles,
    title: "Outreach Templates",
    description: "LinkedIn & email templates",
    gradient: "from-fuchsia-500 to-pink-500",
    bgGlow: "bg-fuchsia-500/20",
    size: "small",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const isLarge = feature.size === "large";
  const isMedium = feature.size === "medium";
  
  return (
    <ScrollReveal delay={index * 0.05}>
      <motion.div 
        className={`group relative h-full rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 overflow-hidden ${
          isLarge ? "p-6 sm:p-8" : isMedium ? "p-5" : "p-4"
        }`}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {/* Glow effect on hover */}
        <div className={`absolute inset-0 ${feature.bgGlow} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500`} />
        
        <div className="relative">
          {/* Icon */}
          <div className={`rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg inline-flex items-center justify-center mb-4 ${
            isLarge ? "w-14 h-14 p-3" : isMedium ? "w-12 h-12 p-2.5" : "w-10 h-10 p-2"
          }`}>
            <feature.icon className="w-full h-full text-white" />
          </div>
          
          {/* Content */}
          <h3 className={`font-bold text-foreground mb-2 group-hover:text-primary transition-colors ${
            isLarge ? "text-xl sm:text-2xl" : isMedium ? "text-lg" : "text-base"
          }`}>
            {feature.title}
          </h3>
          <p className={`text-muted-foreground leading-relaxed ${
            isLarge ? "text-base" : "text-sm"
          }`}>
            {feature.description}
          </p>

          {/* Large card extras */}
          {isLarge && (
            <motion.div 
              className="mt-6 flex items-center gap-2 text-primary font-semibold"
              whileHover={{ x: 5 }}
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </motion.div>
    </ScrollReveal>
  );
};

const Features = () => {
  const largeFeatures = features.filter(f => f.size === "large");
  const mediumFeatures = features.filter(f => f.size === "medium");
  const smallFeatures = features.filter(f => f.size === "small");

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">All-in-One Platform</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Crack Tech Interviews
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              From DSA practice to resume building — all your placement prep tools in one powerful dashboard.
            </p>
          </div>
        </ScrollReveal>

        {/* Bento Grid */}
        <div className="space-y-4">
          {/* Large cards row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {largeFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>

          {/* Medium cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediumFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index + 2} />
            ))}
          </div>

          {/* Small cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {smallFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index + 6} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.3}>
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/signup"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/30 hover:border-primary/50 transition-all duration-300 group"
            >
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold">Start exploring all features for free</span>
              <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Features;
