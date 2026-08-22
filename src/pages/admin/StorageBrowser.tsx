import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database, Trash2, Copy, FolderOpen } from "lucide-react";

const BUCKETS = ["problem-assets", "avatars", "resumes"] as const;

const StorageBrowser = () => {
  const [bucket, setBucket] = useState<string>(BUCKETS[0]);
  const [prefix, setPrefix] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bucket, prefix]);

  const publicUrl = (name: string) => supabase.storage.from(bucket).getPublicUrl(`${prefix ? prefix + "/" : ""}${name}`).data.publicUrl;

  const del = async (name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    const path = `${prefix ? prefix + "/" : ""}${name}`;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    load();
  };

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold"><Database className="h-5 w-5" /> Storage Browser</h1>
      <p className="mb-4 text-sm text-muted-foreground">Browse and clean up storage buckets.</p>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select value={bucket} onValueChange={(v) => { setBucket(v); setPrefix(""); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUCKETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input aria-label="Folder prefix" placeholder="folder prefix (optional)" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="max-w-sm" />
          <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground"></p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Size</th>
                  <th className="px-2 py-2">Updated</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const isFolder = !it.id;
                  return (
                    <tr key={it.name} className="border-b border-border/30">
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          {isFolder && <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                          {isFolder ? (
                            <button className="underline" onClick={() => setPrefix(prefix ? `${prefix}/${it.name}` : it.name)}>{it.name}</button>
                          ) : <span>{it.name}</span>}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">{it.metadata?.size ?? "—"}</td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        {it.updated_at ? new Date(it.updated_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {!isFolder && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(publicUrl(it.name)); toast({ title: "URL copied" }); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del(it.name)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-muted-foreground">Empty</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {prefix && (
          <Button variant="link" size="sm" onClick={() => setPrefix(prefix.split("/").slice(0, -1).join("/"))}>← up</Button>
        )}
      </Card>
    </AdminShell>
  );
};

export default StorageBrowser;
