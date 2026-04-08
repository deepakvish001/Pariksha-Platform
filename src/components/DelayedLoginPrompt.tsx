import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Sparkles, TrendingUp, Brain, SkipForward } from "lucide-react";

const DELAY_MS = 15000; // 15 seconds
const SESSION_KEY = "delayedLoginSkipped";

export const DelayedLoginPrompt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, [user]);

  if (user) return null;

  const handleSkip = () => {
    setOpen(false);
    sessionStorage.setItem(SESSION_KEY, "true");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Unlock the Full Experience
          </DialogTitle>
          <DialogDescription className="text-base pt-1">
            Sign in to save your progress, earn achievements, and access AI-powered tools.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-3">
          {[
            { icon: TrendingUp, label: "Track Progress" },
            { icon: Brain, label: "AI Tools" },
            { icon: Sparkles, label: "Achievements" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-primary/5 border border-primary/10"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            size="lg"
            onClick={() => {
              setOpen(false);
              navigate("/login");
            }}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setOpen(false);
              navigate("/signup");
            }}
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Free Account
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={handleSkip}
            className="w-full gap-2 text-muted-foreground"
          >
            <SkipForward className="h-4 w-4" />
            Skip for Now
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-1">
          You can browse freely — sign in anytime to save your data.
        </p>
      </DialogContent>
    </Dialog>
  );
};
