import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

export const REPORT_REASONS = [
  { value: "spam", label: "Spam or promotional" },
  { value: "misinformation", label: "Misinformation / fake experience" },
  { value: "plagiarism", label: "Copied from another source" },
  { value: "offensive", label: "Offensive or abusive language" },
  { value: "personal_info", label: "Exposes personal information" },
  { value: "other", label: "Other" },
] as const;

type Reason = typeof REPORT_REASONS[number]["value"];

const schema = z.object({
  reason: z.enum(["spam", "misinformation", "plagiarism", "offensive", "personal_info", "other"]),
  details: z.string().trim().max(1000, "Details must be under 1000 characters").optional(),
});

interface Props {
  experienceId: string;
}

export function ReportExperienceDialog({ experienceId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("misinformation");
  const [details, setDetails] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({ reason, details });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      if (!user) throw new Error("Login required");
      const { error } = await supabase.from("experience_reports").insert({
        experience_id: experienceId,
        reporter_id: user.id,
        reason,
        details: details.trim() || null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("You've already reported this experience.");
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Report submitted", description: "Thanks — our moderators will review this shortly." });
      setOpen(false);
      setDetails("");
      qc.invalidateQueries({ queryKey: ["admin-experience-reports"] });
    },
    onError: (e: any) => toast({ title: "Couldn't submit report", description: e.message, variant: "destructive" }),
  });

  const handleOpenChange = (next: boolean) => {
    if (next && !user) {
      navigate(`/auth?redirect=/experiences/${experienceId}`);
      return;
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
          <Flag className="size-4" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this experience</DialogTitle>
          <DialogDescription>
            Help us keep the marketplace trustworthy. Reports are reviewed by our moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Reason</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as Reason)}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                  <Label htmlFor={`reason-${r.value}`} className="font-normal cursor-pointer">{r.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything specific moderators should know..."
            />
            <p className="text-xs text-muted-foreground text-right">{details.length}/1000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submit.isPending}>Cancel</Button>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
