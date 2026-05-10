import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Eye, EyeOff, Flag, Trash2, ExternalLink, MessageCircle, Check, Clock } from "lucide-react";
import {
  useAdminBlogComments,
  useSetCommentStatus,
  useDeleteCommentAdmin,
  useApproveComment,
  type AdminCommentStatusFilter,
} from "@/hooks/admin/useAdminBlog";

const statusBadge: Record<string, string> = {
  visible: "bg-emerald-500/15 text-emerald-500",
  hidden: "bg-orange-500/15 text-orange-500",
  reported: "bg-rose-500/15 text-rose-500",
  deleted: "bg-muted text-muted-foreground",
};

const VALID_TABS: AdminCommentStatusFilter[] = ["pending", "reported", "hidden", "visible", "all"];

type PendingAction =
  | { kind: "status"; id: string; status: "visible" | "hidden" }
  | { kind: "approve"; id: string; approve: boolean }
  | { kind: "delete"; id: string };

export default function AdminBlogComments() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as AdminCommentStatusFilter | null;
  const status: AdminCommentStatusFilter = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "pending";
  const search = params.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search → URL
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

  // Sync external URL changes back into the input
  useEffect(() => { setSearchInput(search); }, [search]);

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== "reported") next.set("tab", v);
    else next.delete("tab");
    setParams(next, { replace: false });
  };

  const { data: comments = [], isLoading } = useAdminBlogComments(status, search);
  const setStatusMut = useSetCommentStatus();
  const del = useDeleteCommentAdmin();
  const approve = useApproveComment();

  const [pending, setPending] = useState<PendingAction | null>(null);

  const confirmDesc = (p: PendingAction) => {
    if (p.kind === "delete") return "This will permanently remove the comment. This action cannot be undone.";
    if (p.kind === "approve")
      return p.approve
        ? "This comment will become publicly visible on the post."
        : "This comment will be rejected and hidden from public view.";
    return p.status === "visible"
      ? "This comment will become publicly visible on the post again."
      : "This comment will be hidden from public view but kept for review.";
  };

  const confirmTitle = (p: PendingAction) => {
    if (p.kind === "delete") return "Delete permanently?";
    if (p.kind === "approve") return p.approve ? "Approve comment?" : "Reject comment?";
    return p.status === "visible" ? "Make visible?" : "Hide comment?";
  };

  const runPending = () => {
    if (!pending) return;
    if (pending.kind === "delete") del.mutate(pending.id);
    else if (pending.kind === "approve") approve.mutate({ id: pending.id, approve: pending.approve });
    else setStatusMut.mutate({ id: pending.id, status: pending.status });
    setPending(null);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Comments moderation"
        description="Review reported, hidden, and visible blog comments."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tabs value={status} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">
              <Clock className="h-3.5 w-3.5 mr-1" /> Pending
            </TabsTrigger>
            <TabsTrigger value="reported">
              <Flag className="h-3.5 w-3.5 mr-1" /> Reported
            </TabsTrigger>
            <TabsTrigger value="hidden">
              <EyeOff className="h-3.5 w-3.5 mr-1" /> Hidden
            </TabsTrigger>
            <TabsTrigger value="visible">
              <Eye className="h-3.5 w-3.5 mr-1" /> Visible
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
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
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <MessageCircle className="mx-auto h-10 w-10 mb-2 opacity-30" />
          <p>No comments in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={c.author?.avatar_url ?? undefined} />
                  <AvatarFallback>{(c.author?.full_name?.[0] || "U").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{c.author?.full_name || "User"}</span>
                    <Badge className={statusBadge[c.status] ?? ""}>{c.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                    {c.post && (
                      <Link
                        to={`/blog/${c.post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {c.post.title}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap break-words">{c.body}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.status !== "visible" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPending({ kind: "status", id: c.id, status: "visible" })}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Make visible
                      </Button>
                    )}
                    {c.status !== "hidden" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPending({ kind: "status", id: c.id, status: "hidden" })}
                      >
                        <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPending({ kind: "delete", id: c.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "delete"
                ? confirmLabel.delete
                : confirmLabel[pending?.status ?? "visible"]}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>{pending && confirmDesc(pending)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={runPending}
              className={pending?.kind === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
