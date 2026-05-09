import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/card";
import { CalendarClock, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAdminCronJobs } from "@/hooks/admin/useAdminControl";

const CronJobs = () => {
  const { data, isLoading } = useAdminCronJobs();
  const jobs = data ?? [];

  return (
    <AdminShell>
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
        <CalendarClock className="h-5 w-5 text-primary" /> Scheduled Jobs
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Background pg_cron jobs and their most recent run.
      </p>

      <Card className="p-0 overflow-x-auto">
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground"></p>
        ) : jobs.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No scheduled jobs found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border/50">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Schedule</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2">Last run</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.jobid} className="border-b border-border/30 align-top">
                  <td className="px-4 py-2 font-medium">{j.jobname}</td>
                  <td className="px-4 py-2 font-mono text-xs">{j.schedule}</td>
                  <td className="px-4 py-2">
                    {j.active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" /> on
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" /> off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {j.last_run_started_at ? new Date(j.last_run_started_at).toLocaleString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {j.last_status === "succeeded" ? (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        succeeded
                      </span>
                    ) : j.last_status === "failed" ? (
                      <span title={j.last_return_message ?? ""}
                        className="rounded bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
                        failed
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{j.last_status ?? "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
};

export default CronJobs;
