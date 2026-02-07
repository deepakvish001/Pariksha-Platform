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
  BookOpen,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "./ScrollReveal";

const features = [
  {
    icon: Code2,
    title: "DSA Practice Sheets",
    description: "500+ curated problems from Striver, Love Babbar, and NeetCode sheets with progress tracking",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/20",
  },
  {
    icon: Brain,
    title: "Core CS Subjects",
    description: "Master OS, DBMS, CN, and OOPs with structured notes and quiz assessments",
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/20",
  },
  {
    icon: Target,
    title: "Company-wise Questions",
    description: "Interview questions categorized by FAANG, startups, and service-based companies",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/20",
  },
  {
    icon: Flame,
    title: "Streak & XP System",
    description: "Build consistency with daily streaks, earn XP, and unlock achievements",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize your growth with detailed analytics and GitHub-style heatmaps",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/20",
  },
  {
    icon: Map,
    title: "Learning Roadmaps",
    description: "Follow structured paths for SDE, Data Science, DevOps, and more",
    gradient: "from-indigo-500 to-purple-500",
    bgGlow: "bg-indigo-500/20",
  },
  {
    icon: Trophy,
    title: "Achievements & Badges",
    description: "Unlock 50+ achievements and showcase your profile on leaderboards",
    gradient: "from-yellow-500 to-amber-500",
    bgGlow: "bg-yellow-500/20",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "ATS-friendly templates with AI-powered analysis and suggestions",
    gradient: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/20",
  },
  {
    icon: MessageSquare,
    title: "Astra AI Assistant",
    description: "Get instant help with coding problems, interview prep, and career guidance",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/20",
  },
  {
    icon: Briefcase,
    title: "Job Portal Access",
    description: "Curated list of job boards, referral networks, and application trackers",
    gradient: "from-sky-500 to-blue-500",
    bgGlow: "bg-sky-500/20",
  },
  {
    icon: GraduationCap,
    title: "Aptitude & Reasoning",
    description: "Prepare for aptitude rounds with 1000+ questions and mock tests",
    gradient: "from-lime-500 to-green-500",
    bgGlow: "bg-lime-500/20",
  },
  {
    icon: Sparkles,
    title: "Cold Outreach Templates",
    description: "Professional templates for LinkedIn, emails, and networking",
    gradient: "from-fuchsia-500 to-pink-500",
    bgGlow: "bg-fuchsia-500/20",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px]" />
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
            <h2 className="text-4xl sm:text-5xl font-black text-foreground mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                Crack Tech Interviews
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From DSA practice to resume building — all your placement prep tools in one powerful dashboard.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.05}>
              <motion.div 
                className="group relative h-full p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-2xl ${feature.bgGlow} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-2.5 mb-4 shadow-lg`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <ScrollReveal delay={0.3}>
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-foreground font-medium">And many more features being added weekly!</span>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default Features;
