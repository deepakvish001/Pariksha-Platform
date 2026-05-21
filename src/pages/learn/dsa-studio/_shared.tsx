import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ListChecks, Puzzle, Wrench, AlertTriangle, ArrowLeft, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const STUDIO_TABS = [
  { id: "problems", label: "Problems", icon: ListChecks, accent: "text-sky-400", to: "/learn/dsa-studio/problems" },
  { id: "patterns", label: "Common Patterns", icon: Puzzle, accent: "text-emerald-400", to: "/learn/dsa-studio/patterns" },
  { id: "tricks", label: "Code Tricks", icon: Wrench, accent: "text-amber-400", to: "/learn/dsa-studio/tricks" },
  { id: "edge", label: "Edge Cases", icon: AlertTriangle, accent: "text-orange-400", to: "/learn/dsa-studio/edge" },
  { id: "journal", label: "Practice Journal", icon: BookMarked, accent: "text-violet-400", to: "/learn/dsa-studio/journal" },
];

export function StudioTabs() {
  const { pathname } = useLocation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
      {STUDIO_TABS.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.to || pathname.startsWith(t.to + "/");
        return (
          <Link
            key={t.id}
            to={t.to}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-all",
              active
                ? "border-primary/50 bg-primary/10 text-primary shadow-md shadow-primary/10"
                : "border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-primary" : t.accent)} />
            <span className="font-medium">{t.label}</span>
          </Link>
        );
      })}
    </motion.div>
  );
}

interface SectionCardProps {
  icon: typeof ListChecks;
  title: string;
  subtitle?: string;
  accent?: string;
  badge?: string;
  links?: { label: string; to: string; external?: boolean }[];
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  accent = "text-primary",
  badge,
  links,
  children,
  className,
}: SectionCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-border/40 bg-card/40 p-5 md:p-6 space-y-4",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn("h-10 w-10 rounded-xl bg-card/60 border border-border/40 flex items-center justify-center shrink-0", accent)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              {title}
              {badge && (
                <Badge className="h-5 text-[10px] bg-primary/15 text-primary border-primary/30">
                  {badge}
                </Badge>
              )}
            </h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {links && links.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {links.map((l) =>
              l.external ? (
                <a
                  key={l.to}
                  href={l.to}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2.5 py-1 rounded-md border border-border/60 bg-card/40 hover:border-primary/50 hover:text-primary transition"
                >
                  {l.label} ↗
                </a>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  className="text-xs px-2.5 py-1 rounded-md border border-border/60 bg-card/40 hover:border-primary/50 hover:text-primary transition"
                >
                  {l.label} →
                </Link>
              ),
            )}
          </div>
        )}
      </header>
      <div>{children}</div>
    </motion.section>
  );
}

interface StudioPageShellProps {
  title: string;
  description: string;
  canonicalPath: string;
  children: ReactNode;
}

export function StudioPageShell({ title, description, canonicalPath, children }: StudioPageShellProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-background text-foreground">
      <Helmet>
        <title>{title} | Parikshaa</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.parikshaa.org${canonicalPath}`} />
      </Helmet>
      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-4 pb-10 space-y-5">
        <Link
          to="/learn/dsa-studio"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to DSA Studio
        </Link>
        <StudioTabs />
        {children}
      </div>
    </div>
  );
}
