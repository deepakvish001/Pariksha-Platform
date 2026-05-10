import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Sparkles, Lock } from "lucide-react";
import { trackLeadEvent } from "@/lib/leadTracking";

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  /** Short human description of what the user just tried to do (e.g. "save this resource"). */
  attemptedAction?: string;
  /** Path the user should land on after authenticating. Defaults to current location. */
  redirectTo?: string;
}

export const LoginPromptDialog = ({
  open,
  onOpenChange,
  message,
  attemptedAction,
  redirectTo,
}: LoginPromptDialogProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const intendedPath =
    redirectTo ?? location.pathname + location.search + location.hash;

  const go = (target: "/login" | "/signup") => {
    onOpenChange(false);
    try {
      localStorage.setItem(
        "pendingAuthAction",
        JSON.stringify({ path: intendedPath, action: attemptedAction ?? null, ts: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    void trackLeadEvent("guest_login_prompt_cta", {
      cta: target === "/login" ? "sign_in" : "sign_up",
      attempted_action: attemptedAction ?? null,
      intended_path: intendedPath,
    });
    navigate(target, { state: { from: { pathname: intendedPath } } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby="login-prompt-title"
        aria-describedby="login-prompt-description"
      >
        <DialogHeader>
          <DialogTitle id="login-prompt-title" className="text-xl flex items-center gap-2">
            <Lock aria-hidden="true" className="h-5 w-5 text-primary" />
            Sign in to continue
          </DialogTitle>
          <DialogDescription id="login-prompt-description" className="text-base pt-1">
            {message ??
              "Sign in to save your work, sync progress across devices, and unlock all features."}
          </DialogDescription>
        </DialogHeader>

        {attemptedAction && (
          <div
            role="status"
            aria-live="polite"
            aria-label={`You tried to ${attemptedAction}`}
            className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-muted-foreground text-xs">You tried to</p>
              <p className="font-medium text-foreground">{attemptedAction}</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll bring you right back here after sign in.
              </p>
            </div>
          </div>
        )}

        <div
          role="group"
          aria-label="Authentication options"
          className="flex flex-col gap-3 pt-2"
        >
          <Button
            size="lg"
            onClick={() => go("/login")}
            className="w-full gap-2"
            aria-label="Sign in to your existing account"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => go("/signup")}
            className="w-full gap-2"
            aria-label="Create a new account"
          >
            <UserPlus aria-hidden="true" className="h-4 w-4" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
