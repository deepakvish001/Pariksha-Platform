import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HeatmapSkeletonProps {
  className?: string;
}

const HeatmapSkeleton = ({ className }: HeatmapSkeletonProps) => {
  // Generate 52 weeks x 7 days = 364 cells
  const cellCount = 52 * 7;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-3 rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[750px]">
          {/* Month labels */}
          <div className="flex gap-1 mb-2 ml-8">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, i) => (
              <Skeleton key={i} className="h-3 w-6" style={{ marginLeft: i === 0 ? 0 : "1.5rem" }} />
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-1">
              {["", "Mon", "", "Wed", "", "Fri", ""].map((day, i) => (
                <div key={i} className="h-3 flex items-center">
                  {day && <Skeleton className="h-2 w-4" />}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
              {[...Array(cellCount)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.random() * 0.5 + 0.3 }}
                  transition={{ delay: i * 0.001, duration: 0.2 }}
                >
                  <Skeleton className="h-3 w-3 rounded-sm" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ translateX: ["-100%", "200%"] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 0.5,
          ease: "easeInOut",
        }}
      />
    </Card>
  );
};

export default HeatmapSkeleton;
