import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, Loader2, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useActivityStats } from "@/hooks/useActivityStats";
import { useActivityHeatmap } from "@/hooks/useActivityHeatmap";
import { ActivityFeedItem } from "@/components/activity/ActivityFeedItem";
import { ActivityStats } from "@/components/activity/ActivityStats";
import { ActivityEmptyState } from "@/components/activity/ActivityEmptyState";
import { ActivityHeatmap } from "@/components/activity/ActivityHeatmap";
import { isToday, isYesterday, isThisWeek } from "date-fns";

const MyActivity = () => {
  const {
    activities, 
    loading: feedLoading, 
    loadingMore,
    hasMore,
    refetch: refetchFeed,
    loadMore 
  } = useActivityFeed({ pageSize: 20 });
  const { stats, loading: statsLoading, refetch: refetchStats } = useActivityStats();
  const { heatmapData, loading: heatmapLoading, totalActivities, refetch: refetchHeatmap } = useActivityHeatmap({ days: 365 });
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !feedLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadingMore, feedLoading, loadMore]);

  const handleRefresh = () => {
    refetchFeed();
    refetchStats();
    refetchHeatmap();
  };

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.created_at);
    let key: string;
    
    if (isToday(date)) {
      key = "Today";
    } else if (isYesterday(date)) {
      key = "Yesterday";
    } else if (isThisWeek(date)) {
      key = "This Week";
    } else {
      key = "Earlier";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(activity);
    return groups;
  }, {} as Record<string, typeof activities>);

  const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

  return (
    <div className="min-h-screen bg-[#030305] dark:bg-[#030305]">
      {/* Ultra Dark Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Deep black base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a12_0%,#030305_50%,#000000_100%)]" />
        
        {/* Subtle animated gradient orbs */}
        <motion.div
          className="absolute top-0 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[180px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -right-40 w-[700px] h-[700px] bg-purple-600/8 rounded-full blur-[200px]"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.12, 0.08, 0.12],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/6 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-[100px]"
          animate={{ 
            scale: [1.05, 0.95, 1.05],
            opacity: [0.1, 0.05, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid overlay - very subtle */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Subtle vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Hero Header */}
      <header className="relative border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative"
              >
                <div className="h-18 w-18 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-primary/30 ring-1 ring-white/10">
                  <Activity className="h-9 w-9 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-2 ring-black"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent"
                >
                  My Activity
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm sm:text-base text-white/40 mt-1.5"
                >
                  Track your learning journey in real-time
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-2.5 mt-4"
                >
                  <Badge className="bg-primary/15 border-primary/25 text-primary hover:bg-primary/25 transition-colors">
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    Live Updates
                  </Badge>
                  <Badge className="bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06] transition-colors">
                    <Clock className="h-3 w-3 mr-1.5" />
                    Real-time
                  </Badge>
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleRefresh}
                disabled={feedLoading || statsLoading}
                className="gap-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-white/80 hover:text-white border border-white/[0.06] hover:border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-300"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${feedLoading || statsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative p-6 md:p-8 space-y-10 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <h2 className="text-lg font-semibold text-white">Overview</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </motion.div>
          <ActivityStats stats={stats} loading={statsLoading} />
        </section>

        {/* Activity Heatmap */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <h2 className="text-lg font-semibold text-white">Contribution Graph</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </motion.div>
          <ActivityHeatmap 
            data={heatmapData} 
            loading={heatmapLoading} 
            totalActivities={totalActivities} 
          />
        </section>

        {/* Activity Feed */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-6"
          >
            <h2 className="text-lg font-semibold text-white">Activity Timeline</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
            {activities.length > 0 && (
              <span className="text-sm text-white/40 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                {activities.length}{hasMore ? "+" : ""} activities
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
          >
            <Card className="overflow-hidden border-white/[0.03] bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/60">
              <CardContent className="p-0">
                {feedLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02]">
                        <Skeleton className="h-13 w-13 rounded-xl shrink-0 bg-white/[0.06]" style={{ height: '3.25rem', width: '3.25rem' }} />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-3/4 bg-white/[0.06]" />
                          <Skeleton className="h-3 w-1/2 bg-white/[0.06]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <ActivityEmptyState />
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {groupOrder.map((group) => {
                      const groupActivities = groupedActivities[group];
                      if (!groupActivities?.length) return null;

                      return (
                        <div key={group}>
                          <div className="px-6 py-4 bg-gradient-to-r from-white/[0.02] to-transparent sticky top-0 z-10 backdrop-blur-2xl border-b border-white/[0.03]">
                            <div className="flex items-center gap-2.5">
                              <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-primary to-orange-500 shadow-lg shadow-primary/40 animate-pulse" />
                              <h3 className="text-sm font-semibold text-white">
                                {group}
                              </h3>
                              <span className="text-xs text-white/35 bg-white/[0.03] px-2 py-0.5 rounded-full">
                                {groupActivities.length}
                              </span>
                            </div>
                          </div>
                          <div className="p-5 space-y-3">
                            {groupActivities.map((activity, index) => (
                              <ActivityFeedItem
                                key={activity.id}
                                activity={activity}
                                index={index}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Infinite scroll trigger */}
                    <div ref={loadMoreRef} className="p-6">
                      {loadingMore && (
                        <div className="flex items-center justify-center gap-3 py-5">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <div className="absolute inset-0 h-6 w-6 rounded-full border-2 border-primary/15" />
                          </div>
                          <span className="text-sm font-medium text-white/40">Loading more activities...</span>
                        </div>
                      )}
                      {!hasMore && activities.length > 0 && (
                        <div className="flex flex-col items-center gap-3 py-5">
                          <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                          <p className="text-center text-sm text-white/30">
                            You've reached the end of your activity history
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default MyActivity;
