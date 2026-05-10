import { Heart, Bookmark, Share2, ArrowUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  bookmarkCount: number;
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  url: string;
  className?: string;
}

export function FloatingActionRail({
  liked,
  bookmarked,
  likeCount,
  bookmarkCount,
  onToggleLike,
  onToggleBookmark,
  url,
  className,
}: Props) {
  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    } catch {
      /* noop */
    }
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollComments = () => {
    document
      .querySelector('[data-section="comments"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Desktop sticky rail */}
      <aside
        aria-label="Article actions"
        className={cn(
          "hidden lg:flex fixed left-4 xl:left-8 top-1/2 -translate-y-1/2 z-30",
          "flex-col items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur p-2 shadow-lg",
          className,
        )}
      >
        <RailBtn
          aria-label={liked ? "Unlike" : "Like"}
          onClick={onToggleLike}
          active={liked}
          icon={<Heart className={cn("h-4 w-4", liked && "fill-current")} />}
          count={likeCount}
        />
        <RailBtn
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          onClick={onToggleBookmark}
          active={bookmarked}
          icon={<Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />}
          count={bookmarkCount}
        />
        <RailBtn aria-label="Share" onClick={onShare} icon={<Share2 className="h-4 w-4" />} />
        <RailBtn
          aria-label="Jump to comments"
          onClick={scrollComments}
          icon={<MessageCircle className="h-4 w-4" />}
        />
        <RailBtn aria-label="Back to top" onClick={scrollTop} icon={<ArrowUp className="h-4 w-4" />} />
      </aside>

      {/* Mobile bottom bar */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur",
          "flex items-center justify-around py-2 px-3",
        )}
        aria-label="Article actions"
      >
        <Button
          size="sm"
          variant={liked ? "default" : "ghost"}
          onClick={onToggleLike}
          aria-label="Like"
        >
          <Heart className={cn("h-4 w-4 mr-1", liked && "fill-current")} />
          {likeCount}
        </Button>
        <Button
          size="sm"
          variant={bookmarked ? "default" : "ghost"}
          onClick={onToggleBookmark}
          aria-label="Bookmark"
        >
          <Bookmark className={cn("h-4 w-4 mr-1", bookmarked && "fill-current")} />
          {bookmarkCount}
        </Button>
        <Button size="sm" variant="ghost" onClick={onShare} aria-label="Share">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={scrollComments} aria-label="Comments">
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={scrollTop} aria-label="Back to top">
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function RailBtn({
  icon,
  count,
  active,
  ...btn
}: {
  icon: React.ReactNode;
  count?: number;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...btn}
      title={btn["aria-label"] as string | undefined}
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
        "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-primary",
      )}
    >
      {icon}
      {typeof count === "number" && (
        <span className="absolute -bottom-1 -right-1 min-w-[16px] rounded-full bg-card px-1 text-[10px] font-semibold leading-tight text-muted-foreground border border-border">
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </button>
  );
}
