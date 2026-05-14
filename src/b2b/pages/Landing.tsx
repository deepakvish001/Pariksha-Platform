import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Code2,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Clock,
  Users,
  FileCheck2,
  Lock,
  Zap,
  Star,
  TrendingUp,
  XCircle,
  Sparkles,
  Quote,
  ChevronDown,
} from "lucide-react";
import "../theme.css";
import { B2BBackdrop, amberGradientText } from "../components/B2BBackdrop";
import { B2BSiteHeader } from "../components/B2BSiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { captureUtm, getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const B2B_FAQS = [
  { q: "How long does setup take?", a: "Under 60 seconds. Sign up, create your org, build (or import) an assessment, and invite candidates by CSV." },
  { q: "Is there a free trial?", a: "Yes — 14 days, all features included, no credit card required. Cancel anytime." },
  { q: "How does proctoring work?", a: "Browser-level: tab-switch, fullscreen exit, copy/paste, right-click and focus loss are all logged with timestamps. You get a per-attempt integrity score." },
  { q: "Can candidates use ChatGPT?", a: "We detect copy/paste, paste velocity and tab switches. Our integrity score surfaces likely AI-assisted attempts so you can review them." },
  { q: "Do you support custom branding?", a: "Yes. Add your logo, colors and a custom subdomain on Pro plans." },
  { q: "Is my data secure?", a: "All data is encrypted in transit and at rest. We follow SOC2-aligned controls and provide full audit trails." },
];

