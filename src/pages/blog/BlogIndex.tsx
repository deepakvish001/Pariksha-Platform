import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Clock,
  Eye,
  Heart,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  useBlogPosts,
  useBlogCategories,
  useBlogTags,
  useBlogLike,
  useBlogBookmark,
  type BlogSort,
} from "@/hooks/useBlog";
import { cn } from "@/lib/utils";
import { extractLanguages } from "@/lib/blog/extractLanguages";

const LANG_DISPLAY: Record<string, string> = {
  ts: "TS", tsx: "TSX", js: "JS", jsx: "JSX",
  py: "Python", java: "Java", cpp: "CPP", c: "C", cs: "C#",
  go: "Go", rust: "Rust", php: "PHP", ruby: "Ruby",
  kotlin: "Kotlin", swift: "Swift",
  sql: "SQL", html: "HTML", css: "CSS", json: "JSON",
  yaml: "YAML", bash: "Bash", md: "Markdown",
};
const langDisplay = (l: string) => LANG_DISPLAY[l] ?? l.toUpperCase();

const PAGE_SIZE = 9;
const SITE_NAME = "Parikshaa";
const SITE_URL =
  (typeof window !== "undefined" && window.location.origin) ||
  "https://www.parikshaa.org";

export default function BlogIndex() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const cat = params.get("cat") ?? undefined;
  const tag = params.get("tag") ?? undefined;
  const sort = (params.get("sort") as BlogSort) || "recent";
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const langsParam = params.get("langs") ?? "";
  const selectedLangs = useMemo(
    () =>
      langsParam
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [langsParam],
  );
  const [searchInput, setSearchInput] = useState(search);
  const searchRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Keyboard: "/" focuses search, "Esc" clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inField = target?.matches?.("input, textarea, [contenteditable]");
      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearchInput("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: false });
  };

  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: false });
    setSearchInput("");
  };

  const { data: categories = [] } = useBlogCategories();
  const { data: tags = [] } = useBlogTags();
  const { data: posts = [], isLoading } = useBlogPosts({
    search,
    categorySlug: cat,
    tagSlug: tag,
    sort,
  });

  // Languages used by each post (memoised; cheap regex scan).
  const postLangs = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of posts) m.set(p.id, extractLanguages((p as any).content));
    return m;
  }, [posts]);

  const availableLangs = useMemo(() => {
    const set = new Set<string>();
    for (const langs of postLangs.values()) langs.forEach((l) => set.add(l));
    return Array.from(set).sort((a, b) => langDisplay(a).localeCompare(langDisplay(b)));
  }, [postLangs]);

  const langFiltered = useMemo(() => {
    if (selectedLangs.length === 0) return posts;
    const want = new Set(selectedLangs);
    return posts.filter((p) => {
      const langs = postLangs.get(p.id) ?? [];
      return langs.some((l) => want.has(l));
    });
  }, [posts, postLangs, selectedLangs]);

  const featured =
    !search && !cat && !tag && sort === "recent" && selectedLangs.length === 0
      ? langFiltered.find((p) => p.is_featured) ?? langFiltered[0]
      : undefined;
  const rest = useMemo(
    () =>
      featured ? langFiltered.filter((p) => p.id !== featured.id) : langFiltered,
    [langFiltered, featured],
  );

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = rest.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goPage = (p: number) => {
    updateParam("page", p > 1 ? String(p) : undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleLang = (lang: string) => {
    const next = new Set(selectedLangs);
    if (next.has(lang)) next.delete(lang);
    else next.add(lang);
    const value = Array.from(next).join(",");
    updateParam("langs", value || undefined);
  };

  const hasFilters =
    !!(search || cat || tag) || sort !== "recent" || selectedLangs.length > 0;

  // Show top ~12 tags by usage signal (alphabetical fallback)
  const visibleTags = useMemo(() => tags.slice(0, 18), [tags]);

  const canonical = `${SITE_URL}/blog`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Helmet prioritizeSeoTags>
        <title>Blog — {SITE_NAME}</title>
        <meta
          name="description"
          content="Career advice, DSA tutorials, interview prep, and placement stories from Parikshaa."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={`Blog — ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Career advice, DSA tutorials, interview prep, and placement stories."
        />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Blog — ${SITE_NAME}`} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-bold">Blog</h1>
        </div>
        <p className="text-muted-foreground">
          Articles, tutorials & placement stories.{" "}
          <span className="hidden sm:inline text-xs">
            Press{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">/</kbd> to
            search.
          </span>
        </p>
      </motion.div>

      {/* Search + sort */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search articles…"
            className="pl-9"
            type="search"
            aria-label="Search blog articles"
            aria-controls="blog-results"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => updateParam("sort", v === "recent" ? undefined : v)}>
          <SelectTrigger className="w-[160px]" aria-label="Sort posts">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most recent</SelectItem>
            <SelectItem value="popular">Most viewed</SelectItem>
            <SelectItem value="liked">Most liked</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-1 h-3.5 w-3.5" />Clear filters
          </Button>
        )}
      </div>

      {/* Categories */}
      <div role="group" aria-label="Filter by category" className="flex gap-1 mb-2 flex-wrap">
        <FilterChip active={!cat} onClick={() => updateParam("cat", undefined)}>All</FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            active={cat === c.slug}
            onClick={() => updateParam("cat", cat === c.slug ? undefined : c.slug)}
          >
            {c.name}
          </FilterChip>
        ))}
      </div>

      {/* Tags */}
      {visibleTags.length > 0 && (
        <div role="group" aria-label="Filter by tag" className="flex gap-1 mb-3 flex-wrap">
          {visibleTags.map((t) => (
            <FilterChip
              key={t.id}
              active={tag === t.slug}
              variant="tag"
              onClick={() => updateParam("tag", tag === t.slug ? undefined : t.slug)}
            >
              #{t.name}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Languages */}
      {availableLangs.length > 0 && (
        <div
          role="group"
          aria-label="Filter by code language"
          className="flex items-center gap-1 mb-6 flex-wrap"
        >
          <span className="mr-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Lang
          </span>
          {availableLangs.map((l) => {
            const active = selectedLangs.includes(l);
            return (
              <FilterChip
                key={l}
                active={active}
                variant="tag"
                onClick={() => toggleLang(l)}
              >
                {langDisplay(l)}
              </FilterChip>
            );
          })}
          {selectedLangs.length > 0 && (
            <>
              <span
                className="ml-2 text-[11px] text-muted-foreground"
                aria-live="polite"
              >
                Showing {langFiltered.length} post
                {langFiltered.length === 1 ? "" : "s"}
                {" · "}
                {selectedLangs.length} language
                {selectedLangs.length === 1 ? "" : "s"} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => updateParam("langs", undefined)}
                aria-label="Clear language filter"
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            </>
          )}
        </div>
      )}

      {/* aria-live result count */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isLoading ? "Loading articles" : `${posts.length} article${posts.length === 1 ? "" : "s"} found`}
      </p>

      <div id="blog-results">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-16">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>No articles match your filters.</p>
            {hasFilters && (
              <Button variant="link" onClick={clearFilters}>
                Reset filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {featured && (
              <Link to={`/blog/${featured.slug}`} aria-label={`Featured: ${featured.title}`}>
                <Card className="overflow-hidden mb-8 group hover:border-primary/50 transition-colors">
                  <div className="grid md:grid-cols-2">
                    {featured.cover_image_url && (
                      <div className="aspect-video md:aspect-auto md:h-full overflow-hidden">
                        <img
                          src={featured.cover_image_url}
                          alt={featured.title}
                          loading="eager"
                          fetchPriority="high"
                          decoding="async"
                          width={800}
                          height={450}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-center">
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {featured.categories?.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.name}
                          </Badge>
                        ))}
                        <Badge className="bg-primary/15 text-primary">Featured</Badge>
                      </div>
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
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
                <Link key={p.id} to={`/blog/${p.slug}`} aria-label={p.title}>
                  <Card className="overflow-hidden group hover:border-primary/50 transition-colors h-full flex flex-col">
                    {p.cover_image_url && (
                      <div className="aspect-video overflow-hidden bg-muted/30">
                        <img
                          src={p.cover_image_url}
                          alt={p.title}
                          loading="lazy"
                          decoding="async"
                          width={400}
                          height={225}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {p.categories?.slice(0, 2).map((c) => (
                          <Badge key={c.id} variant="outline" className="text-[10px]">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
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
              <nav
                aria-label="Pagination"
                className="flex items-center justify-center gap-2 mt-8"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => goPage(currentPage - 1)}
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
                  onClick={() => goPage(currentPage + 1)}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  variant = "category",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "category" | "tag";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground border-transparent"
          : "bg-background text-foreground border-border hover:bg-muted/60",
        variant === "tag" && !active && "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PostMeta({ post }: { post: any }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      {post.published_at && (
        <time dateTime={post.published_at}>
          {new Date(post.published_at).toLocaleDateString()}
        </time>
      )}
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {post.reading_time_min}m
      </span>
      <span className="flex items-center gap-1">
        <Eye className="h-3 w-3" />
        {post.view_count}
      </span>
      <span className="flex items-center gap-1">
        <Heart className="h-3 w-3" />
        {post.like_count}
      </span>
      <span className="flex items-center gap-1">
        <Bookmark className="h-3 w-3" />
        {post.bookmark_count ?? 0}
      </span>
    </div>
  );
}

function CardActions({ postId }: { postId: string }) {
  const { liked, toggle: toggleLike } = useBlogLike(postId);
  const { bookmarked, toggle: toggleBookmark } = useBlogBookmark(postId);
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          toggleLike();
        }}
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
        onClick={(e) => {
          stop(e);
          toggleBookmark();
        }}
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
