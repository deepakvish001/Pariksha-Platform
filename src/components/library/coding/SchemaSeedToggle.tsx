// Collapsible panel that lets a user inspect the exact schema DDL and seed
// DML used by the SQL execution sandbox. Includes a "Copy" button per
// section so the user can paste it into a local SQLite shell to reproduce.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Copy, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface SchemaSeedToggleProps {
  schema: string;
  seed: string;
  defaultOpen?: boolean;
  className?: string;
  /** If true, renders a more compact variant (no big icon). */
  compact?: boolean;
}

const CopyBtn = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-[10px] gap-1"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore — clipboard may be blocked */
        }
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
};

export const SchemaSeedToggle = ({
  schema,
  seed,
  defaultOpen = false,
  className,
  compact = false,
}: SchemaSeedToggleProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = "schema-seed-panel";

  return (
    <div
      className={cn(
        "rounded-md border bg-muted/30 overflow-hidden",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide schema and seed data" : "Show schema and seed data"}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 text-left hover:bg-muted/50 transition-colors",
          compact ? "py-1.5" : "py-2",
        )}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {!compact && <Database className="h-3.5 w-3.5" />}
          Schema &amp; seed data (SQLite)
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="border-t" role="region" aria-label="Execution dataset">
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-border/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Schema (DDL)
            </span>
            <CopyBtn text={schema} label="schema DDL" />
          </div>
          <pre className="text-xs px-3 py-2 overflow-x-auto whitespace-pre font-mono">
            <code>{schema.trim() || "-- (empty)"}</code>
          </pre>
          <div className="flex items-center justify-between px-3 pt-2 pb-1 border-y border-border/60">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seed (DML)
            </span>
            <CopyBtn text={seed} label="seed DML" />
          </div>
          <pre className="text-xs px-3 py-2 overflow-x-auto whitespace-pre font-mono">
            <code>{seed.trim() || "-- (empty)"}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
