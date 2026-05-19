import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short list of fields that will land here when shipped. */
  fields?: string[];
}

export function ComingSoonSection({ icon: Icon, title, description, fields }: Props) {
  return (
    <div className="b2b-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--muted))]/40 text-[hsl(var(--muted-foreground))]">
          <Lock className="h-3 w-3" /> Coming soon
        </span>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      {fields && fields.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
          {fields.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-[hsl(var(--muted-foreground))]/60" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
