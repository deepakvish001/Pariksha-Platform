import { ArrowRight, Sparkles, Zap, Trophy, Target, Users, TrendingUp, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

// Animated counter component
const AnimatedCounter = ({ 
  value, 
  suffix = "", 
  prefix = "",
  label,
  icon: Icon,
}: { 
  value: number; 
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ElementType;
}) => {
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

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted, value]);

  return (
    <motion.div 
      ref={ref} 
      className="relative group"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="flex flex-col items-center p-4 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 backdrop-blur-sm">
        <div className="p-2 rounded-xl bg-primary/10 mb-2">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-foreground">
          {prefix}{count}{suffix}
        </div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</div>
      </div>
    </motion.div>
  );
};

// Feature pill component
const FeaturePill = ({ icon: Icon, text, delay }: { icon: React.ElementType; text: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-border/50 backdrop-blur-sm"
  >
    <Icon className="w-4 h-4 text-primary" />
    <span className="text-sm font-medium text-foreground">{text}</span>
  </motion.div>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 z-0">
        {/* Deep gradient base */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-r from-primary/30 to-orange-500/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-gradient-to-r from-orange-500/20 to-amber-500/30 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full"
            style={{
              left: `${10 + i * 8}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              x: [-10, 10, -10],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 6 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 section-container text-center pt-32 pb-20">
        {/* Trust Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-orange-500 border-2 border-background" />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">Join 10,000+ students crushing their goals</span>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-8"
        >
          <span className="block text-foreground">Turn Learning</span>
          <span className="block bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Into Results
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          The all-in-one platform for <span className="text-foreground font-semibold">DSA practice</span>, 
          <span className="text-foreground font-semibold"> interview prep</span>, and 
          <span className="text-foreground font-semibold"> placement success</span>. 
          Track progress, build streaks, and land your dream job.
        </motion.p>

        {/* Feature Pills */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-10"
        >
          <FeaturePill icon={Target} text="500+ DSA Problems" delay={0.35} />
          <FeaturePill icon={TrendingUp} text="Progress Analytics" delay={0.4} />
          <FeaturePill icon={Trophy} text="Achievements & XP" delay={0.45} />
          <FeaturePill icon={Zap} text="AI-Powered Learning" delay={0.5} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link 
            to="/signup" 
            className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
          >
            <span>Start Free Today</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-orange-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity -z-10" />
          </Link>
          <button className="inline-flex items-center gap-2 px-6 py-4 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300">
            <Play className="w-5 h-5 text-primary" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          <AnimatedCounter value={10000} suffix="+" label="Active Users" icon={Users} />
          <AnimatedCounter value={500} suffix="+" label="DSA Problems" icon={Target} />
          <AnimatedCounter value={95} suffix="%" label="Success Rate" icon={TrendingUp} />
          <AnimatedCounter value={50} suffix="+" label="Companies Hired" icon={Trophy} />
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
    </section>
  );
};

export default Hero;
