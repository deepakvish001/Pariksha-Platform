import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Map, Sparkles, Users, BookOpen } from "lucide-react";

interface AnimatedStatProps {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  delay?: number;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, suffix, label, icon, delay = 0 }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const duration = 2000;
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrame);
    };
  }, [hasStarted, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 + 0.3 }}
      className="glass-card rounded-xl p-4 text-center"
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-primary">{icon}</span>
        <span className="text-2xl font-bold gradient-text tabular-nums">
          {count}{suffix}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
};

interface RoadmapHeroSectionProps {
  totalRoadmaps: number;
  totalTopics: number;
  totalLearners?: number;
}

const RoadmapHeroSection: React.FC<RoadmapHeroSectionProps> = ({
  totalRoadmaps,
  totalTopics,
  totalLearners = 10000,
}) => {
  return (
    <section className="relative overflow-hidden py-12 md:py-16 mb-8">
      {/* Animated Background Elements with smooth theme transitions */}
      <div className="absolute inset-0 z-0 transition-colors duration-700">
        {/* Base gradient with theme transition */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 transition-colors duration-700" />
        
        {/* Animated orbs - Dark mode with smooth transitions */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl dark:block hidden transition-all duration-700"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl dark:block hidden transition-all duration-700"
          style={{ backgroundColor: 'hsl(30 100% 50% / 0.15)' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-2xl dark:block hidden transition-all duration-700"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
          animate={{ 
            x: [0, 20, 0],
            y: [0, -15, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Animated orbs - Light mode with smooth transitions */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl dark:hidden block transition-all duration-700"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl dark:hidden block transition-all duration-700"
          style={{ backgroundColor: 'hsl(30 100% 60% / 0.1)' }}
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-2xl dark:hidden block transition-all duration-700"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.08)' }}
          animate={{ 
            x: [0, 20, 0],
            y: [0, -15, 0],
            opacity: [0.05, 0.12, 0.05]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Grid pattern overlay with theme transition */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] transition-opacity duration-700"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Floating particles with theme-aware colors */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full transition-colors duration-700"
            style={{
              left: `${8 + i * 9}%`,
              top: `${12 + (i % 5) * 18}%`,
              backgroundColor: 'hsl(var(--primary) / 0.4)',
            }}
            animate={{
              y: [-15, 15, -15],
              x: [0, i % 2 === 0 ? 8 : -8, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.25,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-6 transition-colors duration-500"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Explore {totalRoadmaps}+ Career Paths
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight"
        >
          <span className="gradient-text">Navigate Your</span>
          <br />
          <span className="text-foreground transition-colors duration-500">Tech Career Journey</span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-colors duration-500"
        >
          Comprehensive visual roadmaps designed to guide you step by step.
          Track your progress and master each skill on your path to success.
        </motion.p>

        {/* Stats row */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto"
        >
          <AnimatedStat 
            value={totalRoadmaps} 
            suffix="+" 
            label="Career Paths" 
            icon={<Map className="h-4 w-4" />}
            delay={0}
          />
          <AnimatedStat 
            value={totalTopics} 
            suffix="+" 
            label="Topics" 
            icon={<BookOpen className="h-4 w-4" />}
            delay={100}
          />
          <AnimatedStat 
            value={Math.floor(totalLearners / 1000)} 
            suffix="K+" 
            label="Learners" 
            icon={<Users className="h-4 w-4" />}
            delay={200}
          />
        </motion.div>
      </div>

      {/* Bottom gradient fade with theme transition */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 transition-colors duration-700" />
    </section>
  );
};

export default RoadmapHeroSection;
