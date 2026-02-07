import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentLike } from "@/hooks/useContentLike";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LikeButtonProps {
  contentId: string;
  likesCount: number;
  size?: "sm" | "default";
  showCount?: boolean;
  className?: string;
}

export const LikeButton = ({
  contentId,
  likesCount,
  size = "default",
  showCount = true,
  className,
}: LikeButtonProps) => {
  const { user } = useAuth();
  const { isLiked, toggleLike, isToggling } = useContentLike(contentId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to like content");
      return;
    }
    toggleLike();
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-8 px-2" : "h-9 px-3";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        buttonSize,
        "gap-1.5 transition-all",
        isLiked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-all",
          isLiked && "fill-current",
          isToggling && "animate-pulse"
        )}
      />
      {showCount && (
        <span className="text-sm font-medium">
          {likesCount + (isLiked && !isToggling ? 0 : 0)}
        </span>
      )}
    </Button>
  );
};
