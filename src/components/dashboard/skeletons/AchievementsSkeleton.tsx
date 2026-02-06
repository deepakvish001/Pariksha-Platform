import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AchievementsSkeletonProps {
  className?: string;
  itemCount?: number;
}

const AchievementsSkeleton = ({ className, itemCount = 8 }: AchievementsSkeletonProps) => {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(itemCount)].map((_, i) => (
            <motion.div
              key={i}
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Skeleton className="h-12 w-12 rounded-lg" />
            </motion.div>
          ))}
        </div>
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

export default AchievementsSkeleton;
