import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Eye, ShieldAlert, Activity as ActivityIcon, ListChecks,
  Camera, Monitor, Smartphone, Copy, StopCircle, LifeBuoy, User,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AttemptProctoringPanel from "./AttemptProctoringPanel";
import AttemptSosHistoryPanel from "./AttemptSosHistoryPanel";
import type { LiveParticipant, EvidenceCounts } from "../hooks/useAssessmentLive";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EMPTY: EvidenceCounts = { webcam: 0, screen: 0, side_cam: 0, findings_high: 0, findings_med: 0 };

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
  open, onOpenChange, participant, assessmentId, evidence, canProctor, onForceSubmit, forceSubmitPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  participant: LiveParticipant | null;
  assessmentId: string;
  evidence?: EvidenceCounts;
  canProctor: boolean;
  onForceSubmit: (p: LiveParticipant) => void;
  forceSubmitPending?: boolean;
}) {
  const ev = evidence ?? EMPTY;
  const attemptId = participant?.attempt_id ?? undefined;
  const { data: timeline } = useAttemptTimeline(attemptId);
  const { data: answers } = useAttemptAnswers(attemptId);

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
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-white/[0.03] border border-white/5">
                <TabsTrigger value="activity"><ActivityIcon className="h-3.5 w-3.5 mr-1" /> Activity</TabsTrigger>
                <TabsTrigger value="answers"><ListChecks className="h-3.5 w-3.5 mr-1" /> Answers</TabsTrigger>
                {canProctor && <TabsTrigger value="evidence"><Eye className="h-3.5 w-3.5 mr-1" /> Evidence</TabsTrigger>}
                {canProctor && <TabsTrigger value="sos"><LifeBuoy className="h-3.5 w-3.5 mr-1" /> SOS</TabsTrigger>}
              </TabsList>

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
                <TabsContent value="evidence" className="mt-4">
                  <AttemptProctoringPanel attemptId={attemptId} />
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
