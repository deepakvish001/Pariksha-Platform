import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getPostLoginPath } from "@/lib/postLoginRedirect";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error("Auth callback error:", error);
        navigate("/login", { replace: true });
        return;
      }

      let dest: string | null = null;
      try {
        const raw = localStorage.getItem("pendingAuthAction");
        if (raw) {
          const parsed = JSON.parse(raw) as { path?: string };
          if (parsed?.path) dest = parsed.path;
        }
      } catch { /* ignore */ }
      try { localStorage.removeItem("pendingAuthAction"); } catch { /* ignore */ }
      if (!dest) {
        try {
          const stored = sessionStorage.getItem("post_login_redirect");
          if (stored) {
            dest = stored;
            sessionStorage.removeItem("post_login_redirect");
          }
        } catch { /* ignore */ }
      }
      if (!dest) dest = await getPostLoginPath(session.user.id);
      navigate(dest, { replace: true });
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
