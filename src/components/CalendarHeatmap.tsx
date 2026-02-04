import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityData {
  [date: string]: number;
}

interface CalendarHeatmapProps {
  activityData: ActivityData;
  months?: number;
}

const CalendarHeatmap = ({ activityData, months = 4 }: CalendarHeatmapProps) => {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const weeksData: { date: Date; count: number }[][] = [];
    const labels: { label: string; weekIndex: number }[] = [];
    
    // Calculate start date (beginning of the week, months ago)
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to Sunday
    
    let currentDate = new Date(startDate);
    let currentWeek: { date: Date; count: number }[] = [];
    let lastMonth = -1;
    let weekIndex = 0;
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = activityData[dateStr] || 0;
      
      // Track month labels
      if (currentDate.getMonth() !== lastMonth && currentDate.getDay() === 0) {
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'short' });
        labels.push({ label: monthName, weekIndex });
        lastMonth = currentDate.getMonth();
      }
      
      currentWeek.push({ date: new Date(currentDate), count });
      
      // Start new week on Sunday
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
    
    return { weeks: weeksData, monthLabels: labels };
  }, [activityData, months]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted';
    if (count === 1) return 'bg-primary/30';
    if (count <= 3) return 'bg-primary/50';
    if (count <= 5) return 'bg-primary/70';
    return 'bg-primary';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-fit">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map((m, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground"
              style={{ 
                position: 'relative',
                left: `${m.weekIndex * 14}px`,
                marginRight: i < monthLabels.length - 1 
                  ? `${(monthLabels[i + 1]?.weekIndex - m.weekIndex - 1) * 14}px` 
                  : 0
              }}
            >
              {m.label}
            </div>
          ))}
        </div>
        
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="h-3 w-6 text-xs text-muted-foreground flex items-center">
                {label}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, dayIndex) => {
                  const day = week.find(d => d.date.getDay() === dayIndex);
                  if (!day) {
                    return <div key={dayIndex} className="h-3 w-3" />;
                  }
                  
                  return (
                    <Tooltip key={dayIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-3 w-3 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-foreground/50 ${getIntensityClass(day.count)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">{day.count} topic{day.count !== 1 ? 's' : ''}</p>
                        <p className="text-muted-foreground">{formatDate(day.date)}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-3 rounded-sm bg-muted" />
            <div className="h-3 w-3 rounded-sm bg-primary/30" />
            <div className="h-3 w-3 rounded-sm bg-primary/50" />
            <div className="h-3 w-3 rounded-sm bg-primary/70" />
            <div className="h-3 w-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeatmap;
