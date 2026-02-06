import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Map, CheckCircle2, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedStatProps {
  value: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ 
  value, 
  suffix = "", 
  label, 
  icon,
  delay = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();
    const timer = setTimeout(() => {
      const animate = () => {
        const elapsed = Date.now() - startTime - delay;
        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(easeOut * value));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/50"
    >
      <span className="text-primary">{icon}</span>
      <span className="font-bold tabular-nums">{displayValue}{suffix}</span>
      <span className="text-muted-foreground text-sm hidden sm:inline">{label}</span>
    </motion.div>
  );
};

interface RoadmapDetailHeroProps {
  title: string;
  description: string;
  colorClass: string;
  completedTopics: number;
  totalTopics: number;
  progressPercent: number;
}

const RoadmapDetailHero: React.FC<RoadmapDetailHeroProps> = ({
  title,
  description,
  colorClass,
  completedTopics,
  totalTopics,
  progressPercent,
}) => {
  const navigate = useNavigate();

  // Estimate weeks remaining (assuming 3 topics per week average)
  const remainingTopics = totalTopics - completedTopics;
  const estimatedWeeks = Math.ceil(remainingTopics / 3);

  return (
    <header className="relative overflow-hidden border-b border-border/40">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] transition-opacity duration-700"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Floating Orbs */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 blur-3xl transition-all duration-700"
        />
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-10 left-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-primary/15 to-amber-500/10 blur-3xl transition-all duration-700"
        />
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, 8, 0],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute -bottom-10 left-1/3 w-40 h-40 rounded-full bg-gradient-to-br from-orange-500/10 to-rose-500/5 blur-2xl transition-all duration-700"
        />

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/40 transition-colors duration-700"
            style={{
              left: `${15 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation Bar */}
        <div className="flex h-14 items-center gap-4 px-4 md:px-6">
          <SidebarTrigger />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/research/roadmap")}
            className="gap-2 hover:bg-background/60"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All Roadmaps</span>
          </Button>
        </div>

        {/* Hero Content */}
        <div className="px-4 md:px-6 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Icon & Title */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={cn(
                "h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl shrink-0",
                colorClass,
                "shadow-primary/20"
              )}
            >
              <Map className="h-8 w-8 md:h-10 md:w-10 text-white" />
            </motion.div>

            <div className="flex-1 min-w-0">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-2xl md:text-3xl font-bold gradient-text-animated mb-2"
              >
                {title}
              </motion.h1>
              
              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-muted-foreground text-sm md:text-base mb-4 line-clamp-2"
              >
                {description}
              </motion.p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                <AnimatedStat
                  value={completedTopics}
                  suffix={`/${totalTopics}`}
                  label="topics"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  delay={300}
                />
                <AnimatedStat
                  value={progressPercent}
                  suffix="%"
                  label="complete"
                  icon={<Target className="h-4 w-4" />}
                  delay={500}
                />
                {remainingTopics > 0 && (
                  <AnimatedStat
                    value={estimatedWeeks}
                    suffix=""
                    label={estimatedWeeks === 1 ? "week left" : "weeks left"}
                    icon={<Clock className="h-4 w-4" />}
                    delay={700}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RoadmapDetailHero;
