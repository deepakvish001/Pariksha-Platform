import { useMemo } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Star, Loader2 } from "lucide-react";
import {
  useRoadmapOverrides,
  useUpsertRoadmapOverride,
  useSetFeaturedRoadmap,
} from "@/hooks/admin/useRoadmapOverrides";
import { roadmapTrees } from "@/data/roadmapTreesData";

export default function RoadmapsManager() {
  const { data: overrides, isLoading } = useRoadmapOverrides();
  const upsert = useUpsertRoadmapOverride();
  const setFeatured = useSetFeaturedRoadmap();

  const map = useMemo(() => {
    const m = new Map<string, { is_published: boolean; is_featured: boolean }>();
    (overrides ?? []).forEach((o) =>
      m.set(o.roadmap_id, { is_published: o.is_published, is_featured: o.is_featured })
    );
    return m;
  }, [overrides]);

  const list = (roadmapTrees ?? []) as any[];

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <MapIcon className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Roadmaps Manager</h1>
            <p className="text-sm text-muted-foreground">
              Publish, hide, or feature any roadmap on the platform.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All roadmaps</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {list.map((r) => {
                  const id = r.id ?? r.slug;
                  const ov = map.get(id) ?? { is_published: true, is_featured: false };
                  return (
                    <div key={id} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {r.title ?? r.name ?? id}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{id}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={ov.is_featured ? "default" : "outline"}
                        onClick={() => setFeatured.mutate(id)}
                        className="h-8"
                      >
                        <Star className="mr-1 h-3 w-3" />
                        {ov.is_featured ? "Featured" : "Feature"}
                      </Button>
                      <Switch
                        checked={ov.is_published}
                        onCheckedChange={(v) =>
                          upsert.mutate({ roadmap_id: id, is_published: v })
                        }
                      />
                    </div>
                  );
                })}
                {!list.length && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No roadmaps registered.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
