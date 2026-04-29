import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirects /dashboard/profile -> /u/:username for the logged-in user.
 * - Unauthenticated users go to /login.
 * - Users without a username are sent to onboarding to set one.
 */
const DashboardProfileRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchUsername = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_profiles_extended")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      setUsername((data?.username as string | undefined) ?? null);
      setLoading(false);
    };
    if (!authLoading) fetchUsername();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!username) return <Navigate to="/onboarding" replace />;
  return <Navigate to={`/u/${username}`} replace />;
};

export default DashboardProfileRedirect;
