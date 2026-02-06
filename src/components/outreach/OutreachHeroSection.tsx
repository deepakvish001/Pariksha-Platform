import { motion } from "framer-motion";
import { Send, TrendingUp, Copy, Sparkles, Zap } from "lucide-react";
import { outreachTemplates, categoryConfigs } from "@/data/coldOutreachData";

const OutreachHeroSection = () => {
  const totalTemplates = outreachTemplates.length;
  const highSuccessCount = outreachTemplates.filter(t => t.successRate === 'high').length;
  const highSuccessPercent = Math.round((highSuccessCount / totalTemplates) * 100);

  const stats = [
    {
      icon: Send,
      value: totalTemplates.toString(),
      label: "Templates",
      gradient: "from-primary to-primary/60"
    },
    {
      icon: TrendingUp,
      value: `${highSuccessPercent}%`,
      label: "High Success",
      gradient: "from-emerald-500 to-emerald-400"
    },
    {
      icon: Copy,
      value: "1-Click",
      label: "Copy & Customize",
      gradient: "from-blue-500 to-blue-400"
    },
    {
      icon: Sparkles,
      value: "AI",
      label: "Personalization",
      gradient: "from-violet-500 to-purple-400"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-border/40"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-violet-500/10" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAwdjQwaC00MHYtNDB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-50" />
      
      <div className="relative z-10 p-6 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left content */}
          <div className="space-y-4 max-w-xl">
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="font-medium">Boost your outreach game</span>
            </motion.div>
            
            <motion.h1 
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                Cold Outreach
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-violet-500 bg-clip-text text-transparent">
                Templates
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground text-base md:text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Battle-tested templates for LinkedIn DMs & emails. Personalize with AI and start getting responses that convert.
            </motion.p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl bg-background/60 backdrop-blur-xl border border-border/50 p-4 md:p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Subtle gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</span>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OutreachHeroSection;
