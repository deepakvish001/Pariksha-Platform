import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, Eye, Heart, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useBlogPosts, useBlogCategories } from "@/hooks/useBlog";

const PAGE_SIZE = 9;

export default function BlogIndex() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const { data: categories = [] } = useBlogCategories();
  const { data: posts = [], isLoading } = useBlogPosts({ search, categorySlug: cat });

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, cat]);

  const featured = !search && !cat ? posts.find((p) => p.is_featured) ?? posts[0] : undefined;
  const rest = useMemo(
    () => (featured ? posts.filter((p) => p.id !== featured.id) : posts),
    [posts, featured],
  );

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…" className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Badge variant={!cat ? "default" : "outline"} className="cursor-pointer" onClick={() => setCat(undefined)}>All</Badge>
          {categories.map((c) => (
            <Badge key={c.id} variant={cat === c.slug ? "default" : "outline"} className="cursor-pointer" onClick={() => setCat(c.slug)}>{c.name}</Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-16">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">
          <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-30" />
          <p>No articles yet. Check back soon!</p>
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
                    <PostMeta post={featured} />
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
                    <div className="mt-auto"><PostMeta post={p} /></div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
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
    </div>
  );
}
