import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import ScrollReveal from "./ScrollReveal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";

const PROCTORING_OPTIONS = [
  "Tab-switch & fullscreen",
  "Webcam + face detection",
  "Side Eye phone camera",
  "Screen recording",
  "Copy/paste lockdown",
  "Identity verification",
];

const REPORTING_OPTIONS = [
  "Per-candidate PDF",
  "CSV exports",
  "Integrity score breakdown",
  "Public verifiable reports",
  "Leaderboard / cohort view",
  "API / webhook access",
];

const USE_CASES = [
  { value: "campus", label: "Campus placements" },
  { value: "hiring", label: "Tech hiring" },
  { value: "training", label: "Internal training & L&D" },
  { value: "certification", label: "Certification exams" },
];

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid work email").max(160),
  org: z.string().trim().min(2, "Org name required").max(120),
  useCase: z.string().min(1, "Pick a use case"),
  candidates: z.string().min(1, "Pick a volume"),
  notes: z.string().max(2000).optional(),
});

const DemoRequestForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [proctoring, setProctoring] = useState<string[]>([]);
  const [reporting, setReporting] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [leadSource, setLeadSource] = useState<string>("demo_form");
  const formRef = useRef<HTMLFormElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  // Listen for prefill events from other landing sections (e.g. ROI calculator)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ notes?: string; source?: string }>).detail || {};
      if (detail.notes) setNotes(detail.notes);
      if (detail.source) setLeadSource(detail.source);
      // Smooth-focus the notes textarea so the user sees prefilled context
      requestAnimationFrame(() => {
        notesRef.current?.focus({ preventScroll: true });
      });
    };
    window.addEventListener("prefill-demo-form", handler as EventListener);
    return () => window.removeEventListener("prefill-demo-form", handler as EventListener);
  }, []);

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((v) => v !== val) : [...list, val]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const data = { ...formData, notes };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      const utm = getStoredUtm();
      const payload = {
        ...parsed.data,
        proctoring,
        reporting,
        // Standard lead-source fields piggy-backed via UTM channel for the existing handler schema
        utm: { ...utm, content: utm?.content || leadSource },
        referrer: typeof document !== "undefined" ? document.referrer : null,
        landingPage:
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : null,
      };
      const { data: res, error } = await supabase.functions.invoke("submit-demo-request", {
        body: payload,
      });
      if (error || (res as { error?: string } | null)?.error) {
        const msg =
          (res as { error?: string } | null)?.error ||
          error?.message ||
          "Something went wrong. Try again in a moment.";
        toast.error(msg);
        await trackLeadEvent("demo_request_failed", { reason: msg, source: leadSource });
        return;
      }
      await trackLeadEvent("demo_request_submitted", {
        org: parsed.data.org,
        useCase: parsed.data.useCase,
        candidates: parsed.data.candidates,
        proctoring_count: proctoring.length,
        reporting_count: reporting.length,
        source: leadSource,
        lead_id: (res as { id?: string } | null)?.id,
      });
      toast.success("Demo request received — we'll reach out within 1 business day.");
      setDone(true);
      form.reset();
      setNotes("");
      setProctoring([]);
      setReporting([]);
      setLeadSource("demo_form");
      window.dispatchEvent(
        new CustomEvent("demo-form-submitted", { detail: { source: leadSource } }),
      );
    } catch (err) {
      console.error("[demo-request] error", err);
      toast.error("Something went wrong. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="demo" className="py-24 bg-gradient-to-b from-background via-secondary/5 to-background">
      <div className="section-container">
        <div className="grid lg:grid-cols-5 gap-10 items-start max-w-6xl mx-auto">
          {/* Left: pitch */}
          <ScrollReveal className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">Book a tailored demo</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 leading-tight">
                See Parikshaa run on
                <span className="block bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  your real use case
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                Tell us what you need to proctor and what reports your stakeholders expect. We'll walk you through a setup wired exactly for it.
              </p>
              <ul className="space-y-3">
                {[
                  "Live walkthrough on your sample assessment",
                  "Custom integrity scoring tuned to your tolerance",
                  "Sample exports for placement cells & auditors",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal delay={0.1} className="lg:col-span-3">
            <div>
              <motion.form
                ref={formRef}
                onSubmit={handleSubmit}
                className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                {done && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Request received</p>
                      <p className="text-xs text-muted-foreground">A specialist will email you with a tailored demo link within 1 business day.</p>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input id="name" name="name" placeholder="Riya Kapoor" disabled={submitting} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input id="email" name="email" type="email" placeholder="riya@company.com" disabled={submitting} required />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="org">Organization</Label>
                    <Input id="org" name="org" placeholder="Acme University / Razorpay" disabled={submitting} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidates">Candidates / month</Label>
                    <select
                      id="candidates"
                      name="candidates"
                      disabled={submitting}
                      required
                      defaultValue=""
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <option value="" disabled>Select volume</option>
                      <option value="0-100">Under 100</option>
                      <option value="100-500">100 – 500</option>
                      <option value="500-2000">500 – 2,000</option>
                      <option value="2000+">2,000+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <Label>Primary use case</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {USE_CASES.map((u, i) => (
                      <label
                        key={u.value}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-background/50 hover:border-primary/50 cursor-pointer transition-colors text-sm"
                      >
                        <input
                          type="radio"
                          name="useCase"
                          value={u.value}
                          required
                          defaultChecked={i === 0}
                          disabled={submitting}
                          className="accent-primary"
                        />
                        <span className="text-foreground">{u.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <Label>Proctoring requirements <span className="text-muted-foreground font-normal">(pick all that apply)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {PROCTORING_OPTIONS.map((opt) => {
                      const active = proctoring.includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          disabled={submitting}
                          onClick={() => toggle(proctoring, setProctoring, opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background/40 text-muted-foreground border-border/60 hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <Label>Reporting requirements <span className="text-muted-foreground font-normal">(pick all that apply)</span></Label>
                  <div className="flex flex-wrap gap-2">
                    {REPORTING_OPTIONS.map((opt) => {
                      const active = reporting.includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          disabled={submitting}
                          onClick={() => toggle(reporting, setReporting, opt)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background/40 text-muted-foreground border-border/60 hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <Label htmlFor="notes">Anything specific? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    ref={notesRef}
                    id="notes"
                    name="notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g. We run 600 candidates over 2 days, need integrity reports for our auditors."
                    disabled={submitting}
                    maxLength={2000}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending request…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Request my tailored demo
                    </>
                  )}
                </button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  No spam. We only use these details to scope your demo.
                </p>
              </motion.form>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default DemoRequestForm;
