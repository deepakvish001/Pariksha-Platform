import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Check, X, HelpCircle, ShieldQuestion } from "lucide-react";
import {
  usePublicTables, useTablePolicies, evaluatePolicyForRole, AppRoleSelection,
} from "@/hooks/admin/useRlsTester";
import { cn } from "@/lib/utils";

const CMD_LABEL: Record<string, string> = {
  r: "SELECT", a: "INSERT", w: "UPDATE", d: "DELETE", "*": "ALL",
};

const VERDICT: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  allow:   { icon: <Check className="h-3 w-3" />,        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Allow" },
  deny:    { icon: <X className="h-3 w-3" />,            className: "bg-red-500/15 text-red-400 border-red-500/30",             label: "Deny" },
  depends: { icon: <HelpCircle className="h-3 w-3" />,   className: "bg-amber-500/15 text-amber-300 border-amber-500/30",       label: "Depends on row" },
};

const RlsTester = () => {
  const [role, setRole] = useState<AppRoleSelection>("user");
  const [table, setTable] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: tables = [] } = usePublicTables();
  const { data: policies = [], isLoading } = useTablePolicies(table);

  const filteredTables = useMemo(
    () => tables.filter((t) => t.table_name.toLowerCase().includes(search.toLowerCase())),
    [tables, search],
  );

  return (
    <AdminShell>
      <div className="mb-1 flex items-center gap-2">
        <ShieldQuestion className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">RLS Policy Tester</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Pick a role + table to see which row-level security policies apply and a static heuristic verdict.
        "Depends on row" means the policy restricts by <code className="text-xs">user_id</code>.
      </p>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card className="p-3">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Role</div>
          <Select value={role} onValueChange={(v) => setRole(v as AppRoleSelection)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">owner</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="moderator">moderator</SelectItem>
              <SelectItem value="user">user (authenticated)</SelectItem>
              <SelectItem value="anonymous">anonymous</SelectItem>
            </SelectContent>
          </Select>
        </Card>
        <Card className="p-3 md:col-span-2">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Table</div>
          <div className="flex gap-2">
            <Input
              placeholder="Filter tables…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 max-w-[200px]"
            />
            <Select value={table ?? ""} onValueChange={(v) => setTable(v || null)}>
              <SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {filteredTables.map((t) => (
                  <SelectItem key={t.table_name} value={t.table_name}>
                    {t.table_name}
                    {!t.rls_enabled && <span className="ml-2 text-xs text-red-400">(RLS off)</span>}
                    <span className="ml-2 text-xs text-muted-foreground">{t.policy_count} policies</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        {!table && (
          <div className="py-12 text-center text-muted-foreground">Select a table to inspect its policies.</div>
        )}
        {table && isLoading && (
          <div className="py-12 text-center text-muted-foreground">Loading policies…</div>
        )}
        {table && !isLoading && policies.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No RLS policies on <code>{table}</code>.</div>
        )}
        {table && policies.length > 0 && (
          <div className="overflow-hidden rounded-md border border-border/40">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Policy</th>
                  <th className="px-3 py-2">Command</th>
                  <th className="px-3 py-2">For role <span className="text-primary">{role}</span></th>
                  <th className="px-3 py-2">USING</th>
                  <th className="px-3 py-2">CHECK</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => {
                  const v = evaluatePolicyForRole(p.using_expr || p.check_expr, role);
                  const meta = VERDICT[v];
                  return (
                    <tr key={p.policy_name} className="border-t border-border/30 align-top">
                      <td className="px-3 py-2 font-medium">{p.policy_name}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="font-mono text-xs">{CMD_LABEL[p.command] ?? p.command}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className={cn("border gap-1", meta.className)}>
                          {meta.icon}{meta.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.using_expr ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.check_expr ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
};

export default RlsTester;
