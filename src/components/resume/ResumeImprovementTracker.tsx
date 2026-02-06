import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Target, Calendar, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import type { AnalysisResult } from "@/hooks/useResumeAnalysis";

interface ResumeImprovementTrackerProps {
  history: AnalysisResult[];
}

export const ResumeImprovementTracker = ({ history }: ResumeImprovementTrackerProps) => {
  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((analysis, index) => ({
        name: format(new Date(analysis.created_at), "MMM d"),
        fullDate: format(new Date(analysis.created_at), "MMM d, yyyy"),
        fileName: analysis.file_name,
        overall: analysis.overall_score,
        ats: analysis.ats_score,
        keywords: analysis.keyword_score,
        format: analysis.format_score,
        content: analysis.content_score,
        index: index + 1,
      }));
  }, [history]);

  const stats = useMemo(() => {
    if (history.length < 2) return null;

    const sorted = [...history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const best = sorted.reduce((a, b) => (a.overall_score > b.overall_score ? a : b));

    return {
      firstScore: first.overall_score,
      latestScore: last.overall_score,
      change: last.overall_score - first.overall_score,
      bestScore: best.overall_score,
      bestDate: format(new Date(best.created_at), "MMM d, yyyy"),
      totalAnalyses: history.length,
      avgScore: Math.round(history.reduce((sum, a) => sum + a.overall_score, 0) / history.length),
      atsImprovement: last.ats_score - first.ats_score,
      keywordImprovement: last.keyword_score - first.keyword_score,
      formatImprovement: last.format_score - first.format_score,
      contentImprovement: last.content_score - first.content_score,
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No analyses yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload your resume to start tracking improvements
          </p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Improvement Tracker
          </CardTitle>
          <CardDescription>
            Upload more resume versions to see your progress over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {history[0].overall_score}
              </div>
              <p className="text-sm text-muted-foreground">Your first score</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analyze revised versions to track improvement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Badge
          variant={isPositive ? "default" : isNeutral ? "secondary" : "destructive"}
          className="text-xs"
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : isNeutral ? (
            <Minus className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {isPositive ? "+" : ""}{value}
        </Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Improvement Tracker
        </CardTitle>
        <CardDescription>
          Track how your resume scores have changed over {stats?.totalAnalyses} analyses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                {stats.change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : stats.change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`text-2xl font-bold ${
                    stats.change > 0
                      ? "text-green-500"
                      : stats.change < 0
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {stats.change > 0 ? "+" : ""}{stats.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Overall Change</p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.bestScore}</span>
              </div>
              <p className="text-xs text-muted-foreground">Best Score</p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.avgScore}</span>
              </div>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
            
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.totalAnalyses}</span>
              </div>
              <p className="text-xs text-muted-foreground">Analyses</p>
            </div>
          </div>
        )}

        {/* Score Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="overallGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                        <p className="font-medium">{data.fullDate}</p>
                        <p className="text-xs text-muted-foreground mb-2 truncate max-w-[200px]">
                          {data.fileName}
                        </p>
                        <div className="space-y-1">
                          <p className="text-primary font-semibold">Overall: {data.overall}</p>
                          <p className="text-xs">ATS: {data.ats}</p>
                          <p className="text-xs">Keywords: {data.keywords}</p>
                          <p className="text-xs">Format: {data.format}</p>
                          <p className="text-xs">Content: {data.content}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="overall"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#overallGradient)"
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Improvements */}
        {stats && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Category Changes (First → Latest)</p>
            <div className="flex flex-wrap gap-3">
              <TrendIndicator value={stats.atsImprovement} label="ATS" />
              <TrendIndicator value={stats.keywordImprovement} label="Keywords" />
              <TrendIndicator value={stats.formatImprovement} label="Format" />
              <TrendIndicator value={stats.contentImprovement} label="Content" />
            </div>
          </div>
        )}

        {/* Recent History */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Recent Analyses</p>
          <div className="space-y-2">
            {[...history]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((analysis, index) => {
                const prevAnalysis = history.find(
                  (a) =>
                    new Date(a.created_at).getTime() < new Date(analysis.created_at).getTime()
                );
                const change = prevAnalysis
                  ? analysis.overall_score - prevAnalysis.overall_score
                  : 0;

                return (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          analysis.overall_score >= 80
                            ? "bg-green-500/20 text-green-600"
                            : analysis.overall_score >= 60
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {analysis.overall_score}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{analysis.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(analysis.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    {index < history.length - 1 && change !== 0 && (
                      <Badge
                        variant={change > 0 ? "default" : "destructive"}
                        className="text-xs ml-2"
                      >
                        {change > 0 ? "+" : ""}{change}
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
