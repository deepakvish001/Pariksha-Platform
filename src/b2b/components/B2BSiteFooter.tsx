import { Link } from "react-router-dom";

/**
 * Lightweight marketing footer for Parikshaa for Teams.
 * Mirrors the muted glassmorphic feel of the B2B header.
 */
export function B2BSiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-[hsl(var(--muted-foreground))] sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-[hsl(var(--primary))] text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
            P
          </div>
          <span>
            © {new Date().getFullYear()} Parikshaa · by Byteskill
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link to="/b2b" className="hover:text-[hsl(var(--foreground))]">
            Overview
          </Link>
          <Link to="/pricing" className="hover:text-[hsl(var(--foreground))]">
            Pricing
          </Link>
          <Link to="/privacy" className="hover:text-[hsl(var(--foreground))]">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-[hsl(var(--foreground))]">
            Terms
          </Link>
          <a
            href="mailto:hello@byteskill.in"
            className="hover:text-[hsl(var(--foreground))]"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
