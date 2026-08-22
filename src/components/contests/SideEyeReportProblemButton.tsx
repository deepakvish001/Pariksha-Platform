import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  contestId: string;
  sessionId: string | null;
}

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "camera", label: "Camera issue" },
  { value: "audio", label: "Audio issue" },
  { value: "phone_pairing", label: "Phone pairing" },
  { value: "network", label: "Network drop" },
  { value: "screen_share", label: "Screen sharing" },
  { value: "other", label: "Other" },
];

/**
 * Candidate-side "Report a problem" button — writes to sideeye_candidate_reports
 * so admins can triage technical issues without a back-channel email.
 */
export function SideEyeReportProblemButton({ contestId, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("sideeye_candidate_reports" as never).insert({
        contest_id: contestId,
        session_id: sessionId,
        user_id: user.id,
        category,
        message: message.trim() || null,
      } as never);
      if (error) throw error;
      toast.success("Reported — a proctor will follow up");
      setOpen(false);
      setMessage("");
      setCategory("other");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1">
        <LifeBuoy className="h-4 w-4" />
        Report a problem
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report a problem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="side-eye-report-category" className="text-xs text-muted-foreground">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="side-eye-report-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Describe the issue (optional, helps the proctor)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
