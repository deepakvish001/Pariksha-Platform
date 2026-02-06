import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LeaderboardSkeletonProps {
  className?: string;
  itemCount?: number;
}

const LeaderboardSkeleton = ({ className, itemCount = 5 }: LeaderboardSkeletonProps) => {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(itemCount)].map((_, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            {/* Rank */}
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            {/* Avatar */}
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            {/* Name & Stats */}
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Score */}
            <Skeleton className="h-5 w-12" />
          </motion.div>
        ))}
      </CardContent>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut",
        }}
      />
    </Card>
  );
};

export default LeaderboardSkeleton;
