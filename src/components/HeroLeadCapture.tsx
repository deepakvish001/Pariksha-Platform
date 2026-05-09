import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";

const fieldSchemas = {
  name: z.string().trim().min(2, "Enter your full name (min 2 characters)").max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Work email is required")
    .email("Enter a valid email like name@company.com")
    .max(160, "Email is too long")
    .refine(
      (v) => !/(gmail|yahoo|hotmail|outlook|icloud|proton)\./i.test(v),
      "Please use your work email (not a personal address)",
    ),
};

type Errors = { name?: string; email?: string };

const HeroLeadCapture = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (field: keyof Errors, value: string): string | undefined => {
    const r = fieldSchemas[field].safeParse(value);
    return r.success ? undefined : r.error.issues[0]?.message;
  };

  const setField =
    (field: keyof Errors, setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setter(v);
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validate(field, v) }));
      }
    };

  const onBlur = (field: keyof Errors, value: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validate("name", name);
    const emailErr = validate("email", email);
    setTouched({ name: true, email: true });
    setErrors({ name: nameErr, email: emailErr });
    if (nameErr || emailErr) {
      toast.error("Fix the highlighted fields to continue");
      return;
    }
    setSubmitting(true);
    try {
      const utm = getStoredUtm();
      const payload = {
        name: name.trim(),
        email: email.trim(),
        org: "Hero quick capture",
        useCase: "campus",
        candidates: "0-100",
        proctoring: [],
        reporting: [],
        notes: "Source: hero_quick_capture",
        // Tag lead source via utm.content for the existing handler schema
        utm: { ...utm, content: utm?.content || "hero_quick_capture" },
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
          "Something went wrong. Please try again.";
        toast.error(msg);
        await trackLeadEvent("hero_lead_failed", { reason: msg, source: "hero_quick_capture" });
        return;
      }
      await trackLeadEvent("hero_lead_submitted", {
        source: "hero_quick_capture",
        lead_id: (res as { id?: string } | null)?.id,
      });
      toast.success("You're in — we'll reach out shortly.");
      setDone(true);
    } catch (err) {
      console.error("[hero-lead] error", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: keyof Errors) =>
    `flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none rounded-xl border transition-colors ${
      errors[field]
        ? "border-destructive/60 focus:border-destructive"
        : "border-transparent focus:border-primary/40"
    }`;

  return (
    <div className="max-w-xl mx-auto mb-10">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm text-left"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Thanks {name.split(" ")[0]} — you're on the list.
              </p>
              <p className="text-xs text-muted-foreground">
                A specialist will email <span className="text-foreground">{email}</span> with a tailored
                walkthrough within 1 business day.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            noValidate
            className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-lg p-2"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={name}
                  onChange={setField("name", setName)}
                  onBlur={() => onBlur("name", name)}
                  placeholder="Your name"
                  maxLength={80}
                  disabled={submitting}
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "hero-name-err" : undefined}
                  className={inputCls("name")}
                />
              </div>
              <div className="hidden sm:block w-px bg-border/60 self-stretch" />
              <div className="flex-1 min-w-0">
                <input
                  type="email"
                  value={email}
                  onChange={setField("email", setEmail)}
                  onBlur={() => onBlur("email", email)}
                  placeholder="Work email"
                  maxLength={160}
                  disabled={submitting}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "hero-email-err" : undefined}
                  className={inputCls("email")}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Get early access <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {(errors.name || errors.email) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-2 pt-2 space-y-1 text-left"
                >
                  {errors.name && (
                    <p id="hero-name-err" className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.name}
                    </p>
                  )}
                  {errors.email && (
                    <p id="hero-email-err" className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
      {!done && (
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          No spam. We only email about your tailored demo.
        </p>
      )}
    </div>
  );
};

export default HeroLeadCapture;
