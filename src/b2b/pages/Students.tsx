import { useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { OrgShell } from "../layouts/OrgShell";
import { useMyOrganizations } from "../hooks/useOrg";
import { useCurrentOrg } from "../context/OrgContext";
import {
  useOrgStudents,
  useEnrollStudents,
  useDeleteOrgStudent,
  useUpdateOrgStudent,
  type OrgStudent,
} from "../hooks/useOrgStudents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Upload, UserPlus, Trash2, Search, Download, Ban, Mail } from "lucide-react";
import { toast } from "sonner";

function downloadCsv(filename: string, rows: any[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ParsedRow = {
  email: string;
  full_name?: string;
  roll_number?: string;
  branch?: string;
  batch_year?: number;
  section?: string;
};

function parseCsv(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const firstLine = lines[0].toLowerCase();
  let header: string[];
  let body: string[];
  if (firstLine.includes("email")) {
    header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    body = lines.slice(1);
  } else {
    header = ["email"];
    body = lines;
  }
  const idx = (k: string) => header.indexOf(k);
  const cols = {
    email: idx("email"),
    full_name: idx("full_name") >= 0 ? idx("full_name") : idx("name"),
    roll_number: idx("roll_number") >= 0 ? idx("roll_number") : idx("roll"),
    branch: idx("branch"),
    batch_year: idx("batch_year") >= 0 ? idx("batch_year") : idx("batch"),
    section: idx("section"),
  };
  const rows: ParsedRow[] = [];
  for (const line of body) {
    const parts = line.split(",").map((p) => p.trim());
    const email = parts[cols.email] ?? parts[0];
    if (!email || !email.includes("@")) continue;
    const r: ParsedRow = { email };
    if (cols.full_name >= 0 && parts[cols.full_name]) r.full_name = parts[cols.full_name];
    if (cols.roll_number >= 0 && parts[cols.roll_number]) r.roll_number = parts[cols.roll_number];
    if (cols.branch >= 0 && parts[cols.branch]) r.branch = parts[cols.branch];
    if (cols.batch_year >= 0 && parts[cols.batch_year]) {
      const y = parseInt(parts[cols.batch_year], 10);
      if (Number.isFinite(y)) r.batch_year = y;
    }
    if (cols.section >= 0 && parts[cols.section]) r.section = parts[cols.section];
    rows.push(r);
  }
  return rows;
}

function StatusBadge({ status }: { status: OrgStudent["status"] }) {
  const v = {
    invited: { label: "Invited", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    suspended: { label: "Suspended", className: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
    alumni: { label: "Alumni", className: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30" },
  }[status];
  return <Badge variant="outline" className={`text-[10px] ${v.className}`}>{v.label}</Badge>;
}

function EnrollDialog({ orgId, basePath }: { orgId: string; basePath: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"single" | "paste" | "csv">("single");
  const [single, setSingle] = useState<ParsedRow>({ email: "" });
  const [pasted, setPasted] = useState("");
  const [csvText, setCsvText] = useState("");
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const enroll = useEnrollStudents(orgId);

  const handleCsvFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    setPreview(parseCsv(text));
  };

  const submit = async () => {
    let rows: ParsedRow[] = [];
    if (tab === "single") {
      if (!single.email || !single.email.includes("@")) {
        toast.error("Enter a valid email");
        return;
      }
      rows = [single];
    } else if (tab === "paste") {
      rows = pasted
        .split(/[\s,;\n]+/)
        .map((e) => e.trim())
        .filter((e) => e.includes("@"))
        .map((email) => ({ email }));
    } else {
      rows = preview;
    }
    if (rows.length === 0) {
      toast.error("Nothing to enroll");
      return;
    }
    try {
      const res = await enroll.mutateAsync(rows);
      toast.success(`Enrolled ${res.inserted} student${res.inserted === 1 ? "" : "s"} (${res.updated} updated)`);
      setOpen(false);
      setSingle({ email: "" });
      setPasted("");
      setCsvText("");
      setPreview([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to enroll");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><UserPlus className="h-4 w-4 mr-2" /> Enroll students</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enroll students</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="single">Single</TabsTrigger>
            <TabsTrigger value="paste">Paste emails</TabsTrigger>
            <TabsTrigger value="csv">CSV upload</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="space-y-3 pt-3">
            <Input placeholder="Email *" value={single.email} onChange={(e) => setSingle((s) => ({ ...s, email: e.target.value }))} />
            <Input placeholder="Full name" value={single.full_name ?? ""} onChange={(e) => setSingle((s) => ({ ...s, full_name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Roll number" value={single.roll_number ?? ""} onChange={(e) => setSingle((s) => ({ ...s, roll_number: e.target.value }))} />
              <Input placeholder="Branch (e.g. CSE)" value={single.branch ?? ""} onChange={(e) => setSingle((s) => ({ ...s, branch: e.target.value }))} />
              <Input placeholder="Batch year (e.g. 2026)" type="number" value={single.batch_year ?? ""} onChange={(e) => setSingle((s) => ({ ...s, batch_year: parseInt(e.target.value || "0", 10) || undefined }))} />
              <Input placeholder="Section" value={single.section ?? ""} onChange={(e) => setSingle((s) => ({ ...s, section: e.target.value }))} />
            </div>
          </TabsContent>
          <TabsContent value="paste" className="space-y-2 pt-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Paste emails separated by commas, spaces, or new lines.</p>
            <Textarea rows={8} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="alice@college.edu, bob@college.edu&#10;carol@college.edu" />
          </TabsContent>
          <TabsContent value="csv" className="space-y-3 pt-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Header row supported: <code>email, full_name, roll_number, branch, batch_year, section</code>. If no header, the first column is treated as email.
            </p>
            <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
            {preview.length > 0 && (
              <div className="text-xs border rounded p-2 max-h-48 overflow-auto">
                <div className="font-semibold mb-1">{preview.length} rows previewed</div>
                {preview.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex gap-2 py-0.5 border-b last:border-0">
                    <span className="font-mono">{r.email}</span>
                    {r.full_name && <span className="text-[hsl(var(--muted-foreground))]">· {r.full_name}</span>}
                    {r.roll_number && <span className="text-[hsl(var(--muted-foreground))]">· {r.roll_number}</span>}
                  </div>
                ))}
                {preview.length > 20 && <div className="text-[hsl(var(--muted-foreground))] mt-1">…and {preview.length - 20} more</div>}
              </div>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={enroll.isPending}>
            {enroll.isPending ? "Enrolling…" : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function B2BStudents() {
  const { data: orgs, isLoading: loadingOrgs } = useMyOrganizations();
  const ctx = useCurrentOrg();
  const org = ctx.org ?? orgs?.[0];
  const orgId = org?.id;
  const basePath = (org as any)?.slug
    ? (org!.type === "college" ? `/colleges/${org!.slug}` : `/companies/${org!.slug}`)
    : "/b2b";
  const { data: students, isLoading } = useOrgStudents(orgId);
  const remove = useDeleteOrgStudent(orgId);
  const update = useUpdateOrgStudent(orgId);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | OrgStudent["status"]>("all");

  const filtered = useMemo(() => {
    const list = students ?? [];
    return list.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (q) {
        const t = q.toLowerCase();
        return (
          s.email.toLowerCase().includes(t) ||
          (s.full_name ?? "").toLowerCase().includes(t) ||
          (s.roll_number ?? "").toLowerCase().includes(t) ||
          (s.branch ?? "").toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [students, q, status]);

  if (loadingOrgs) return <OrgShell title="Students"><div /></OrgShell>;
  if (!org) return <Navigate to="/b2b/onboarding" replace />;

  return (
    <OrgShell
      title={
        <>
          <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
            {org.name}
          </span>{" "}
          <span className="text-[hsl(var(--muted-foreground))] font-normal">· Students</span>
        </>
      }
    >
      <div className="b2b-card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <GraduationCap className="h-5 w-5 text-[hsl(var(--primary))]" />
        <div className="flex-1 min-w-[200px]">
          <div className="font-medium">Enrolled students</div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Students you enroll here will receive an email invite and can sign in to see their college and dashboard.
          </p>
        </div>
        <Button variant="outline" onClick={() => downloadCsv("students.csv", filtered)} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
        <EnrollDialog orgId={orgId!} basePath={basePath} />
      </div>

      <div className="b2b-card p-3 mb-3 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-[hsl(var(--muted-foreground))]" />
          <Input className="pl-8" placeholder="Search email, name, roll, branch…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="text-sm rounded border bg-transparent px-2 py-1.5"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          <option value="invited">Invited</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="alumni">Alumni</option>
        </select>
        <div className="text-xs text-[hsl(var(--muted-foreground))]">
          {filtered.length} of {students?.length ?? 0}
        </div>
      </div>

      <div className="b2b-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_auto] gap-3 px-4 py-2 border-b text-xs font-semibold text-[hsl(var(--muted-foreground))]">
          <div>Student</div>
          <div>Email</div>
          <div>Roll</div>
          <div>Branch</div>
          <div>Batch</div>
          <div>Status</div>
          <div></div>
        </div>
        {isLoading && <div className="p-6 text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
            No students yet. Click <strong>Enroll students</strong> to add your first batch.
          </div>
        )}
        <ul className="divide-y">
          {filtered.map((s) => (
            <li key={s.id} className="px-4 py-3 md:grid md:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_auto] gap-3 flex flex-col md:items-center text-sm">
              <Link to={`${basePath}/students/${s.id}`} className="font-medium hover:underline truncate">
                {s.full_name || s.email.split("@")[0]}
              </Link>
              <div className="truncate text-[hsl(var(--muted-foreground))]">{s.email}</div>
              <div className="truncate">{s.roll_number ?? "—"}</div>
              <div className="truncate">{s.branch ?? "—"}</div>
              <div>{s.batch_year ?? "—"}</div>
              <StatusBadge status={s.status} />
              <div className="flex items-center gap-1 md:justify-end">
                {s.status === "active" ? (
                  <Button size="icon" variant="ghost" title="Suspend" onClick={() => update.mutate({ id: s.id, patch: { status: "suspended" } })}>
                    <Ban className="h-4 w-4" />
                  </Button>
                ) : s.status === "suspended" ? (
                  <Button size="icon" variant="ghost" title="Reactivate" onClick={() => update.mutate({ id: s.id, patch: { status: "active" } })}>
                    <Mail className="h-4 w-4" />
                  </Button>
                ) : null}
                <Button
                  size="icon"
                  variant="ghost"
                  title="Remove"
                  onClick={() => {
                    if (confirm(`Remove ${s.email} from ${org.name}?`)) remove.mutate(s.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </OrgShell>
  );
}
