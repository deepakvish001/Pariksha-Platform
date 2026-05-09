import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const STORAGE_KEY = "lastVisitedRoute";

// Routes that should not be persisted (public/auth routes)
const EXCLUDED_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/onboarding",
];

/**
 * Hook to persist the current route to localStorage.
 * Call this in a component that's rendered on protected routes.
 */
export function useRoutePersistence() {
  const location = useLocation();

  useEffect(() => {
    const fullPath = location.pathname + location.search + location.hash;
    
    // Only persist if not an excluded route
    const isExcluded = EXCLUDED_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith("/u/") || location.pathname.startsWith("/shared/")
    );
    
    if (!isExcluded) {
      localStorage.setItem(STORAGE_KEY, fullPath);
    }
  }, [location]);
}

/**
 * Hook to restore the last visited route on app load.
 * Call this once at the app level after authentication is confirmed.
 */
export function useRestoreRoute() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only restore if we're on the root dashboard path
    if (location.pathname === "/learn") {
      const savedRoute = localStorage.getItem(STORAGE_KEY);
      
      if (savedRoute && savedRoute !== "/learn") {
        // Small delay to ensure auth state is settled
        const timer = setTimeout(() => {
          navigate(savedRoute, { replace: true });
        }, 50);
        
        return () => clearTimeout(timer);
      }
    }
  }, []); // Only run once on mount
}

/**
 * Get the last saved route (for use outside React components)
 */
export function getLastVisitedRoute(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Clear the saved route
 */
export function clearLastVisitedRoute(): void {
  localStorage.removeItem(STORAGE_KEY);
}
