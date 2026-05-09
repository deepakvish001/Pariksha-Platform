import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function Lobby() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    enabled: !!attemptId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select(
          "*, assessment:assessments(id,title,description,duration_min,proctoring_enabled,starts_at,ends_at,status)",
        )
        .eq("id", attemptId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return null;
  if (!data) return <div className="p-8">Attempt not found.</div>;
  const a: any = data.assessment;

  const now = Date.now();
  const startMs = a?.starts_at ? new Date(a.starts_at).getTime() : null;
  const endMs = a?.ends_at ? new Date(a.ends_at).getTime() : null;
  const notYetOpen = !!startMs && now < startMs;
  const closed = !!endMs && now > endMs;
  const notPublished = a?.status && a.status !== "published";
  const blocked = notYetOpen || closed || notPublished;
  const blockReason = notPublished
    ? "This assessment isn't open yet — the recruiter hasn't published it."
    : notYetOpen
    ? `This assessment opens on ${new Date(startMs!).toLocaleString()}.`
    : closed
    ? `This assessment closed on ${new Date(endMs!).toLocaleString()}.`
    : null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{a?.title ?? "Assessment"}</CardTitle>
          {a?.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> Duration: {a?.duration_min} minutes</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Proctoring: {a?.proctoring_enabled ? "On" : "Off"}</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Stable internet recommended</li>
            {(startMs || endMs) && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Window: {startMs ? new Date(startMs).toLocaleString() : "open now"} →{" "}
                {endMs ? new Date(endMs).toLocaleString() : "no close time"}
              </li>
            )}
          </ul>
          {blocked && blockReason && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {blockReason}
            </div>
          )}
          {!blocked && (
            <p className="text-xs text-muted-foreground">
              Once you start, the timer cannot be paused. Make sure you're ready.
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={blocked} onClick={() => navigate(`/assessments/${attemptId}/play`)}>
              Start now
            </Button>
            <Button variant="ghost" onClick={() => navigate("/assessments")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
