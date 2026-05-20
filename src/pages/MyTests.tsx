import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Inbox, History, Clock, ArrowRight, PlayCircle, FileCheck2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useMyInvites, useMyAttempts, claimInvite } from "@/b2b/hooks/useInvites";

export default function MyTests() {
  const navigate = useNavigate();
  const { data: invites, isLoading: lInv } = useMyInvites();
  const { data: attempts, isLoading: lAt } = useMyAttempts();

  const submittedAttemptIds = new Set(
    (attempts ?? []).filter((a: any) => a.status === "submitted").map((a: any) => a.assessment_id),
  );

  const pending = (invites ?? []).filter(
    (i: any) =>
      (i.status === "pending" || i.status === "claimed") &&
      !submittedAttemptIds.has(i.assessment_id),
  );

  const past = (attempts ?? []).filter((a: any) =>
    ["submitted", "expired", "abandoned"].includes(a.status),
  );

  const handleStart = async (token: string) => {
    try {
      const a: any = await claimInvite(token);
      navigate(`/assessments/${a.id}/lobby`);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not join");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <header>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Tests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All tests recruiters have invited you to, plus your past attempts.
            </p>
          </header>

          {/* Pending invitations */}
          <section className="rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 backdrop-blur p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-[hsl(var(--primary))]/15 p-1.5">
                  <Inbox className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Pending invitations</h2>
                  <p className="text-xs text-muted-foreground">
                    Tests waiting for you to start.
                  </p>
                </div>
              </div>
              {pending.length > 0 && (
                <span className="rounded-full border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/10 px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]">
                  {pending.length}
                </span>
              )}
            </div>

            {lInv ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
            ) : pending.length === 0 ? (
              <div className="py-8 text-center">
                <Inbox className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  You have no pending test invitations.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  When a recruiter invites you to a test, it will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[hsl(var(--border))]/40 -mx-5">
                {pending.map((i: any) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {i.assessment?.title ?? "Assessment"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {i.assessment?.duration_min ?? "—"} min
                        {i.expires_at && (
                          <span>· expires {new Date(i.expires_at).toLocaleDateString()}</span>
                        )}
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
            )}
          </section>

          {/* Past tests */}
          <section className="rounded-xl border border-[hsl(var(--border))]/60 bg-[hsl(var(--card))]/40 backdrop-blur p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-md bg-white/5 p-1.5">
                <History className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Past tests</h2>
                <p className="text-xs text-muted-foreground">Tests you've already taken.</p>
              </div>
            </div>

            {lAt ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading…</div>
            ) : past.length === 0 ? (
              <div className="py-8 text-center">
                <FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No past tests yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[hsl(var(--border))]/40 -mx-5">
                {past.map((a: any) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {a.assessment?.title ?? "Assessment"}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                        {a.started_at ? new Date(a.started_at).toLocaleString() : "—"} ·{" "}
                        {a.status?.replace(/_/g, " ")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
