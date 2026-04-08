import { ArrowRight, Sparkles, Zap, Trophy, Target, TrendingUp, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

const taglines = ["Into Results", "Into Success", "Into Offers", "Into Growth"];

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
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      current = Math.round(progress * value);
      setCount(current);
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
      {/* Background — simplified */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        <div className="absolute top-10 left-10 w-[600px] h-[600px] bg-gradient-to-r from-primary/25 to-orange-500/15 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-r from-orange-500/15 to-amber-500/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Particles — reduced to 6 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDuration: `${3 + i * 0.5}s`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 section-container text-center pt-28 pb-16">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-8"
        >
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-500 border-2 border-background flex items-center justify-center"
              >
                <span className="text-[10px] font-bold text-primary-foreground">{String.fromCharCode(64 + i)}</span>
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">Join 10,000+ students crushing their goals</span>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black leading-[0.85] tracking-tight mb-8"
        >
          <span className="block text-foreground">Turn Learning</span>
          <TypingEffect />
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          The all-in-one platform for{" "}
          <span className="text-foreground font-semibold">DSA practice</span>,{" "}
          <span className="text-foreground font-semibold">interview prep</span>, and{" "}
          <span className="text-foreground font-semibold">placement success</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            to="/dashboard"
            className="group relative inline-flex items-center gap-2 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-bold text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105"
          >
            <span>Start Free Today</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="#features"
            className="inline-flex items-center gap-2 px-8 py-5 rounded-full border-2 border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold hover:bg-card hover:border-primary/50 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            Explore Features
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center items-center divide-x divide-border/50 max-w-4xl mx-auto bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50 py-6"
        >
          <AnimatedCounter value={10000} suffix="+" label="Active Users" />
          <AnimatedCounter value={500} suffix="+" label="DSA Problems" />
          <AnimatedCounter value={95} suffix="%" label="Success Rate" />
          <AnimatedCounter value={50} suffix="+" label="Companies Hired" />
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full bg-background/50 border border-border/50 text-xs text-muted-foreground">
                  app.byteskill.io/dashboard
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gradient-to-br from-background to-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">Problems Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">247</div>
                  <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3" /> +12 this week
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Current Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">23 Days</div>
                  <div className="text-xs text-orange-500 flex items-center gap-1 mt-1">🔥 Personal best!</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Trophy className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Level Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">Level 12</div>
                  <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "65%" }}
                      transition={{ duration: 1, delay: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">Today's Practice</span>
                  <span className="text-xs text-muted-foreground">Striver's SDE Sheet</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Two Sum", difficulty: "Easy", done: true },
                    { name: "Merge Intervals", difficulty: "Medium", done: true },
                    { name: "LRU Cache", difficulty: "Hard", done: false },
                  ].map((problem) => (
                    <div key={problem.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${problem.done ? 'bg-emerald-500/20' : 'bg-muted'}`}>
                        {problem.done && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <span className="text-sm text-foreground flex-1">{problem.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        problem.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-500' :
                        problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-destructive/20 text-destructive'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
    </section>
  );
};

export default Hero;
