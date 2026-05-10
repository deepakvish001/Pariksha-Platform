import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Cross-tab auth synchronization.
 * - Listens to Supabase auth state changes (which propagate across tabs via
 *   localStorage-backed session storage).
 * - Also listens to the raw `storage` event as a hard fallback in case the
 *   session key is cleared from another tab while this tab is backgrounded.
 * - On sign-out, forces navigation to /learn and away from gated routes.
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

function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/learn") return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
  );
}

export function CrossTabAuthSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const wasAuthedRef = useRef<boolean>(!!user);

  useEffect(() => {
    wasAuthedRef.current = !!user;
  }, [user]);

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
      if (!isPublicPath(location.pathname)) {
        navigate("/learn", { replace: true });
      }
    };

    // Supabase fires SIGNED_OUT in every tab when localStorage session is cleared.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || (!session && wasAuthedRef.current)) {
          wasAuthedRef.current = false;
          forceLogoutRedirect();
        } else if (session) {
          wasAuthedRef.current = true;
        }
      }
    );

    // Hard fallback: storage event when another tab nukes the auth key.
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      const isAuthKey =
        e.key.startsWith("sb-") && e.key.includes("-auth-token");
      if (isAuthKey && e.newValue === null && wasAuthedRef.current) {
        wasAuthedRef.current = false;
        forceLogoutRedirect();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, [navigate, location.pathname]);

  return null;
}

export default CrossTabAuthSync;
