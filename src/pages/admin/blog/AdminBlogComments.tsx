import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, EyeOff, Flag, Trash2, ExternalLink, MessageCircle } from "lucide-react";
import {
  useAdminBlogComments,
  useSetCommentStatus,
  useDeleteCommentAdmin,
  type AdminCommentStatusFilter,
} from "@/hooks/admin/useAdminBlog";

const statusBadge: Record<string, string> = {
  visible: "bg-emerald-500/15 text-emerald-500",
  hidden: "bg-orange-500/15 text-orange-500",
  reported: "bg-rose-500/15 text-rose-500",
  deleted: "bg-muted text-muted-foreground",
};

export default function AdminBlogComments() {
  const [status, setStatus] = useState<AdminCommentStatusFilter>("reported");
  const [search, setSearch] = useState("");
  const { data: comments = [], isLoading } = useAdminBlogComments(status, search);
  const setStatusMut = useSetCommentStatus();
  const del = useDeleteCommentAdmin();

  return (
    <AdminShell>
      <AdminPageHeader
        title="Comments moderation"
        description="Review reported, hidden, and visible blog comments."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as AdminCommentStatusFilter)}>
          <TabsList>
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                        disabled={setStatusMut.isPending}
                        onClick={() => setStatusMut.mutate({ id: c.id, status: "visible" })}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Make visible
                      </Button>
                    )}
                    {c.status !== "hidden" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setStatusMut.isPending}
                        onClick={() => setStatusMut.mutate({ id: c.id, status: "hidden" })}
                      >
                        <EyeOff className="h-3.5 w-3.5 mr-1" /> Hide
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={del.isPending}
                      onClick={() => {
                        if (confirm("Permanently delete this comment?")) del.mutate(c.id);
                      }}
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
    </AdminShell>
  );
}
