import { BlogContent } from "@/components/blog/BlogContent";
import { cn } from "@/lib/utils";

interface Props {
  source: string;
  className?: string;
}

/** Admin-side preview that renders identically to the public blog post.
 *  Wraps `BlogContent` so admins see exactly what readers will see
 *  (callouts, embeds, mermaid, math, code chrome, etc.). */
export const MarkdownPreview = ({ source, className }: Props) => {
  return (
    <div className={cn("blog-preview", className)}>
      <BlogContent source={source} />
    </div>
  );
};
