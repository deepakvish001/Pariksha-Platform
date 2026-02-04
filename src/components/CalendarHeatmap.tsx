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

  const { monthsData, stats } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Determine which months to show based on range
    let startMonth: number;
    let endMonth: number;
    
    if (selectedRange === 'current') {
      startMonth = 0; // January
      endMonth = 11; // December
    } else if (selectedRange === '6months') {
      startMonth = Math.max(0, today.getMonth() - 5);
      endMonth = today.getMonth();
    } else {
      startMonth = Math.max(0, today.getMonth() - 2);
      endMonth = today.getMonth();
    }
    
    // Stats tracking
    let totalSubmissions = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    // Build data for each month
    const monthsArr: { 
      label: string; 
      weeks: { date: Date; count: number }[][] 
    }[] = [];
    
    for (let month = startMonth; month <= endMonth; month++) {
      const monthLabel = new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'short' });
      const weeksInMonth: { date: Date; count: number }[][] = [];
      
      // Get first and last day of month
      const firstDay = new Date(currentYear, month, 1);
      const lastDay = new Date(currentYear, month + 1, 0);
      
      // Start from the Sunday of the week containing the 1st
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      let currentWeek: { date: Date; count: number }[] = [];
      let currentDate = new Date(startDate);
      
      // Build weeks until we pass the last day of the month
      while (currentDate <= lastDay || currentWeek.length > 0) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInMonth = currentDate.getMonth() === month && currentDate.getFullYear() === currentYear;
        const isInPast = currentDate <= today;
        const count = (isInMonth && isInPast) ? (activityData[dateStr] || 0) : -1; // -1 means not in this month
        
        // Track stats only for days in the displayed months
        if (isInMonth && isInPast) {
          totalSubmissions += activityData[dateStr] || 0;
          if (activityData[dateStr] > 0) {
            activeDays++;
            tempStreak++;
            maxStreak = Math.max(maxStreak, tempStreak);
          } else {
            tempStreak = 0;
          }
        }
        
        currentWeek.push({ date: new Date(currentDate), count });
        
        // Start new week on Saturday
        if (currentDate.getDay() === 6) {
          weeksInMonth.push(currentWeek);
          currentWeek = [];
          
          // Check if we've completed the month
          if (currentDate >= lastDay) {
            break;
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Add remaining days if any
      if (currentWeek.length > 0) {
        weeksInMonth.push(currentWeek);
      }
      
      monthsArr.push({ label: monthLabel, weeks: weeksInMonth });
    }
    
    return { 
      monthsData: monthsArr,
      stats: {
        totalSubmissions,
        activeDays,
        maxStreak,
      }
    };
  }, [activityData, selectedRange]);

  const getIntensityClass = (count: number) => {
    if (count === -1) return 'bg-transparent'; // Not in this month
    if (count === 0) return 'bg-[#161b22]';
    if (count === 1) return 'bg-[#0e4429]';
    if (count <= 3) return 'bg-[#006d32]';
    if (count <= 5) return 'bg-[#26a641]';
    return 'bg-[#39d353]';
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
        <div className="flex gap-4">
          {monthsData.map((monthData, monthIndex) => (
            <div key={monthIndex} className="flex flex-col items-center">
              {/* Month grid */}
              <div className="flex gap-[2px]">
                {monthData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const day = week.find(d => d.date.getDay() === dayIndex);
                      if (!day || day.count === -1) {
                        return <div key={dayIndex} className="h-[10px] w-[10px]" />;
                      }
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[10px] w-[10px] rounded-[2px] transition-all cursor-pointer hover:ring-1 hover:ring-white/30 ${getIntensityClass(day.count)}`}
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
              
              {/* Month label */}
              <span className="text-xs text-muted-foreground mt-1">
                {monthData.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
