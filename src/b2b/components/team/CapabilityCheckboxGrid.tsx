import { Checkbox } from "@/components/ui/checkbox";
import { CAPABILITY_GROUPS, type Capability } from "@/b2b/hooks/usePermissions";

interface Props {
  value: Capability[];
  onChange: (next: Capability[]) => void;
}

export function CapabilityCheckboxGrid({ value, onChange }: Props) {
  const toggle = (cap: Capability, on: boolean) => {
    const set = new Set(value);
    if (on) set.add(cap);
    else set.delete(cap);
    onChange(Array.from(set) as Capability[]);
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CAPABILITY_GROUPS.map((group) => (
        <div key={group.label} className="rounded-lg border bg-card/50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] mb-2">
            {group.label}
          </div>
          <ul className="space-y-2">
            {group.caps.map((c) => {
              const checked = value.includes(c.key);
              return (
                <li key={c.key} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    id={`cap-${c.key}`}
                    checked={checked}
                    onCheckedChange={(on) => toggle(c.key, !!on)}
                    className="mt-0.5"
                  />
                  <label htmlFor={`cap-${c.key}`} className="cursor-pointer leading-tight">
                    {c.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
