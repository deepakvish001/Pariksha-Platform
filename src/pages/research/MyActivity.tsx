import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, Loader2, Sparkles, TrendingUp, Clock } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
    <div className="min-h-screen bg-[#0a0a0f] dark:bg-[#0a0a0f]">
      {/* Dark Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-20 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 -right-32 w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[150px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.15, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
      </div>

      {/* Hero Header */}
      <header className="relative border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <SidebarTrigger className="mt-1 text-white/70 hover:text-white" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-primary/40 ring-2 ring-white/10">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-3 w-3 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
                >
                  My Activity
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm sm:text-base text-white/50 mt-1"
                >
                  Track your learning journey in real-time
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mt-3"
                >
                  <Badge className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                  <Badge className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10">
                    <Clock className="h-3 w-3 mr-1" />
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
                className="gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-xl backdrop-blur-sm"
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
              <span className="text-sm text-white/50 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                {activities.length}{hasMore ? "+" : ""} activities
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/40 ring-1 ring-white/5">
              <CardContent className="p-0">
                {feedLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0 bg-white/10" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-3/4 bg-white/10" />
                          <Skeleton className="h-3 w-1/2 bg-white/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <ActivityEmptyState />
                ) : (
                  <div className="divide-y divide-white/5">
                    {groupOrder.map((group) => {
                      const groupActivities = groupedActivities[group];
                      if (!groupActivities?.length) return null;

                      return (
                        <div key={group}>
                          <div className="px-6 py-3 bg-gradient-to-r from-white/5 to-transparent sticky top-0 z-10 backdrop-blur-xl border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
                              <h3 className="text-sm font-semibold text-white">
                                {group}
                              </h3>
                              <span className="text-xs text-white/40">
                                ({groupActivities.length})
                              </span>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
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
                        <div className="flex items-center justify-center gap-3 py-4">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <div className="absolute inset-0 h-6 w-6 rounded-full border-2 border-primary/20" />
                          </div>
                          <span className="text-sm font-medium text-white/50">Loading more activities...</span>
                        </div>
                      )}
                      {!hasMore && activities.length > 0 && (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          <p className="text-center text-sm text-white/40">
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
