import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { GlassPanel } from "./GlassPanel";
import { EloBadge } from "./EloBadge";
import { motion } from "framer-motion";

interface OpponentCardProps {
  name: string;
  avatarUrl?: string | null;
  elo: number;
  passed: number;
  total: number;
  typing?: boolean;
}

export function OpponentCard({ name, avatarUrl, elo, passed, total, typing }: OpponentCardProps) {
  const pct = total > 0 ? (passed / total) * 100 : 0;
  return (
    <GlassPanel glow="magenta" className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-primary/50">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {typing && (
            <motion.span
              className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{name}</div>
          <EloBadge elo={elo} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1 text-muted-foreground">
          <span>Test progress</span>
          <span className="font-mono">{passed} / {total || "?"}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </GlassPanel>
  );
}
