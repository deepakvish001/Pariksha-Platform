import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { X, Sparkles, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GuestSignupBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem("guestBannerDismissed") === "true"
  );

  if (user || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("guestBannerDismissed", "true");
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              Track Progress
            </span>
            <span className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5 text-primary" />
              AI Tools
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Achievements
            </span>
          </div>
          <p className="text-sm text-foreground sm:hidden">
            Sign up to unlock all features
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-xs h-7 px-3"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/signup")}
            className="text-xs h-7 px-3"
          >
            Sign Up Free
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
