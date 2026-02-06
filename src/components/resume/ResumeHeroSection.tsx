import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Download, Shield, Star, CheckCircle } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  delay = 0,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50"
    >
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold">
          {formatNumber(count)}
          {suffix}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
};

interface ResumeHeroSectionProps {
  templateCount: number;
  atsCount: number;
  totalDownloads: number;
}

const ResumeHeroSection: React.FC<ResumeHeroSectionProps> = ({
  templateCount,
  atsCount,
  totalDownloads,
}) => {
  return (
    <section className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Floating Gradient Orbs */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-10 right-[20%] w-72 h-72 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-3xl transition-colors duration-700"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
            scale: [1, 0.95, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-0 left-[10%] w-96 h-96 bg-gradient-to-tr from-primary/15 to-amber-400/10 rounded-full blur-3xl transition-colors duration-700"
        />

        {/* Floating Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full"
            style={{
              left: `${15 + i * 10}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative border-b border-border/40 bg-background/60 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <FileCheck className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold">Resume Templates</h1>
              <p className="text-sm text-muted-foreground">
                Professional designs for every career
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-6"
          >
            <CheckCircle className="h-4 w-4" />
            100% Free • ATS Optimized • Professional Quality
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Craft Your{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Perfect Resume
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Choose from professionally designed templates that help you stand out
            and get hired faster. All templates are ATS-friendly and completely free.
          </motion.p>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <AnimatedStat
              value={templateCount}
              suffix="+"
              label="Templates"
              icon={<FileCheck className="h-4 w-4 text-primary" />}
              delay={500}
            />
            <AnimatedStat
              value={totalDownloads}
              suffix="+"
              label="Downloads"
              icon={<Download className="h-4 w-4 text-primary" />}
              delay={700}
            />
            <AnimatedStat
              value={atsCount}
              label="ATS Friendly"
              icon={<Shield className="h-4 w-4 text-emerald-500" />}
              delay={900}
            />
            <AnimatedStat
              value={4.8}
              suffix="★"
              label="User Rating"
              icon={<Star className="h-4 w-4 text-amber-500" />}
              delay={1100}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ResumeHeroSection;
