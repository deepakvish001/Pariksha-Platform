import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Eye, Heart, Bookmark, Share2, MessageCircle, Trash2, Flag } from "lucide-react";
import { BlogContent } from "@/components/blog/BlogContent";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { extractToc } from "@/lib/blog/extractToc";
import { useMemo } from "react";
import { useBlogPost, useTrackBlogView, useBlogLike, useBlogBookmark, useBlogComments, usePostComment, useDeleteComment, useReportComment, useRelatedPosts } from "@/hooks/useBlog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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

  useEffect(() => {
    if (post?.id) trackView.mutate(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  if (isLoading) return <div className="container mx-auto py-16 text-center text-muted-foreground">Loading…</div>;
  if (!post) return <div className="container mx-auto py-16 text-center">Post not found.</div>;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const toc = useMemo(() => extractToc(post.content_md || ""), [post.content_md]);

  return (
    <>
      <ReadingProgress />
      <article className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.seo_description || post.excerpt || ""} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || ""} />
        {post.og_image_url && <meta property="og:image" content={post.og_image_url} />}
        {post.cover_image_url && !post.og_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: post.cover_image_url,
          datePublished: post.published_at,
          author: { "@type": "Person", name: post.author?.full_name || "Byteskill" },
        })}</script>
      </Helmet>

      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />All posts</Link></Button>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 max-w-3xl mx-auto w-full">
          <div className="flex gap-2 mb-3 flex-wrap">
            {post.categories?.map((c) => <Badge key={c.id} variant="outline">{c.name}</Badge>)}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>}

          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url ?? undefined} />
              <AvatarFallback>{(post.author?.full_name?.[0] || "B").toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{post.author?.full_name || "Byteskill"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-3">
                {post.published_at && <span>{new Date(post.published_at).toLocaleDateString()}</span>}
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_time_min} min read</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count}</span>
              </p>
            </div>
          </div>

          {post.cover_image_url && <img src={post.cover_image_url} alt="" className="w-full rounded-lg mb-8 border" />}

          <BlogContent source={post.content_md} className="mb-8" />

      <div className="flex gap-2 py-4 border-y mb-8">
        <Button variant={liked ? "default" : "outline"} size="sm" onClick={() => toggleLike()}>
          <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-current" : ""}`} />{post.like_count}
        </Button>
        <Button variant={bookmarked ? "default" : "outline"} size="sm" onClick={() => toggleBookmark()}>
          <Bookmark className={`mr-2 h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />{post.bookmark_count ?? 0}
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          navigator.clipboard.writeText(url);
          toast({ title: "Link copied!" });
        }}>
          <Share2 className="mr-2 h-4 w-4" />Share
        </Button>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-1 mb-8 flex-wrap">
          {post.tags.map((t) => <Badge key={t.id} variant="secondary">#{t.name}</Badge>)}
        </div>
      )}

      {post.allow_comments && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5" />Comments ({comments.length})</h2>
          {user ? (
            <Card className="p-4 mb-6">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add your comment…" rows={3} />
              <div className="flex justify-end mt-2">
                <Button size="sm" disabled={!body.trim() || postComment.isPending} onClick={() => {
                  postComment.mutate({ body }, { onSuccess: () => setBody("") });
                }}>Post</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 mb-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary underline">Sign in</Link> to leave a comment.
            </Card>
          )}
          <div className="space-y-3">
            {comments.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.author?.avatar_url ?? undefined} />
                    <AvatarFallback>{(c.author?.full_name?.[0] || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{c.author?.full_name || "User"}</p>
                      <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                  </div>
                  {user && user.id !== c.user_id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-7 w-7"
                      title="Report comment"
                      onClick={() => reportComment.mutate(c.id)}
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {user?.id === c.user_id && (
                    <Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => deleteComment.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-4">Related posts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r: any) => (
              <Link key={r.id} to={`/blog/${r.slug}`}>
                <Card className="overflow-hidden h-full group hover:border-primary/50 transition-colors">
                  {r.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={r.cover_image_url}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {r.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.reading_time_min}m</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{r.view_count}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{r.like_count}</span>
                      <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{r.bookmark_count ?? 0}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>
    </article>
    </>
  );
}
