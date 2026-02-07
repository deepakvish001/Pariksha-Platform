import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Trophy, Code2, Target, Star, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CPHeroSectionProps {
  totalProblems: number;
  solvedCount: number;
  tracksCount: number;
  revisionCount: number;
}

// Animated counter component
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span className="tabular-nums">{displayValue.toLocaleString()}</span>;
}

// Floating stat pill component
function StatPill({ 
  icon: Icon, 
  label, 
  value, 
  colorClass,
  delay = 0 
}: { 
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-background/80 backdrop-blur-sm border border-border/50",
        "shadow-lg hover:shadow-xl transition-shadow"
      )}
    >
      <div className={cn("p-1.5 rounded-full", colorClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-tight">{label}</span>
        <span className="text-sm font-bold leading-tight">
          <AnimatedCounter value={value} />
        </span>
      </div>
    </motion.div>
  );
}

const CPHeroSection = ({ 
  totalProblems, 
  solvedCount, 
  tracksCount, 
  revisionCount 
}: CPHeroSectionProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-muted/30 border border-border/50">
      {/* Gradient border accent at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-orange-500" />
      
      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 30, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Title and icon */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Large gradient icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-amber-500 rounded-2xl blur-xl opacity-40" />
              <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary to-amber-500 shadow-lg">
                <Code2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </motion.div>
            
            {/* Title */}
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold"
              >
                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                  Competitive
                </span>{" "}
                <span className="bg-gradient-to-r from-primary via-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Programming
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm sm:text-base mt-1"
              >
                Master algorithms through curated problem sets
              </motion.p>
            </div>
          </div>
          
          {/* Right side - Floating stat pills */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <StatPill
              icon={Target}
              label="Total Problems"
              value={totalProblems}
              colorClass="bg-primary/20 text-primary"
              delay={0.4}
            />
            <StatPill
              icon={Trophy}
              label="Solved"
              value={solvedCount}
              colorClass="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              delay={0.5}
            />
            <StatPill
              icon={Layers}
              label="Tracks"
              value={tracksCount}
              colorClass="bg-blue-500/20 text-blue-600 dark:text-blue-400"
              delay={0.6}
            />
            <StatPill
              icon={Star}
              label="Revision"
              value={revisionCount}
              colorClass="bg-amber-500/20 text-amber-600 dark:text-amber-400"
              delay={0.7}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPHeroSection;
