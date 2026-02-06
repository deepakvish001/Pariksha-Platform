import { motion } from "framer-motion";
import { BarChart3, Copy, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useOutreachUsageAnalytics } from "@/hooks/useOutreachUsageAnalytics";
import { outreachTemplates, getCategoryLabel } from "@/data/coldOutreachData";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const OutreachUsageAnalytics = () => {
  const { user } = useAuth();
  const { topTemplates, totalCopies, chartData, recentActivity, isLoading } = useOutreachUsageAnalytics();

  if (!user) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sign in to view analytics</h3>
        <p className="text-muted-foreground">
          Track your template usage and see which messages work best
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (totalCopies === 0) {
    return (
      <div className="text-center py-16">
        <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No usage data yet</h3>
        <p className="text-muted-foreground">
          Start copying templates to track your outreach activity
        </p>
      </div>
    );
  }

  const getTemplateTitle = (templateId: string) => {
    const template = outreachTemplates.find((t) => t.id === templateId);
    return template?.title || templateId;
  };

  const getTemplateCategory = (templateId: string) => {
    const template = outreachTemplates.find((t) => t.id === templateId);
    return template ? getCategoryLabel(template.category) : "Custom";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Copy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCopies}</p>
                <p className="text-sm text-muted-foreground">Total Copies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{topTemplates.length}</p>
                <p className="text-sm text-muted-foreground">Templates Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recentActivity.length > 0
                    ? formatDistanceToNow(new Date(recentActivity[0].copied_at), { addSuffix: false })
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">Since Last Copy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Copy Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="copyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">
                              {format(new Date(payload[0].payload.date), "MMM d, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].value} copies
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="url(#copyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Used Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTemplates.slice(0, 5).map((stat, index) => (
                <div
                  key={stat.templateId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{getTemplateTitle(stat.templateId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTemplateCategory(stat.templateId)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{stat.count} copies</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {getTemplateTitle(activity.template_id)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getTemplateCategory(activity.template_id)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.copied_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default OutreachUsageAnalytics;
