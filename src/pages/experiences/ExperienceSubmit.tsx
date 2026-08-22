import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSubmitExperience,
  useUpdateExperience,
  useExperience,
  type ExperienceRound,
} from "@/hooks/useExperiences";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Send, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ExperienceSubmit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;

  const submit = useSubmitExperience();
  const update = useUpdateExperience();
  const { data: existing, isLoading: loadingExisting } = useExperience(editId);

  const [form, setForm] = useState({
    company_name: "",
    role: "",
    year: new Date().getFullYear(),
    experience_type: "on_campus" as "on_campus" | "off_campus" | "internship" | "referral",
    difficulty: "medium",
    offer_status: "selected" as "selected" | "rejected" | "waitlisted" | "in_progress",
    ctc_lpa: "" as string,
    location: "",
    tips: "",
    overall_text: "",
  });
  const [rounds, setRounds] = useState<ExperienceRound[]>([
    { name: "Online Assessment", type: "", questions: "", duration: "" },
  ]);

  // Hydrate when editing
  useEffect(() => {
    if (!isEdit || !existing) return;
    setForm({
      company_name: existing.company_name,
      role: existing.role,
      year: existing.year,
      experience_type: existing.experience_type,
      difficulty: existing.difficulty,
      offer_status: existing.offer_status,
      ctc_lpa: existing.ctc_lpa?.toString() ?? "",
      location: existing.location ?? "",
      tips: existing.tips ?? "",
      overall_text: existing.overall_text,
    });
    if (existing.rounds?.length) setRounds(existing.rounds);
  }, [isEdit, existing]);

  if (!user) {
    return (
      <div className="container max-w-md py-12 text-center">
        <p className="mb-4">Please log in to share your experience.</p>
        <Button asChild><Link to={`/auth?redirect=${isEdit ? `/experiences/${editId}/edit` : "/experiences/submit"}`}>Sign in</Link></Button>
      </div>
    );
  }

  if (isEdit && loadingExisting) {
    return <div className="container max-w-3xl py-8"><Card className="h-96 animate-pulse bg-muted/30" /></div>;
  }

  if (isEdit && existing && existing.user_id !== user.id) {
    return (
      <div className="container max-w-md py-12 text-center">
        <p className="mb-4">You can only edit experiences you submitted.</p>
        <Button asChild variant="link"><Link to="/experiences/mine">Back to my submissions</Link></Button>
      </div>
    );
  }

  if (isEdit && existing && existing.status !== "rejected") {
    return (
      <div className="container max-w-md py-12 text-center">
        <p className="mb-4">Only rejected experiences can be edited and resubmitted.</p>
        <Button asChild variant="link"><Link to="/experiences/mine">Back to my submissions</Link></Button>
      </div>
    );
  }

  const updateRound = (i: number, field: keyof ExperienceRound, v: string) =>
    setRounds((r) => r.map((x, idx) => idx === i ? { ...x, [field]: v } : x));

  const handleSubmit = async () => {
    if (!form.company_name.trim() || !form.role.trim() || !form.overall_text.trim()) {
      toast({ title: "Please fill required fields", description: "Company, role, and your overall experience are required.", variant: "destructive" });
      return;
    }
    const payload = {
      company_name: form.company_name.trim(),
      role: form.role.trim(),
      year: form.year,
      experience_type: form.experience_type,
      difficulty: form.difficulty,
      offer_status: form.offer_status,
      ctc_lpa: form.ctc_lpa ? Number(form.ctc_lpa) : null,
      location: form.location.trim() || null,
      rounds: rounds.filter((r) => r.name.trim()) as any,
      tips: form.tips.trim() || null,
      overall_text: form.overall_text.trim(),
    };

    if (isEdit && editId) {
      await update.mutateAsync({ id: editId, patch: payload });
    } else {
      await submit.mutateAsync({ user_id: user.id, ...payload });
    }
    navigate("/experiences/mine");
  };

  const pending = submit.isPending || update.isPending;

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <Helmet><title>{isEdit ? "Edit & resubmit experience" : "Share your interview experience"}</title></Helmet>

      <Button variant="ghost" size="sm" asChild className="gap-2">
        <Link to={isEdit ? "/experiences/mine" : "/experiences"}><ArrowLeft className="size-4" /> Back</Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{isEdit ? "Edit & resubmit" : "Share your interview experience"}</h1>
        <p className="text-muted-foreground mt-1">
          {isEdit
            ? "Address the moderator feedback below and save to send your experience back for review."
            : "Help juniors prep with first-hand info. Submissions are reviewed before going live and earn XP on approval."}
        </p>
      </div>

      {isEdit && existing?.moderation_notes && (
        <Card className="p-4 border-red-500/40 bg-red-500/5 flex gap-3">
          <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-red-500">Why this was rejected</p>
            <p className="text-muted-foreground whitespace-pre-wrap mt-1">{existing.moderation_notes}</p>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Company & Role</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="exp-company">Company *</Label>
            <Input id="exp-company" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Google" />
          </div>
          <div>
            <Label htmlFor="exp-role">Role *</Label>
            <Input id="exp-role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. SDE-1" />
          </div>
          <div>
            <Label htmlFor="exp-year">Year</Label>
            <Input id="exp-year" type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="exp-location">Location</Label>
            <Input id="exp-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Bangalore" />
          </div>
          <div>
            <Label htmlFor="exp-ctc">CTC (LPA)</Label>
            <Input id="exp-ctc" type="number" step="0.1" value={form.ctc_lpa} onChange={(e) => setForm((f) => ({ ...f, ctc_lpa: e.target.value }))} placeholder="optional" />
          </div>
          <div>
            <Label htmlFor="exp-type">Type</Label>
            <Select value={form.experience_type} onValueChange={(v: any) => setForm((f) => ({ ...f, experience_type: v }))}>
              <SelectTrigger id="exp-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="on_campus">On-Campus</SelectItem>
                <SelectItem value="off_campus">Off-Campus</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="exp-difficulty">Difficulty</Label>
            <Select value={form.difficulty} onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}>
              <SelectTrigger id="exp-difficulty"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="exp-outcome">Outcome</Label>
            <Select value={form.offer_status} onValueChange={(v: any) => setForm((f) => ({ ...f, offer_status: v }))}>
              <SelectTrigger id="exp-outcome"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="waitlisted">Waitlisted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <Label htmlFor="exp-overall">Overall experience * (markdown supported)</Label>
        <Textarea
          id="exp-overall"
          rows={6}
          value={form.overall_text}
          onChange={(e) => setForm((f) => ({ ...f, overall_text: e.target.value }))}
          placeholder="Describe the full interview process, timeline, vibe, how you prepped..."
        />
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Rounds</h2>
          <Button size="sm" variant="outline" onClick={() => setRounds((r) => [...r, { name: "", type: "", questions: "", duration: "" }])} className="gap-1">
            <Plus className="size-4" /> Add round
          </Button>
        </div>
        {rounds.map((r, i) => (
          <div key={i} className="border border-border/40 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Round {i + 1}</span>
              {rounds.length > 1 && (
                <Button size="icon" variant="ghost" aria-label={`Remove round ${i + 1}`} onClick={() => setRounds((rr) => rr.filter((_, idx) => idx !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Input placeholder="Round name (e.g. Technical 1)" value={r.name} onChange={(e) => updateRound(i, "name", e.target.value)} />
              <Input placeholder="Type (DSA, System Design, HR...)" value={r.type ?? ""} onChange={(e) => updateRound(i, "type", e.target.value)} />
              <Input placeholder="Duration (e.g. 60 min)" value={r.duration ?? ""} onChange={(e) => updateRound(i, "duration", e.target.value)} />
            </div>
            <Textarea
              rows={4}
              placeholder="Questions asked, topics covered (markdown supported)"
              value={r.questions ?? ""}
              onChange={(e) => updateRound(i, "questions", e.target.value)}
            />
          </div>
        ))}
      </Card>

      <Card className="p-6 space-y-3">
        <Label htmlFor="exp-tips">Tips for future candidates (optional)</Label>
        <Textarea id="exp-tips" rows={4} value={form.tips} onChange={(e) => setForm((f) => ({ ...f, tips: e.target.value }))} placeholder="What worked, what to avoid, resources you'd recommend..." />
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to={isEdit ? "/experiences/mine" : "/experiences"}>Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={pending} className="gap-2">
          {isEdit ? <RefreshCw className="size-4" /> : <Send className="size-4" />}
          {pending ? (isEdit ? "Resubmitting..." : "Submitting...") : (isEdit ? "Resubmit for review" : "Submit for review")}
        </Button>
      </div>
    </div>
  );
}
