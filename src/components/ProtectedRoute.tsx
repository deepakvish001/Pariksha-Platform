import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  allowSkipOnboarding?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false,
  allowSkipOnboarding = false 
}: ProtectedRouteProps) => {
  const { user, loading, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires onboarding and user hasn't completed it
  // Redirect to onboarding unless coming from onboarding page (to allow skip)
  if (requireOnboarding && !onboardingCompleted && !allowSkipOnboarding) {
    // Check if user just skipped onboarding (session storage flag)
    const skippedOnboarding = sessionStorage.getItem("skippedOnboarding");
    if (!skippedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