export default function B2BLanding() {
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    captureUtm();
    trackLeadEvent("b2b_landing_view");
    const onScroll = () => setShowStickyCta(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="theme-b2b relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <B2BBackdrop />
      <B2BSiteHeader
        links={[
          { label: "Why Parikshaa", to: "#why" },
          { label: "Features", to: "#features" },
          { label: "ROI", to: "#roi" },
          { label: "Pricing", to: "/pricing" },
        ]}
      />
      <div className="pt-16">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[hsl(var(--border))]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at top, black 40%, transparent 75%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs font-medium text-[hsl(var(--muted-foreground))]">
                <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
                Used by 200+ placement cells & hiring teams
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
                Hire & place developers <span className={amberGradientText}>10× faster</span> — without the cheating.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-xl">
                Parikshaa is the all-in-one coding assessment platform built for placement cells and recruiters.
                Auto-graded tests, AI proctoring, and integrity scoring — live in under 60 seconds.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  "Cut screening time by 80% with auto-grading",
                  "Catch cheating with browser-level proctoring",
                  "Invite 1,000+ candidates in a single CSV upload",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button asChild size="lg" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
                  <Link to="/b2b/onboarding" onClick={() => trackLeadEvent("b2b_hero_cta_click", { cta: "start_free" })}>
                    Start free — no card needed <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#demo" onClick={() => trackLeadEvent("b2b_hero_cta_click", { cta: "book_demo" })}>
                    Book a 15-min demo
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
                ✓ 14-day free trial   ✓ Cancel anytime   ✓ SOC2-aligned security
              </p>
            </div>

            {/* Lead capture card */}
            <div className="lg:col-span-2">
              <DemoLeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/40">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-center text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-5">
            Trusted by leading colleges and hiring teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
            {["IIT Delhi", "VIT", "BITS Pilani", "Infosys", "TCS", "Zoho", "Freshworks", "Razorpay"].map((n) => (
              <span key={n} className="text-sm sm:text-base font-semibold tracking-tight text-[hsl(var(--muted-foreground))]">
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / proof band */}
      <section className="border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { v: "200+", l: "Organizations" },
            { v: "1.2M+", l: "Assessments delivered" },
            { v: "80%", l: "Less screening time" },
            { v: "<60s", l: "Invite to live" },
          ].map((s) => (
            <div key={s.l}>
              <div className={`text-3xl sm:text-4xl font-semibold tracking-tight ${amberGradientText}`}>{s.v}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem → Solution */}
      <section id="why" className="border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">The problem</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
              Hiring devs the old way is broken.
            </h2>
            <p className="mt-3 text-[hsl(var(--muted-foreground))]">
              Spreadsheets, emailed PDFs, ChatGPT-assisted answers. You waste weeks and still hire the wrong people.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-5">
            <div className="b2b-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-400">
                <XCircle className="h-4 w-4" /> Without Parikshaa
              </div>
              <ul className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                <li>• 2–3 weeks to screen one batch of candidates</li>
                <li>• 40%+ of submissions are AI-assisted or copied</li>
                <li>• Manual grading errors and inconsistent rubrics</li>
                <li>• No audit trail when a hiring decision is challenged</li>
                <li>• Engineers pulled into evaluating instead of building</li>
              </ul>
            </div>
            <div className="b2b-card p-6 border-[hsl(var(--primary))]/40">
              <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary))]">
                <CheckCircle2 className="h-4 w-4" /> With Parikshaa
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                <li>• Live results in hours, not weeks</li>
                <li>• AI proctoring + integrity score per attempt</li>
                <li>• Auto-graded MCQ, SQL & code with hidden tests</li>
                <li>• Tamper-proof event log on every submission</li>
                <li>• Engineers stay shipping; recruiters move faster</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Two audiences */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-6">
        <AudienceCard
          id="colleges"
          icon={GraduationCap}
          eyebrow="For Colleges & TPOs"
          title="Place 3× more students this season."
          points={[
            "Bulk-invite an entire batch in seconds via CSV",
            "Mix coding, MCQ, SQL & subjective rounds",
            "Track candidate-level integrity & scores",
            "Export ready-to-share leaderboards for recruiters",
          ]}
          ctaHref="/b2b/onboarding"
          ctaLabel="Set up your college free"
        />
        <AudienceCard
          id="companies"
          icon={Briefcase}
          eyebrow="For Companies & HR"
          title="Stop wasting engineering hours on screening."
          points={[
            "Reuse your question bank across roles",
            "Auto-grade MCQ + SQL, manually grade code",
            "Built-in proctoring with full event log",
            "Standardize assessments across every hiring loop",
          ]}
          ctaHref="/b2b/onboarding"
          ctaLabel="Start hiring smarter"
        />
      </section>

      {/* ROI / Outcomes */}
      <section id="roi" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">Real outcomes</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Numbers customers see in week one.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              { i: TrendingUp, v: "80%", t: "Faster screening", d: "Average reduction in time-to-shortlist across our top 50 customers." },
              { i: ShieldCheck, v: "12×", t: "Cheating caught", d: "Compared to honor-system take-homes, with full proctoring evidence." },
              { i: Clock, v: "<60s", t: "Setup to live", d: "From signing up to inviting your first candidate batch." },
            ].map((s) => (
              <div key={s.t} className="b2b-card p-6">
                <s.i className="h-5 w-5 text-[hsl(var(--primary))]" />
                <div className={`mt-3 text-3xl font-semibold tracking-tight ${amberGradientText}`}>{s.v}</div>
                <p className="mt-1 font-medium">{s.t}</p>
                <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">How it works</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">From draft to insight in three steps.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              { n: "01", t: "Build", d: "Author questions in the bank, group them into sections, and set duration & proctoring.", icon: FileCheck2 },
              { n: "02", t: "Invite", d: "Add candidates by email or CSV. Each gets a unique, single-use join link.", icon: Users },
              { n: "03", t: "Evaluate", d: "Watch attempts roll in, grade subjective answers, and export the leaderboard.", icon: BarChart3 },
            ].map((s) => (
              <div key={s.n} className="b2b-card p-6 relative">
                <div className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{s.n}</div>
                <s.icon className="h-5 w-5 text-[hsl(var(--primary))] mt-3" />
                <h3 className="mt-3 font-semibold text-lg tracking-tight">{s.t}</h3>
                <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">Platform</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Everything you need, nothing you don't.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Code2, t: "4 question types", d: "Coding, MCQ, SQL and long-form subjective in one assessment." },
            { icon: ShieldCheck, t: "Browser proctoring", d: "Tab-switch, fullscreen, copy/paste and right-click monitoring." },
            { icon: CheckCircle2, t: "Auto-grading", d: "MCQ and SQL exact-match scored instantly on submission." },
            { icon: BarChart3, t: "Integrity scoring", d: "Per-event penalties surface a single integrity score per attempt." },
            { icon: Clock, t: "Hard timer", d: "Server-anchored deadline with automatic submission on timeout." },
            { icon: Lock, t: "Role-based access", d: "Owner, admin, recruiter and viewer roles per organization." },
            { icon: Users, t: "Bulk candidate invites", d: "Paste a CSV — each candidate gets a unique join link." },
            { icon: FileCheck2, t: "Manual grading", d: "Score subjective and code answers question-by-question." },
            { icon: Zap, t: "Zero install", d: "Runs in any modern browser. No plugins or downloads." },
          ].map((f) => (
            <div key={f.t} className="b2b-card p-5 hover:border-[hsl(var(--primary))]/40 transition-colors">
              <f.icon className="h-5 w-5 text-[hsl(var(--primary))]" />
              <p className="mt-3 font-medium">{f.t}</p>
              <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">Customers</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Teams that switched, never went back.</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {[
              {
                q: "We screened 1,800 students in 4 days. Last year that took us 6 weeks across 3 spreadsheets.",
                n: "Priya Menon",
                r: "TPO, Engineering College",
              },
              {
                q: "The integrity score saved us from at least a dozen bad hires in our last campus drive.",
                n: "Arjun Rao",
                r: "Engineering Manager, FinTech",
              },
              {
                q: "Our recruiters set up a full coding round in under 10 minutes. No engineer involved.",
                n: "Sara Khan",
                r: "Head of Talent, SaaS Co.",
              },
            ].map((t) => (
              <div key={t.n} className="b2b-card p-6 flex flex-col">
                <Quote className="h-5 w-5 text-[hsl(var(--primary))]" />
                <p className="mt-3 text-sm leading-relaxed">"{t.q}"</p>
                <div className="mt-5 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[hsl(var(--primary))] text-[hsl(var(--primary))]" />
                    ))}
                  </div>
                  <p className="text-sm font-medium">{t.n}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.r}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">FAQ</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How long does setup take?", a: "Under 60 seconds. Sign up, create your org, build (or import) an assessment, and invite candidates by CSV." },
              { q: "Is there a free trial?", a: "Yes — 14 days, all features included, no credit card required. Cancel anytime." },
              { q: "How does proctoring work?", a: "Browser-level: tab-switch, fullscreen exit, copy/paste, right-click and focus loss are all logged with timestamps. You get a per-attempt integrity score." },
              { q: "Can candidates use ChatGPT?", a: "We detect copy/paste, paste velocity and tab switches. Our integrity score surfaces likely AI-assisted attempts so you can review them." },
              { q: "Do you support custom branding?", a: "Yes. Add your logo, colors and a custom subdomain on Pro plans." },
              { q: "Is my data secure?", a: "All data is encrypted in transit and at rest. We follow SOC2-aligned controls and provide full audit trails." },
            ].map((f) => (
              <details key={f.q} className="b2b-card p-5 group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm">
                  {f.q}
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section id="demo" className="border-t border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="b2b-card p-10 sm:p-14 text-center bg-gradient-to-br from-[hsl(var(--primary))]/10 to-transparent">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5 text-xs font-medium text-[hsl(var(--primary))] mb-5">
              <Sparkles className="h-3 w-3" /> Limited: Free onboarding for the first 50 orgs this month
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl mx-auto">
              Run your next assessment in under 5 minutes.
            </h2>
            <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Spin up an organization, build your first assessment, and invite candidates — all before your coffee gets cold.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
                <Link to="/b2b/onboarding" onClick={() => trackLeadEvent("b2b_footer_cta_click", { cta: "create_org" })}>
                  Create your organization <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="mailto:sales@parikshaa.app" onClick={() => trackLeadEvent("b2b_footer_cta_click", { cta: "talk_sales" })}>
                  Talk to sales
                </a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
              No credit card · No call required to get started
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <p>© {new Date().getFullYear()} Parikshaa. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/login" className="hover:text-[hsl(var(--foreground))]">Sign in</Link>
            <Link to="/b2b/onboarding" className="hover:text-[hsl(var(--foreground))]">Get started</Link>
            <a href="mailto:sales@parikshaa.app" className="hover:text-[hsl(var(--foreground))]">Contact sales</a>
          </div>
        </div>
      </footer>
      </div>

      {/* Sticky CTA */}
      {showStickyCta && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md sm:max-w-lg animate-in fade-in slide-in-from-bottom-4">
          <div className="b2b-card flex items-center gap-3 p-3 pl-4 shadow-2xl bg-[hsl(var(--card))]">
            <p className="text-sm font-medium flex-1 hidden sm:block">Ready to see Parikshaa in action?</p>
            <p className="text-sm font-medium flex-1 sm:hidden">See Parikshaa in action</p>
            <Button asChild size="sm" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
              <Link to="/b2b/onboarding" onClick={() => trackLeadEvent("b2b_sticky_cta_click")}>
                Start free <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const FREE_EMAIL_RE = /@(gmail|yahoo|hotmail|outlook|icloud|proton|aol|live|rediffmail)\./i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function DemoLeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});
  const [hasStarted, setHasStarted] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);

  const errors = (() => {
    const e: { name?: string; email?: string } = {};
    if (touched.name) {
      if (!name.trim()) e.name = "Please enter your full name";
      else if (name.trim().length < 2) e.name = "Name is too short";
    }
    if (touched.email) {
      const v = email.trim();
      if (!v) e.email = "Work email is required";
      else if (!EMAIL_RE.test(v)) e.email = "Enter a valid email like name@company.com";
      else if (FREE_EMAIL_RE.test(v)) e.email = "Please use your work email (not a personal address)";
    }
    return e;
  })();

  const markStarted = () => {
    if (!hasStarted) {
      setHasStarted(true);
      void trackLeadEvent("b2b_hero_form_start");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    // Re-evaluate against the synchronous values
    const v = email.trim();
    const finalErrors: { name?: string; email?: string } = {};
    if (!name.trim()) finalErrors.name = "Please enter your full name";
    else if (name.trim().length < 2) finalErrors.name = "Name is too short";
    if (!v) finalErrors.email = "Work email is required";
    else if (!EMAIL_RE.test(v)) finalErrors.email = "Enter a valid email like name@company.com";
    else if (FREE_EMAIL_RE.test(v)) finalErrors.email = "Please use your work email (not a personal address)";
    if (Object.keys(finalErrors).length) {
      toast.error("Fix the highlighted fields to continue");
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const utm = getStoredUtm();
      const { data: res, error } = await supabase.functions.invoke("submit-demo-request", {
        body: {
          name: name.trim(),
          email: v,
          organization: v.split("@")[1]?.split(".")[0] ?? "—",
          source: "b2b_landing_hero",
          notes: "Quick capture from /b2b hero",
          utm: { ...utm, content: utm.content || "b2b_landing_hero" },
          referrer: document.referrer || null,
          landingPage: window.location.pathname + window.location.search,
        },
      });
      if (error || (res as { error?: string } | null)?.error) {
        const msg = (res as { error?: string } | null)?.error || error?.message || "Something went wrong.";
        setServerError(msg);
        toast.error(msg);
        await trackLeadEvent("b2b_hero_form_failed", { reason: msg });
        return;
      }
      setCalendarUrl((res as { calendar_url?: string } | null)?.calendar_url ?? null);
      await trackLeadEvent("b2b_hero_form_submit", { email: v });
      setSubmitted(true);
      toast.success("Got it — check your inbox for next steps.");
    } catch (err) {
      console.error(err);
      const msg = "Something went wrong. Please try again or email sales@parikshaa.app.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="b2b-card p-7 text-center animate-in fade-in slide-in-from-bottom-2">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/15 grid place-items-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">You're on the list.</h3>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          We just emailed <span className="font-medium text-[hsl(var(--foreground))]">{email}</span> with next steps and a link to pick a 15-min slot.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          {calendarUrl && (
            <Button
              asChild
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                Book a slot now <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/b2b/onboarding">Or start free</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="b2b-card p-6 sm:p-7">
      <h3 className="text-lg font-semibold tracking-tight">Book a tailored demo</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
        Just two fields. We'll email you a calendar link.
      </p>
      <div className="mt-5 space-y-3">
        <div>
          <Input
            placeholder="Your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markStarted();
            }}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "lead-name-err" : undefined}
            disabled={submitting}
          />
          {errors.name && (
            <p id="lead-name-err" className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>
        <div>
          <Input
            type="email"
            placeholder="you@yourcompany.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              markStarted();
            }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "lead-email-err" : undefined}
            disabled={submitting}
          />
          {errors.email && (
            <p id="lead-email-err" className="text-xs text-red-400 mt-1">{errors.email}</p>
          )}
        </div>
      </div>
      {serverError && (
        <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {serverError}
        </div>
      )}
      <Button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
      >
        {submitting ? "Sending…" : "Get my demo"}
        {!submitting && <ArrowRight className="h-4 w-4 ml-1" />}
      </Button>
      <p className="mt-3 text-[11px] text-[hsl(var(--muted-foreground))] text-center">
        Takes 10 seconds. No credit card. Unsubscribe anytime.
      </p>
    </form>
  );
}

function AudienceCard({
  id,
  icon: Icon,
  eyebrow,
  title,
  points,
  ctaHref,
  ctaLabel,
}: {
  id?: string;
  icon: typeof GraduationCap;
  eyebrow: string;
  title: string;
  points: string[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div id={id} className="b2b-card p-8 flex flex-col">
      <div className="h-10 w-10 rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">{eyebrow}</p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h3>
      <ul className="mt-5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <Button asChild variant="outline">
          <Link to={ctaHref}>{ctaLabel} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
        </Button>
      </div>
    </div>
  );
}
