import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TopicBadgesWithOverflowProps {
  topics: string[];
  /** Number of topics to show inline before collapsing the rest into a +N popover. */
  visibleCount?: number;
  /** Tailwind class names applied to each visible topic badge. */
  badgeClassName?: string;
  /** Tailwind class names applied to the overflow (+N) badge. */
  overflowBadgeClassName?: string;
  /** Tailwind class names for the wrapper of inline badges. */
  className?: string;
  /** Tailwind class names for the popover content container. */
  popoverClassName?: string;
  /** Max height (Tailwind class) applied to the scrollable area inside the popover. */
  popoverMaxHeightClassName?: string;
  /** Stop propagation on popover interactions (useful inside clickable rows). */
  stopPropagation?: boolean;
}

/**
 * Renders a list of topic badges with the first `visibleCount` shown inline and
 * the remainder collapsed into a clickable "+N" badge that reveals the rest in
 * a clamped, scrollable popover.
 */
export const TopicBadgesWithOverflow = ({
  topics,
  visibleCount = 3,
  badgeClassName = "text-xs font-normal",
  overflowBadgeClassName = "text-xs font-normal cursor-pointer hover:bg-muted/60 transition-colors",
  className = "flex flex-wrap gap-1",
  popoverClassName = "w-auto max-w-xs p-2",
  popoverMaxHeightClassName = "max-h-48",
  stopPropagation = true,
}: TopicBadgesWithOverflowProps) => {
  if (!topics || topics.length === 0) return null;

  const visible = topics.slice(0, visibleCount);
  const overflow = topics.slice(visibleCount);
  const stop = (e: React.SyntheticEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return (
    <div className={className}>
      {visible.map((t) => (
        <Badge key={t} variant="secondary" className={badgeClassName}>
          {t}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={stop}
              className="inline-flex"
              aria-label={`Show ${overflow.length} more topics`}
            >
              <Badge variant="outline" className={overflowBadgeClassName}>
                +{overflow.length}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={popoverClassName}
            onClick={stop}
          >
            <div className={cn(popoverMaxHeightClassName, "overflow-y-auto pr-1")}>
              <div className="flex flex-wrap gap-1">
                {overflow.map((t) => (
                  <Badge key={t} variant="secondary" className={badgeClassName}>
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
