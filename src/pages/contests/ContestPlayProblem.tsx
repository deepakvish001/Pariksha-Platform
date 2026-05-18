import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useContest } from "@/hooks/useContests";
import { useActiveContestSession } from "@/hooks/useActiveContestSession";
import { useContestTabLock } from "@/hooks/useContestTabLock";
import { useContestStreamHealth } from "@/hooks/useContestStreamHealth";
import { useTerminationWatcher } from "@/hooks/useTerminationWatcher";
import TerminationLockout from "@/components/contests/TerminationLockout";
import { ContestTopBar } from "@/components/contests/ContestTopBar";
import SecureProblemHUD from "@/components/contests/SecureProblemHUD";
import { MultiTabBlockedDialog } from "@/components/contests/MultiTabBlockedDialog";
import { StreamHealthBanner } from "@/components/contests/StreamHealthBanner";
import { ContestVariantBanner } from "@/components/contests/ContestVariantBanner";
import { useContestProblemVariant } from "@/hooks/useContestProblemVariant";
import { useCodeProvenance } from "@/hooks/useCodeProvenance";
import { useAuth } from "@/contexts/AuthContext";
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
  const termination = useTerminationWatcher(session.sessionId ?? null);
  // Assigns (or reuses) the participant's randomized variant for this problem.
  const variantQuery = useContestProblemVariant(contest?.id, problemSlug);
  const { user } = useAuth();
  // Find the Monaco editor DOM root after CodingProblemDetail mounts so the
  // provenance ledger can attach keystroke / paste / cut listeners. We poll
  // briefly because the editor mounts asynchronously after Suspense resolves.
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!session.sessionId) return;
    let tries = 0;
    const t = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(".monaco-editor");
      if (el) { setEditorEl(el); window.clearInterval(t); }
      else if (++tries > 40) window.clearInterval(t); // give up after ~12s
    }, 300);
    return () => window.clearInterval(t);
  }, [session.sessionId, problemSlug]);

  useCodeProvenance({
    target: editorEl,
    sessionId: session.sessionId ?? null,
    contestId: contest?.id ?? null,
    userId: user?.id ?? null,
    problemId: problemSlug ?? null,
  });

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
      {variantQuery.data && (
        <ContestVariantBanner
          variantKey={variantQuery.data.variant_key}
          title={variantQuery.data.title}
          statementMd={variantQuery.data.statement_md}
          weight={variantQuery.data.weight as number | null}
          assignedAt={variantQuery.data.assigned_at}
          refreshing={variantQuery.isFetching}
          onRefresh={async () => {
            const previousKey = variantQuery.data?.variant_key;
            const result = await variantQuery.refetch();
            const nextKey = result.data?.variant_key;
            if (!nextKey) toast.error("Failed to refresh variant");
            else if (previousKey === nextKey)
              toast.info(`Variant unchanged: ${nextKey}`, {
                description: "Assignment is deterministic — same variant on retry.",
              });
            else toast.success(`Variant updated to ${nextKey}`);
          }}
        />
      )}
      <div className="flex-1">
        <CodingProblemDetail />
      </div>
      <MultiTabBlockedDialog open={tabLock.displaced} contestSlug={contest.slug} />
    </>
  );
}
