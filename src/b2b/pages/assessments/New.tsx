import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { OrgShell } from "../../layouts/OrgShell";
import { useMyOrganizations } from "../../hooks/useOrg";
import { useCreateAssessment } from "../../hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, Check, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSESSMENT_TEMPLATES,
  ASSESSMENT_TYPES,
  getTemplate,
  PARTICIPATION_LABELS,
  PROCTORING_LABELS,
  type AssessmentType,
  type ParticipationMode,
  type ProctoringLevel,
} from "../../lib/assessmentTemplates";

export default function AssessmentNew() {
  const { data: orgs, isLoading } = useMyOrganizations();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const initialType = (sp.get("type") as AssessmentType | null) ?? null;

  const [type, setType] = useState<AssessmentType | null>(
    initialType && ASSESSMENT_TYPES.includes(initialType) ? initialType : null,
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [participation, setParticipation] = useState<ParticipationMode>("invite");
  const [proctoringLevel, setProctoringLevel] = useState<ProctoringLevel>("off");
  const [showResults, setShowResults] = useState(true);
  const create = useCreateAssessment();
  const seededRef = useRef(false);

  const org = orgs?.[0];
  const template = useMemo(() => (type ? getTemplate(type) : null), [type]);

  // When the user picks a type, seed defaults from the template (then allow org defaults to refine).
  useEffect(() => {
    if (!template) return;
    setDuration(template.defaultDurationMin);
    setParticipation(template.defaultParticipation);
    setProctoringLevel(template.defaultProctoring);
    setShowResults(template.defaultShowResults);
  }, [template]);

  // Refine with org defaults once on first load (only if not already overridden by template choice).
  useEffect(() => {
    if (!org || seededRef.current || !template) return;
    seededRef.current = true;
    if (typeof org.default_duration_min === "number" && org.default_duration_min > 0) {
      setDuration(org.default_duration_min);
    }
    if (typeof org.auto_release_results === "boolean") {
      setShowResults(org.auto_release_results);
    }
  }, [org, template]);

  if (isLoading) return null;
  if (!orgs?.length) return <Navigate to="/b2b/onboarding" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type) return toast.error("Pick an assessment type first");
    if (!title.trim()) return toast.error("Title is required");
    try {
      const a = await create.mutateAsync({
        org_id: org!.id,
        title: title.trim(),
        description: description.trim() || undefined,
        duration_min: duration,
        proctoring_enabled: proctoringLevel !== "off",
        show_results_to_candidate: showResults,
        type,
        participation_mode: participation,
        proctoring_level: proctoringLevel,
      });

      // Seed sections from the template (best-effort; ignore errors).
      const tpl = getTemplate(type);
      if (tpl.sections.length) {
        try {
          await supabase.from("assessment_sections").insert(
            tpl.sections.map((s, idx) => ({
              assessment_id: a.id,
              title: s.title,
              description: s.description ?? null,
              order_index: idx,
              weight: 1,
            })),
          );
        } catch {
          /* non-blocking */
        }
      }

      toast.success(`${getTemplate(type).label} created`);
      navigate(`/b2b/assessments/${a.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create");
    }
  }

  // ───── Step 1: pick a type ─────
  if (!type) {
    return (
      <OrgShell title="New assessment">
        <div className="max-w-5xl">
          <div className="mb-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Step 1 of 2</p>
            <h2 className="text-2xl font-semibold tracking-tight mt-1">
              What kind of assessment are you running?
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
              Pick a template — sections, duration, participation and proctoring will be pre-configured. You can change everything later.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {ASSESSMENT_TYPES.map((t, i) => {
              const tpl = ASSESSMENT_TEMPLATES[t];
              const Icon = tpl.icon;
              return (
                <motion.button
                  key={t}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setType(t);
                    setSp((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set("type", t);
                      return next;
                    }, { replace: true });
                  }}
                  className="b2b-card group relative text-left p-5 hover:border-[hsl(var(--primary))]/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg border p-2.5 ${tpl.badgeClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{tpl.label}</h3>
                        <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${tpl.badgeClass}`}>
                          {tpl.tagline}
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">
                        {tpl.description}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>⏱ {tpl.defaultDurationMin} min</span>
                        <span>👥 {PARTICIPATION_LABELS[tpl.defaultParticipation].label}</span>
                        <span>🛡 {PROCTORING_LABELS[tpl.defaultProctoring].label} proctoring</span>
                        <span>📚 {tpl.sections.length} section{tpl.sections.length === 1 ? "" : "s"}</span>
                      </div>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2">
                        Best for: {tpl.recommendedFor.join(" · ")}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              );
            })}
          </div>
          <div className="mt-6">
            <Button variant="ghost" onClick={() => navigate("/b2b/assessments")}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
          </div>
        </div>
      </OrgShell>
    );
  }

  // ───── Step 2: basics ─────
  const Icon = template!.icon;
  return (
    <OrgShell title={`New ${template!.label.toLowerCase()}`}>
      <div className="max-w-2xl mb-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
        <span className="inline-flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Pre-filled from {template!.label.toLowerCase()} template and your org defaults.
        </span>
        <Link
          to="/b2b/settings?section=defaults"
          className="underline-offset-2 hover:underline hover:text-[hsl(var(--foreground))]"
        >
          Edit defaults
        </Link>
      </div>

      <form onSubmit={onSubmit} className="b2b-card p-6 max-w-2xl space-y-5">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-2.5">
            <div className={`rounded-md border p-2 ${template!.badgeClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Template</p>
              <p className="font-semibold leading-tight">{template!.label}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setType(null);
              setSp((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("type");
                return next;
              }, { replace: true });
            }}
          >
            Change
          </Button>
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "placement_mock"
                ? "TCS NQT Mock — Round 1"
                : type === "academic"
                ? "DBMS Unit Test — Chapter 4"
                : type === "benchmark"
                ? "CSE Batch 2027 — Diagnostic"
                : "Weekly Coding Contest #12"
            }
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
            className="mt-1 min-h-[90px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={2880}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 60)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Who can join</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(Object.keys(PARTICIPATION_LABELS) as ParticipationMode[]).map((m) => {
              const active = participation === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setParticipation(m)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    active
                      ? "border-[hsl(var(--primary))]/60 bg-[hsl(var(--primary))]/10"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{PARTICIPATION_LABELS[m].label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                    {PARTICIPATION_LABELS[m].helper}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Proctoring</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            {(Object.keys(PROCTORING_LABELS) as ProctoringLevel[]).map((lvl) => {
              const active = proctoringLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setProctoringLevel(lvl)}
                  className={`text-left rounded-md border p-3 transition-colors ${
                    active
                      ? "border-[hsl(var(--primary))]/60 bg-[hsl(var(--primary))]/10"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{PROCTORING_LABELS[lvl].label}</span>
                    {active && <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                    {PROCTORING_LABELS[lvl].helper}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3">
          <Switch id="show-results" checked={showResults} onCheckedChange={setShowResults} className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="show-results" className="cursor-pointer">Show results to candidate</Label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              When off, candidates only see a submission confirmation and a feedback form — no score or breakdown.
            </p>
          </div>
        </div>

        {template!.sections.length > 0 && (
          <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-3">
            <p className="text-xs font-medium text-[hsl(var(--foreground))]">
              We'll pre-create {template!.sections.length} section{template!.sections.length === 1 ? "" : "s"}:
            </p>
            <ul className="mt-1.5 text-xs text-[hsl(var(--muted-foreground))] space-y-0.5">
              {template!.sections.map((s) => (
                <li key={s.title}>• {s.title}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            disabled={create.isPending}
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {create.isPending ? "Creating…" : `Create ${template!.label.toLowerCase()}`}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/b2b/assessments")}>
            Cancel
          </Button>
        </div>
      </form>
    </OrgShell>
  );
}
