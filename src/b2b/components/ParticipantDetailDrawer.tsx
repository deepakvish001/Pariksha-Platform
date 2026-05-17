import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Eye, ShieldAlert, Activity as ActivityIcon, ListChecks,
  Camera, Monitor, Smartphone, Copy, StopCircle, LifeBuoy, User, Radio,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AttemptProctoringPanel from "./AttemptProctoringPanel";
import { LiveStreamTile } from "./LiveStreamTile";
import AttemptSosHistoryPanel from "./AttemptSosHistoryPanel";
import type { LiveParticipant, EvidenceCounts } from "../hooks/useAssessmentLive";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EMPTY: EvidenceCounts = { webcam: 0, screen: 0, side_cam: 0, findings_high: 0, findings_med: 0 };

import { useEffect, useRef, useState } from "react";

/** Compact 3-tile live view for a single attempt. */
function LiveProctorThreeEye({ attemptId }: { attemptId: string }) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_side_camera_pairings")
        .select("pair_token,status")
        .eq("attempt_id", attemptId)
        .eq("status", "paired")
        .maybeSingle();
      if (!cancelled) setToken((data as { pair_token?: string } | null)?.pair_token ?? null);
    })();
    return () => { cancelled = true; };
  }, [attemptId]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <LiveStreamTile attemptId={attemptId} channelId={`proctor:${attemptId}:webcam`} kind="webcam" />
      <LiveStreamTile attemptId={attemptId} channelId={`proctor:${attemptId}:screen`} kind="screen" />
      <LiveStreamTile attemptId={attemptId} channelId={token ? `proctor:sidecam:${token}` : null} kind="sideeye" />
    </div>
  );
}

function useAttemptTimeline(attemptId?: string) {
  return useQuery({
    queryKey: ["b2b", "drawer-timeline", attemptId],
    enabled: !!attemptId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("attempt_events")
        .select("id, kind, payload, created_at")
        .eq("attempt_id", attemptId!)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });
}

function useAttemptAnswers(attemptId?: string) {
  return useQuery({
    queryKey: ["b2b", "drawer-answers", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      const { data } = await supabase
        .from("attempt_answers")
        .select("id, question_id, answer, auto_score, manual_score, question:questions(id,title,type,points)")
        .eq("attempt_id", attemptId!);
      return data ?? [];
    },
  });
}

