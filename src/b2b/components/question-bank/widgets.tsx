import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "./types";

export function TagInput({
  value,
  onChange,
  placeholder = "Add tag and press Enter",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().toLowerCase();
    if (!v) return;
    if (value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  );
}

export function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (v: Difficulty) => void;
}) {
  const items: { v: Difficulty; label: string; tone: string }[] = [
    { v: "easy", label: "Easy", tone: "text-emerald-500 border-emerald-500/50" },
    { v: "medium", label: "Medium", tone: "text-amber-500 border-amber-500/50" },
    { v: "hard", label: "Hard", tone: "text-rose-500 border-rose-500/50" },
  ];
  return (
    <div className="flex gap-1.5">
      {items.map((i) => {
        const active = value === i.v;
        return (
          <button
            key={i.v}
            type="button"
            onClick={() => onChange(i.v)}
            className={`flex-1 px-3 py-2 rounded-md border text-sm font-medium transition ${
              active
                ? `${i.tone} bg-[hsl(var(--secondary))]`
                : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

export function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel = "Add",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  const update = (i: number, v: string) =>
    onChange(value.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={v}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
          />
          <Button variant="ghost" size="sm" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}

export function ValidationHint({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`text-xs ${
        ok ? "text-emerald-600 dark:text-emerald-400" : "text-[hsl(var(--muted-foreground))]"
      }`}
    >
      {children}
    </p>
  );
}
