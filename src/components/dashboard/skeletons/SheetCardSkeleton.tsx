import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SheetCardSkeletonProps {
  index?: number;
  className?: string;
}

const SheetCardSkeleton = ({ index = 0, className }: SheetCardSkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <Card className={cn("relative h-full overflow-hidden", className)}>
        {/* Category Color Strip */}
        <Skeleton className="absolute top-0 left-0 right-0 h-1 rounded-none" />

        <CardContent className="p-5 pt-6 flex flex-col h-full">
          {/* Icon & Category */}
          <div className="flex items-start gap-3 mb-4">
            <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex-1 space-y-2 mb-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>

          {/* Last Activity */}
          <div className="flex items-center gap-1.5 mb-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
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
    </motion.div>
  );
};

export default SheetCardSkeleton;
