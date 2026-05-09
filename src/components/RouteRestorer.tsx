import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "lastVisitedRoute";

// Routes that trigger restoration
const RESTORE_TRIGGER_ROUTES = ["/learn"];

// Routes to never restore to
const NEVER_RESTORE_TO = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/onboarding",
];

/**
 * Component that restores the user to their last visited page after login/refresh
 */
export function RouteRestorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    // Only attempt restoration once, when auth is loaded
    if (loading || hasRestored) return;

    // Only restore if user is authenticated and we're on a trigger route
    if (!user) return;

    const shouldRestore = RESTORE_TRIGGER_ROUTES.some(
      route => location.pathname === route
    );

    if (shouldRestore) {
      const savedRoute = localStorage.getItem(STORAGE_KEY);
      
      // Check if saved route is valid and different from current
      if (
        savedRoute &&
        savedRoute !== location.pathname &&
        !NEVER_RESTORE_TO.includes(savedRoute) &&
        savedRoute.startsWith("/")
      ) {
        setHasRestored(true);
        navigate(savedRoute, { replace: true });
        return;
      }
    }

    setHasRestored(true);
  }, [user, loading, location.pathname, navigate, hasRestored]);

  return null;
}
