import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import { useMyOrganizations } from "../../hooks/useOrg";
import { useCreateAssessment } from "../../hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AssessmentNew() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [proctoring, setProctoring] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const create = useCreateAssessment();

  if (isLoading) return null;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;
  const org = orgs[0];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");
    try {
      const a = await create.mutateAsync({
        org_id: org.id,
        title: title.trim(),
        description: description.trim() || undefined,
        duration_min: duration,
        proctoring_enabled: proctoring,
        show_results_to_candidate: showResults,
      });
      toast.success("Assessment created");
      navigate(`/b2b/assessments/${a.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create");
    }
  }

  return (
    <OrgShell title="New assessment">
      <form onSubmit={onSubmit} className="b2b-card p-6 max-w-2xl space-y-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Backend Engineer Screening — Q1"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional context for candidates."
            className="mt-1 min-h-[100px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 60)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch id="proctor" checked={proctoring} onCheckedChange={setProctoring} />
            <Label htmlFor="proctor" className="cursor-pointer">Enable basic proctoring</Label>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <Switch id="show-results" checked={showResults} onCheckedChange={setShowResults} className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="show-results" className="cursor-pointer">Show results to candidate</Label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              When off, candidates only see a submission confirmation and a feedback form — no score, per-question breakdown, integrity report, or receipt PDF.
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {create.isPending ? "Creating…" : "Create assessment"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/b2b/assessments")}>
            Cancel
          </Button>
        </div>
      </form>
    </OrgShell>
  );
}
