import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";

export default function FromTheBlogRail() {
  const { data: posts = [], isLoading } = useBlogPosts({ limit: 6 });

  if (isLoading || posts.length === 0) return null;

  return (
    <section className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">From the Blog</h2>
          <span className="text-sm text-white/40">({posts.length})</span>
        </div>
        <Link
          to="/blog"
          className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 6).map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={`/blog/${p.slug}`}>
              <Card className="h-full overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                {p.cover_image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={p.cover_image_url}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.categories?.slice(0, 1).map((c) => (
                      <Badge key={c.id} variant="secondary" className="text-xs">
                        {c.name}
                      </Badge>
                    ))}
                    {p.reading_time_min ? (
                      <span className="text-xs text-white/50 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.reading_time_min} min
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-semibold text-white line-clamp-2">{p.title}</h3>
                  {p.excerpt && (
                    <p className="text-sm text-white/60 line-clamp-2">{p.excerpt}</p>
                  )}
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
