import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle2, AlertCircle } from "lucide-react";

export default function JoinStudent() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? undefined;
  const inviteEmail = params.get("email") ?? undefined;
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    setState("working");
    supabase.functions
      .invoke("accept-student-enrollment", { body: { token } })
      .then(({ data, error }) => {
        if (error || (data as any)?.error) {
          setState("error");
          setMsg(((data as any)?.error as string) ?? error?.message ?? "Could not link your enrollment");
          return;
        }
        setState("done");
        setTimeout(() => nav("/my/college"), 1200);
      })
      .catch((e) => {
        setState("error");
        setMsg(String(e?.message ?? e));
      });
  }, [user, loading, token, nav]);

  if (!loading && !user) {
    const next = `/join/student${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="b2b-card p-8 max-w-md text-center">
          <GraduationCap className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--primary))]" />
          <h1 className="text-xl font-semibold mb-1">Your college enrolled you</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Sign in {inviteEmail ? <>with <strong>{inviteEmail}</strong></> : null} to access your college dashboard.
          </p>
          <div className="flex gap-2 justify-center">
            <Link to={`/login?redirect=${encodeURIComponent(next)}`}><Button>Sign in</Button></Link>
            <Link to={`/signup?redirect=${encodeURIComponent(next)}`}><Button variant="outline">Sign up</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="b2b-card p-8 max-w-md text-center">
        {state === "done" ? (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-500" />
            <h1 className="text-xl font-semibold mb-1">You're in!</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Redirecting to your dashboard…</p>
          </>
        ) : state === "error" ? (
          <>
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-rose-500" />
            <h1 className="text-xl font-semibold mb-1">Couldn't link enrollment</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{msg}</p>
            <Button variant="outline" onClick={() => nav("/learn")}>Go to Learn</Button>
          </>
        ) : (
          <>
            <GraduationCap className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--primary))] animate-pulse" />
            <h1 className="text-xl font-semibold">Linking your enrollment…</h1>
          </>
        )}
      </div>
    </div>
  );
}
