import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutGrid } from "lucide-react";
import {
  StatCardSkeleton,
  SheetCardSkeleton,
  ChartSkeleton,
  LeaderboardSkeleton,
  GoalCardSkeleton,
  AchievementsSkeleton,
  HeatmapSkeleton,
} from "./skeletons";

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 sm:h-16 items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-orange flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">Progress Matrix</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Track your preparation across topics</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Stats Grid Skeleton */}
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <StatCardSkeleton key={i} index={i} />
          ))}
        </div>

        {/* Goals Section Skeleton */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <GoalCardSkeleton key={i} index={i} />
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
          {/* Sheet Cards Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <SheetCardSkeleton key={i} index={i} />
              ))}
            </div>
          </motion.div>

          {/* Sidebar Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <ChartSkeleton />
            <LeaderboardSkeleton />
            <AchievementsSkeleton />
          </motion.div>
        </div>

        {/* Heatmap Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HeatmapSkeleton />
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardSkeleton;
