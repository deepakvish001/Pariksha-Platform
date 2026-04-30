import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Share2, X } from "lucide-react";
import { useAdminSharedFolders, useRevokeShare } from "@/hooks/admin/useAdminCoverage";

const FoldersAdmin = () => {
  const list = useAdminSharedFolders(200);
  const revoke = useRevokeShare();

  return (
    <AdminShell>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Folders & Public Shares</h1>
        <p className="text-sm text-muted-foreground">Audit shared folders and revoke public share links.</p>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3"><Share2 className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Active shared folders</h2></div>
        {list.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border/50">
                  <th className="px-2 py-2">Folder</th><th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Code</th><th className="px-2 py-2">Public</th>
                  <th className="px-2 py-2">Allow copy</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((s: any) => (
                  <tr key={s.id} className="border-b border-border/30">
                    <td className="px-2 py-2">{s.folder_name || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-2 py-2">{s.owner_name || s.owner_user_id?.slice(0, 8)}</td>
                    <td className="px-2 py-2 font-mono text-xs">{s.share_code}</td>
                    <td className="px-2 py-2">{s.is_public ? <Badge>public</Badge> : "—"}</td>
                    <td className="px-2 py-2">{s.allow_copy ? "✓" : "—"}</td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-2 py-2 text-right">
                      <Button size="sm" variant="ghost" disabled={revoke.isPending}
                        onClick={() => { if (confirm("Revoke this share link?")) revoke.mutate(s.id); }}>
                        <X className="h-3.5 w-3.5 mr-1 text-destructive" /> Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No public shares.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default FoldersAdmin;
