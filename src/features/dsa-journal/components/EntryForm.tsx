import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Link as LinkIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "../types";
import { useCreateEntry, useUpdateEntry, type EntryInput } from "../api";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  topic: z.string().trim().max(80).optional().or(z.literal("")),
  pattern: z.string().trim().max(80).optional().or(z.literal("")),
  algorithm: z.string().trim().max(120).optional().or(z.literal("")),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  personal_difficulty: z.number().min(1).max(5).optional(),
  time_taken_min: z.number().min(0).max(1440).optional(),
  attempts: z.number().min(1).max(99).default(1),
  solved_clean: z.boolean().default(false),
  status: z.enum(["solved", "partial", "stuck"]).default("solved"),
  mistakes: z.string().max(2000).optional().or(z.literal("")),
  learnings: z.string().max(2000).optional().or(z.literal("")),
  notes_md: z.string().max(8000).optional().or(z.literal("")),
  tags: z.string().max(200).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  dayId: string;
  entry?: JournalEntry | null;
  onDone?: () => void;
}

export default function EntryForm({ dayId, entry, onDone }: Props) {
  const create = useCreateEntry();
  const update = useUpdateEntry();
  const editing = !!entry;

  const [links, setLinks] = useState<{ label: string; url: string }[]>(
    entry?.links?.length ? entry.links : [{ label: "", url: "" }],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: entry?.title ?? "",
      topic: entry?.topic ?? "",
      pattern: entry?.pattern ?? "",
      algorithm: entry?.algorithm ?? "",
      difficulty: entry?.difficulty ?? undefined,
      personal_difficulty: entry?.personal_difficulty ?? 3,
      time_taken_min: entry?.time_taken_min ?? undefined,
      attempts: entry?.attempts ?? 1,
      solved_clean: entry?.solved_clean ?? false,
      status: entry?.status ?? "solved",
      mistakes: entry?.mistakes ?? "",
      learnings: entry?.learnings ?? "",
      notes_md: entry?.notes_md ?? "",
      tags: (entry?.tags ?? []).join(", "),
    },
  });

  const onSubmit = async (v: FormValues) => {
    const cleanedLinks = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.url.length > 0);
    const tags = (v.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: EntryInput = {
      day_id: dayId,
      title: v.title.trim(),
      links: cleanedLinks,
      topic: v.topic?.trim() || null,
      pattern: v.pattern?.trim() || null,
      algorithm: v.algorithm?.trim() || null,
      difficulty: v.difficulty ?? null,
      personal_difficulty: v.personal_difficulty ?? null,
      time_taken_min: v.time_taken_min ?? null,
      attempts: v.attempts,
      solved_clean: v.solved_clean,
      status: v.status,
      mistakes: v.mistakes?.trim() || null,
      learnings: v.learnings?.trim() || null,
      notes_md: v.notes_md?.trim() || null,
      tags,
    };

    if (editing && entry) {
      await update.mutateAsync({ id: entry.id, patch: payload as any });
    } else {
      await create.mutateAsync(payload);
    }
    onDone?.();
  };

  const pd = form.watch("personal_difficulty") ?? 3;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
    >
      <div>
        <Label>Problem title *</Label>
        <Input {...form.register("title")} placeholder="e.g. Two Sum" />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <LinkIcon className="h-3.5 w-3.5" /> Links
        </Label>
        {links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="Label (LeetCode)"
              value={l.label}
              className="w-1/3"
              onChange={(e) =>
                setLinks((arr) =>
                  arr.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)),
                )
              }
            />
            <Input
              placeholder="https://..."
              value={l.url}
              onChange={(e) =>
                setLinks((arr) =>
                  arr.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)),
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setLinks((arr) => arr.filter((_, idx) => idx !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLinks((arr) => [...arr, { label: "", url: "" }])}
        >
          <Plus className="h-3 w-3 mr-1" /> Add link
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <Label>Topic</Label>
          <Input {...form.register("topic")} placeholder="Array" />
        </div>
        <div>
          <Label>Pattern</Label>
          <Input {...form.register("pattern")} placeholder="Sliding Window" />
        </div>
        <div>
          <Label>Algorithm</Label>
          <Input {...form.register("algorithm")} placeholder="Two pointers" />
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select
            value={form.watch("difficulty") ?? ""}
            onValueChange={(v) => form.setValue("difficulty", v as any)}
          >
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as any)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="stuck">Stuck — revisit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Time taken (min)</Label>
          <Input
            type="number"
            min={0}
            {...form.register("time_taken_min", { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label>Attempts till correct</Label>
          <Input
            type="number"
            min={1}
            {...form.register("attempts", { valueAsNumber: true })}
          />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label>Solved clean (1 try)</Label>
            <div className="h-10 flex items-center">
              <Switch
                checked={form.watch("solved_clean")}
                onCheckedChange={(c) => form.setValue("solved_clean", c)}
              />
            </div>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>How hard did it feel?</Label>
          <div className="flex items-center gap-1 h-10">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => form.setValue("personal_difficulty", n)}
                className="p-0.5"
                aria-label={`Rate ${n}`}
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition",
                    n <= (pd as number)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Label>Tags (comma separated)</Label>
        <Input {...form.register("tags")} placeholder="hashmap, prefix-sum" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Mistakes made</Label>
          <Textarea
            rows={3}
            {...form.register("mistakes")}
            placeholder="Forgot to handle negative numbers..."
          />
        </div>
        <div>
          <Label>Key learning</Label>
          <Textarea
            rows={3}
            {...form.register("learnings")}
            placeholder="Use prefix sums when range-queries appear"
          />
        </div>
      </div>

      <div>
        <Label>Notes (markdown)</Label>
        <Textarea
          rows={5}
          className="font-mono text-xs"
          {...form.register("notes_md")}
          placeholder={"# Approach\n- ...\n\n```py\n# code\n```"}
        />
      </div>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur pt-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {editing ? "Save changes" : "Log problem"}
        </Button>
      </div>
    </form>
  );
}
