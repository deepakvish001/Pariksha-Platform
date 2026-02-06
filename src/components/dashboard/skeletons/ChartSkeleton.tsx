import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  className?: string;
  barCount?: number;
}

const ChartSkeleton = ({ className, barCount = 7 }: ChartSkeletonProps) => {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-32">
          {[...Array(barCount)].map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 flex flex-col items-center gap-2"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              style={{ transformOrigin: "bottom" }}
            >
              <Skeleton
                className="w-full rounded-t"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
              <Skeleton className="h-3 w-6" />
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

export default ChartSkeleton;
