import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Building2, Users, FileCheck2, MessageSquare } from "lucide-react";

function Tile({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function ParikshaaOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["parikshaa-overview"],
    queryFn: async () => {
      const [orgs, leads, assessments, profiles] = await Promise.all([
        supabase.from("organizations").select("id,status,type", { count: "exact" }),
        supabase.from("b2b_leads").select("id,status", { count: "exact" }),
        supabase.from("assessments").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
      ]);
      const orgRows = orgs.data ?? [];
      const leadRows = leads.data ?? [];
      return {
        users: profiles.count ?? 0,
        assessments: assessments.count ?? 0,
        orgs: orgs.count ?? 0,
        companies: orgRows.filter((o: any) => o.type === "company").length,
        colleges: orgRows.filter((o: any) => o.type === "college").length,
        pending: orgRows.filter((o: any) => o.status === "pending").length,
        leads: leads.count ?? 0,
        newLeads: leadRows.filter((l: any) => l.status === "new").length,
      };
    },
  });

  return (
    <>
      <ShellHeader title="Overview" />
      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="text-sm text-muted-foreground"></div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Total users" value={data!.users} icon={Users} />
              <Tile label="Organizations" value={data!.orgs} icon={Building2} />
              <Tile label="Assessments" value={data!.assessments} icon={FileCheck2} />
              <Tile label="Leads" value={data!.leads} icon={MessageSquare} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Tile label="Companies" value={data!.companies} icon={Building2} />
              <Tile label="Colleges" value={data!.colleges} icon={Building2} />
              <Tile label="Pending approval" value={data!.pending} icon={Building2} />
            </div>
            {data!.pending > 0 && (
              <div className="rounded-lg border bg-amber-500/5 border-amber-500/30 p-4 text-sm">
                <strong>{data!.pending}</strong> organization
                {data!.pending === 1 ? "" : "s"} awaiting approval —{" "}
                <a className="underline" href="/admin/parikshaa/orgs">review</a>.
              </div>
            )}
            {data!.newLeads > 0 && (
              <div className="rounded-lg border bg-card p-4 text-sm">
                <strong>{data!.newLeads}</strong> new lead
                {data!.newLeads === 1 ? "" : "s"} in the pipeline —{" "}
                <a className="underline" href="/admin/parikshaa/leads">view</a>.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
