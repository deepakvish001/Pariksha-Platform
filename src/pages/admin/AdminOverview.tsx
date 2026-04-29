import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminProblems } from "@/hooks/useAdminProblems";
import { useAuditLog } from "@/hooks/useAdminProblems";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";

const AdminOverview = () => {
  const { data: problems = [] } = useAdminProblems();
  const { data: audit = [] } = useAuditLog();
  const drafts = problems.filter((p) => !p.is_published).length;
  const published = problems.length - drafts;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">
            Manage coding problems, tests, and bulk imports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/problems/import">
              <Upload className="mr-2 h-4 w-4" /> Bulk Import
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/problems/new">
              <Plus className="mr-2 h-4 w-4" /> New Problem
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total problems</p>
          <p className="mt-1 text-3xl font-bold">{problems.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="mt-1 text-3xl font-bold text-emerald-500">{published}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="mt-1 text-3xl font-bold text-amber-500">{drafts}</p>
        </Card>
      </div>

      <Card className="mt-6 p-4">
        <h2 className="mb-3 text-sm font-semibold">Recent admin actions</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No actions yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audit.slice(0, 8).map((a) => (
              <li key={a.id} className="flex justify-between gap-3 border-b border-border/50 pb-2 last:border-0">
                <span className="truncate">
                  <span className="font-medium">{a.action}</span>{" "}
                  <span className="text-muted-foreground">on</span>{" "}
                  <span className="font-mono text-xs">{a.entity_slug}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
};

export default AdminOverview;
