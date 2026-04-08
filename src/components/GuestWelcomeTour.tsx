import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  BookOpen,
  Sparkles,
  Map,
  ArrowRight,
  X,
  PartyPopper,
} from "lucide-react";

const TOUR_KEY = "guestTourCompleted";

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tourSteps: TourStep[] = [
  {
    title: "Practice Sheets",
    description: "Browse curated DSA sheets like Striver's SDE Sheet, Neetcode 150, and more — all free to explore.",
    icon: FileSpreadsheet,
  },
  {
    title: "Learning Library",
    description: "Access interview questions, CS subjects, aptitude practice, and company-specific resources.",
    icon: BookOpen,
  },
  {
    title: "Roadmaps & Guides",
    description: "Follow structured learning paths for full-stack, DSA, system design, and more.",
    icon: Map,
  },
  {
    title: "AI-Powered Tools",
    description: "Generate courses, quizzes, and study plans with AI. Sign in to save your creations!",
    icon: Sparkles,
  },
];

export const GuestWelcomeTour = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (user) return;
    if (localStorage.getItem(TOUR_KEY) === "true") return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [user]);

  if (user || !visible) return null;

  const isLast = step === tourSteps.length - 1;
  const current = tourSteps[step];
  const Icon = current.icon;

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  const handleNext = () => {
    if (isLast) {
      handleDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]"
            onClick={handleDismiss}
          />

          {/* Tour card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[61] w-[90vw] max-w-md"
          >
            <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((step + 1) / tourSteps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Dismiss */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-5">
                {/* Step indicator */}
                <div className="flex items-center gap-1.5 mb-3">
                  {tourSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step
                          ? "w-6 bg-primary"
                          : i < step
                          ? "w-3 bg-primary/40"
                          : "w-3 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">
                      {current.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {current.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs text-muted-foreground h-8"
                  >
                    Skip Tour
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="gap-1.5 h-8 text-xs"
                  >
                    {isLast ? (
                      <>
                        <PartyPopper className="h-3.5 w-3.5" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
