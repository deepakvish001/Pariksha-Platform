import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type NavLink = { label: string; to: string };

/**
 * Public marketing header for Parikshaa for Teams pages.
 * Mirrors the main landing-page Navbar: fixed, scroll-aware backdrop blur,
 * h-16 row, and the same border/shadow transitions.
 */
export function B2BSiteHeader({
  links = DEFAULT_LINKS,
  ctaTo = "/b2b/onboarding",
  ctaLabel = "Get started",
}: {
  links?: NavLink[];
  ctaTo?: string;
  ctaLabel?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[hsl(var(--background))]/90 backdrop-blur-xl border-b border-[hsl(var(--border))] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/b2b" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] grid place-items-center font-bold">
              P
            </div>
            <span className="font-semibold tracking-tight text-[15px]">
              Parikshaa{" "}
              <span className="text-[hsl(var(--muted-foreground))] font-normal">for Teams</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`transition-colors ${
                    active
                      ? "text-[hsl(var(--primary))] font-medium"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Sign in
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
            >
              <Link to={ctaTo}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

const DEFAULT_LINKS: NavLink[] = [
  { label: "Overview", to: "/b2b" },
  { label: "Pricing", to: "/pricing" },
];
