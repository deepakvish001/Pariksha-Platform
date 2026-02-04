import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActivityData {
  [date: string]: number;
}

interface CalendarHeatmapProps {
  activityData: ActivityData;
}

const CalendarHeatmap = ({ activityData }: CalendarHeatmapProps) => {
  const [selectedRange, setSelectedRange] = useState<'current' | '6months' | '3months'>('current');
  
  const months = selectedRange === 'current' ? 12 : selectedRange === '6months' ? 6 : 3;

  const { weeks, monthLabels, stats } = useMemo(() => {
    const today = new Date();
    const weeksData: { date: Date; count: number }[][] = [];
    const labels: { label: string; weekIndex: number }[] = [];
    
    // Calculate start date based on months
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to Sunday
    
    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; count: number }[] = [];
    let lastMonth = -1;
    let weekIndex = 0;
    
    // Stats tracking
    let totalSubmissions = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const allDates: { date: string; count: number }[] = [];
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityData[dateStr] || 0;
      
      // Track stats
      totalSubmissions += count;
      if (count > 0) {
        activeDays++;
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      
      allDates.push({ date: dateStr, count });
      
      // Track month labels (at the start of each month)
      if (currentDate.getMonth() !== lastMonth) {
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
        labels.push({ label: monthName, weekIndex });
        lastMonth = currentDate.getMonth();
      }
      
      currentWeek.push({ date: new Date(currentDate), count });
      
      // Start new week on Saturday
      if (currentDate.getDay() === 6) {
        weeksData.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add remaining days
    if (currentWeek.length > 0) {
      weeksData.push(currentWeek);
    }
    
    return { 
      weeks: weeksData, 
      monthLabels: labels,
      stats: {
        totalSubmissions,
        activeDays,
        maxStreak,
      }
    };
  }, [activityData, months]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-[#1e3a29]';
    if (count === 1) return 'bg-[#2d5a3d]';
    if (count <= 3) return 'bg-[#3d7a52]';
    if (count <= 5) return 'bg-[#4d9a66]';
    return 'bg-[#5dba7a]';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case 'current': return 'Current';
      case '6months': return '6 Months';
      case '3months': return '3 Months';
    }
  };

  const getPeriodText = () => {
    switch (selectedRange) {
      case 'current': return 'one year';
      case '6months': return 'six months';
      case '3months': return 'three months';
    }
  };

  return (
    <div className="w-full">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{stats.totalSubmissions}</span>
          <span className="text-muted-foreground">submissions in the past {getPeriodText()}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Total topics completed in this period</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Total active days: </span>
            <span className="font-semibold">{stats.activeDays}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Max streak: </span>
            <span className="font-semibold">{stats.maxStreak}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {getRangeLabel()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedRange('current')}>
                Current (1 Year)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRange('6months')}>
                6 Months
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedRange('3months')}>
                3 Months
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="min-w-fit">
          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week.find(d => d.date.getDay() === dayIndex);
                  if (!day) {
                    return <div key={dayIndex} className="h-[11px] w-[11px]" />;
                  }
                  
                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-[11px] w-[11px] rounded-[2px] transition-all cursor-pointer hover:ring-1 hover:ring-white/30 ${getIntensityClass(day.count)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{day.count} submission{day.count !== 1 ? 's' : ''}</p>
                        <p className="text-muted-foreground">{formatDate(day.date)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Month labels at bottom */}
          <div className="flex mt-2 text-xs text-muted-foreground">
            {monthLabels.map((m, i) => {
              const nextMonthIndex = monthLabels[i + 1]?.weekIndex || weeks.length;
              const width = (nextMonthIndex - m.weekIndex) * 14; // 11px cell + 3px gap
              return (
                <div
                  key={i}
                  style={{ width: `${width}px` }}
                  className="text-left"
                >
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
