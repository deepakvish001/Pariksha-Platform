import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  GraduationCap,
  Building2,
  ShieldCheck,
  Sparkles,
  Users2,
  ArrowRight,
  Check,
  Zap,
} from "lucide-react";
import { slugify } from "../hooks/useOrg";
import "../theme.css";
import { B2BBackdrop } from "../components/B2BBackdrop";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: "Launch in minutes",
    desc: "Spin up role-based coding assessments with zero setup.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade proctoring",
    desc: "Side-Eye AI, tab tracking, and full audit logs out of the box.",
  },
  {
    icon: Users2,
    title: "Built for teams",
    desc: "Invite recruiters, faculty, or interviewers with granular roles.",
  },
];

const TYPE_BENEFITS: Record<"college" | "company", string[]> = {
  college: [
    "Placement-ready DSA, aptitude & SQL banks",
    "Batch-wise insights and student leaderboards",
    "Branded campus drives & invite links",
  ],
  company: [
    "Role-based coding tests for hiring funnels",
    "Real-time anti-cheat & video proctoring",
    "ATS-style candidate scoring & exports",
  ],
};

export default function B2BOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState<"college" | "company" | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!type && name.trim().length >= 2 && !submitting;

  const handleCreate = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    const baseSlug = slugify(name) || "org";
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: name.trim(), type: type!, slug, owner_id: user.id })
      .select()
      .maybeSingle();
    setSubmitting(false);
    if (error) {
      toast({
        title: "Could not create organization",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Organization created", description: data?.name });
    const base = type === "company" ? "/companies" : "/colleges";
    navigate(`${base}/${data?.slug}`);
  };

  return (
    <div className="theme-b2b relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <B2BBackdrop variant="subtle" />

      {/* Decorative gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-[1.05fr,1fr] lg:gap-16 lg:px-8 lg:py-16">
        {/* LEFT — brand & value */}
        <aside className="hidden flex-col justify-between lg:flex">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-500 shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
                <span className="text-base font-bold text-[hsl(var(--primary-foreground))]">P</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Parikshaa</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  by Byteskill
                </div>
              </div>
            </div>

            <div className="mt-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
                <Sparkles className="h-3 w-3" />
                Step 1 of 1 · Setup
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">
                Build your{" "}
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  hiring &amp; placement
                </span>{" "}
                workspace.
              </h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                Stand up a fully branded assessment environment for your
                campus or company in under a minute.
              </p>
            </div>

            <ul className="mt-10 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))/0.6] backdrop-blur">
                    <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">
                      {desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex -space-x-2">
              {[
                "from-amber-400 to-orange-500",
                "from-emerald-400 to-teal-500",
                "from-sky-400 to-indigo-500",
              ].map((g, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 border-[hsl(var(--background))] bg-gradient-to-br",
                    g,
                  )}
                />
              ))}
            </div>
            <span>Trusted by 120+ campuses &amp; hiring teams</span>
          </div>
        </aside>

        {/* RIGHT — form */}
        <main className="flex items-center">
          <div className="w-full">
            {/* Mobile-only header */}
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-amber-500 shadow-[0_0_24px_hsl(var(--primary)/0.45)]">
                <span className="text-lg font-bold text-[hsl(var(--primary-foreground))]">
                  P
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">
                Set up your organization
              </h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Tell us who you're running assessments for.
              </p>
            </div>

            <div className="b2b-card relative overflow-hidden p-6 shadow-[0_24px_60px_-30px_hsl(24_95%_53%/0.35)] sm:p-8">
              {/* Card top accent */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary))/0.6] to-transparent"
              />

              <div className="mb-6 hidden lg:block">
                <h2 className="text-lg font-semibold tracking-tight">
                  Create your organization
                </h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  You can rename, invite teammates, and customize branding later.
                </p>
              </div>

              <div className="space-y-7">
                {/* Type selector */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                    I'm setting up Parikshaa for a
                  </Label>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          key: "college" as const,
                          label: "College",
                          desc: "Placement assessments for students",
                          icon: GraduationCap,
                        },
                        {
                          key: "company" as const,
                          label: "Company",
                          desc: "Coding tests for hiring developers",
                          icon: Building2,
                        },
                      ]
                    ).map(({ key, label, desc, icon: Icon }) => {
                      const active = type === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setType(key)}
                          className={cn(
                            "group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
                            active
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.06] shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.6)]"
                              : "border-[hsl(var(--border))] bg-[hsl(var(--card))/0.4] hover:-translate-y-0.5 hover:border-[hsl(var(--primary))/0.5] hover:shadow-md",
                          )}
                        >
                          {active && (
                            <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                          <div
                            className={cn(
                              "grid h-9 w-9 place-items-center rounded-lg transition-colors",
                              active
                                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                : "bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))]",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <p className="mt-3 text-sm font-semibold">{label}</p>
                          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                            {desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Org name */}
                <div>
                  <Label
                    htmlFor="org-name"
                    className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
                  >
                    Organization name
                  </Label>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === "college"
                        ? "e.g. IIT Delhi"
                        : type === "company"
                          ? "e.g. Acme Inc."
                          : "Pick your organization name"
                    }
                    maxLength={80}
                    className="mt-2 h-11 bg-[hsl(var(--background))/0.5]"
                  />
                  <p className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                    {name.length}/80 — used in invites and on candidate-facing
                    pages.
                  </p>
                </div>

                {/* Type-specific benefits */}
                {type && (
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))/0.4] p-4">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
                      You'll unlock
                    </div>
                    <ul className="space-y-1.5">
                      {TYPE_BENEFITS[type].map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-xs text-[hsl(var(--foreground))/0.85]"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <Button
                  className="group h-11 w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                  disabled={!canSubmit}
                  onClick={handleCreate}
                >
                  {submitting ? (
                    "Creating…"
                  ) : (
                    <>
                      Create organization
                      <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>

                <p className="text-center text-[11px] text-[hsl(var(--muted-foreground))]">
                  By continuing you agree to Parikshaa's terms &amp; privacy
                  policy.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
