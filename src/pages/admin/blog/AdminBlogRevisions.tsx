import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, History, RotateCcw, Loader2, Eye, GitCompare } from "lucide-react";
import { useBlogPostById } from "@/hooks/useBlog";
import { useBlogRevisions, useRestoreBlogRevision, type BlogRevision } from "@/hooks/admin/useAdminBlog";
import { cn } from "@/lib/utils";
import { diffLines } from "diff";

export default function AdminBlogRevisions() {
  const { id } = useParams();
  const { data: post } = useBlogPostById(id);
  const { data: revisions = [], isLoading } = useBlogRevisions(id);
  const restore = useRestoreBlogRevision();

  // "current" pseudo-revision representing the live post
  const current: BlogRevision | null = post
    ? {
        id: "__current__",
        post_id: post.id,
        title: post.title,
        content_md: post.content_md,
        saved_by: null,
        created_at: post.updated_at,
      }
    : null;

  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const all = useMemo(() => (current ? [current, ...revisions] : revisions), [current, revisions]);
  const left = all.find((r) => r.id === leftId) ?? null;
  const right = all.find((r) => r.id === rightId) ?? null;

  const diff = useMemo(() => {
    if (!left || !right) return null;
    return diffLines(right.content_md, left.content_md);
  }, [left, right]);

  return (
    <AdminShell>
      <AdminPageHeader
        title="Version history"
        actions={
          <Button asChild variant="ghost">
            <Link to={id ? `/admin/blog/${id}/edit` : "/admin/blog"}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back to editor
            </Link>
          </Button>
        }
      />

      {post && (
        <Card className="mb-4 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Post</p>
          <h2 className="text-xl font-semibold">{post.title}</h2>
          <p className="text-sm text-muted-foreground">
            {revisions.length} saved revision{revisions.length === 1 ? "" : "s"}
          </p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" />Revisions
          </div>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : all.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No revisions yet. Save the post to create one.
            </div>
          ) : (
            <ul className="space-y-1.5" role="listbox" aria-label="Revisions">
              {all.map((r) => {
                const isCurrent = r.id === "__current__";
                const isLeft = leftId === r.id;
                const isRight = rightId === r.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring",
                        (isLeft || isRight) && "border-primary bg-primary/5",
                      )}
                      onClick={() => {
                        // Click cycles: empty → left → right (then replaces left)
                        if (!leftId) setLeftId(r.id);
                        else if (leftId === r.id) setLeftId(null);
                        else if (!rightId) setRightId(r.id);
                        else if (rightId === r.id) setRightId(null);
                        else {
                          setLeftId(r.id);
                          setRightId(null);
                        }
                      }}
                      aria-pressed={isLeft || isRight}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {isCurrent ? "Current (live)" : new Date(r.created_at).toLocaleString()}
                        </span>
                        <div className="flex shrink-0 gap-1">
                          {isLeft && <Badge variant="default" className="text-[10px]">A</Badge>}
                          {isRight && <Badge variant="secondary" className="text-[10px]">B</Badge>}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {r.author?.avatar_url ? (
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={r.author.avatar_url} />
                            <AvatarFallback>?</AvatarFallback>
                          </Avatar>
                        ) : null}
                        <span className="truncate">
                          {isCurrent ? "Latest saved version" : r.author?.full_name || "Unknown editor"}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Click any revision to mark as <kbd className="rounded border px-1">A</kbd>, then a
            second to mark as <kbd className="rounded border px-1">B</kbd> for comparison.
          </p>
        </Card>

        <div className="space-y-4">
          {!left && !right ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              <GitCompare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Select a revision on the left to preview, then a second one to compare.
            </Card>
          ) : !right ? (
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
                  <h3 className="font-semibold">{left!.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(left!.created_at).toLocaleString()}
                  </p>
                </div>
                {left!.id !== "__current__" && (
                  <RestoreButton
                    onConfirm={() =>
                      restore.mutate({ postId: id!, revisionId: left!.id })
                    }
                    pending={restore.isPending}
                  />
                )}
              </div>
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-xs">
                {left!.content_md}
              </pre>
            </Card>
          ) : (
            <Card className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="default">A</Badge>
                  <span className="text-muted-foreground">
                    {left!.id === "__current__" ? "Current" : new Date(left!.created_at).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">vs</span>
                  <Badge variant="secondary">B</Badge>
                  <span className="text-muted-foreground">
                    {right!.id === "__current__" ? "Current" : new Date(right!.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {right!.id !== "__current__" && (
                    <RestoreButton
                      label="Restore B"
                      onConfirm={() =>
                        restore.mutate({ postId: id!, revisionId: right!.id })
                      }
                      pending={restore.isPending}
                    />
                  )}
                  {left!.id !== "__current__" && (
                    <RestoreButton
                      label="Restore A"
                      onConfirm={() =>
                        restore.mutate({ postId: id!, revisionId: left!.id })
                      }
                      pending={restore.isPending}
                    />
                  )}
                </div>
              </div>
              <pre className="max-h-[70vh] overflow-auto rounded-md border bg-background p-3 text-xs leading-relaxed">
                {diff?.map((part, i) => (
                  <span
                    key={i}
                    className={cn(
                      "block whitespace-pre-wrap",
                      part.added && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                      part.removed && "bg-rose-500/10 text-rose-700 dark:text-rose-300 line-through",
                      !part.added && !part.removed && "text-muted-foreground",
                    )}
                  >
                    {part.added ? "+ " : part.removed ? "− " : "  "}
                    {part.value}
                  </span>
                ))}
              </pre>
            </Card>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function RestoreButton({
  onConfirm,
  pending,
  label = "Restore this version",
}: {
  onConfirm: () => void;
  pending: boolean;
  label?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="default" disabled={pending}>
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore this revision?</AlertDialogTitle>
          <AlertDialogDescription>
            The current live content will be saved as a new revision first, so this action is reversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Restore</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
