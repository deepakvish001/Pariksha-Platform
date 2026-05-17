import { useEffect, useState } from "react";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  difficulty: z.enum(["easy", "ok", "hard"]),
  clarity: z.number().int().min(1).max(5),
  tech_issues: z.string().trim().max(2000).optional(),
  comments: z.string().trim().min(5, "Please share a few words").max(2000),
});

interface Props {
  attemptId: string;
  assessmentId: string;
}

function StarRow({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1 mt-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n} of 5`}
            onClick={() => onChange(n)}
            className={cn(
              "p-1 rounded transition-transform hover:scale-110",
              n <= value ? "text-amber-500" : "text-muted-foreground/40",
            )}
          >
            <Star className={cn("h-6 w-6", n <= value && "fill-current")} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AssessmentFeedbackForm({ attemptId, assessmentId }: Props) {
  const [rating, setRating] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "ok" | "hard" | "">("");
  const [techIssues, setTechIssues] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if feedback already submitted (so we don't show form again on revisit)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("assessment_feedback")
        .select("id")
        .eq("attempt_id", attemptId)
        .maybeSingle();
      if (!cancelled) {
        if (data) setSubmitted(true);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  if (checking) return null;

  if (submitted) {
    return (
      <Card className="border-emerald-500/30">
        <CardContent className="p-5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <div className="font-medium text-sm">Thanks for your feedback!</div>
            <p className="text-xs text-muted-foreground">
              Your responses have been shared with the assessment team.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = FeedbackSchema.safeParse({
      rating,
      difficulty: difficulty || undefined,
      clarity,
      tech_issues: techIssues,
      comments,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast.error(first ?? "Please complete all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please sign in to submit feedback");
        return;
      }
      const { error } = await supabase.from("assessment_feedback").insert({
        attempt_id: attemptId,
        assessment_id: assessmentId,
        user_id: userData.user.id,
        rating: parsed.data.rating,
        difficulty: parsed.data.difficulty,
        clarity: parsed.data.clarity,
        tech_issues: parsed.data.tech_issues || null,
        comments: parsed.data.comments,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Feedback submitted — thank you!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold">Share your feedback</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help us improve future assessments. This is required to complete your submission.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <StarRow value={rating} onChange={setRating} label="Overall rating" />
            <StarRow value={clarity} onChange={setClarity} label="Question clarity" />
          </div>

          <div>
            <Label className="text-sm">Difficulty</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {(["easy", "ok", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-sm capitalize transition-colors",
                    difficulty === d
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:bg-muted",
                  )}
                >
                  {d === "ok" ? "Just right" : d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tech-issues" className="text-sm">
              Any technical issues? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="tech-issues"
              value={techIssues}
              onChange={(e) => setTechIssues(e.target.value)}
              placeholder="Lag, camera glitches, slow loading, etc."
              maxLength={2000}
              className="mt-1.5 min-h-[70px]"
            />
          </div>

          <div>
            <Label htmlFor="comments" className="text-sm">
              Detailed comments <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What worked well? What could be improved? Any suggestions?"
              maxLength={2000}
              required
              className="mt-1.5 min-h-[110px]"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{comments.length}/2000</p>
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Submitting…" : "Submit feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
