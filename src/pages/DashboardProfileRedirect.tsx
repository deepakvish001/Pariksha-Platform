import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * /dashboard/profile -> /u/:username
 *
 * Redirects the signed-in user to their own public profile page.
 * Falls back to /login when unauthenticated and to /onboarding when no
 * username has been claimed yet.
 */
const DashboardProfileRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        if (!cancelled) setResolving(false);
        return;
      }
      const { data } = await supabase
        .from("user_profiles_extended")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setUsername((data?.username as string | null) ?? null);
      setResolving(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || resolving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!username) return <Navigate to="/onboarding" replace />;
  return <Navigate to={`/u/${username}`} replace />;
};

export default DashboardProfileRedirect;
