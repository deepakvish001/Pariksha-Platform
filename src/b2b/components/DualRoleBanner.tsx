import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "b2b.dualRoleBanner.dismissed";

/**
 * Shown inside OrgShell when the signed-in user is ALSO enrolled as a
 * student in some college. Explains why post-login routed them to the
 * org dashboard (admin/member rules win over the student rule — see
 * src/lib/postLoginRedirect.ts) and offers a quick link to /my/college.
 */
export function DualRoleBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("org_students")
        .select("id")
        .eq("user_id", uid)
        .in("status", ["invited", "active"])
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-[hsl(var(--primary))]/25 bg-[hsl(var(--primary))]/8 px-3 py-2 text-sm">
      <GraduationCap className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground">You're also enrolled as a student.</span>{" "}
        <span className="text-muted-foreground">
          You landed here because your admin/member role takes priority on login.
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="h-8">
        <Link to="/my/college">Open student view</Link>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setShow(false);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
