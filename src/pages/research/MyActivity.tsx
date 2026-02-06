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
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 dark:from-primary/10 dark:to-primary/5" />
        <motion.div
          className="absolute top-20 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 -right-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl hidden dark:block"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Hero Header */}
      <header className="relative border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <SidebarTrigger className="mt-1" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30">
                  <Activity className="h-7 w-7 text-primary-foreground" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                </motion.div>
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                >
                  My Activity
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm sm:text-base text-muted-foreground mt-1"
                >
                  Track your learning journey in real-time
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mt-2"
                >
                  <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Live Updates
                  </Badge>
                  <Badge variant="outline" className="bg-muted/50">
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
                className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shadow-lg shadow-primary/10"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${feedLoading || statsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="relative p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </motion.div>
          <ActivityStats stats={stats} loading={statsLoading} />
        </section>

        {/* Activity Heatmap */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Contribution Graph</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
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
            className="flex items-center gap-2 mb-4"
          >
            <h2 className="text-lg font-semibold text-foreground">Activity Timeline</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            {activities.length > 0 && (
              <span className="text-sm text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {activities.length}{hasMore ? "+" : ""} activities
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/20">
              <CardContent className="p-0">
                {feedLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                        <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-3">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <ActivityEmptyState />
                ) : (
                  <div className="divide-y divide-border/50">
                    {groupOrder.map((group) => {
                      const groupActivities = groupedActivities[group];
                      if (!groupActivities?.length) return null;

                      return (
                        <div key={group}>
                          <div className="px-6 py-3 bg-gradient-to-r from-muted/50 to-transparent sticky top-0 z-10 backdrop-blur-sm border-b border-border/30">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                              <h3 className="text-sm font-semibold text-foreground">
                                {group}
                              </h3>
                              <span className="text-xs text-muted-foreground">
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
                          <span className="text-sm font-medium text-muted-foreground">Loading more activities...</span>
                        </div>
                      )}
                      {!hasMore && activities.length > 0 && (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
                          <p className="text-center text-sm text-muted-foreground">
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
