import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, authReady } = useAuth();
  const { isAdmin, isLoading } = useUserRole();

  if (!authReady || loading || (user && isLoading)) {
    return null;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/learn" replace />;
  return <>{children}</>;
};
