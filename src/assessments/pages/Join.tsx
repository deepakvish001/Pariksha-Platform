import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { claimInvite } from "@/b2b/hooks/useInvites";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function StudentJoin() {
  const { token } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      sessionStorage.setItem("post_login_redirect", `/assessments/join/${token}`);
      navigate("/login", { replace: true });
      return;
    }
    if (!token) return;
    setBusy(true);
    claimInvite(token)
      .then((attempt: any) => {
        toast.success("Joined assessment");
        navigate(`/assessments/${attempt.id}/preflight`, { replace: true });
      })
      .catch((err) => {
        const code = String(err?.message ?? "");
        const map: Record<string, string> = {
          invalid_token: "This invite link is invalid.",
          invite_expired: "This invite has expired.",
          email_mismatch: "This invite was sent to a different email. Sign in with the invited email.",
          auth_required: "Please sign in to join.",
        };
        setError(map[code] ?? code ?? "Could not join the assessment.");
      })
      .finally(() => setBusy(false));
  }, [user, loading, token, navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-[hsl(var(--background))] p-6">
      <div className="max-w-md w-full text-center space-y-3">
        {busy || loading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Joining assessment…</p>
          </>
        ) : error ? (
          <>
            <h1 className="text-xl font-semibold">Can't join</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/assessments")}>Go to my assessments</Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
