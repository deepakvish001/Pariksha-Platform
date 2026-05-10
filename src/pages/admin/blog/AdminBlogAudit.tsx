import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, EyeOff, Flag, Trash2, ExternalLink, History as HistoryIcon, ArrowRight } from "lucide-react";
import { useBlogCommentAudit, type AuditAction } from "@/hooks/admin/useAdminBlogAudit";

const VALID_ACTIONS: (AuditAction | "all")[] = ["all", "make_visible", "hide", "report", "delete"];

const actionMeta: Record<AuditAction, { label: string; icon: any; className: string }> = {
  make_visible: { label: "Made visible", icon: Eye, className: "bg-emerald-500/15 text-emerald-500" },
  hide: { label: "Hidden", icon: EyeOff, className: "bg-orange-500/15 text-orange-500" },
  report: { label: "Reported", icon: Flag, className: "bg-rose-500/15 text-rose-500" },
  delete: { label: "Deleted", icon: Trash2, className: "bg-destructive/15 text-destructive" },
  status_change: { label: "Status change", icon: HistoryIcon, className: "bg-muted text-muted-foreground" },
};

export default function AdminBlogAudit() {
  const [params, setParams] = useSearchParams();
  const actionParam = params.get("action") as AuditAction | "all" | null;
  const action: AuditAction | "all" =
    actionParam && VALID_ACTIONS.includes(actionParam) ? actionParam : "all";
  const search = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        const next = new URLSearchParams(params);
        if (searchInput.trim()) next.set("q", searchInput.trim());
        else next.delete("q");
        setParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => { setSearchInput(search); }, [search]);

  const setAction = (v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== "all") next.set("action", v);
    else next.delete("action");
    setParams(next, { replace: false });
  };

  const { data: rows = [], isLoading } = useBlogCommentAudit({ action, search });

  return (
    <AdminShell>
      <AdminPageHeader
        title="Comment audit log"
        description="Every moderator action on blog comments — make visible, hide, report, delete."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tabs value={action} onValueChange={setAction}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="make_visible"><Eye className="h-3.5 w-3.5 mr-1" />Visible</TabsTrigger>
            <TabsTrigger value="hide"><EyeOff className="h-3.5 w-3.5 mr-1" />Hide</TabsTrigger>
            <TabsTrigger value="report"><Flag className="h-3.5 w-3.5 mr-1" />Report</TabsTrigger>
            <TabsTrigger value="delete"><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search comment text…"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-16">Loading…</div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <HistoryIcon className="mx-auto h-10 w-10 mb-2 opacity-30" />
          <p>No audit entries match these filters.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const meta = actionMeta[r.action] ?? actionMeta.status_change;
            const Icon = meta.icon;
            return (
              <Card key={r.id} className="p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.actor?.avatar_url ?? undefined} />
                    <AvatarFallback>{(r.actor?.full_name?.[0] || "S").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium">{r.actor?.full_name || "System"}</span>
                      <Badge className={meta.className}>
                        <Icon className="h-3 w-3 mr-1" />
                        {meta.label}
                      </Badge>
                      {r.old_status && r.new_status && r.action !== "delete" && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          {r.old_status} <ArrowRight className="h-3 w-3" /> {r.new_status}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    {r.comment_snapshot && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-wrap break-words">
                        “{r.comment_snapshot}”
                      </p>
                    )}
                    {r.post && (
                      <Link
                        to={`/blog/${r.post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center gap-1 text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {r.post.title}
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
