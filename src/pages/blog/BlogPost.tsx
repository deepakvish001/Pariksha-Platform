import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  Trash2,
  Flag,
  Reply,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { BlogContent } from "@/components/blog/BlogContent";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { InlineToc } from "@/components/blog/InlineToc";
import { MobileTocSheet } from "@/components/blog/MobileTocSheet";
import { TocLiveAnnouncer } from "@/components/blog/TocLiveAnnouncer";
import { FloatingActionRail } from "@/components/blog/FloatingActionRail";
import { extractToc } from "@/lib/blog/extractToc";
import { scrollToHashOnLoad } from "@/lib/blog/scrollToHeading";
import { useActiveHeading } from "@/hooks/useActiveHeading";
import {
  useBlogPost,
  useTrackBlogView,
  useBlogLike,
  useBlogBookmark,
  useBlogComments,
  usePostComment,
  useDeleteComment,
  useReportComment,
  useRelatedPosts,
} from "@/hooks/useBlog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SITE_NAME = "Parikshaa";
const SITE_URL =
  (typeof window !== "undefined" && window.location.origin) ||
  "https://www.parikshaa.org";

export default function BlogPost() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: post, isLoading } = useBlogPost(slug);
  const trackView = useTrackBlogView();
  const { liked, toggle: toggleLike } = useBlogLike(post?.id);
  const { bookmarked, toggle: toggleBookmark } = useBlogBookmark(post?.id);
  const { data: comments = [] } = useBlogComments(post?.id);
  const postComment = usePostComment(post?.id);
  const deleteComment = useDeleteComment(post?.id);
  const reportComment = useReportComment(post?.id);
  const { data: related = [] } = useRelatedPosts(
    post?.id,
    post?.categories?.map((c) => c.slug),
    3,
  );
  const [body, setBody] = useState("");
  // Honeypot: a hidden field that bots tend to fill in. If non-empty on submit,
  // we silently drop the comment without telling the bot.
  const [hp, setHp] = useState("");
  // Also require a minimum dwell time on the form before accepting submissions.
  const [formMountedAt] = useState(() => Date.now());

  useEffect(() => {
    if (post?.id) trackView.mutate(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  // Keyboard shortcuts: t = top, c = comments
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.matches?.("input, textarea, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "t") window.scrollTo({ top: 0, behavior: "smooth" });
      if (e.key === "c") {
        document
          .querySelector('[data-section="comments"]')
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build threaded comment tree
  const tree = useMemo(() => buildTree(comments), [comments]);
  const [commentSort, setCommentSort] = useState<"newest" | "oldest" | "top">("newest");
  const [visibleRoots, setVisibleRoots] = useState(10);
  const sortedTree = useMemo(() => {
    const arr = [...tree];
    const count = (n: TreeNode): number =>
      1 + n.children.reduce((s, c) => s + count(c), 0);
    if (commentSort === "newest")
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (commentSort === "oldest")
      arr.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    else arr.sort((a, b) => count(b) - count(a));
    return arr;
  }, [tree, commentSort]);
  useEffect(() => setVisibleRoots(10), [commentSort, post?.id]);

  // TOC extraction must happen before early returns so the active-heading
  // hook below runs unconditionally.
  const toc = useMemo(() => extractToc(post?.content_md || ""), [post?.content_md]);
  const activeHeadingId = useActiveHeading(toc);

  // Deep-link: when the post + content render, honour the URL hash.
  useEffect(() => {
    if (!post?.content_md || !window.location.hash) return;
    // Wait a tick for BlogContent to render headings, then jump with offset.
    const t = setTimeout(() => scrollToHashOnLoad(), 60);
    return () => clearTimeout(t);
  }, [post?.id, post?.content_md]);

  if (isLoading)
    return <div className="container mx-auto py-16 text-center text-muted-foreground">Loading…</div>;
  if (!post)
    return <div className="container mx-auto py-16 text-center">Post not found.</div>;

  const url = `${SITE_URL}/blog/${post.slug}`;
  const canonical = post.canonical_url || url;
  const ogImage = post.og_image_url || post.cover_image_url || `${SITE_URL}/og-image.png`;
  const seoTitle = post.seo_title || `${post.title} — ${SITE_NAME}`;
  const seoDesc = post.seo_description || post.excerpt || `${post.title} · ${SITE_NAME} blog.`;
  const coverAlt = post.title; // alt-text fallback derived from title

  return (
    <>
      <ReadingProgress totalMinutes={post.reading_time_min} />
      <FloatingActionRail
        liked={liked}
        bookmarked={bookmarked}
        likeCount={post.like_count}
        bookmarkCount={post.bookmark_count ?? 0}
        onToggleLike={() => toggleLike()}
        onToggleBookmark={() => toggleBookmark()}
        url={url}
      />
      <MobileTocSheet items={toc} activeId={activeHeadingId} storageKey={post.slug} />
      <TocLiveAnnouncer items={toc} activeId={activeHeadingId} />
      <article className="container mx-auto px-4 py-8 pb-24 lg:pb-8 max-w-6xl">
        <Helmet prioritizeSeoTags>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDesc} />
          <link rel="canonical" href={canonical} />

          {/* Open Graph */}
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={post.title} />
          <meta property="og:description" content={seoDesc} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={coverAlt} />
          {post.published_at && (
            <meta property="article:published_time" content={post.published_at} />
          )}
          {post.updated_at && (
            <meta property="article:modified_time" content={post.updated_at} />
          )}
          {post.author?.full_name && (
            <meta property="article:author" content={post.author.full_name} />
          )}
          {post.categories?.map((c) => (
            <meta key={c.id} property="article:section" content={c.name} />
          ))}
          {post.tags?.map((t) => (
            <meta key={t.id} property="article:tag" content={t.name} />
          ))}

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={post.title} />
          <meta name="twitter:description" content={seoDesc} />
          <meta name="twitter:image" content={ogImage} />
          <meta name="twitter:image:alt" content={coverAlt} />

          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: seoDesc,
              image: ogImage,
              datePublished: post.published_at,
              dateModified: post.updated_at,
              author: { "@type": "Person", name: post.author?.full_name || SITE_NAME },
              publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
              },
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
              keywords: (post.tags ?? []).map((t) => t.name).join(", "),
            })}
          </script>
        </Helmet>

        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />All posts
          </Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 max-w-3xl mx-auto w-full">
            <div className="flex gap-2 mb-3 flex-wrap">
              {post.categories?.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
            )}

            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author?.avatar_url ?? undefined} alt={post.author?.full_name ?? ""} />
                <AvatarFallback>
                  {(post.author?.full_name?.[0] || "B").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{post.author?.full_name || SITE_NAME}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-3">
                  {post.published_at && (
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString()}
                    </time>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time_min} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.view_count}
                  </span>
                </p>
              </div>
            </div>

            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={coverAlt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={1200}
                height={630}
                sizes="(min-width: 1024px) 800px, 100vw"
                className="w-full h-auto rounded-lg mb-8 border bg-muted/30 object-cover"
              />
            )}

            <InlineToc
              items={toc}
              readingTimeMin={post.reading_time_min}
              activeId={activeHeadingId}
              storageKey={post.slug}
            />

            <BlogContent source={post.content_md} className="mb-8" />

            <div className="flex gap-2 py-4 border-y mb-8">
              <Button variant={liked ? "default" : "outline"} size="sm" onClick={() => toggleLike()}>
                <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {post.like_count}
              </Button>
              <Button
                variant={bookmarked ? "default" : "outline"}
                size="sm"
                onClick={() => toggleBookmark()}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
                {post.bookmark_count ?? 0}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  toast({ title: "Link copied!" });
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1 mb-8 flex-wrap">
                {post.tags.map((t) => (
                  <Link key={t.id} to={`/blog?tag=${encodeURIComponent(t.slug)}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                      #{t.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {post.allow_comments && (
              <section data-section="comments" aria-labelledby="comments-heading">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <h2 id="comments-heading" className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Comments ({comments.length})
                  </h2>
                  {tree.length > 1 && (
                    <div
                      role="radiogroup"
                      aria-label="Sort comments"
                      className="inline-flex rounded-md border bg-muted/30 p-0.5 text-xs"
                    >
                      {(["newest", "top", "oldest"] as const).map((opt) => (
                        <button
                          key={opt}
                          role="radio"
                          aria-checked={commentSort === opt}
                          onClick={() => setCommentSort(opt)}
                          className={cn(
                            "px-2.5 py-1 rounded capitalize transition-colors",
                            commentSort === opt
                              ? "bg-background shadow-sm font-medium"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {user ? (
                  <Card className="p-4 mb-6">
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Add your comment…"
                      rows={3}
                      maxLength={2000}
                      aria-label="Add a comment"
                    />
                    {/* Honeypot — visually hidden, off-screen, ignored by screen readers */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={hp}
                      onChange={(e) => setHp(e.target.value)}
                      style={{
                        position: "absolute",
                        left: "-10000px",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {body.length}/2000 · Comments are reviewed before they appear.
                      </span>
                      <Button
                        size="sm"
                        disabled={!body.trim() || postComment.isPending}
                        onClick={() => {
                          // Spam guards: honeypot filled OR form submitted in <3s.
                          if (hp || Date.now() - formMountedAt < 3000) {
                            // Pretend it worked so bots don't retry.
                            setBody("");
                            toast({
                              title: "Submitted for review",
                              description: "Your comment will appear after admin approval.",
                            });
                            return;
                          }
                          postComment.mutate(
                            { body },
                            {
                              onSuccess: () => {
                                setBody("");
                                toast({
                                  title: "Submitted for review",
                                  description: "Your comment will appear after admin approval.",
                                });
                              },
                            },
                          );
                        }}
                      >
                        Post
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 mb-6 text-center text-sm text-muted-foreground">
                    <Link to="/login" className="text-primary underline">
                      Sign in
                    </Link>{" "}
                    to leave a comment.
                  </Card>
                )}

                {tree.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No comments yet. Be the first to share your thoughts.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-3" role="list">
                      {sortedTree.slice(0, visibleRoots).map((node) => (
                        <CommentNode
                          key={node.id}
                          node={node}
                          depth={0}
                          currentUserId={user?.id}
                          canSignedIn={!!user}
                          onReply={(parentId, text) =>
                            postComment.mutate({ body: text, parentId })
                          }
                          onDelete={(id) => deleteComment.mutate(id)}
                          onReport={(id) => reportComment.mutate(id)}
                        />
                      ))}
                    </ul>
                    {visibleRoots < sortedTree.length && (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleRoots((v) => v + 10)}
                        >
                          Load more comments ({sortedTree.length - visibleRoots} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {related.length > 0 && (
              <section className="mt-12 pt-8 border-t" aria-labelledby="related-heading">
                <h2 id="related-heading" className="text-2xl font-bold mb-4">
                  Related posts
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {related.map((r: any) => (
                    <Link key={r.id} to={`/blog/${r.slug}`}>
                      <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors group">
                        {r.cover_image_url && (
                          <img
                            src={r.cover_image_url}
                            alt={r.title}
                            loading="lazy"
                            decoding="async"
                            width={400}
                            height={225}
                            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {r.title}
                          </h3>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 [scrollbar-width:thin]">
              <TableOfContents items={toc} activeId={activeHeadingId} />
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}

// ────────── Threaded comments ──────────
type CommentRow = ReturnType<typeof useBlogComments>["data"] extends (infer T)[] | undefined ? T : never;
interface TreeNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
  children: TreeNode[];
}

function buildTree(rows: CommentRow[] = []): TreeNode[] {
  const map = new Map<string, TreeNode>();
  rows.forEach((r: any) => map.set(r.id, { ...r, children: [] }));
  const roots: TreeNode[] = [];
  map.forEach((n) => {
    if (n.parent_id && map.has(n.parent_id)) map.get(n.parent_id)!.children.push(n);
    else roots.push(n);
  });
  // newest replies last (chronological)
  const sortRec = (list: TreeNode[]) => {
    list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    list.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

function CommentNode({
  node,
  depth,
  currentUserId,
  canSignedIn,
  onReply,
  onDelete,
  onReport,
}: {
  node: TreeNode;
  depth: number;
  currentUserId: string | undefined;
  canSignedIn: boolean;
  onReply: (parentId: string, body: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const isMine = currentUserId === node.user_id;
  const maxDepth = 4;

  return (
    <li>
      <Card className={cn("p-4", depth > 0 && "border-l-2 border-l-primary/30")}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={node.author?.avatar_url ?? undefined} alt={node.author?.full_name ?? ""} />
            <AvatarFallback>{(node.author?.full_name?.[0] || "U").toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{node.author?.full_name || "User"}</p>
              <time
                dateTime={node.created_at}
                className="text-xs text-muted-foreground shrink-0"
              >
                {new Date(node.created_at).toLocaleDateString()}
              </time>
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{node.body}</p>

            <div className="flex items-center gap-1 mt-2">
              {canSignedIn && depth < maxDepth && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setReplying((v) => !v)}
                  aria-expanded={replying}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}
              {node.children.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => setCollapsed((v) => !v)}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <ChevronRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ChevronDown className="mr-1 h-3 w-3" />
                  )}
                  {node.children.length} {node.children.length === 1 ? "reply" : "replies"}
                </Button>
              )}
              <div className="flex-1" />
              {currentUserId && !isMine && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive h-7 w-7"
                  title="Report comment"
                  onClick={() => onReport(node.id)}
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              )}
              {isMine && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive h-7 w-7"
                  title="Delete comment"
                  onClick={() => onDelete(node.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {replying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Reply to ${node.author?.full_name || "user"}…`}
                  maxLength={2000}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplying(false);
                      setText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!text.trim()}
                    onClick={() => {
                      onReply(node.id, text.trim());
                      setText("");
                      setReplying(false);
                    }}
                  >
                    Post reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {!collapsed && node.children.length > 0 && (
        <ul className={cn("mt-3 space-y-3", depth < 2 ? "ml-6" : "ml-3")} role="list">
          {node.children.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              depth={depth + 1}
              currentUserId={currentUserId}
              canSignedIn={canSignedIn}
              onReply={onReply}
              onDelete={onDelete}
              onReport={onReport}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
