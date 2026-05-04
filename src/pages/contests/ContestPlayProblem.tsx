import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest } from "@/hooks/useContests";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useContestTabLock } from "@/hooks/useContestTabLock";
import { useContestStreamHealth } from "@/hooks/useContestStreamHealth";
import { ContestTopBar } from "@/components/contests/ContestTopBar";
import SecureProblemHUD from "@/components/contests/SecureProblemHUD";
import { MultiTabBlockedDialog } from "@/components/contests/MultiTabBlockedDialog";
import { StreamHealthBanner } from "@/components/contests/StreamHealthBanner";
import { ContestVariantBanner } from "@/components/contests/ContestVariantBanner";
import { useContestProblemVariant } from "@/hooks/useContestProblemVariant";
import CodingProblemDetail from "@/pages/library/CodingProblemDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

/**
 * Kiosk wrapper around CodingProblemDetail used when a participant is
 * actively solving a problem inside a secure contest session. Renders the
 * persistent contest top-bar (timer + Submit + exit) and the floating HUD.
 *
 * The actual editor/problem UI is the existing CodingProblemDetail page,
 * which already accepts `?contest=<slug>` and behaves accordingly.
 */
export default function ContestPlayProblem() {
  const { slug, problemSlug } = useParams<{ slug: string; problemSlug: string }>();
  const navigate = useNavigate();
  const { data: contest, isLoading } = useContest(slug);
  const session = useActiveContestSession(contest?.id);
  const [submitReady, setSubmitReady] = useState(false);
  // Single-tab enforcement: any second tab/window opened on this contest
  // is displaced and shown a blocking dialog.
  const tabLock = useContestTabLock(contest?.id, !!contest?.id && session.hasActive);
  // Read-only stream health snapshot for the kiosk banner. The actual
  // recorders live inside SecureProblemHUD's useContestSecureMode hook.
  const streamHealth = useContestStreamHealth(session.sessionId ?? null);
  // Assigns (or reuses) the participant's randomized variant for this problem.
  const variantQuery = useContestProblemVariant(contest?.id, problemSlug);

  // Make sure the URL CodingProblemDetail reads from has ?contest=<slug>
  useEffect(() => {
    if (!contest || !problemSlug) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("contest") !== contest.slug) {
      url.searchParams.set("contest", contest.slug);
      window.history.replaceState(null, "", url.toString());
    }
  }, [contest, problemSlug]);

  if (isLoading) return <Skeleton className="m-6 h-96" />;
  if (!contest || !problemSlug) return <Navigate to="/contests" replace />;

  const handleSubmit = () => {
    // CodingProblemDetail owns the actual submit button; we just nudge
    // the user toward it. A future iteration can lift submit state up.
    document.querySelector<HTMLButtonElement>("[data-contest-submit-btn]")?.click();
  };

  const handleTimeUp = () => {
    toast.warning("Contest ended — submitting and returning to leaderboard");
    handleSubmit();
    window.setTimeout(() => navigate(`/contests/${contest.slug}/leaderboard`), 1500);
  };

  return (
    <>
      <Helmet>
        <title>{contest.title} — {problemSlug}</title>
      </Helmet>
      <ContestTopBar
        contestTitle={contest.title}
        contestSlug={contest.slug}
        endsAt={contest.ends_at}
        problemSlug={problemSlug}
        onSubmit={handleSubmit}
        onTimeUp={handleTimeUp}
        submitDisabled={!submitReady || !session.hasActive}
      />
      <div className="border-b border-border/40 px-3 py-1">
        <SecureProblemHUD
          contestId={contest.id}
          contestSlug={contest.slug}
          onSubmissionReadyChange={setSubmitReady}
        />
      </div>
      <StreamHealthBanner
        webcamHealthy={streamHealth.webcamHealthy}
        screenHealthy={streamHealth.screenHealthy}
        graceUntil={streamHealth.graceUntil}
        onReshareScreen={() => navigate(`/contests/${contest.slug}`)}
        onReshareWebcam={() => navigate(`/contests/${contest.slug}`)}
      />
      <div className="flex-1">
        <CodingProblemDetail />
      </div>
      <MultiTabBlockedDialog open={tabLock.displaced} contestSlug={contest.slug} />
    </>
  );
}
