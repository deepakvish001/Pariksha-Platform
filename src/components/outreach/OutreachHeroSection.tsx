import { motion } from "framer-motion";
import { Send, TrendingUp, Copy, Sparkles } from "lucide-react";
import { outreachTemplates, categoryConfigs } from "@/data/coldOutreachData";

const OutreachHeroSection = () => {
  const totalTemplates = outreachTemplates.length;
  const highSuccessCount = outreachTemplates.filter(t => t.successRate === 'high').length;
  const highSuccessPercent = Math.round((highSuccessCount / totalTemplates) * 100);
  const popularCategory = categoryConfigs.find(c => 
    c.id === outreachTemplates.filter(t => t.isPopular)[0]?.category
  );

  const stats = [
    {
      icon: Send,
      value: totalTemplates.toString(),
      label: "Templates",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      value: `${highSuccessPercent}%`,
      label: "High Success Rate",
      color: "text-green-500"
    },
    {
      icon: Copy,
      value: "1-Click",
      label: "Copy & Customize",
      color: "text-blue-500"
    },
    {
      icon: Sparkles,
      value: "AI",
      label: "Personalization",
      color: "text-purple-500"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-6 md:p-8"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Send className="h-5 w-5 text-primary-foreground" />
              </div>
              Cold Outreach Templates
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Proven templates for LinkedIn DMs, emails, and networking. Personalize with AI and start getting responses.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center p-3 rounded-xl bg-background/50 border border-border/50"
              >
                <stat.icon className={`h-5 w-5 ${stat.color} mb-1`} />
                <span className="text-xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OutreachHeroSection;
