import { useMemo, useState } from "react";
import { useRoleAudit, RoleAuditEntry } from "@/hooks/admin/useRoleAudit";
import { useAdminUsers } from "@/hooks/admin/useAdminControl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollText, ShieldCheck, ShieldOff, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ActionBadge = ({ action }: { action: RoleAuditEntry["action"] }) =>
  action === "grant_role" ? (
    <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">
      <ShieldCheck className="mr-1 h-3 w-3" /> Granted
    </Badge>
  ) : (
    <Badge variant="destructive" className="bg-red-500/15 text-red-400 hover:bg-red-500/20">
      <ShieldOff className="mr-1 h-3 w-3" /> Revoked
    </Badge>
  );

export const RoleAuditLog = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [action, setAction] = useState<"grant_role" | "revoke_role" | null>(null);
  const [search, setSearch] = useState("");

  const { data: users = [] } = useAdminUsers("", 500);
  const { data: entries = [], isLoading } = useRoleAudit({ userId, action });

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.actor_name?.toLowerCase().includes(q) ||
        e.actor_email?.toLowerCase().includes(q) ||
        e.target_name?.toLowerCase().includes(q) ||
        e.target_email?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const hasFilters = !!(userId || action || search);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">Audit Log</h2>
        <span className="text-xs text-muted-foreground">({filtered.length})</span>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_220px_180px_auto]">
        <Input
          placeholder="Search actor, target, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
        <Select value={userId ?? "all"} onValueChange={(v) => setUserId(v === "all" ? null : v)}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Filter by user" /></SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all">All users</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.user_id} value={u.user_id}>
                {u.full_name ?? u.email ?? u.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action ?? "all"} onValueChange={(v) => setAction(v === "all" ? null : (v as any))}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="grant_role">Grants</SelectItem>
            <SelectItem value="revoke_role">Revokes</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setUserId(null); setAction(null); setSearch(""); }}
          >
            <X className="mr-1 h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Actor</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground"></td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No audit entries</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-border/30 hover:bg-muted/20">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                </td>
                <td className="px-3 py-2"><ActionBadge action={e.action} /></td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="font-mono text-xs">{e.role ?? "—"}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{e.target_name ?? "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">{e.target_email ?? e.target_user_id?.slice(0, 8)}</div>
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium">{e.actor_name ?? "System"}</div>
                  <div className="text-xs text-muted-foreground">{e.actor_email ?? e.actor_id?.slice(0, 8)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
