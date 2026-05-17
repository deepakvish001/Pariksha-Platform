import { ArrowRight, Sparkles, Briefcase, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import HeroLeadCapture from "./HeroLeadCapture";

const taglines = ["Into Offers", "Into Hires", "Into Results", "Into Careers"];

const TypingEffect = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentTagline = taglines[currentIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentTagline.length) {
          setDisplayText(currentTagline.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % taglines.length);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-primary"
      >
        |
      </motion.span>
    </span>
  );
};

const AnimatedCounter = ({ value, suffix = "", label }: { value: number; suffix?: string; label: string }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    const duration = 1500;
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.round(progress * value));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hasStarted, value]);

  return (
    <div ref={ref} className="text-center px-4 sm:px-6">
      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">{count}{suffix}</div>
      <div className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">{label}</div>
    </div>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        <div className="absolute top-10 left-10 w-[600px] h-[600px] bg-gradient-to-r from-primary/25 to-orange-500/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/15 to-amber-500/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 section-container text-center pt-28 pb-20">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-foreground">Trusted by 200+ colleges & companies</span>
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>

        {/* Headline — rendered without entrance animation so it's the immediate LCP element */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight mb-8">
          <span className="block text-foreground">Turn Assessments</span>
          <TypingEffect />
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
        >
          The all-in-one assessment platform for{" "}
          <span className="text-foreground font-semibold">colleges</span>,{" "}
          <span className="text-foreground font-semibold">companies</span>, and{" "}
          <span className="text-foreground font-semibold">students</span> — proctored tests, coding contests, and a free learning hub.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5"
        >
          <Link
            to="/learn"
            className="group relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            <span>Start Free — No Card Required</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/b2b"
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300"
          >
            <Briefcase className="w-5 h-5 text-primary" />
            Book a Demo
          </Link>
        </motion.div>

        {/* Inline lead capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <HeroLeadCapture />
        </motion.div>

        {/* Reassurance microcopy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted-foreground mb-14"
        >
          {["Free forever for students", "Setup in under 60s", "Cancel anytime"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {t}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap justify-center items-center divide-x divide-border/50 max-w-4xl mx-auto bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 py-6"
        >
          <AnimatedCounter value={200} suffix="+" label="Colleges & Companies" />
          <AnimatedCounter value={50000} suffix="+" label="Assessments Taken" />
          <AnimatedCounter value={99} suffix="%" label="Integrity Score" />
          <AnimatedCounter value={10000} suffix="+" label="Active Learners" />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />
    </section>
  );
};

export default Hero;
