import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Library, Loader2, Trash2 } from "lucide-react";
import {
  LIBRARY_CATEGORIES,
  useHiddenLibraryItems,
  useToggleLibraryItem,
  useLibraryCategoryFlag,
} from "@/hooks/admin/useLibraryCuration";

const CategoryRow = ({ id, label }: { id: string; label: string }) => {
  const { enabled, isLoading, setFlag } = useLibraryCategoryFlag(id);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">Category key: library.{id}.enabled</div>
      </div>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Switch checked={enabled} onCheckedChange={(v) => setFlag(v)} />
      )}
    </div>
  );
};

export default function LibraryCuration() {
  const { data: hidden, isLoading } = useHiddenLibraryItems();
  const toggle = useToggleLibraryItem();

  return (
    <AdminShell>
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Library className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Library Curation</h1>
            <p className="text-sm text-muted-foreground">
              Toggle whole library categories on/off and review hidden items.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category visibility</CardTitle>
          </CardHeader>
          <CardContent>
            {LIBRARY_CATEGORIES.map((c) => (
              <CategoryRow key={c.id} id={c.id} label={c.label} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hidden items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !hidden?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No items currently hidden.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {hidden.map((h) => (
                  <div
                    key={`${h.category}-${h.item_id}`}
                    className="flex items-center gap-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-mono truncate">{h.item_id}</div>
                      <div className="text-xs text-muted-foreground">{h.category}</div>
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      onClick={() =>
                        toggle.mutate({ category: h.category, item_id: h.item_id, hide: false })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Restore
                    </button>
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
