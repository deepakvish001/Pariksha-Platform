import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Eye,
  Users,
  Wifi,
  AlertTriangle,
  Briefcase,
} from "lucide-react";

/**
 * Public, lightweight integrity policy page.
 *
 * Linked from the IntegrityExplanation card so candidates can read a plain
 * explanation of how recruiters interpret the score before a manual review.
 */
export default function IntegrityPolicy() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to assessments
        </Link>

        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            <ShieldCheck className="h-3 w-3" />
            Integrity policy
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            How your integrity score is used
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            A short, plain-English summary of what the integrity score measures,
            how recruiters interpret it, and what it does <em>not</em> do.
          </p>
        </header>

        <section className="space-y-4">
          <article className="rounded-md border border-border bg-card/60 p-4">
            <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              What we measure
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every attempt starts at 100%. We deduct points when the proctoring
              system records flagged activity such as tab switching, pasting
              external content, webcam issues, or device changes. Each event has
              a fixed weight defined by the recruiter before the test begins.
            </p>
          </article>

          <article className="rounded-md border border-border bg-card/60 p-4">
            <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              How recruiters use it
            </h2>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                <span>
                  <strong className="text-foreground">90%+ (Excellent)</strong>{" "}
                  — Treated as a clean attempt. Usually no manual review.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                <span>
                  <strong className="text-foreground">70–89% (Good)</strong> —
                  Minor signals captured. Recruiters may glance at the timeline
                  but rarely act on it.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldX className="h-3.5 w-3.5 mt-0.5 text-rose-500 shrink-0" />
                <span>
                  <strong className="text-foreground">
                    Below 70% (Needs review)
                  </strong>{" "}
                  — The attempt is flagged for a human reviewer who looks at the
                  event timeline, webcam snapshots, and your answers before
                  making any decision.
                </span>
              </li>
            </ul>
          </article>

          <article className="rounded-md border border-border bg-card/60 p-4">
            <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              What it is <em>not</em>
            </h2>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed list-disc pl-5">
              <li>
                It is <strong>not</strong> a cheating verdict. A low score on its
                own never disqualifies a candidate.
              </li>
              <li>
                It is <strong>not</strong> used to compare candidates — it is
                only used to decide whether your attempt deserves a closer look.
              </li>
              <li>
                It is <strong>not</strong> shared publicly. Only the recruiting
                team that owns the assessment can see your score and events.
              </li>
            </ul>
          </article>

          <article className="rounded-md border border-border bg-card/60 p-4">
            <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Your rights
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can request a copy of your integrity events and webcam
              snapshots, ask for a manual re-review, or request deletion of your
              attempt data subject to the recruiter's retention policy. Contact
              the recruiter directly, or email{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="mailto:support@parikshaa.org"
              >
                support@parikshaa.org
              </a>
              .
            </p>
          </article>

          <article className="rounded-md border border-border bg-card/60 p-4">
            <h2 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              Connection and accessibility
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Brief network drops, accessibility tools (screen readers, zoom),
              and short, explainable interruptions are reviewed in context. If
              you had a legitimate reason for a flag, mention it in your
              candidate notes — reviewers see them alongside the timeline.
            </p>
          </article>
        </section>

        <p className="text-[11px] text-muted-foreground italic mt-8">
          Integrity is a signal, not a verdict — recruiters review flagged
          attempts manually before making any hiring decision.
        </p>
      </div>
    </main>
  );
}
