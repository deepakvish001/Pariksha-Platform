import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ArrowRight, X } from "lucide-react";
import { trackLeadEvent } from "@/lib/leadTracking";

const StickyDemoCTA = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("sticky-demo-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    let pulseTimer: number | null = null;
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const past = y > window.innerHeight * 0.6;
      setVisible(past);

      // pulse highlight when user scrolls aggressively
      const delta = Math.abs(y - lastY);
      if (past && delta > 80) {
        setHighlight(true);
        if (pulseTimer) window.clearTimeout(pulseTimer);
        pulseTimer = window.setTimeout(() => setHighlight(false), 1100);
      }

      // hide once they reach the demo form / footer
      const demo = document.getElementById("demo");
      if (demo) {
        const rect = demo.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6) setVisible(false);
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, []);

  const onClick = () => {
    void trackLeadEvent("sticky_cta_click", { highlight });
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem("sticky-demo-dismissed", "1");
    } catch {
      /* noop */
    }
    void trackLeadEvent("sticky_cta_dismiss", {});
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-2xl"
        >
          <motion.div
            animate={
              highlight
                ? { scale: [1, 1.02, 1], boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.55)" }
                : { scale: 1 }
            }
            transition={{ duration: 0.6 }}
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
