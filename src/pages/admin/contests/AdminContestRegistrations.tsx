import { useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdminContest, useAdminContestRegistrations, useUpdateRegistrationStatus, useDeleteRegistration } from "@/hooks/admin/useAdminContests";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Trash2, Radio, ShieldAlert } from "lucide-react";

const AdminContestRegistrations = () => {
  const { id } = useParams();
  const { data: contest } = useAdminContest(id);
  const { data: regs, isLoading } = useAdminContestRegistrations(id);
  const update = useUpdateRegistrationStatus();
  const del = useDeleteRegistration();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "registered" | "withdrawn" | "disqualified">("all");

  const filtered = useMemo(() => {
    return (regs ?? []).filter((r: any) => {
      if (filter !== "all" && r.status !== filter) return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (r.full_name ?? "").toLowerCase().includes(q) || r.user_id.includes(q);
    });
  }, [regs, search, filter]);

  const exportCsv = () => {
    const rows = [
      ["user_id", "name", "status", "registered_at"],
      ...filtered.map((r: any) => [r.user_id, r.full_name ?? "", r.status, r.registered_at]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `registrations-${contest?.slug ?? id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell>
      <Helmet><title>Registrations | Admin</title></Helmet>
      <div className="space-y-6 p-6">
        <Link to="/admin/contests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All contests
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Registrations</h1>
            <p className="text-sm text-muted-foreground">{contest?.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/admin/contests/${id}/proctor`}>
              <Button size="sm" variant="outline">
                <ShieldAlert className="mr-2 h-4 w-4" /> Proctor review
              </Button>
            </Link>
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="h-3 w-3 animate-pulse" /> Live
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input aria-label="Search by name or user id" placeholder="Search by name or user id..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filtered.length} of {(regs ?? []).length}</span>
            <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export</Button>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No registrations.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={r.avatar_url ?? undefined} />
                          <AvatarFallback>{(r.full_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{r.full_name ?? "Anonymous"}</div>
                          <div className="text-xs text-muted-foreground">{r.user_id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={(v: any) => update.mutate({ id: r.id, status: v })}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registered">Registered</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                          <SelectItem value="disqualified">Disqualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{new Date(r.registered_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label="Remove registration" onClick={() => {
                        if (confirm("Remove this registration?")) del.mutate(r.id);
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminShell>
  );
};

export default AdminContestRegistrations;