function StatChip({ icon: Icon, label, value, tone = "muted" }: any) {
  const tones: Record<string, string> = {
    muted: "border-white/10 text-muted-foreground",
    warn: "border-amber-500/30 text-amber-300 bg-amber-500/5",
    danger: "border-rose-500/30 text-rose-300 bg-rose-500/5",
    ok: "border-emerald-500/30 text-emerald-300 bg-emerald-500/5",
  };
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] ${tones[tone]}`}>
      <Icon className="h-3 w-3" />
      <span className="uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export default function ParticipantDetailDrawer({
  open, onOpenChange, participant, assessmentId, evidence, canProctor, orgId, onForceSubmit, forceSubmitPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  participant: LiveParticipant | null;
  assessmentId: string;
  evidence?: EvidenceCounts;
  canProctor: boolean;
  orgId?: string | null;
  onForceSubmit: (p: LiveParticipant) => void;
  forceSubmitPending?: boolean;
}) {
  const ev = evidence ?? EMPTY;
  const attemptId = participant?.attempt_id ?? undefined;
  const { data: timeline } = useAttemptTimeline(attemptId);
  const { data: answers } = useAttemptAnswers(attemptId);

  // Controlled tab state so we can auto-switch as the candidate's status changes
  // (e.g. polling detects they just started or just submitted while the drawer is open).
  const status = participant?.status;
  const isLive = status === "in_progress";
  const [tab, setTab] = useState<string>(() =>
    canProctor && isLive ? "live" : "activity",
  );
  const prevStatusRef = useRef<string | undefined>(status);
  useEffect(() => {
    if (!open || !status) return;
    const prev = prevStatusRef.current;
    // Candidate just started → jump to live feed.
    if (canProctor && status === "in_progress" && prev !== "in_progress") {
      setTab("live");
    }
    // Candidate just stopped (submitted/auto/abandoned) → jump to Evidence
    // so the proctor sees the latest timeline markers and recordings.
    if (status !== "in_progress" && prev === "in_progress") {
      setTab("evidence");
    }
    prevStatusRef.current = status;
  }, [status, open, canProctor, tab]);

  // When a new participant is selected, reset tab to a sensible default.
  const inviteKey = participant?.invite_id ?? null;
  useEffect(() => {
    if (!inviteKey) return;
    setTab(canProctor && isLive ? "live" : "activity");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteKey]);

  if (!participant) return null;
  const canForce = !!attemptId && participant.status !== "submitted" && participant.status !== "auto_submitted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-0">
        <div className="p-6 border-b border-white/5 bg-gradient-to-br from-[hsl(var(--primary))]/8 to-transparent">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              {participant.name ?? participant.email}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {participant.email}
              {participant.external_id ? ` · ${participant.external_id}` : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatChip icon={ActivityIcon} label="Status" value={participant.status.replace(/_/g, " ")} />
            <StatChip icon={ListChecks} label="Score" value={participant.score ?? "—"} />
            <StatChip
              icon={ShieldAlert}
              label="Integrity"
              value={participant.integrity_score ?? "—"}
              tone={
                participant.integrity_score == null ? "muted"
                : participant.integrity_score >= 80 ? "ok"
                : participant.integrity_score >= 60 ? "warn" : "danger"
              }
            />
            {canProctor && (
              <>
                <StatChip icon={Camera} label="Webcam" value={ev.webcam} />
                <StatChip icon={Monitor} label="Screen" value={ev.screen} />
                <StatChip icon={Smartphone} label="Side-cam" value={ev.side_cam} />
                {ev.findings_high > 0 && <StatChip icon={ShieldAlert} label="High" value={ev.findings_high} tone="danger" />}
                {ev.findings_med > 0 && <StatChip icon={ShieldAlert} label="Med" value={ev.findings_med} tone="warn" />}
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {attemptId && (
              <Button size="sm" variant="outline" asChild>
                <Link to={`/b2b/assessments/${assessmentId}/attempts/${attemptId}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open full attempt
                </Link>
              </Button>
            )}
            {attemptId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/b2b/assessments/${assessmentId}/manage?attempt=${attemptId}`
                  );
                  toast.success("Link copied");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy link
              </Button>
            )}
            {canForce && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={forceSubmitPending}
                    className="text-rose-300 hover:text-rose-200">
                    <StopCircle className="h-3.5 w-3.5 mr-1" /> Force submit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Force submit attempt?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ends <span className="font-medium">{participant.name ?? participant.email}</span>'s attempt
                      immediately. Current answers will be scored.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-500/90 hover:bg-rose-500 text-white"
                      onClick={() => onForceSubmit(participant)}
                    >
                      Force submit
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="p-6">
          {!attemptId ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Candidate hasn't started the assessment yet.
            </div>
          ) : (
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="w-full"
            >
              <TabsList className="flex flex-wrap h-auto bg-white/[0.03] border border-white/5">
                {canProctor && (
                  <TabsTrigger value="live">
                    <Radio className="h-3.5 w-3.5 mr-1 text-rose-400" /> Live
                    {participant.status === "in_progress" && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </TabsTrigger>
                )}
                <TabsTrigger value="activity"><ActivityIcon className="h-3.5 w-3.5 mr-1" /> Activity</TabsTrigger>
                <TabsTrigger value="answers"><ListChecks className="h-3.5 w-3.5 mr-1" /> Answers</TabsTrigger>
                {canProctor && <TabsTrigger value="evidence"><Eye className="h-3.5 w-3.5 mr-1" /> Evidence</TabsTrigger>}
                {canProctor && <TabsTrigger value="sos"><LifeBuoy className="h-3.5 w-3.5 mr-1" /> SOS</TabsTrigger>}
              </TabsList>

              {canProctor && (
                <TabsContent value="live" className="mt-4 space-y-4">
                  {participant.status === "in_progress" ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                          Live · all three eyes
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Started {participant.started_at ? formatDistanceToNow(new Date(participant.started_at), { addSuffix: true }) : "—"}
                        </span>
                      </div>
                      <LiveProctorThreeEye attemptId={attemptId} />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">Webcam shots</div>
                          <div className="font-semibold tabular-nums text-sm">{ev.webcam}</div>
                        </div>
                        <div className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">Screen shots</div>
                          <div className="font-semibold tabular-nums text-sm">{ev.screen}</div>
                        </div>
                        <div className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">Side-cam</div>
                          <div className="font-semibold tabular-nums text-sm">{ev.side_cam}</div>
                        </div>
                        <div className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">Flags</div>
                          <div className="font-semibold tabular-nums text-sm">
                            <span className="text-rose-300">{ev.findings_high}</span>
                            <span className="text-muted-foreground"> · </span>
                            <span className="text-amber-300">{ev.findings_med}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Switch to Evidence tab for full captured history, recordings, and AI findings.
                      </p>
                    </>
                  ) : (
                    <div className="rounded-md border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
                      Live feed isn't available — this attempt is <span className="font-medium capitalize">{participant.status.replace(/_/g, " ")}</span>.
                      Open the Evidence tab to review the recorded session.
                    </div>
                  )}
                </TabsContent>
              )}

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {(timeline ?? []).length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6">No activity yet.</div>
                  )}
                  {(timeline ?? []).map((e: any) => (
                    <div key={e.id} className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{e.kind.replace(/_/g, " ")}</span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {e.payload && Object.keys(e.payload).length > 0 && (
                        <pre className="mt-1 text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                          {JSON.stringify(e.payload, null, 0)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="answers" className="mt-4">
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {(answers ?? []).length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">No answers submitted yet.</div>
                  ) : (
                    (answers ?? []).map((a: any) => {
                      const score = a.manual_score ?? a.auto_score;
                      const pts = a.question?.points ?? 0;
                      return (
                        <div key={a.id} className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{a.question?.title ?? "Question"}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {a.question?.type}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Score: <span className="text-foreground font-semibold tabular-nums">{score ?? "—"}/{pts}</span></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {canProctor && (
                <TabsContent value="evidence" className="mt-4 space-y-4">
                  <AttemptProctoringPanel attemptId={attemptId} orgId={orgId} />
                </TabsContent>
              )}

              {canProctor && (
                <TabsContent value="sos" className="mt-4">
                  <AttemptSosHistoryPanel attemptId={attemptId} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
