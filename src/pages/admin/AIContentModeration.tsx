import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAIContent, useToggleAIContentPublic, useDeleteAIContent } from "@/hooks/admin/useAdminControl";
import { Trash2, Search } from "lucide-react";

const AIContentModeration = () => {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useAdminAIContent(search);
  const toggle = useToggleAIContentPublic();
  const del = useDeleteAIContent();

  return (
    <AdminShell>
      <h1 className="mb-1 text-2xl font-bold">AI Content Moderation</h1>
      <p className="mb-4 text-sm text-muted-foreground">Force-private or delete user-generated AI content.</p>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Likes</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Public</th>
                <th className="px-2 py-2 text-right">Delete</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c: any) => (
                <tr key={c.id} className="border-b border-border/30">
                  <td className="px-2 py-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.topic}</div>
                  </td>
                  <td className="px-2 py-3"><Badge variant="outline">{c.content_type}</Badge></td>
                  <td className="px-2 py-3">{c.likes_count}</td>
                  <td className="px-2 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-2 py-3">
                    <Switch checked={c.is_public}
                      onCheckedChange={(v) => toggle.mutate({ id: c.id, isPublic: v })} />
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Button size="sm" variant="ghost" className="text-destructive"
                      onClick={() => { if (confirm("Delete?")) del.mutate(c.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && data.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No content</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
};

export default AIContentModeration;
