import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, ArrowRight, Sparkles, Building2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import "../theme.css";

type Tier = {
  name: string;
  tagline: string;
  price: string;
  unit?: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    tagline: "For small teams running their first tests.",
    price: "Free",
    features: [
      "Up to 25 candidates / month",
      "All 4 question types",
      "Basic browser proctoring",
      "1 organization workspace",
      "Email support",
    ],
    cta: "Get started",
  },
  {
    name: "Growth",
    tagline: "For active hiring teams and placement cells.",
    price: "Custom",
    unit: "talk to us",
    features: [
      "Unlimited candidates",
      "Question bank with reuse",
      "Integrity scoring + event log",
      "Bulk CSV invites",
      "CSV export of results",
      "Priority support",
    ],
    cta: "Contact sales",
    highlight: true,
  },
  {
    name: "Enterprise",
    tagline: "For colleges & companies at scale.",
    price: "Custom",
    unit: "annual contract",
    features: [
      "SSO + role-based access",
      "Dedicated success manager",
      "On-prem question import",
      "Custom proctoring policies",
      "SLA + uptime guarantees",
    ],
    cta: "Contact sales",
  },
];

export default function B2BPricing() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    work_email: user?.email ?? "",
    organization: "",
    org_type: "company" as "college" | "company" | "other",
    team_size: "",
    message: "",
  });

  const upd = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.work_email.trim() || !form.organization.trim()) {
      toast.error("Please fill in name, email and organization.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("b2b_leads").insert({
      name: form.name.trim(),
      work_email: form.work_email.trim(),
      organization: form.organization.trim(),
      org_type: form.org_type,
      team_size: form.team_size || null,
      message: form.message || null,
      source: "pricing_page",
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit — please try again.");
      return;
    }
    setSubmitted(true);
    toast.success("Thanks! Our team will reach out shortly.");
  };

  return (
    <div className="theme-b2b min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Nav */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/b2b" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">
              P
            </div>
            <span className="font-semibold tracking-tight text-[15px]">
              Parikshaa{" "}
              <span className="text-[hsl(var(--muted-foreground))] font-normal">for Teams</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[hsl(var(--muted-foreground))]">
            <Link to="/b2b" className="hover:text-[hsl(var(--foreground))]">
              Overview
            </Link>
            <Link to="/pricing" className="text-[hsl(var(--foreground))]">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hidden sm:block"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <Link to="/b2b/onboarding">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" /> Simple, transparent pricing
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto leading-[1.05]">
            Pricing that scales with your hiring.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Start free. Talk to us when you're ready to run real-volume hiring or campus drives.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-5">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={
              "b2b-card p-7 flex flex-col " +
              (t.highlight
                ? "border-[hsl(var(--primary))]/50 ring-1 ring-[hsl(var(--primary))]/20 relative"
                : "")
            }
          >
            {t.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[11px] font-medium">
                Most popular
              </div>
            )}
            <p className="text-sm font-medium text-[hsl(var(--primary))]">{t.name}</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{t.tagline}</p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{t.price}</span>
              {t.unit && (
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{t.unit}</span>
              )}
            </div>
            <ul className="mt-6 space-y-2.5 flex-1">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              {t.cta === "Get started" ? (
                <Button
                  asChild
                  className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                >
                  <Link to="/b2b/onboarding">
                    {t.cta} <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <a href="#contact">{t.cta}</a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Contact sales */}
      <section id="contact" className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">
              Talk to sales
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
              Tell us about your team.
            </h2>
            <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-md">
              Share a few details and we'll get back within one business day with pricing tailored
              to your volume.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Colleges & TPOs</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Volume pricing per batch · CSV upload · Unlimited assessments
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Companies & HR</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Per-seat or per-candidate · Question bank reuse · Role-based access
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="b2b-card p-7">
            {submitted ? (
              <div className="text-center py-10">
                <div className="h-12 w-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">Thanks — we got it.</h3>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  Our team will reach out to <span className="font-medium">{form.work_email}</span>{" "}
                  within one business day.
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <Link to="/b2b">Back to overview</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => upd("name", e.target.value)}
                      placeholder="Aanya Sharma"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.work_email}
                      onChange={(e) => upd("work_email", e.target.value)}
                      placeholder="you@company.com"
                      className="mt-1.5"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="org">Organization</Label>
                    <Input
                      id="org"
                      value={form.organization}
                      onChange={(e) => upd("organization", e.target.value)}
                      placeholder="Acme Inc."
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={form.org_type}
                      onValueChange={(v) => upd("org_type", v)}
                    >
                      <SelectTrigger id="type" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="college">College / University</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="size">Expected candidates / month</Label>
                  <Select value={form.team_size} onValueChange={(v) => upd("team_size", v)}>
                    <SelectTrigger id="size" className="mt-1.5">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-50">1–50</SelectItem>
                      <SelectItem value="50-250">50–250</SelectItem>
                      <SelectItem value="250-1000">250–1,000</SelectItem>
                      <SelectItem value="1000+">1,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="msg">Anything else?</Label>
                  <Textarea
                    id="msg"
                    value={form.message}
                    onChange={(e) => upd("message", e.target.value)}
                    placeholder="Tell us about your hiring or placement workflow…"
                    className="mt-1.5 min-h-[96px]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                >
                  {submitting ? "Submitting…" : "Request a call"}
                </Button>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center">
                  By submitting you agree to be contacted by Parikshaa about your inquiry.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <p>© {new Date().getFullYear()} Parikshaa. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/b2b" className="hover:text-[hsl(var(--foreground))]">
              Overview
            </Link>
            <Link to="/pricing" className="hover:text-[hsl(var(--foreground))]">
              Pricing
            </Link>
            <Link to="/login" className="hover:text-[hsl(var(--foreground))]">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
