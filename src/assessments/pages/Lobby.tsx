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
        .select("*, assessment:assessments(id,title,description,duration_min,proctoring_enabled)")
        .eq("id", attemptId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8">Loading…</div>;
  if (!data) return <div className="p-8">Attempt not found.</div>;
  const a: any = data.assessment;

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
          </ul>
          <p className="text-xs text-muted-foreground">
            Once you start, the timer cannot be paused. Make sure you're ready.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate(`/assessments/${attemptId}/play`)}>
              Start now
            </Button>
            <Button variant="ghost" onClick={() => navigate("/assessments")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
