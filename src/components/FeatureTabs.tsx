import { useState, useEffect } from "react";
import { 
  Target, 
  Code2, 
  Trophy, 
  BarChart2, 
  Brain, 
  CheckCircle2, 
  TrendingUp, 
  Flame,
  Star,
  Zap,
  BookOpen,
  FileText,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import ScrollReveal from "./ScrollReveal";

const tabs = [
  { 
    id: "dsa", 
    icon: Code2, 
    label: "DSA Sheets",
    title: "Master Data Structures & Algorithms",
    description: "Practice with curated problem sheets from Striver, Love Babbar, NeetCode, and more. Track your progress, mark revisions, and build consistency with our gamified approach.",
    features: ["500+ curated problems", "Progress tracking", "Revision markers", "Difficulty filters", "Company tags", "Video solutions"],
    stats: { problems: "500+", users: "8K+", completion: "92%" },
    cta: "Start Practicing",
    ctaLink: "/dashboard/sheets",
    preview: [
      { icon: CheckCircle2, text: "Two Sum - Easy", status: "done", xp: "+10 XP" },
      { icon: Code2, text: "Binary Search - Medium", status: "progress", xp: "+20 XP" },
      { icon: Code2, text: "DP on Grids - Hard", status: "pending", xp: "+30 XP" },
      { icon: CheckCircle2, text: "Merge Intervals - Medium", status: "done", xp: "+20 XP" },
    ]
  },
  { 
    id: "cp", 
    icon: Zap, 
    label: "Competitive Programming",
    title: "Level Up Your CP Skills",
    description: "AtCoder, Codeforces, and ICPC problem sets organized by track and difficulty. From beginner to advanced algorithms with detailed editorials.",
    features: ["270+ contest problems", "Track-wise organization", "Platform filters", "Notes support", "Rating tracker", "Contest calendar"],
    stats: { problems: "270+", users: "5K+", tracks: "8" },
    cta: "View Problem Sets",
    ctaLink: "/dashboard/sheets/competitive-programming",
    preview: [
      { icon: CheckCircle2, text: "ABC 330 - Complete", status: "done", xp: "+50 XP" },
      { icon: Zap, text: "Educational Round 156", status: "progress", xp: "+40 XP" },
      { icon: Zap, text: "ICPC Regionals 2023", status: "pending", xp: "+100 XP" },
      { icon: CheckCircle2, text: "AtCoder Grand 061", status: "done", xp: "+80 XP" },
    ]
  },
  { 
    id: "analytics", 
    icon: BarChart2, 
    label: "Analytics",
    title: "Visualize Your Growth Journey",
    description: "Track your daily activity with GitHub-style heatmaps, understand learning patterns, and get personalized insights to optimize your preparation.",
    features: ["Activity heatmap", "Weekly reports", "Streak tracking", "XP leaderboards", "Time analytics", "Goal tracking"],
    stats: { streak: "23 days", xp: "2,450", rank: "#127" },
    cta: "View Analytics",
    ctaLink: "/dashboard",
    preview: [
      { icon: TrendingUp, text: "Weekly problems: 45 solved", status: "done", xp: "+15%" },
      { icon: Flame, text: "Current streak: 23 days", status: "done", xp: "🔥" },
      { icon: Star, text: "This week: +450 XP earned", status: "done", xp: "Level 12" },
      { icon: Target, text: "Weekly goal: 85% complete", status: "progress", xp: "42/50" },
    ]
  },
  { 
    id: "achievements", 
    icon: Trophy, 
    label: "Achievements",
    title: "Earn Badges & Climb Leaderboards",
    description: "Unlock 50+ achievements, earn XP for every action, level up your profile, and compete with peers on weekly and all-time leaderboards.",
    features: ["50+ achievements", "XP system", "Level progression", "Public profiles", "Rarity tiers", "Social sharing"],
    stats: { badges: "50+", levels: "25", active: "10K+" },
    cta: "View Achievements",
    ctaLink: "/dashboard/achievements",
    preview: [
      { icon: Trophy, text: "Speed Demon - 10 in 1 hour", status: "done", xp: "Unlocked!" },
      { icon: Star, text: "Streak Master - 30 day streak", status: "progress", xp: "78%" },
      { icon: Trophy, text: "DSA Champion - 100 problems", status: "pending", xp: "45/100" },
      { icon: Trophy, text: "Early Bird - First 1000 users", status: "done", xp: "Rare!" },
    ]
  },
  { 
    id: "interview", 
    icon: Brain, 
    label: "Interview Prep",
    title: "Ace Your Technical Interviews",
    description: "Company-specific questions from FAANG to startups, CS fundamentals, aptitude prep, SQL practice, and behavioral interview guides.",
    features: ["Company-wise questions", "CS subjects", "Aptitude tests", "SQL practice", "System design", "HR questions"],
    stats: { companies: "50+", questions: "1000+", categories: "8" },
    cta: "Start Prep",
    ctaLink: "/dashboard/library/company-resources",
    preview: [
      { icon: BookOpen, text: "Google - System Design", status: "progress", xp: "5 topics" },
      { icon: FileText, text: "Amazon - Leadership Principles", status: "pending", xp: "14 Qs" },
      { icon: Brain, text: "Meta - Behavioral Questions", status: "done", xp: "Complete" },
      { icon: BookOpen, text: "Microsoft - OS Concepts", status: "progress", xp: "3/8" },
    ]
  },
];

const FeatureTabs = () => {
  const [activeTab, setActiveTab] = useState("dsa");
  const [progress, setProgress] = useState(0);
  const activeContent = tabs.find(tab => tab.id === activeTab);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex].id);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setProgress(0);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-4">
              See It In
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent"> Action</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the key features that make Byteskill the ultimate placement prep companion
            </p>
          </div>
        </ScrollReveal>

        {/* Tabs with progress bar */}
        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden ${
                  activeTab === tab.id 
                    ? "bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/25" 
                    : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Progress bar for active tab */}
                {activeTab === tab.id && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    style={{ width: `${progress}%` }}
                  />
                )}
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab Content - Side by Side Layout */}
        <ScrollReveal delay={0.2}>
          <AnimatePresence mode="wait">
            {activeContent && (
              <motion.div
                key={activeContent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-7xl mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Text Content */}
                  <div className="order-2 lg:order-1">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                      {activeContent.title}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      {activeContent.description}
                    </p>
                    
                    {/* Features grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                      {activeContent.features.map((feature, index) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-orange-500" />
                          <span className="text-sm font-medium text-foreground">{feature}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap gap-3 mb-8">
                      {Object.entries(activeContent.stats).map(([key, value], index) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                        >
                          <span className="text-sm font-bold text-primary">{value}</span>
                          <span className="text-xs text-muted-foreground ml-1 capitalize">{key}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Link 
                      to={activeContent.ctaLink}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      <span>{activeContent.cta}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Preview Card - Browser Mockup */}
                  <div className="order-1 lg:order-2">
                    <motion.div 
                      className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-2xl shadow-black/10"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* Browser Header */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="px-3 py-1 rounded-full bg-background/50 border border-border/50 text-xs text-muted-foreground">
                            app.byteskill.io/{activeContent.id}
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-orange-500">
                              <activeContent.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="font-bold text-foreground block">{activeContent.label}</span>
                              <span className="text-xs text-muted-foreground">Dashboard Preview</span>
                            </div>
                          </div>
                        </div>

                        {/* Preview Items */}
                        <div className="space-y-3">
                          {activeContent.preview.map((item, index) => (
                            <motion.div
                              key={item.text}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-colors"
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                item.status === 'done' ? 'bg-emerald-500/20 text-emerald-500' :
                                item.status === 'progress' ? 'bg-primary/20 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                <item.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground truncate block">{item.text}</span>
                              </div>
                              {item.xp && (
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  item.status === 'done' ? 'bg-emerald-500/20 text-emerald-500' : 
                                  item.status === 'progress' ? 'bg-primary/20 text-primary' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {item.xp}
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FeatureTabs;
