import { useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";
import { trackLeadEvent } from "@/lib/leadTracking";

interface RequireAuthOptions {
  /** Short description of what the user attempted, e.g. "save this resource". */
  action?: string;
  /** Override redirect path after login (defaults to current URL). */
  redirectTo?: string;
  /** Custom dialog message. */
  message?: string;
}

export const useRequireAuth = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<RequireAuthOptions>({});
  const pendingRef = useRef<(() => void) | null>(null);

  const requireAuth = useCallback(
    (callback: () => void, options: RequireAuthOptions = {}) => {
      if (user) {
        callback();
        return;
      }
      pendingRef.current = callback;
      setOpts(options);
      setIsOpen(true);

      const intendedPath =
        options.redirectTo ?? location.pathname + location.search + location.hash;
      void trackLeadEvent("guest_action_attempt", {
        attempted_action: options.action ?? null,
        intended_path: intendedPath,
      });
    },
    [user, location.pathname, location.search, location.hash],
  );

  const dialog = (
    <LoginPromptDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      attemptedAction={opts.action}
      redirectTo={opts.redirectTo}
      message={opts.message}
    />
  );

  return { requireAuth, user, LoginPromptDialog: dialog };
};
