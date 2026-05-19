import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { acceptOrgInvite } from "@/b2b/hooks/useOrgInvites";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "needs_login" }
  | { status: "accepting" }
  | { status: "success" }
  | { status: "error"; code: string; message: string };

const ERR_MESSAGES: Record<string, string> = {
  email_mismatch: "This invite was sent to a different email address. Sign in with that email to accept.",
  invite_not_found: "This invite link is invalid.",
  invite_revoked: "This invite has been revoked.",
  invite_expired: "This invite has expired. Ask an admin to resend.",
  invite_already_used: "This invite has already been used.",
};

export default function JoinOrg() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (loading || !token) return;
    if (!user) {
      setState({ status: "needs_login" });
      return;
    }
    setState({ status: "accepting" });
    acceptOrgInvite(token)
      .then(() => setState({ status: "success" }))
      .catch((e: any) => {
        const code = (e?.message ?? "").split(":").pop()?.trim() ?? "unknown";
        setState({ status: "error", code, message: ERR_MESSAGES[code] ?? (e?.message ?? "Could not accept invite.") });
      });
  }, [loading, user, token]);

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => navigate("/b2b/dashboard", { replace: true }), 1200);
      return () => clearTimeout(t);
    }
  }, [state.status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="b2b-card max-w-md w-full p-8 text-center">
        {state.status === "loading" || state.status === "accepting" ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Checking your invite…</p>
          </>
        ) : state.status === "needs_login" ? (
          <>
            <h1 className="text-xl font-semibold mb-2">Sign in to accept</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              This invite is tied to a specific email. Sign in (or create an account) with that email to join the team.
            </p>
            <Button asChild>
              <Link to={`/login?redirect=${encodeURIComponent(`/b2b/join/${token}`)}`}>Continue to sign in</Link>
            </Button>
          </>
        ) : state.status === "success" ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-semibold mt-2">You're in!</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Taking you to the workspace…</p>
          </>
        ) : (
          <>
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
            <h1 className="text-xl font-semibold mt-2">Can't accept this invite</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{state.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go home</Button>
          </>
        )}
      </div>
    </div>
  );
}
