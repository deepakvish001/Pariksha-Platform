import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

const SEEN_KEY = "guestTooltipsSeen";

interface GuestTooltipItem {
  id: string;
  label: string;
  tip: string;
}

const tooltipData: Record<string, GuestTooltipItem> = {
  "/dashboard": {
    id: "dashboard",
    label: "Dashboard",
    tip: "Your progress hub — sign in to track solved problems, streaks & achievements.",
  },
  "/dashboard/sheets": {
    id: "sheets",
    label: "Sheets",
    tip: "Browse curated DSA sheets. Sign in to mark problems as solved.",
  },
  "/library/dsa": {
    id: "dsa",
    label: "DSA Questions",
    tip: "450+ practice problems across all topics — free to explore.",
  },
  "/platform/ai/community": {
    id: "community",
    label: "Community",
    tip: "Discover AI-generated courses, quizzes & roadmaps from other learners.",
  },
  "/research/roadmap": {
    id: "roadmap",
    label: "Roadmap",
    tip: "Follow structured learning paths. Sign in to save your progress.",
  },
  "/platform/collections": {
    id: "collections",
    label: "Collections",
    tip: "Create custom folders to organize your favorite problems. Requires sign-in.",
  },
};

interface GuestSidebarTooltipProps {
  url: string;
  children: React.ReactNode;
}

export const GuestSidebarTooltip = ({ url, children }: GuestSidebarTooltipProps) => {
  const { user } = useAuth();
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(SEEN_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [showPulse, setShowPulse] = useState(false);

  const tip = tooltipData[url];

  useEffect(() => {
    if (!user && tip && !seen.has(tip.id)) {
      const timer = setTimeout(() => setShowPulse(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user, tip, seen]);

  if (user || !tip || seen.has(tip.id)) {
    return <>{children}</>;
  }

  const handleSeen = () => {
    const next = new Set(seen);
    next.add(tip.id);
    setSeen(next);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
    setShowPulse(false);
  };

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild onMouseEnter={handleSeen} onFocus={handleSeen}>
        <div className="relative">
          {children}
          <AnimatePresence>
            {showPulse && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-1 right-1 flex h-2 w-2"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[220px] p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{tip.tip}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
