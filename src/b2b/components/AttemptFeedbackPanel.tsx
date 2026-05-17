import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  attemptId: string;
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? "text-amber-500 fill-current" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function AttemptFeedbackPanel({ attemptId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["b2b", "attempt-feedback", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_feedback")
        .select("rating, difficulty, clarity, tech_issues, comments, created_at")
        .eq("attempt_id", attemptId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return null;
  if (!data) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Candidate feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Candidate has not submitted feedback yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Candidate feedback
          <span className="text-[10px] font-normal text-muted-foreground ml-auto">
            {new Date(data.created_at).toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Overall rating
            </div>
            <Stars value={data.rating} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Question clarity
            </div>
            <Stars value={data.clarity} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Difficulty
            </div>
            <Badge variant="outline" className="capitalize">
              {data.difficulty === "ok" ? "Just right" : data.difficulty}
            </Badge>
          </div>
        </div>
        {data.tech_issues && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Technical issues
            </div>
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 whitespace-pre-wrap">
              {data.tech_issues}
            </p>
          </div>
        )}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Comments
          </div>
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 whitespace-pre-wrap">
            {data.comments}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
