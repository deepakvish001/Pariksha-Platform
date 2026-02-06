import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, getDay, startOfWeek, addDays, parseISO, getMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame } from "lucide-react";
import type { DayActivity } from "@/hooks/useActivityHeatmap";

interface ActivityHeatmapProps {
  data: DayActivity[];
  loading: boolean;
  totalActivities: number;
}

const levelColors = {
  0: "bg-muted hover:bg-muted/80",
  1: "bg-emerald-200 dark:bg-emerald-900 hover:bg-emerald-300 dark:hover:bg-emerald-800",
  2: "bg-emerald-400 dark:bg-emerald-700 hover:bg-emerald-500 dark:hover:bg-emerald-600",
  3: "bg-emerald-500 dark:bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400",
  4: "bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-300",
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ data, loading, totalActivities }: ActivityHeatmapProps) {
  // Organize data into weeks for grid layout
  const { weeks, monthMarkers } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthMarkers: [] };

    const weeks: DayActivity[][] = [];
    const monthMarkers: { weekIndex: number; month: string }[] = [];
    let currentWeek: DayActivity[] = [];
    let lastMonth = -1;

    // Pad first week with empty days if needed
    const firstDate = parseISO(data[0].date);
    const firstDayOfWeek = getDay(firstDate);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, level: 0 });
    }

    data.forEach((day, index) => {
      const date = parseISO(day.date);
      const dayOfWeek = getDay(date);
      const month = getMonth(date);

      // Track month changes for labels
      if (month !== lastMonth) {
        monthMarkers.push({ weekIndex: weeks.length, month: monthLabels[month] });
        lastMonth = month;
      }

      currentWeek.push(day);

      // Start new week on Sunday
      if (dayOfWeek === 6 || index === data.length - 1) {
        // Pad last week if needed
        while (currentWeek.length < 7) {
          currentWeek.push({ date: "", count: 0, level: 0 });
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return { weeks, monthMarkers };
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                Activity Heatmap
              </CardTitle>
              <CardDescription>
                {totalActivities} activities in the last year
              </CardDescription>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-3 w-3 rounded-sm ${levelColors[level as keyof typeof levelColors]}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Month labels */}
              <div className="flex mb-2 ml-8">
                {monthMarkers.map((marker, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: i === 0 ? `${marker.weekIndex * 14}px` : undefined,
                      width: i < monthMarkers.length - 1 
                        ? `${(monthMarkers[i + 1].weekIndex - marker.weekIndex) * 14}px`
                        : undefined,
                    }}
                  >
                    {marker.month}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 pr-2">
                  {dayLabels.map((day, i) => (
                    <div
                      key={day}
                      className="h-3 text-xs text-muted-foreground leading-3"
                      style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <TooltipProvider delayDuration={100}>
                  <div className="flex gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => (
                          <Tooltip key={`${weekIndex}-${dayIndex}`}>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  delay: weekIndex * 0.005,
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30
                                }}
                                className={`
                                  h-3 w-3 rounded-sm cursor-pointer transition-colors
                                  ${day.date ? levelColors[day.level] : "bg-transparent"}
                                `}
                              />
                            </TooltipTrigger>
                            {day.date && (
                              <TooltipContent side="top" className="text-xs">
                                <p className="font-medium">
                                  {day.count} {day.count === 1 ? "activity" : "activities"}
                                </p>
                                <p className="text-muted-foreground">
                                  {format(parseISO(day.date), "MMMM d, yyyy")}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        ))}
                      </div>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
