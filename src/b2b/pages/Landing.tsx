import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import "../theme.css";
import { B2BBackdrop, amberGradientText } from "../components/B2BBackdrop";
import { B2BSiteHeader } from "../components/B2BSiteHeader";

export default function B2BLanding() {
  return (
    <div className="theme-b2b relative min-h-screen overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <B2BBackdrop />
      <B2BSiteHeader
        links={[
          { label: "Overview", to: "/b2b" },
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
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-xs font-medium text-[hsl(var(--muted-foreground))]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Trusted by placement cells and hiring teams
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-semibold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            Coding assessments candidates <span className={amberGradientText}>actually trust</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
            Parikshaa gives placement cells and recruiters everything to create, deliver, and evaluate
            coding tests at scale — with built-in proctoring, automatic grading, and integrity scoring.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
              <Link to="/b2b/onboarding">Set up your organization <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="mailto:sales@parikshaa.app">Talk to sales</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
            Free to set up · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Stats / proof band */}
      <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { v: "4", l: "Question types" },
            { v: "100%", l: "Browser-based" },
            { v: "<60s", l: "Invite to live" },
            { v: "0", l: "Plugins required" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{s.v}</div>
              <div className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Two audiences */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-6">
        <AudienceCard
          id="colleges"
          icon={GraduationCap}
          eyebrow="For Colleges & TPOs"
          title="Streamline your placement assessments."
          points={[
            "Bulk-invite a batch in seconds via CSV",
            "Mix coding, MCQ, SQL & subjective rounds",
            "Track candidate-level integrity & scores",
            "Export results to share with recruiters",
          ]}
          ctaHref="/b2b/onboarding"
          ctaLabel="Set up your college"
        />
        <AudienceCard
          id="companies"
          icon={Briefcase}
          eyebrow="For Companies & HR"
          title="Hire developers without the hassle."
          points={[
            "Reuse your question bank across roles",
            "Auto-grade MCQ + SQL, manually grade code",
            "Built-in proctoring with event log",
            "Standardize assessments per role",
          ]}
          ctaHref="/b2b/onboarding"
          ctaLabel="Start hiring"
        />
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))]">
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

      {/* CTA band */}
      <section className="border-t border-[hsl(var(--border))]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="b2b-card p-10 sm:p-14 text-center bg-gradient-to-br from-[hsl(var(--primary))]/8 to-transparent">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl mx-auto">
              Ready to run your next assessment?
            </h2>
            <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Spin up an organization, build your first assessment, and invite candidates — all in under five minutes.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
                <Link to="/b2b/onboarding">Create your organization <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/b2b/dashboard">Go to dashboard</Link>
              </Button>
            </div>
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
    </div>
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
