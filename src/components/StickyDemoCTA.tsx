import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ArrowRight, X } from "lucide-react";
import { trackLeadEvent } from "@/lib/leadTracking";

const DISMISS_KEY = "sticky-demo-dismissed";

const StickyDemoCTA = () => {
  const [pastHero, setPastHero] = useState(false);
  const [demoVisible, setDemoVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const lastYRef = useRef(0);
  const pulseTimerRef = useRef<number | null>(null);

  // Initial dismiss check + scroll listener for "past hero" + scroll-velocity highlight
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* sessionStorage may be blocked */
    }

    lastYRef.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      setPastHero(y > window.innerHeight * 0.6);

      const delta = Math.abs(y - lastYRef.current);
      if (delta > 80) {
        setHighlight(true);
        if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = window.setTimeout(() => setHighlight(false), 1100);
      }
      lastYRef.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  // Hide once the demo form is in view (more reliable than scroll math)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let observer: IntersectionObserver | null = null;
    let attemptTimer: number | null = null;

    const attach = () => {
      const el = document.getElementById("demo");
      if (!el) {
        attemptTimer = window.setTimeout(attach, 600);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setDemoVisible(entry.isIntersecting && entry.intersectionRatio > 0.15);
          }
        },
        { threshold: [0, 0.15, 0.5] },
      );
      observer.observe(el);
    };
    attach();

    return () => {
      if (observer) observer.disconnect();
      if (attemptTimer) window.clearTimeout(attemptTimer);
    };
  }, []);

  const onClick = () => {
    void trackLeadEvent("sticky_cta_click", { highlight });
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
    void trackLeadEvent("sticky_cta_dismiss", {});
  };

  const visible = pastHero && !demoVisible && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-2xl"
          role="region"
          aria-label="Book a tailored demo"
        >
          <motion.div
            animate={
              highlight
                ? {
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      "0 10px 30px -10px hsl(var(--primary) / 0.25)",
                      "0 24px 70px -10px hsl(var(--primary) / 0.6)",
                      "0 10px 30px -10px hsl(var(--primary) / 0.25)",
                    ],
                  }
                : { scale: 1 }
            }
            transition={{ duration: 0.7 }}
            className={`relative flex items-center gap-3 rounded-2xl border backdrop-blur-xl px-3 sm:px-4 py-2.5 shadow-2xl transition-colors ${
              highlight
                ? "border-primary/60 bg-gradient-to-r from-primary/15 via-card/90 to-orange-500/15"
                : "border-border/60 bg-card/85"
            }`}
          >
            <div className="hidden sm:flex h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-orange-500 items-center justify-center shrink-0 shadow-lg shadow-primary/30">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">Book a tailored demo</p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">
                20 mins · wired to your real use case · no slide deck
              </p>
            </div>
            <button
              type="button"
              onClick={onClick}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-xs sm:text-sm font-bold shadow-md shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.03] shrink-0"
            >
              Book now <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="h-7 w-7 rounded-full grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyDemoCTA;
