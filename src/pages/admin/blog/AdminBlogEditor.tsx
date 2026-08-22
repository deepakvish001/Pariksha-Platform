import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownEditor } from "@/components/admin/editor/MarkdownEditor";
import { ArrowLeft, Upload, Save, Loader2, ExternalLink, RotateCcw, Check, History, ImageIcon, Send, Copy } from "lucide-react";
import { useBlogCategories, useBlogTags, useBlogPostById } from "@/hooks/useBlog";
import { useSaveBlogPost, useUploadBlogCover, useUpsertBlogTag } from "@/hooks/admin/useAdminBlog";
import { slugify } from "@/types/blog";
import type { BlogPostStatus } from "@/types/blog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminBlogEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id;
  const { data: existing } = useBlogPostById(id);
  const { data: categories = [] } = useBlogCategories();
  const { data: tags = [] } = useBlogTags();
  const save = useSaveBlogPost();
  const uploadCover = useUploadBlogCover();
  const upsertTag = useUpsertBlogTag();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [status, setStatus] = useState<BlogPostStatus>("draft");
  const [scheduled, setScheduled] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [featured, setFeatured] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [catIds, setCatIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const [ogGenerating, setOgGenerating] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setExcerpt(existing.excerpt ?? "");
      setContent(existing.content_md);
      setCover(existing.cover_image_url);
      setStatus(existing.status);
      setScheduled(existing.scheduled_for ? existing.scheduled_for.slice(0, 16) : "");
      setSeoTitle(existing.seo_title ?? "");
      setSeoDesc(existing.seo_description ?? "");
      setFeatured(existing.is_featured);
      setAllowComments(existing.allow_comments);
      setCatIds(existing.category_ids ?? []);
      setTagIds(existing.tag_ids ?? []);
      setOgImageUrl((existing as any).og_image_url ?? null);
    }
  }, [existing]);

  useEffect(() => { if (isNew && title && !slug) setSlug(slugify(title)); }, [title, slug, isNew]);

  // ─── Autosave + unsaved-changes guard ────────────────────────────────────
  const draftKey = `blog-draft:${id ?? "new"}`;
  const initialSnapshot = useRef<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [recoveredAt, setRecoveredAt] = useState<number | null>(null);

  // Snapshot of the saved baseline → used to detect "dirty" state.
  const savedSnapshot = useMemo(
    () =>
      JSON.stringify({
        title, slug, excerpt, content, cover, status, scheduled,
        seoTitle, seoDesc, featured, allowComments, catIds, tagIds,
      }),
    [title, slug, excerpt, content, cover, status, scheduled, seoTitle, seoDesc, featured, allowComments, catIds, tagIds],
  );
  if (initialSnapshot.current === null && (existing || isNew)) {
    initialSnapshot.current = savedSnapshot;
  }
  const isDirty = initialSnapshot.current !== null && initialSnapshot.current !== savedSnapshot;

  // Restore draft on first mount if a newer one exists in localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft?.savedAt || (existing && new Date(existing.updated_at || 0).getTime() > draft.savedAt)) return;
      // Only auto-restore when the user hasn't typed yet (matches saved baseline).
      if (initialSnapshot.current !== savedSnapshot) return;
      setTitle(draft.title ?? title);
      setSlug(draft.slug ?? slug);
      setExcerpt(draft.excerpt ?? excerpt);
      setContent(draft.content ?? content);
      setCover(draft.cover ?? cover);
      setStatus(draft.status ?? status);
      setScheduled(draft.scheduled ?? scheduled);
      setSeoTitle(draft.seoTitle ?? seoTitle);
      setSeoDesc(draft.seoDesc ?? seoDesc);
      setFeatured(draft.featured ?? featured);
      setAllowComments(draft.allowComments ?? allowComments);
      setCatIds(draft.catIds ?? catIds);
      setTagIds(draft.tagIds ?? tagIds);
      setRecoveredAt(draft.savedAt);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  // Debounced autosave to localStorage.
  useEffect(() => {
    if (!isDirty) return;
    setAutosaveStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            savedAt: Date.now(),
            title, slug, excerpt, content, cover, status, scheduled,
            seoTitle, seoDesc, featured, allowComments, catIds, tagIds,
          }),
        );
        setAutosaveStatus("saved");
      } catch {
        /* quota exceeded */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [savedSnapshot, isDirty, draftKey]);

  // beforeunload guard.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const discardDraft = () => {
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    setRecoveredAt(null);
    if (existing) {
      setTitle(existing.title);
      setSlug(existing.slug);
      setExcerpt(existing.excerpt ?? "");
      setContent(existing.content_md);
      setCover(existing.cover_image_url);
      setStatus(existing.status);
      setScheduled(existing.scheduled_for ? existing.scheduled_for.slice(0, 16) : "");
      setSeoTitle(existing.seo_title ?? "");
      setSeoDesc(existing.seo_description ?? "");
      setFeatured(existing.is_featured);
      setAllowComments(existing.allow_comments);
      setCatIds(existing.category_ids ?? []);
      setTagIds(existing.tag_ids ?? []);
    }
  };

  const openPublicPreview = () => {
    if (!slug.trim()) {
      toast({ title: "Save the post first", description: "A slug is required to preview." });
      return;
    }
    window.open(`/blog/${slug.trim()}`, "_blank", "noopener,noreferrer");
  };

  const handleSave = async (overrideStatus?: BlogPostStatus) => {
    if (!title.trim() || !slug.trim()) return alert("Title and slug are required");
    const finalStatus = overrideStatus ?? status;
    const newId = await save.mutateAsync({
      id,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content_md: content,
      cover_image_url: cover,
      status: finalStatus,
      scheduled_for: finalStatus === "scheduled" && scheduled ? new Date(scheduled).toISOString() : null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
      is_featured: featured,
      allow_comments: allowComments,
      category_ids: catIds,
      tag_ids: tagIds,
    });
    // Clear draft + reset baseline.
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    initialSnapshot.current = savedSnapshot;
    setAutosaveStatus("saved");
    if (isNew) nav(`/admin/blog/${newId}/edit`, { replace: true });
  };

  const handleAddTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    const slug = slugify(name);
    await upsertTag.mutateAsync({ name, slug });
    setNewTag("");
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title={isNew ? "New post" : "Edit post"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                isDirty
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : autosaveStatus === "saving"
                    ? "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
              aria-live="polite"
            >
              {autosaveStatus === "saving" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {isDirty ? "Unsaved" : autosaveStatus === "saving" ? "Saving…" : "Saved"}
            </span>
            <Button asChild variant="ghost"><Link to="/admin/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
            {!isNew && id && (
              <Button asChild variant="outline" title="View version history">
                <Link to={`/admin/blog/${id}/revisions`}>
                  <History className="mr-2 h-4 w-4" />History
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={openPublicPreview} title="Open public preview in a new tab">
              <ExternalLink className="mr-2 h-4 w-4" />Preview
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save draft
            </Button>
            {status === "scheduled" && scheduled ? (
              <Button onClick={() => handleSave("scheduled")} disabled={save.isPending}>
                Schedule
              </Button>
            ) : (
              <Button onClick={() => handleSave("published")} disabled={save.isPending}>
                Publish now
              </Button>
            )}
          </div>
        }
      />

      {recoveredAt && (
        <Card className="mb-3 flex flex-wrap items-center justify-between gap-2 border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <span className="text-amber-700 dark:text-amber-300">
            Restored an unsaved draft from {new Date(recoveredAt).toLocaleString()}.
          </span>
          <Button size="sm" variant="ghost" onClick={discardDraft}>
            <RotateCcw className="mr-1 h-3 w-3" />Discard draft
          </Button>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div>
              <Label htmlFor="blog-title">Title</Label>
              <Input id="blog-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="An awesome blog post title" className="text-lg" />
            </div>
            <div>
              <Label htmlFor="blog-slug">Slug (URL)</Label>
              <Input id="blog-slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="my-awesome-post" />
              <p className="text-xs text-muted-foreground mt-1">/blog/{slug || "your-slug"}</p>
            </div>
            <div>
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea id="blog-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Short summary shown in cards and search." />
            </div>
          </Card>

          <div>
            <Label className="mb-2 block">Content (Markdown)</Label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              slug={slug || "blog-post"}
              onFrontMatter={(fm) => {
                const before = { title, excerpt, cover, slug, seoTitle, seoDesc };
                let n = 0;
                if (fm.title && !title) { setTitle(fm.title); n++; }
                if (fm.excerpt && !excerpt) { setExcerpt(fm.excerpt); n++; }
                if (fm.cover && !cover) { setCover(fm.cover); n++; }
                if (fm.slug && !slug) { setSlug(slugify(fm.slug)); n++; }
                if (fm.seoTitle && !seoTitle) { setSeoTitle(fm.seoTitle); n++; }
                if (fm.seoDescription && !seoDesc) { setSeoDesc(fm.seoDescription); n++; }
                return {
                  applied: n,
                  undo: () => {
                    setTitle(before.title);
                    setExcerpt(before.excerpt);
                    setCover(before.cover);
                    setSlug(before.slug);
                    setSeoTitle(before.seoTitle);
                    setSeoDesc(before.seoDesc);
                  },
                };
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Publish</h3>
            <div>
              <Label htmlFor="blog-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BlogPostStatus)}>
                <SelectTrigger id="blog-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "scheduled" && (
              <div>
                <Label htmlFor="blog-publish-at">Publish at</Label>
                <Input id="blog-publish-at" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
              </div>
            )}
            <div className="flex items-center justify-between"><Label htmlFor="featured">Featured</Label><Switch id="featured" checked={featured} onCheckedChange={setFeatured} /></div>
            <div className="flex items-center justify-between"><Label htmlFor="comments">Allow comments</Label><Switch id="comments" checked={allowComments} onCheckedChange={setAllowComments} /></div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Cover image</h3>
            {cover && <img src={cover} alt="" className="w-full rounded border" />}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 cursor-pointer hover:bg-muted/50 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              {uploadCover.isPending ? "Uploading…" : "Upload cover"}
              <input type="file" accept="image/*" hidden onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await uploadCover.mutateAsync(f);
                  setCover(url);
                }
              }} />
            </label>
            {cover && <Button size="sm" variant="ghost" onClick={() => setCover(null)}>Remove</Button>}
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Categories</h3>
            <div className="flex flex-wrap gap-1">
              {categories.map((c) => {
                const on = catIds.includes(c.id);
                return (
                  <Badge key={c.id} variant={on ? "default" : "outline"} className="cursor-pointer"
                    onClick={() => setCatIds((p) => on ? p.filter((x) => x !== c.id) : [...p, c.id])}>
                    {c.name}
                  </Badge>
                );
              })}
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => {
                const on = tagIds.includes(t.id);
                return (
                  <Badge key={t.id} variant={on ? "default" : "outline"} className="cursor-pointer"
                    onClick={() => setTagIds((p) => on ? p.filter((x) => x !== t.id) : [...p, t.id])}>
                    {t.name}
                  </Badge>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag" className="h-8" />
              <Button size="sm" variant="outline" onClick={handleAddTag}>Add</Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">SEO</h3>
            <div>
              <Label htmlFor="blog-seo-title">SEO title</Label>
              <Input id="blog-seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} />
              <p className="text-[11px] text-muted-foreground mt-1">{seoTitle.length}/60</p>
            </div>
            <div>
              <Label htmlFor="blog-meta-desc">Meta description</Label>
              <Textarea id="blog-meta-desc" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} rows={3} maxLength={160} />
              <p className="text-[11px] text-muted-foreground mt-1">{seoDesc.length}/160</p>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={!id || ogGenerating}
                onClick={async () => {
                  if (!id) return;
                  setOgGenerating(true);
                  const { data, error } = await supabase.functions.invoke("generate-og-image", {
                    body: { postId: id },
                  });
                  setOgGenerating(false);
                  if (error) {
                    toast({ title: "Failed", description: error.message, variant: "destructive" });
                    return;
                  }
                  const url = (data as any)?.og_image_url as string | undefined;
                  if (url) setOgImageUrl(`${url}?t=${Date.now()}`);
                  toast({ title: "OG image generated", description: "Cover image updated for social sharing." });
                }}
              >
                {ogGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                {ogImageUrl ? "Regenerate OG image" : "Generate OG image"}
              </Button>

              {ogImageUrl && (
                <div className="space-y-2 rounded-md border bg-muted/20 p-2">
                  <div className="aspect-[1200/630] w-full overflow-hidden rounded border bg-background">
                    <img
                      src={ogImageUrl}
                      alt="OG preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Input
                      readOnly
                      value={ogImageUrl.split("?")[0]}
                      onFocus={(e) => e.currentTarget.select()}
                      className="h-8 text-xs font-mono"
                      aria-label="OG image URL"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={async () => {
                        const u = ogImageUrl.split("?")[0];
                        try {
                          await navigator.clipboard.writeText(u);
                          toast({ title: "Copied", description: "OG image URL copied to clipboard." });
                        } catch {
                          toast({ title: "Copy failed", variant: "destructive" });
                        }
                      }}
                      aria-label="Copy OG image URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      asChild
                    >
                      <a href={ogImageUrl} target="_blank" rel="noreferrer" aria-label="Open OG image">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const { data, error } = await supabase.functions.invoke("regenerate-sitemap", {
                    body: {},
                  });
                  if (error) {
                    toast({ title: "Failed", description: error.message, variant: "destructive" });
                    return;
                  }
                  const okCount = ((data as any)?.results ?? []).filter((r: any) => r.ok).length;
                  toast({ title: "Search engines pinged", description: `${okCount}/2 succeeded.` });
                }}
              >
                <Send className="h-4 w-4 mr-2" /> Ping search engines
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Save the post first, then generate a per-post OpenGraph image and notify Google &amp; Bing about new content.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
