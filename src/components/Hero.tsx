import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms for different layers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 250]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Parallax orbs - Dark mode */}
        <motion.div 
          style={{ y: y1, scale }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow dark:block hidden" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl animate-pulse-slow dark:block hidden" 
        />
        <motion.div 
          style={{ y: y3, scale }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl dark:block hidden" 
        />
        
        {/* Parallax orbs - Light mode */}
        <motion.div 
          style={{ y: y1, scale }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow dark:hidden block" 
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl animate-pulse-slow dark:hidden block" 
        />
        
        {/* Grid pattern overlay with parallax */}
        <motion.div 
          style={{ y: y3, opacity }}
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        >
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        </motion.div>
        
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 section-container text-center pt-28 pb-32">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Trusted by 10,000+ students worldwide</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="gradient-text">Turn Learning Chaos</span>
          <br />
          <span className="text-foreground">Into Career Progress</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Replace scattered notes, random spreadsheets, and UI frustrations. 
          This is focused learning time, structured for students — built for 
          clarity and career progress.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button className="btn-primary inline-flex items-center gap-2 text-lg group">
            Start Learning Clearly
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="px-6 py-3 rounded-full border border-border bg-secondary/50 text-foreground font-medium hover:bg-secondary transition-colors">
            Watch Demo
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { value: "10K+", label: "Active Users" },
            { value: "95%", label: "Success Rate" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
