import { useNavigate } from "react-router-dom";
import { Inbox, Clock, PlayCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useMyInvites, claimInvite } from "@/b2b/hooks/useInvites";
import { Button } from "@/components/ui/button";

/**
 * Shown on every authenticated dashboard route (mounted in DashboardLayout).
 * Surfaces any assessment invite the signed-in user has so they don't have
 * to hunt under /assessments to start an invited test.
 */
export function InvitedAssessmentsBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: invites } = useMyInvites();

  if (!user) return null;

  const pending = (invites ?? []).filter(
    (i: any) => i.status === "pending" || i.status === "claimed",
  );
  if (!pending.length) return null;

  const handleStart = async (token: string) => {
    try {
      const a: any = await claimInvite(token);
      navigate(`/assessments/${a.id}/lobby`);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not join");
    }
  };

  return (
    <div className="mx-4 sm:mx-6 mt-4">
      <div className="rounded-xl border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5 backdrop-blur p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[hsl(var(--primary))]/15 p-1.5">
              <Inbox className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {pending.length === 1
                  ? "You have a test invitation"
                  : `${pending.length} test invitations waiting`}
              </div>
              <div className="text-xs text-muted-foreground">
                Start now or view all under My Assessments
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/assessments")}
          >
            View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        <ul className="divide-y divide-[hsl(var(--border))]/40">
          {pending.slice(0, 3).map((i: any) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate text-sm">
                  {i.assessment?.title ?? "Assessment"}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {i.assessment?.duration_min ?? "—"} min
                </div>
              </div>
              <Button
                size="sm"
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 shrink-0"
                onClick={() => handleStart(i.token)}
              >
                {i.status === "claimed" ? (
                  <>Resume <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                ) : (
                  <><PlayCircle className="h-3.5 w-3.5 mr-1" /> Start</>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
