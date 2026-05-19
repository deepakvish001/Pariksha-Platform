import { Link, useNavigate } from "react-router-dom";
import { useMyInvites, useMyAttempts, claimInvite } from "@/b2b/hooks/useInvites";
import {
  useOpenOrgAssessments,
  useEnrollOpenOrg,
} from "@/assessments/hooks/useOpenOrgAssessments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Inbox,
  History,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Building2,
} from "lucide-react";
import { SectionCard } from "@/b2b/components/ui/SectionCard";
import { StatusPill, type StatusTone } from "@/b2b/components/ui/StatusPill";
import { EmptyState } from "@/b2b/components/ui/EmptyState";
import { getTemplate } from "@/b2b/lib/assessmentTemplates";

const ATTEMPT_TONE: Record<string, StatusTone> = {
  in_progress: "live",
  submitted: "success",
  expired: "danger",
  abandoned: "warning",
  pending: "neutral",
};

type TypeKey = "placement_mock" | "academic_test" | "open_contest" | "other";

const TYPE_GROUPS: { key: TypeKey; label: string; match: (t?: string) => boolean }[] = [
  { key: "placement_mock", label: "Placement mocks", match: (t) => t === "placement_mock" || t === "placement" || t === "mock" },
  { key: "academic_test", label: "Class & academic tests", match: (t) => t === "academic_test" || t === "class_test" || t === "academic" },
  { key: "open_contest", label: "Open contests", match: (t) => t === "open_contest" || t === "contest" },
  { key: "other", label: "Other assessments", match: () => true },
];

function groupByType<T extends { assessment?: { type?: string } | null }>(items: T[] | undefined) {
  const buckets = new Map<TypeKey, T[]>();
  TYPE_GROUPS.forEach((g) => buckets.set(g.key, []));
  (items ?? []).forEach((it) => {
    const t = it.assessment?.type;
    const group = TYPE_GROUPS.find((g) => g.match(t))!;
    buckets.get(group.key)!.push(it);
  });
  return buckets;
}

export default function MyAssessments() {
  const { data: invites } = useMyInvites();
  const { data: attempts } = useMyAttempts();
  const { data: openAssessments } = useOpenOrgAssessments();
  const enroll = useEnrollOpenOrg();
  const navigate = useNavigate();
  const invitesByType = groupByType(invites as any[]);

  const pendingCount =
    invites?.filter((i: any) => i.status === "pending" || i.status === "claimed").length ?? 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-0 h-72 w-[500px] rounded-full bg-[hsl(var(--primary))]/10 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">My assessments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Invitations and past attempts in one place.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="rounded-full border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
              {pendingCount} ready to start
            </div>
          )}
        </header>

        {/* Invitations */}
        <SectionCard
          icon={Inbox}
          title="Invitations"
          description="Tests recruiters have sent you"
        >
          {!invites?.length ? (
            <EmptyState
              icon={Inbox}
              title="No invitations yet"
              description="When a recruiter invites you to a test, it will appear here."
            />
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]/40 -mx-5">
              {invites.map((i: any) => {
                const canStart = i.status === "pending" || i.status === "claimed";
                const tpl = getTemplate(i.assessment?.type);
                const TIcon = tpl.icon;
                return (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {i.assessment?.title ?? "Assessment"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${tpl.badgeClass}`}>
                          <TIcon className="h-3 w-3" /> {tpl.label}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {i.assessment?.duration_min ?? "—"} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusPill tone={i.status === "pending" ? "scheduled" : i.status === "claimed" ? "live" : "neutral"}>
                        {i.status}
                      </StatusPill>
                      {canStart && (
                        <Button
                          size="sm"
                          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                          onClick={async () => {
                            try {
                              const a: any = await claimInvite(i.token);
                              navigate(`/assessments/${a.id}/lobby`);
                            } catch (err: any) {
                              toast.error(err?.message ?? "Could not join");
                            }
                          }}
                        >
                          {i.status === "claimed" ? (
                            <>
                              Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Open enrollment from your organizations */}
        {openAssessments && openAssessments.length > 0 && (
          <SectionCard
            icon={Sparkles}
            title="Open in your organization"
            description="Self-enroll into these assessments"
          >
            <ul className="divide-y divide-[hsl(var(--border))]/40 -mx-5">
              {openAssessments.map((a) => {
                const tpl = getTemplate(a.type as any);
                const TIcon = tpl.icon;
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">{a.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${tpl.badgeClass}`}>
                          <TIcon className="h-3 w-3" /> {tpl.label}
                        </span>
                        {a.organization?.name && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {a.organization.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {a.duration_min} min
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={enroll.isPending}
                      className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 shrink-0"
                      onClick={async () => {
                        try {
                          const { token } = await enroll.mutateAsync(a.id);
                          if (a.already_enrolled) {
                            toast.success("Joining…");
                          } else {
                            toast.success("Enrolled");
                          }
                          const claimed: any = await claimInvite(token);
                          navigate(`/assessments/${claimed.id}/lobby`);
                        } catch (err: any) {
                          toast.error(err?.message ?? "Could not join");
                        }
                      }}
                    >
                      {a.already_enrolled ? (
                        <>Resume <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                      ) : (
                        <><PlayCircle className="h-3.5 w-3.5 mr-1" /> Join</>
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        )}


        {/* Past attempts */}
        <SectionCard icon={History} title="Past attempts" description="Your test history">
          {!attempts?.length ? (
            <EmptyState
              icon={FileCheck2}
              title="No attempts yet"
              description="Completed tests will be listed here with date and status."
            />
          ) : (
            <ul className="divide-y divide-[hsl(var(--border))]/40 -mx-5">
              {attempts.map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">
                      {a.assessment?.title ?? "Assessment"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {a.started_at ? new Date(a.started_at).toLocaleString() : "—"}
                    </div>
                  </div>
                  <StatusPill tone={ATTEMPT_TONE[a.status] ?? "neutral"}>
                    {a.status === "in_progress" && (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {a.status?.replace(/_/g, " ")}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
