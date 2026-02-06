import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, getDay, parseISO, getMonth, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DayActivity } from "@/hooks/useActivityHeatmap";

interface ActivityHeatmapProps {
  data: DayActivity[];
  loading: boolean;
  totalActivities: number;
}

const levelColors = {
  0: "bg-white/[0.03] hover:bg-white/[0.06]",
  1: "bg-emerald-600/25 hover:bg-emerald-600/35",
  2: "bg-emerald-500/45 hover:bg-emerald-500/55",
  3: "bg-emerald-500/65 hover:bg-emerald-500/75",
  4: "bg-emerald-400/90 hover:bg-emerald-400",
};

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ data, loading, totalActivities }: ActivityHeatmapProps) {
  const isMobile = useIsMobile();

  // Filter data for mobile (last 3 months only)
  const filteredData = useMemo(() => {
    if (!isMobile || data.length === 0) return data;
    
    const threeMonthsAgo = subDays(new Date(), 90);
    return data.filter((day) => {
      if (!day.date) return false;
      return parseISO(day.date) >= threeMonthsAgo;
    });
  }, [data, isMobile]);

  // Calculate activities count for filtered data
  const displayedActivities = useMemo(() => {
    if (!isMobile) return totalActivities;
    return filteredData.reduce((sum, day) => sum + day.count, 0);
  }, [filteredData, isMobile, totalActivities]);

  // Organize data into weeks for grid layout
  const { weeks, monthMarkers } = useMemo(() => {
    if (filteredData.length === 0) return { weeks: [], monthMarkers: [] };

    const weeks: DayActivity[][] = [];
    const monthMarkers: { weekIndex: number; month: string }[] = [];
    let currentWeek: DayActivity[] = [];
    let lastMonth = -1;

    // Pad first week with empty days if needed
    const firstDate = parseISO(filteredData[0].date);
    const firstDayOfWeek = getDay(firstDate);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: "", count: 0, level: 0 });
    }

    filteredData.forEach((day, index) => {
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
      if (dayOfWeek === 6 || index === filteredData.length - 1) {
        // Pad last week if needed
        while (currentWeek.length < 7) {
          currentWeek.push({ date: "", count: 0, level: 0 });
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return { weeks, monthMarkers };
  }, [filteredData]);

  if (loading) {
    return (
      <Card className="border-white/[0.03] bg-black/40 backdrop-blur-2xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-5 w-40 bg-white/[0.06]" />
          <Skeleton className="h-4 w-60 bg-white/[0.06]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full bg-white/[0.06]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden border-white/[0.03] bg-black/40 backdrop-blur-2xl">
        <CardHeader className="pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2.5 text-white font-semibold">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                Activity Heatmap
              </CardTitle>
              <CardDescription className="text-white/40 mt-1.5">
                {displayedActivities} activities {isMobile ? "in the last 3 months" : "in the last year"}
              </CardDescription>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2.5 text-xs text-white/40">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-3 w-3 rounded-[3px] ${levelColors[level as keyof typeof levelColors]} transition-colors`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className={isMobile ? "min-w-[320px]" : "min-w-[750px]"}>
              {/* Month labels */}
              <div className="flex mb-2 ml-8">
                {monthMarkers.map((marker, i) => {
                  const cellSize = isMobile ? 12 : 14; // Smaller cells on mobile
                  return (
                    <div
                      key={i}
                      className="text-xs text-white/40"
                      style={{
                        marginLeft: i === 0 ? `${marker.weekIndex * cellSize}px` : undefined,
                        width: i < monthMarkers.length - 1 
                          ? `${(monthMarkers[i + 1].weekIndex - marker.weekIndex) * cellSize}px`
                          : undefined,
                      }}
                    >
                      {marker.month}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-[3px] sm:gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] sm:gap-1 pr-1 sm:pr-2">
                  {dayLabels.map((day, i) => (
                    <div
                      key={day}
                      className="h-[10px] sm:h-3 text-[10px] sm:text-xs text-white/40 leading-[10px] sm:leading-3"
                      style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                    >
                      {isMobile ? day.charAt(0) : day}
                    </div>
                  ))}
                </div>

                {/* Heatmap grid */}
                <TooltipProvider delayDuration={100}>
                  <div className="flex gap-[3px] sm:gap-1">
                    {weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-[3px] sm:gap-1">
                        {week.map((day, dayIndex) => (
                          <Tooltip key={`${weekIndex}-${dayIndex}`}>
                            <TooltipTrigger asChild>
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  delay: weekIndex * 0.003,
                                  type: "spring",
                                  stiffness: 500,
                                  damping: 30
                                }}
                                className={`
                                  h-[10px] w-[10px] sm:h-3 sm:w-3 rounded-sm cursor-pointer transition-colors
                                  ${day.date ? levelColors[day.level] : "bg-transparent"}
                                `}
                              />
                            </TooltipTrigger>
                            {day.date && (
                              <TooltipContent side="top" className="text-xs bg-black/95 border-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50">
                                <p className="font-semibold text-white">
                                  {day.count} {day.count === 1 ? "activity" : "activities"}
                                </p>
                                <p className="text-white/40 mt-0.5">
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
          
          {/* Mobile hint */}
          {isMobile && (
            <p className="text-xs text-white/30 mt-3 text-center">
              ← Scroll to see more →
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
