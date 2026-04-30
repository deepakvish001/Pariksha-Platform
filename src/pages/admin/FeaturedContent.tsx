import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Star, Loader2 } from "lucide-react";
import {
  useFeaturedContent,
  useUpsertFeatured,
  useDeleteFeatured,
} from "@/hooks/admin/useFeaturedContent";

const SLOTS = [
  "landing_hero",
  "landing_secondary",
  "community_top",
  "ai_staff_pick",
  "roadmap_featured",
] as const;

const TARGET_TYPES = ["ai_content", "roadmap", "problem", "company"] as const;

export default function FeaturedContent() {
  const { data, isLoading } = useFeaturedContent();
  const upsert = useUpsertFeatured();
  const del = useDeleteFeatured();

  const [draft, setDraft] = useState({
    slot: SLOTS[0] as string,
    target_type: TARGET_TYPES[0] as string,
    target_id: "",
    weight: 0,
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Star className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Featured / Staff Picks</h1>
            <p className="text-sm text-muted-foreground">
              Pin content into landing slots and the community gallery.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add or update slot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <Label className="text-xs">Slot</Label>
                <Select
                  value={draft.slot}
                  onValueChange={(v) => setDraft((d) => ({ ...d, slot: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={draft.target_type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, target_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TARGET_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs">Target ID / slug</Label>
                <Input
                  value={draft.target_id}
                  onChange={(e) => setDraft((d) => ({ ...d, target_id: e.target.value }))}
                  placeholder="e.g. two-sum or content uuid"
                />
              </div>
              <div>
                <Label className="text-xs">Weight</Label>
                <Input
                  type="number"
                  value={draft.weight}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, weight: Number(e.target.value || 0) }))
                  }
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                disabled={!draft.target_id.trim() || upsert.isPending}
                onClick={() => upsert.mutate(draft)}
              >
                {upsert.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Save slot
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active slots</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No featured slots yet.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {data.map((row) => (
                  <div key={row.slot} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{row.slot}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.target_type} · {row.target_id} · weight {row.weight}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => del.mutate(row.slot)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
