import { Link } from "react-router-dom";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink, FileText, Eye, Heart } from "lucide-react";
import { useAdminBlogPosts, useDeleteBlogPost } from "@/hooks/admin/useAdminBlog";
import type { BlogPostStatus } from "@/types/blog";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-500",
  published: "bg-emerald-500/15 text-emerald-500",
  archived: "bg-orange-500/15 text-orange-500",
};

export default function AdminBlogList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogPostStatus | "all">("all");
  const { data: posts = [], isLoading } = useAdminBlogPosts(search, status);
  const del = useDeleteBlogPost();

  return (
    <AdminShell>
      <AdminPageHeader
        title="Blog Posts"
        description="Author, schedule, and publish articles for the blog."
        actions={
          <Button asChild>
            <Link to="/admin/blog/new"><Plus className="mr-2 h-4 w-4" />New post</Link>
          </Button>
        }
      />

      <Card className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><Eye className="inline h-3.5 w-3.5" /></TableHead>
              <TableHead className="text-right"><Heart className="inline h-3.5 w-3.5" /></TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : posts.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                No posts yet. Click "New post" to write your first article.
              </TableCell></TableRow>
            ) : posts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium max-w-md truncate">{p.title}</TableCell>
                <TableCell><Badge className={statusColor[p.status]}>{p.status}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{p.view_count}</TableCell>
                <TableCell className="text-right tabular-nums">{p.like_count}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-1">
                  {p.status === "published" && (
                    <Button asChild size="icon" variant="ghost" aria-label="View post"><Link to={`/blog/${p.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>
                  )}
                  <Button asChild size="icon" variant="ghost" aria-label="Edit post"><Link to={`/admin/blog/${p.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" aria-label="Delete post" onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminShell>
  );
}
