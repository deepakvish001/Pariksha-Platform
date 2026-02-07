import { motion } from "framer-motion";
import { useEffect, useState, memo } from "react";
import { Trophy, Code2, Target, Star, Layers, Zap, TrendingUp, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface CPHeroSectionProps {
  totalProblems: number;
  solvedCount: number;
  tracksCount: number;
  revisionCount: number;
  streak?: number;
}

// Animated counter component with smooth easing
const AnimatedCounter = memo(function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = displayValue;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Ease out exponential for smoother feel
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(startValue + easeOut * (value - startValue)));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span className="tabular-nums font-bold">{displayValue.toLocaleString()}</span>;
});

// Enhanced floating stat pill with glassmorphism
const StatPill = memo(function StatPill({ 
  icon: Icon, 
  label, 
  value, 
  colorClass,
  glowColor,
  delay = 0 
}: { 
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
  glowColor?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.05, y: -2 }}
      className={cn(
        "relative group flex items-center gap-2.5 px-4 py-2.5 rounded-2xl",
        "bg-background/70 backdrop-blur-xl border border-border/40",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "cursor-default"
      )}
    >
      {/* Glow effect on hover */}
      {glowColor && (
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10",
          glowColor
        )} />
      )}
      
      <motion.div 
        className={cn("p-2 rounded-xl", colorClass)}
        whileHover={{ rotate: [0, -10, 10, -5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="h-4 w-4" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium leading-tight">{label}</span>
        <span className="text-base font-bold leading-tight">
          <AnimatedCounter value={value} />
        </span>
      </div>
    </motion.div>
  );
});

// Floating particle effect
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.5, 1],
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
  );
}

const CPHeroSection = memo(function CPHeroSection({ 
  totalProblems, 
  solvedCount, 
  tracksCount, 
  revisionCount,
  streak = 0
}: CPHeroSectionProps) {
  const progressPercent = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background via-background to-muted/20 border border-border/40">
      {/* Animated gradient border at top */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, hsl(var(--primary)), hsl(38 92% 50%), hsl(25 95% 53%), hsl(var(--primary)))",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Animated floating orbs with improved aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 blur-3xl"
          animate={{ 
            x: [0, 40, 0], 
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-tr from-amber-500/12 to-orange-500/8 blur-3xl"
          animate={{ 
            x: [0, -25, 0], 
            y: [0, 35, 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 left-1/3 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-500/8 to-cyan-500/8 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Floating particles */}
      <FloatingParticles />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Title and icon */}
          <div className="flex items-center gap-5">
            {/* Large gradient icon with enhanced effects */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50" />
              <motion.div 
                className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary via-amber-500 to-orange-500 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Code2 className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg" />
              </motion.div>
              
              {/* Progress ring around icon */}
              <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="calc(50% - 2px)"
                  fill="none"
                  stroke="hsl(var(--muted) / 0.3)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="calc(50% - 2px)"
                  fill="none"
                  stroke="url(#heroProgressGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${progressPercent * 2.51} 251`}
                  initial={{ strokeDasharray: "0 251" }}
                  animate={{ strokeDasharray: `${progressPercent * 2.51} 251` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="heroProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(142 76% 46%)" />
                    <stop offset="100%" stopColor="hsl(142 76% 36%)" />
                  </linearGradient>
                </defs>
              </svg>
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
                className="text-muted-foreground text-sm sm:text-base mt-1.5 flex items-center gap-2"
              >
                Master algorithms through curated problem sets
                {streak > 0 && (
                  <motion.span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-semibold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <Flame className="h-3 w-3" />
                    {streak} day streak
                  </motion.span>
                )}
              </motion.p>
            </div>
          </div>
          
          {/* Right side - Floating stat pills */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <StatPill
              icon={Target}
              label="Total"
              value={totalProblems}
              colorClass="bg-primary/15 text-primary"
              glowColor="bg-primary/20"
              delay={0.4}
            />
            <StatPill
              icon={Trophy}
              label="Solved"
              value={solvedCount}
              colorClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              glowColor="bg-emerald-500/20"
              delay={0.5}
            />
            <StatPill
              icon={Layers}
              label="Tracks"
              value={tracksCount}
              colorClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
              glowColor="bg-blue-500/20"
              delay={0.6}
            />
            <StatPill
              icon={Star}
              label="Revision"
              value={revisionCount}
              colorClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              glowColor="bg-amber-500/20"
              delay={0.7}
            />
          </div>
        </div>
        
        {/* Progress bar at bottom */}
        <motion.div 
          className="mt-6 pt-4 border-t border-border/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Overall Progress</span>
            <span className="font-semibold text-foreground">{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export default CPHeroSection;
