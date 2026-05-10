import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, Eye, Heart, Bookmark, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useBlogPosts, useBlogCategories, useBlogLike, useBlogBookmark } from "@/hooks/useBlog";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export default function BlogIndex() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const cat = params.get("cat") ?? undefined;
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search input → URL (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        const next = new URLSearchParams(params);
        if (searchInput.trim()) next.set("q", searchInput.trim());
        else next.delete("q");
        next.delete("page");
        setParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Keep input in sync if URL changes externally
  useEffect(() => { setSearchInput(search); }, [search]);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: false });
  };

  const { data: categories = [] } = useBlogCategories();
  const { data: posts = [], isLoading } = useBlogPosts({ search, categorySlug: cat });

  const featured = !search && !cat ? posts.find((p) => p.is_featured) ?? posts[0] : undefined;
  const rest = useMemo(
    () => (featured ? posts.filter((p) => p.id !== featured.id) : posts),
    [posts, featured],
  );

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goPage = (p: number) => {
    updateParam("page", p > 1 ? String(p) : undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet>
        <title>Blog — Byteskill</title>
        <meta name="description" content="Career advice, DSA tutorials, interview prep, and placement stories from Byteskill." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-bold">Blog</h1>
        </div>
        <p className="text-muted-foreground">Articles, tutorials & placement stories.</p>
      </motion.div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search articles…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge
            variant={!cat ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => updateParam("cat", undefined)}
          >
            All
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={cat === c.slug ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => updateParam("cat", c.slug)}
            >
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-16">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-30" />
          <p>No articles match your filters.</p>
        </div>
      ) : (
        <>
          {featured && (
            <Link to={`/blog/${featured.slug}`}>
              <Card className="overflow-hidden mb-8 group hover:border-primary/50 transition-colors">
                <div className="grid md:grid-cols-2">
                  {featured.cover_image_url && (
                    <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
                      <img src={featured.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center">
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {featured.categories?.map((c) => <Badge key={c.id} variant="outline">{c.name}</Badge>)}
                      <Badge className="bg-primary/15 text-primary">Featured</Badge>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{featured.title}</h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">{featured.excerpt}</p>
                    <div className="flex items-center justify-between gap-2">
                      <PostMeta post={featured} />
                      <CardActions postId={featured.id} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paged.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`}>
                <Card className="overflow-hidden group hover:border-primary/50 transition-colors h-full flex flex-col">
                  {p.cover_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img src={p.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {p.categories?.slice(0, 2).map((c) => <Badge key={c.id} variant="outline" className="text-[10px]">{c.name}</Badge>)}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.excerpt}</p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <PostMeta post={p} />
                      <CardActions postId={p.id} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => goPage(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => goPage(currentPage + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PostMeta({ post }: { post: any }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.reading_time_min}m</span>
      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count}</span>
      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.like_count}</span>
      <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{post.bookmark_count ?? 0}</span>
    </div>
  );
}

function CardActions({ postId }: { postId: string }) {
  const { liked, toggle: toggleLike } = useBlogLike(postId);
  const { bookmarked, toggle: toggleBookmark } = useBlogBookmark(postId);
  const stop = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => { stop(e); toggleLike(); }}
        className={cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors",
          liked && "text-rose-500",
        )}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
      </button>
      <button
        type="button"
        onClick={(e) => { stop(e); toggleBookmark(); }}
        className={cn(
          "h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors",
          bookmarked && "text-primary",
        )}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
      >
        <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
      </button>
    </div>
  );
}
