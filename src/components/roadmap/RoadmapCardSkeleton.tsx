import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RoadmapCardSkeletonProps {
  isFeatured?: boolean;
}

const RoadmapCardSkeleton: React.FC<RoadmapCardSkeletonProps> = ({ isFeatured = false }) => {
  return (
    <Card className={cn(
      "overflow-hidden h-full border-2",
      isFeatured && "ring-2 ring-primary/10"
    )}>
      {/* Header skeleton with shimmer */}
      <div className="h-28 sm:h-32 relative bg-muted overflow-hidden">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Badge skeletons */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Skeleton className="h-5 w-20 bg-background/30" />
          <Skeleton className="h-5 w-24 bg-background/30" />
        </div>
        
        {/* Center icon skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-12 w-12 rounded-xl bg-background/30" />
        </div>
      </div>

      <CardHeader className="pb-2 pt-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <div className="ml-auto">
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Grid of skeleton cards
interface RoadmapSkeletonGridProps {
  count?: number;
  isFeatured?: boolean;
}

export const RoadmapSkeletonGrid: React.FC<RoadmapSkeletonGridProps> = ({ 
  count = 3, 
  isFeatured = false 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <RoadmapCardSkeleton isFeatured={isFeatured} />
        </motion.div>
      ))}
    </div>
  );
};

// Continue learning skeleton
export const ContinueLearningSkeletonGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-24 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Progress comparison skeleton
export const ProgressComparisonSkeleton: React.FC = () => {
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoadmapCardSkeleton;
