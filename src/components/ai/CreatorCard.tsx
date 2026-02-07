import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface CreatorCardProps {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "default";
}

export const CreatorCard = ({ name, avatarUrl, size = "default" }: CreatorCardProps) => {
  const displayName = name || "Anonymous";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-2">
      <Avatar className={avatarSize}>
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="text-[10px]">
          {initials || <User className="h-3 w-3" />}
        </AvatarFallback>
      </Avatar>
      <span className={`${textSize} text-muted-foreground truncate max-w-[120px]`}>
        {displayName}
      </span>
    </div>
  );
};
