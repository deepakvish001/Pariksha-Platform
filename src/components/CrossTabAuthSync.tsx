import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Cross-tab auth synchronization.
 *
 * - Listens to Supabase auth state changes (which propagate across tabs via
 *   BroadcastChannel + the localStorage-backed session store).
 * - Adds a raw `storage` event fallback for tabs that were backgrounded when
 *   the BroadcastChannel message fired.
 * - On SIGNED_OUT in any tab → clears local artifacts and redirects gated
 *   routes to /learn.
 * - On SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED in another tab → forces
 *   this tab away from auth screens (login/signup/forgot/reset) into the
 *   intended destination so the UI matches the new session without a manual
 *   refresh.
 * - On `visibilitychange` (tab refocus) → calls getSession() so a tab that
 *   slept through token rotation re-hydrates with the latest tokens.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/learn",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/b2b",
];

const AUTH_SCREEN_PATHS = new Set([
  "/login",
  "/signup",
  "/forgot-password",
]);

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/learn") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
  );
}

function readPendingAuthPath(): string | null {
  try {
    const raw = localStorage.getItem("pendingAuthAction");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: string };
    return parsed?.path && parsed.path.startsWith("/") ? parsed.path : null;
  } catch {
    return null;
  }
}

export function CrossTabAuthSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const wasAuthedRef = useRef<boolean>(!!user);
  const pathRef = useRef<string>(location.pathname);

  useEffect(() => {
    wasAuthedRef.current = !!user;
  }, [user]);

  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const forceLogoutRedirect = () => {
      try {
        sessionStorage.removeItem("skippedOnboarding");
        sessionStorage.removeItem("delayedLoginSkipped");
        localStorage.removeItem("lastVisitedRoute");
        localStorage.removeItem("pendingAuthAction");
      } catch {
        /* ignore */
      }
      if (!isPublicPath(pathRef.current)) {
        navigate("/learn", { replace: true });
      }
    };

    const handleRemoteSignIn = () => {
      // If this tab is sitting on an auth screen while another tab signed in,
      // jump it to the intended dashboard so the UI matches the live session.
      const current = pathRef.current;
      if (AUTH_SCREEN_PATHS.has(current)) {
        const dest = readPendingAuthPath() ?? "/learn";
        try { localStorage.removeItem("pendingAuthAction"); } catch { /* noop */ }
        navigate(dest, { replace: true });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || (!session && wasAuthedRef.current)) {
          wasAuthedRef.current = false;
          forceLogoutRedirect();
          return;
        }
        if (session) {
          const wasAuthed = wasAuthedRef.current;
          wasAuthedRef.current = true;
          // Fresh sign-in propagated from another tab.
          if (!wasAuthed && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
            handleRemoteSignIn();
          }
          // Token refresh / user update from another tab — AuthContext already
          // re-syncs user/profile via its own listener; nothing to do here.
        }
      }
    );

    // Hard fallback: storage events fire in tabs that missed the BroadcastChannel.
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const isAuthKey = e.key.startsWith("sb-") && e.key.includes("-auth-token");
      if (!isAuthKey) return;

      if (e.newValue === null && wasAuthedRef.current) {
        wasAuthedRef.current = false;
        forceLogoutRedirect();
      } else if (e.newValue && !wasAuthedRef.current) {
        // Another tab just signed in — pull the fresh session into this tab.
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            wasAuthedRef.current = true;
            handleRemoteSignIn();
          }
        });
      }
    };
    window.addEventListener("storage", onStorage);

    // Re-hydrate session when the tab becomes visible again (covers laptops
    // that slept through token rotation in a sibling tab).
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      supabase.auth.getSession().then(({ data }) => {
        const hasSession = !!data.session;
        if (hasSession && !wasAuthedRef.current) {
          wasAuthedRef.current = true;
          handleRemoteSignIn();
        } else if (!hasSession && wasAuthedRef.current) {
          wasAuthedRef.current = false;
          forceLogoutRedirect();
        }
      });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [navigate]);

  return null;
}

export default CrossTabAuthSync;
