import { motion } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useActivityStats } from "@/hooks/useActivityStats";
import { ActivityFeedItem } from "@/components/activity/ActivityFeedItem";
import { ActivityStats } from "@/components/activity/ActivityStats";
import { ActivityEmptyState } from "@/components/activity/ActivityEmptyState";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

const MyActivity = () => {
  const { activities, loading: feedLoading, refetch: refetchFeed } = useActivityFeed({ limit: 50 });
  const { stats, loading: statsLoading, refetch: refetchStats } = useActivityStats();

  const handleRefresh = () => {
    refetchFeed();
    refetchStats();
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Activity</h1>
                <p className="text-sm text-muted-foreground">Track your learning journey in real-time</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={feedLoading || statsLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${feedLoading || statsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <ActivityStats stats={stats} loading={statsLoading} />

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Activity Timeline</CardTitle>
                  <CardDescription>Your recent learning activities</CardDescription>
                </div>
                {activities.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {activities.length} activities
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {feedLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4">
                      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <ActivityEmptyState />
              ) : (
                <div className="divide-y">
                  {groupOrder.map((group) => {
                    const groupActivities = groupedActivities[group];
                    if (!groupActivities?.length) return null;

                    return (
                      <div key={group}>
                        <div className="px-6 py-3 bg-muted/20 sticky top-16 z-10">
                          <h3 className="text-sm font-semibold text-muted-foreground">
                            {group}
                          </h3>
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
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default MyActivity;
