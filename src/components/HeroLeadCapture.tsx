import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid work email").max(160),
});

const HeroLeadCapture = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSubmitting(true);
    try {
      const utm = getStoredUtm();
      const payload = {
        ...parsed.data,
        org: "Hero quick capture",
        useCase: "campus",
        candidates: "0-100",
        proctoring: [],
        reporting: [],
        notes: "Source: hero quick form",
        utm,
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
        await trackLeadEvent("hero_lead_failed", { reason: msg });
        return;
      }
      await trackLeadEvent("hero_lead_submitted", {
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
              <p className="text-sm font-semibold text-foreground">Thanks {name.split(" ")[0]} — you're on the list.</p>
              <p className="text-xs text-muted-foreground">A specialist will email <span className="text-foreground">{email}</span> with a tailored walkthrough within 1 business day.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-lg"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              disabled={submitting}
              required
              className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="hidden sm:block w-px bg-border/60" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email"
              maxLength={160}
              disabled={submitting}
              required
              className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
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
