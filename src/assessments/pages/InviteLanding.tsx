/**
 * Candidate-facing landing rendered at /assessments/join/:token. Replaces the
 * old silent auto-claim. We fetch a read-only preview via the
 * preview_assessment_invite RPC and only consume the invite when the candidate
 * explicitly clicks "Start assessment".
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, AlertTriangle, Loader2, LogIn, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { claimInvite } from "@/b2b/hooks/useInvites";
import { Button } from "@/components/ui/button";
import { AssessmentLanding, type LandingSection } from "@/b2b/components/assessment/AssessmentLanding";

type PreviewResponse =
  | {
      status: "ok";
      invited_email: string;
      invite_status: string;
      org: { id: string; name: string; logo_url: string | null; brand_color: string | null };
      assessment: {
        id: string;
        slug: string | null;
        title: string;
        description: string | null;
        duration_min: number;
        max_attempts: number;
        proctoring_enabled: boolean;
        proctoring_config: unknown;
        show_results_to_candidate: boolean;
        starts_at: string | null;
        ends_at: string | null;
        status: string;
        brand_color: string | null;
        type?: string | null;
      };
      sections: { id: string; title: string; description: string | null; question_count: number }[];
    }
  | { status: "expired"; invited_email: string }
  | { status: "invalid" };

export default function InviteLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [starting, setStarting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite-preview", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("preview_assessment_invite", { _token: token! });
      if (error) throw error;
      return data as PreviewResponse;
    },
  });

  // Preserve original auto-redirect behaviour for users who arrive logged-out:
  // remember where to come back after sign-in.
  useEffect(() => {
    if (!loading && !user && token) {
      sessionStorage.setItem("post_login_redirect", `/assessments/join/${token}`);
    }
  }, [loading, user, token]);

  const sections: LandingSection[] = useMemo(
    () => (data?.status === "ok" ? data.sections : []),
    [data],
  );

  if (isLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[hsl(var(--background))]">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (error || !data || data.status === "invalid") {
    return (
      <ErrorScreen
        title="Invalid invite"
        message="This invite link is invalid or has been revoked. Please ask the recruiter for a fresh link."
        onHome={() => navigate("/assessments")}
      />
    );
  }

  if (data.status === "expired") {
    return (
      <ErrorScreen
        title="Invite expired"
        message={`The invite sent to ${data.invited_email} has expired. Please ask the recruiter to send a new one.`}
        onHome={() => navigate("/assessments")}
      />
    );
  }

  const onStart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setStarting(true);
    try {
      const attempt = (await claimInvite(token!)) as { id: string };
      navigate(`/assessments/${attempt.id}/lobby`, { replace: true });
    } catch (err) {
      const code = String((err as { message?: string })?.message ?? "");
      const map: Record<string, string> = {
        invalid_token: "This invite link is invalid.",
        invite_expired: "This invite has expired.",
        email_mismatch: `This invite was sent to ${data.invited_email}. Sign in with that email.`,
        auth_required: "Please sign in to start.",
      };
      toast.error(map[code] ?? code ?? "Couldn't start the assessment.");
      setStarting(false);
    }
  };

  return (
    <AssessmentLanding
      mode="candidate"
      chrome="full"
      org={data.org}
      assessment={data.assessment}
      sections={sections}
      topSlot={
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur px-3 py-1 text-xs text-[hsl(var(--muted-foreground))]">
            <Mail className="h-3.5 w-3.5" />
            Invited as <span className="text-[hsl(var(--foreground))] font-medium">{data.invited_email}</span>
          </div>
        </div>
      }
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => navigate("/assessments")}>
            Cancel
          </Button>
          {!user ? (
            <Button
              size="sm"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign in to start
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={starting}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              onClick={onStart}
            >
              {starting ? "Starting…" : "Start assessment"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </>
      }
    />
  );
}

function ErrorScreen({ title, message, onHome }: { title: string; message: string; onHome: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center bg-[hsl(var(--background))] p-6">
      <div className="max-w-md text-center space-y-3">
        <AlertTriangle className="h-8 w-8 mx-auto text-amber-400" />
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
        <Button onClick={onHome}>Go to my assessments</Button>
      </div>
    </div>
  );
}
