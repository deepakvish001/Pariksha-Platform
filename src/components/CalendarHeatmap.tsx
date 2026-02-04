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
  accountCreatedAt?: string; // ISO date string of when account was created
}

const CalendarHeatmap = ({ activityData, accountCreatedAt }: CalendarHeatmapProps) => {
  const currentYear = new Date().getFullYear();
  const accountYear = accountCreatedAt ? new Date(accountCreatedAt).getFullYear() : currentYear;
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  
  
  // Generate available years from account creation to current
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let year = accountYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }, [accountYear, currentYear]);

  const { monthsData, stats } = useMemo(() => {
    const today = new Date();
    
    // Always show full year (Jan to Dec)
    const startMonth = 0;
    const endMonth = 11;
    
    // Stats tracking
    let totalSubmissions = 0;
    let activeDays = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    // Build data for each month
    const monthsArr: { 
      label: string; 
      weeks: { date: Date; count: number; isInMonth: boolean }[][] 
    }[] = [];
    
    for (let month = startMonth; month <= endMonth; month++) {
      const monthLabel = new Date(selectedYear, month, 1).toLocaleDateString('en-US', { month: 'short' });
      const weeksInMonth: { date: Date; count: number; isInMonth: boolean }[][] = [];
      
      // Get first and last day of month
      const firstDay = new Date(selectedYear, month, 1);
      const lastDay = new Date(selectedYear, month + 1, 0);
      
      // Start from the Sunday of the week containing the 1st
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      
      let currentWeek: { date: Date; count: number; isInMonth: boolean }[] = [];
      let currentDate = new Date(startDate);
      
      // Build weeks until we pass the last day of the month
      while (currentDate <= lastDay || currentWeek.length > 0) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInMonth = currentDate.getMonth() === month && currentDate.getFullYear() === selectedYear;
        const isInPast = currentDate <= today;
        const count = isInPast ? (activityData[dateStr] || 0) : 0;
        
        // Track stats only for days in the displayed months and in the past
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
        
        currentWeek.push({ date: new Date(currentDate), count, isInMonth });
        
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
  }, [activityData, selectedYear, currentYear]);

  const getIntensityClass = (count: number, isInMonth: boolean) => {
    if (!isInMonth) return 'bg-transparent'; // Not in this month
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

  const getPeriodText = () => {
    return selectedYear === currentYear ? 'year' : `${selectedYear}`;
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
          
          {/* Year Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                {selectedYear}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableYears.map((year) => (
                <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)}>
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-2 pt-0">
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]"></div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]">Mon</div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]"></div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]">Wed</div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]"></div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]">Fri</div>
            <div className="h-[10px] text-[9px] text-muted-foreground leading-[10px]"></div>
          </div>
          
          {/* Month columns */}
          <div className="flex gap-4">
            {monthsData.map((monthData, monthIndex) => (
              <div key={monthIndex} className="flex flex-col items-center">
                {/* Month grid */}
                <div className="flex gap-[2px]">
                  {monthData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const day = week.find(d => d.date.getDay() === dayIndex);
                      if (!day) {
                        return <div key={dayIndex} className="h-[10px] w-[10px]" />;
                      }
                      
                      // Show box but make it transparent if not in month
                      if (!day.isInMonth) {
                        return <div key={dayIndex} className="h-[10px] w-[10px]" />;
                      }
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[10px] w-[10px] rounded-[2px] transition-all cursor-pointer hover:ring-1 hover:ring-white/30 ${getIntensityClass(day.count, day.isInMonth)}`}
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
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="flex gap-[2px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-[10px] w-[10px] rounded-[2px] bg-[#161b22] cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>No activity</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-[10px] w-[10px] rounded-[2px] bg-[#0e4429] cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>1 submission</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-[10px] w-[10px] rounded-[2px] bg-[#006d32] cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>2-3 submissions</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-[10px] w-[10px] rounded-[2px] bg-[#26a641] cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>4-5 submissions</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-[10px] w-[10px] rounded-[2px] bg-[#39d353] cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>6+ submissions</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
