import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
  ArrowLeft,
  Check,
  Zap,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Mail,
  Copy,
  CheckCircle2,
  RefreshCcw,
  SkipForward,
  Link2,
} from "lucide-react";
import { slugify } from "../hooks/useOrg";
import "../theme.css";
import { B2BBackdrop } from "../components/B2BBackdrop";
import { B2BSiteHeader } from "../components/B2BSiteHeader";
import { B2BSiteFooter } from "../components/B2BSiteFooter";
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

const orgSchema = z.object({
  type: z.enum(["college", "company"], {
    errorMap: () => ({ message: "Please pick the type that fits you best." }),
  }),
  name: z
    .string()
    .trim()
    .min(2, { message: "Organization name must be at least 2 characters." })
    .max(80, { message: "Organization name must be 80 characters or fewer." }),
});

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Enter a valid email address." });

type CreatedOrg = { id: string; slug: string; name: string; type: "college" | "company" };

export default function B2BOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Step 1 state ────────────────────────────────────────────────────────
  const [type, setType] = useState<"college" | "company" | null>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState<{ type?: boolean; name?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // ── Wizard state ────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [createdOrg, setCreatedOrg] = useState<CreatedOrg | null>(null);

  // ── Step 2 state ────────────────────────────────────────────────────────
  const [emails, setEmails] = useState<string[]>(["", "", ""]);
  const [emailErrors, setEmailErrors] = useState<(string | null)[]>([null, null, null]);
  const [copied, setCopied] = useState(false);
  // Per-email invite tokens; bumping the seed regenerates every link.
  const [linkSeed, setLinkSeed] = useState<string>(() =>
    Math.random().toString(36).slice(2, 10),
  );
  const [generatedLinks, setGeneratedLinks] = useState<
    { email: string; url: string }[] | null
  >(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // ── Derived validation ──────────────────────────────────────────────────
  const validation = useMemo(() => {
    const result = orgSchema.safeParse({ type: type ?? undefined, name });
    if (result.success) return { typeError: null, nameError: null };
    const errs = result.error.flatten().fieldErrors;
    return {
      typeError: errs.type?.[0] ?? null,
      nameError: errs.name?.[0] ?? null,
    };
  }, [type, name]);

  const showTypeError = touched.type && validation.typeError;
  const showNameError = touched.name && validation.nameError;

  // ── Step 1 submit ───────────────────────────────────────────────────────
  const handleCreate = async () => {
    setTouched({ type: true, name: true });
    setServerError(null);
    if (validation.typeError || validation.nameError) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (submitting) return; // double-submit guard

    setSubmitting(true);
    try {
      const baseSlug = slugify(name) || "org";
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase
        .from("organizations")
        .insert({ name: name.trim(), type: type!, slug, owner_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Could not create organization.");
      const org: CreatedOrg = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        type: data.type as "college" | "company",
      };
      setCreatedOrg(org);
      toast({ title: "Organization created", description: org.name });
      setStep(2);
    } catch (e: any) {
      const msg = e?.message ?? "Something went wrong. Please try again.";
      setServerError(msg);
      toast({
        title: "Could not create organization",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 helpers ──────────────────────────────────────────────────────
  const updateEmail = (idx: number, value: string) => {
    setEmails((prev) => prev.map((e, i) => (i === idx ? value : e)));
    setEmailErrors((prev) => prev.map((e, i) => (i === idx ? null : e)));
  };
  const addRow = () => {
    if (emails.length >= 10) return;
    setEmails((p) => [...p, ""]);
    setEmailErrors((p) => [...p, null]);
  };
  const removeRow = (idx: number) => {
    setEmails((p) => p.filter((_, i) => i !== idx));
    setEmailErrors((p) => p.filter((_, i) => i !== idx));
  };
  const validateEmails = () => {
    const errs = emails.map((e) => {
      const v = e.trim();
      if (!v) return null; // blank rows are allowed (skipped)
      const r = emailSchema.safeParse(v);
      return r.success ? null : r.error.issues[0]?.message ?? "Invalid email";
    });
    setEmailErrors(errs);
    return errs.every((e) => !e);
  };
  const validEmails = useMemo(
    () =>
      Array.from(
        new Set(
          emails
            .map((e) => e.trim().toLowerCase())
            .filter((e) => emailSchema.safeParse(e).success),
        ),
      ),
    [emails],
  );
  const teamUrl = createdOrg
    ? `${window.location.origin}/${createdOrg.type === "company" ? "companies" : "colleges"}/${createdOrg.slug}/team`
    : "";

  /** Per-email tokenized invite link. Bumping `linkSeed` regenerates them all. */
  const buildInviteLink = (email: string, seed = linkSeed) => {
    const handle = email.replace(/[^a-z0-9]+/gi, "-").slice(0, 24).toLowerCase();
    const token = `${seed}-${handle || "guest"}`;
    return `${teamUrl}?invite=${token}`;
  };

  const buildMailto = (links: { email: string; url: string }[]) => {
    const subject = encodeURIComponent(
      `You're invited to ${createdOrg?.name ?? "our team"} on Parikshaa`,
    );
    const lines = links
      .map((l) => `• ${l.email}\n  ${l.url}`)
      .join("\n");
    const body = encodeURIComponent(
      `Hi,\n\nI've set up "${createdOrg?.name}" on Parikshaa for our assessments.\n` +
        `Use your personal invite link below to join the team:\n\n${lines}\n\n` +
        `Thanks!`,
    );
    return `mailto:${links.map((l) => l.email).join(",")}?subject=${subject}&body=${body}`;
  };

  const generateAndSend = (seed: string) => {
    if (!validateEmails()) return false;
    if (validEmails.length === 0) {
      toast({
        title: "Add at least one email",
        description: "Or click 'Skip for now' to finish onboarding.",
      });
      return false;
    }
    const links = validEmails.map((email) => ({
      email,
      url: buildInviteLink(email, seed),
    }));
    setGeneratedLinks(links);
    window.location.href = buildMailto(links);
    return true;
  };

  const handleSendInvites = () => generateAndSend(linkSeed);

  const handleResendInvites = () => {
    const fresh = Math.random().toString(36).slice(2, 10);
    setLinkSeed(fresh);
    if (generateAndSend(fresh)) {
      toast({
        title: "Invite links refreshed",
        description: "We regenerated unique links and reopened your email client.",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(teamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const handleCopyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 1800);
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const finishOnboarding = () => {
    if (!createdOrg) return;
    const base = createdOrg.type === "company" ? "/companies" : "/colleges";
    navigate(`${base}/${createdOrg.slug}`);
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="theme-b2b relative flex min-h-screen flex-col overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <B2BBackdrop variant="subtle" />
      <B2BSiteHeader />

      {/* Decorative gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_60%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_60%)] blur-3xl"
      />

      <main className="relative z-10 flex flex-1 items-stretch pt-16">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr,1fr] lg:gap-16 lg:px-8 lg:py-14">
          {/* LEFT — brand & value (hidden on mobile) */}
          <aside className="hidden flex-col justify-between lg:flex">
            <div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
                  <Sparkles className="h-3 w-3" />
                  Step {step} of 2 · Setup
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
          <section className="flex items-center">
            <div className="w-full">
              {/* Mobile-only header */}
              <div className="mb-5 text-center lg:hidden">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--primary))]">
                  <Sparkles className="h-3 w-3" />
                  Step {step} of 2
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  {step === 1 ? "Set up your organization" : "Invite your teammates"}
                </h1>
                <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                  {step === 1
                    ? "Tell us who you're running assessments for."
                    : "Optional — you can always invite people later."}
                </p>
              </div>

              {/* Mobile step progress bar */}
              <div className="mb-4 flex items-center gap-2 lg:hidden" aria-hidden>
                {[1, 2].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      step >= s
                        ? "bg-[hsl(var(--primary))]"
                        : "bg-[hsl(var(--border))]",
                    )}
                  />
                ))}
              </div>

              <div className="b2b-card relative overflow-hidden p-5 shadow-[0_24px_60px_-30px_hsl(24_95%_53%/0.35)] sm:p-7">
                {/* Top accent */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--primary))/0.6] to-transparent"
                />

                {/* ────────── Step 1 ────────── */}
                {step === 1 && (
                  <>
                    <div className="mb-6 hidden lg:block">
                      <h2 className="text-lg font-semibold tracking-tight">
                        Create your organization
                      </h2>
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        You can rename, invite teammates, and customize branding later.
                      </p>
                    </div>

                    <fieldset
                      disabled={submitting}
                      aria-busy={submitting}
                      className="space-y-5 disabled:opacity-60 sm:space-y-6"
                    >
                      {/* Type selector */}
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          I'm setting up Parikshaa for a
                        </Label>
                        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
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
                                onClick={() => {
                                  setType(key);
                                  setTouched((t) => ({ ...t, type: true }));
                                }}
                                aria-pressed={active}
                                aria-invalid={!!showTypeError}
                                className={cn(
                                  "group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200 sm:p-4",
                                  active
                                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.06] shadow-[0_8px_24px_-12px_hsl(var(--primary)/0.6)]"
                                    : showTypeError
                                      ? "border-destructive/60 bg-destructive/5"
                                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))/0.4] hover:-translate-y-0.5 hover:border-[hsl(var(--primary))/0.5] hover:shadow-md",
                                )}
                              >
                                {active && (
                                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] sm:right-3 sm:top-3">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                                <div
                                  className={cn(
                                    "grid h-8 w-8 place-items-center rounded-lg transition-colors sm:h-9 sm:w-9",
                                    active
                                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                      : "bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))]",
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <p className="mt-2.5 text-sm font-semibold sm:mt-3">
                                  {label}
                                </p>
                                <p className="mt-0.5 text-[11px] leading-snug text-[hsl(var(--muted-foreground))] sm:text-xs">
                                  {desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                        {showTypeError && (
                          <p
                            role="alert"
                            className="mt-2 flex items-center gap-1.5 text-xs text-destructive"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            {validation.typeError}
                          </p>
                        )}
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
                          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                          placeholder={
                            type === "college"
                              ? "e.g. IIT Delhi"
                              : type === "company"
                                ? "e.g. Acme Inc."
                                : "Pick your organization name"
                          }
                          maxLength={80}
                          aria-invalid={!!showNameError}
                          aria-describedby={
                            showNameError ? "org-name-error" : "org-name-hint"
                          }
                          className={cn(
                            "mt-2 h-11 bg-[hsl(var(--background))/0.5]",
                            showNameError &&
                              "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        {showNameError ? (
                          <p
                            id="org-name-error"
                            role="alert"
                            className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            {validation.nameError}
                          </p>
                        ) : (
                          <p
                            id="org-name-hint"
                            className="mt-1.5 text-[11px] text-[hsl(var(--muted-foreground))]"
                          >
                            {name.length}/80 — used in invites and on candidate-facing pages.
                          </p>
                        )}
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

                      {serverError && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{serverError}</span>
                        </div>
                      )}

                      <Button
                        className="group h-11 w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
                        onClick={handleCreate}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        )}
                      </Button>

                      <p className="text-center text-[11px] text-[hsl(var(--muted-foreground))]">
                        By continuing you agree to Parikshaa's terms &amp; privacy policy.
                      </p>
                    </fieldset>
                  </>
                )}

                {/* ────────── Step 2 ────────── */}
                {step === 2 && createdOrg && (
                  <>
                    <div className="mb-6 hidden lg:block">
                      <div className="flex items-center gap-2 text-xs text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-semibold">{createdOrg.name} is ready</span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight">
                        Invite your teammates
                      </h2>
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        Add up to 10 emails — we'll prepare an invite mail for you.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))/0.4] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                              Shareable team link
                            </div>
                            <div className="mt-0.5 truncate text-xs text-[hsl(var(--foreground))/0.9]">
                              {teamUrl}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCopyLink}
                            className="shrink-0"
                          >
                            {copied ? (
                              <>
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                          Email addresses
                        </Label>
                        <div className="mt-2 space-y-2">
                          {emails.map((value, idx) => (
                            <div key={idx}>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                                  <Input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="off"
                                    value={value}
                                    onChange={(e) => updateEmail(idx, e.target.value)}
                                    onBlur={() => validateEmails()}
                                    placeholder="teammate@company.com"
                                    aria-invalid={!!emailErrors[idx]}
                                    className={cn(
                                      "h-10 pl-9 bg-[hsl(var(--background))/0.5]",
                                      emailErrors[idx] &&
                                        "border-destructive focus-visible:ring-destructive",
                                    )}
                                  />
                                </div>
                                {emails.length > 1 && (
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeRow(idx)}
                                    aria-label="Remove email"
                                    className="h-9 w-9 shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {emailErrors[idx] && (
                                <p
                                  role="alert"
                                  className="ml-1 mt-1 flex items-center gap-1.5 text-xs text-destructive"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {emailErrors[idx]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={addRow}
                          disabled={emails.length >= 10}
                          className="mt-2 h-8 px-2 text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add another
                          <span className="ml-1 text-[hsl(var(--muted-foreground))]">
                            ({emails.length}/10)
                          </span>
                        </Button>
                      </div>

                      {/* Generated per-email invite links (after first send) */}
                      {generatedLinks && generatedLinks.length > 0 && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
                              <Link2 className="h-3.5 w-3.5" />
                              Latest invite links
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleResendInvites}
                              className="h-7 px-2 text-[11px]"
                            >
                              <RefreshCcw className="mr-1.5 h-3 w-3" />
                              Resend &amp; regenerate
                            </Button>
                          </div>
                          <ul className="space-y-1.5">
                            {generatedLinks.map((l) => (
                              <li
                                key={l.email}
                                className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))/0.6] px-2.5 py-1.5"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-xs font-medium">
                                    {l.email}
                                  </div>
                                  <div className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">
                                    {l.url}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleCopyInviteLink(l.url)}
                                  aria-label={`Copy invite link for ${l.email}`}
                                  className="h-7 w-7 shrink-0"
                                >
                                  {copiedLink === l.url ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                            Each link is unique to that email. Resending replaces the
                            previous links.
                          </p>
                        </div>
                      )}

                      {/* Action row */}
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setStep(1)}
                          className="h-10 w-full sm:w-auto"
                        >
                          <ArrowLeft className="mr-1.5 h-4 w-4" />
                          Back
                        </Button>
                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={finishOnboarding}
                            className="h-10 w-full sm:w-auto"
                          >
                            <SkipForward className="mr-1.5 h-4 w-4" />
                            Skip for now
                          </Button>
                          {generatedLinks && generatedLinks.length > 0 ? (
                            <Button
                              type="button"
                              onClick={handleResendInvites}
                              className="h-10 w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 sm:w-auto"
                            >
                              <RefreshCcw className="mr-1.5 h-4 w-4" />
                              Resend invites
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={handleSendInvites}
                              className="h-10 w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 sm:w-auto"
                            >
                              <Mail className="mr-1.5 h-4 w-4" />
                              Send invites
                              <span className="ml-1.5 rounded bg-[hsl(var(--primary-foreground))/0.2] px-1.5 text-[10px] font-semibold">
                                {validEmails.length}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-center text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                        Skipping takes you straight to{" "}
                        <span className="font-medium text-[hsl(var(--foreground))/0.8]">
                          {createdOrg.name}
                        </span>
                        's dashboard — you can always invite teammates from the Team page later.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <B2BSiteFooter />

      {/* Full-screen submission overlay */}
      {submitting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[60] grid place-items-center bg-[hsl(var(--background))/0.7] backdrop-blur-sm"
        >
          <div className="b2b-card flex flex-col items-center gap-3 p-6 shadow-2xl">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[hsl(var(--primary))/0.18] blur-xl"
              />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold">Creating your workspace</div>
              <div className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Provisioning organization, members &amp; defaults…
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
