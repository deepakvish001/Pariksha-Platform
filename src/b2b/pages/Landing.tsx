import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, BarChart3, Code2 } from "lucide-react";
import "../theme.css";

export default function B2BLanding() {
  return (
    <div className="theme-b2b min-h-screen">
      <header className="border-b bg-[hsl(var(--card))]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/b2b" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">P</div>
            <span className="font-semibold tracking-tight">Parikshaa for Teams</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">Sign in</Link>
            <Button asChild className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
              <Link to="/b2b/onboarding">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="inline-block px-3 py-1 rounded-full bg-[hsl(var(--secondary))] text-xs font-medium tracking-wide text-[hsl(var(--primary))]">
          For colleges & hiring teams
        </p>
        <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
          Run secure coding assessments candidates actually trust.
        </h1>
        <p className="mt-4 text-base text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
          Parikshaa gives placement cells and recruiters the tools to create, deliver, and evaluate
          coding tests at scale — with built-in proctoring and integrity scoring.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90">
            <Link to="/b2b/onboarding">Set up your organization</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/pricing">Talk to sales</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Code2, t: "Coding, MCQ, SQL", d: "Mix multiple question types in one assessment." },
          { icon: ShieldCheck, t: "Built-in proctoring", d: "Tab-switch, fullscreen, and snapshot monitoring." },
          { icon: CheckCircle2, t: "Auto-graded", d: "Instant scoring with hidden test cases." },
          { icon: BarChart3, t: "Real analytics", d: "Leaderboards, percentiles, and integrity reports." },
        ].map((f) => (
          <div key={f.t} className="b2b-card p-5">
            <f.icon className="h-5 w-5 text-[hsl(var(--primary))]" />
            <p className="mt-3 font-medium">{f.t}</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
