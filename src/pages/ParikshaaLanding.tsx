import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Code2,
  Users,
  Sparkles,
  BarChart3,
  Zap,
} from "lucide-react";
import "@/b2b/theme.css";
import { B2BBackdrop, amberGradientText } from "@/b2b/components/B2BBackdrop";
import { B2BSiteHeader } from "@/b2b/components/B2BSiteHeader";

const CompanyLogos = lazy(() => import("@/components/CompanyLogos"));

export default function ParikshaaLanding() {
  return (
    <div className="theme-b2b relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <B2BBackdrop />
      <B2BSiteHeader
        links={[
          { label: "Learn", to: "/learn" },
          { label: "For Teams", to: "/b2b" },
          { label: "Pricing", to: "/pricing" },
        ]}
        ctaTo="/learn"
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
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
            One platform. Two outcomes.
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Learn to code.{" "}
            <span className={amberGradientText}>Get hired with proof.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Parikshaa is a free learning platform for students and a serious assessment platform
            for hiring teams and placement cells — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <Link to="/learn">
                Learn (Free) <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/b2b/onboarding">For Teams · Hire & Assess</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
            Already invited to a test?{" "}
            <Link to="/login" className="text-[hsl(var(--primary))] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { v: "Free", l: "For students" },
            { v: "4", l: "Question types" },
            { v: "<60s", l: "Invite to live" },
            { v: "100%", l: "Browser-based" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{s.v}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide mt-1">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two pillars */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-6">
        <PillarCard
          icon={BookOpen}
          eyebrow="Free for students"
          title="Learn"
          subtitle="Sheets, roadmaps, contests, AI mentor."
          points={[
            "DSA, SQL, system design & interview sheets",
            "Personalised roadmaps with progress tracking",
            "Daily coding challenges & weekly contests",
            "AI assistant for doubts and study plans",
          ]}
          ctaHref="/learn"
          ctaLabel="Start learning — free"
          ctaPrimary
        />
        <PillarCard
          icon={Briefcase}
          eyebrow="For colleges & companies"
          title="Hire & Assess"
          subtitle="Run real coding rounds without the chaos."
          points={[
            "Coding, MCQ, SQL & subjective in one test",
            "Browser proctoring with integrity scoring",
            "Bulk-invite candidates by CSV in seconds",
            "Auto-grade objective answers, score code manually",
          ]}
          ctaHref="/b2b/onboarding"
          ctaLabel="Set up your organization"
        />
      </section>

      {/* Logos */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <Suspense fallback={<div className="h-32" />}>
          <CompanyLogos />
        </Suspense>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10">
          <FlowColumn
            tag="For students"
            icon={GraduationCap}
            steps={[
              { n: "01", t: "Sign up free", d: "Create your Parikshaa account in seconds." },
              { n: "02", t: "Pick a sheet or roadmap", d: "DSA, SQL, system design, fundamentals — your call." },
              { n: "03", t: "Practice & track", d: "Solve, get scored, climb the leaderboard." },
            ]}
          />
          <FlowColumn
            tag="For teams"
            icon={Briefcase}
            steps={[
              { n: "01", t: "Build the test", d: "Mix coding, MCQ, SQL & subjective questions." },
              { n: "02", t: "Invite candidates", d: "Paste a CSV — each gets a unique join link." },
              { n: "03", t: "Review results", d: "See scores, integrity events and a shareable leaderboard." },
            ]}
          />
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">
              Platform
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">
              Everything you need, nothing you don't.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Code2, t: "4 question types", d: "Coding, MCQ, SQL and long-form subjective in one assessment." },
              { icon: ShieldCheck, t: "Browser proctoring", d: "Tab-switch, fullscreen and event monitoring built-in." },
              { icon: BarChart3, t: "Integrity scoring", d: "A single trust score per attempt, backed by event log." },
              { icon: Users, t: "Bulk invites", d: "Paste a CSV and every candidate gets a unique link." },
              { icon: BookOpen, t: "Curated learning", d: "Free sheets, roadmaps and AI-powered study plans." },
              { icon: Zap, t: "Zero install", d: "Runs in any modern browser. No plugins or downloads." },
            ].map((f) => (
              <div
                key={f.t}
                className="b2b-card p-5 hover:border-[hsl(var(--primary))]/40 transition-colors"
              >
                <f.icon className="h-5 w-5 text-[hsl(var(--primary))]" />
                <p className="mt-3 font-medium">{f.t}</p>
                <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="b2b-card p-10 sm:p-14 text-center bg-gradient-to-br from-[hsl(var(--primary))]/8 to-transparent">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl mx-auto">
              Pick a side. Or use both.
            </h2>
            <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Students learn for free. Teams run their next round in under five minutes.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              >
                <Link to="/learn">
                  Start learning <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      </div>
    </div>
  );
}

// Legacy header retained for compatibility (no longer used).
function SiteHeader() {
  return (
    <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">
            P
          </div>
          <span className="font-semibold tracking-tight text-[15px]">Parikshaa</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-[hsl(var(--muted-foreground))]">
          <Link to="/learn" className="hover:text-[hsl(var(--foreground))]">
            Learn
          </Link>
          <Link to="/b2b" className="hover:text-[hsl(var(--foreground))]">
            For Teams
          </Link>
          <Link to="/pricing" className="hover:text-[hsl(var(--foreground))]">
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
            <Link to="/learn">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
        <p>© {new Date().getFullYear()} Parikshaa. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link to="/learn" className="hover:text-[hsl(var(--foreground))]">
            Learn
          </Link>
          <Link to="/b2b" className="hover:text-[hsl(var(--foreground))]">
            For Teams
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
  );
}

function PillarCard({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  points,
  ctaHref,
  ctaLabel,
  ctaPrimary,
}: {
  icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
  ctaHref: string;
  ctaLabel: string;
  ctaPrimary?: boolean;
}) {
  return (
    <div className="b2b-card p-8 flex flex-col">
      <div className="h-10 w-10 rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
      <ul className="mt-5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        {ctaPrimary ? (
          <Button
            asChild
            className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            <Link to={ctaHref}>
              {ctaLabel} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to={ctaHref}>
              {ctaLabel} <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function FlowColumn({
  tag,
  icon: Icon,
  steps,
}: {
  tag: string;
  icon: typeof GraduationCap;
  steps: { n: string; t: string; d: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs uppercase tracking-wider text-[hsl(var(--primary))] font-medium">
          {tag}
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {steps.map((s) => (
          <div key={s.n} className="b2b-card p-5">
            <div className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{s.n}</div>
            <h3 className="mt-1.5 font-semibold tracking-tight">{s.t}</h3>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
