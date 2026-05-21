import { format, parseISO, addDays, subDays, isToday, isFuture } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  /** Selected date as ISO yyyy-mm-dd. */
  value: string;
  onChange: (iso: string) => void;
}

const toISO = (d: Date) => format(d, "yyyy-MM-dd");

export default function DateNavigator({ value, onChange }: Props) {
  const date = parseISO(value);
  const today = isToday(date);
  const future = isFuture(date);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center rounded-lg border border-border/40 bg-card/40 overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-none"
          onClick={() => onChange(toISO(subDays(date, 1)))}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="px-3 h-8 text-sm font-medium inline-flex items-center gap-2 hover:bg-card/60 transition"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {format(date, "EEE, MMM d yyyy")}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && onChange(toISO(d))}
              disabled={(d) => d > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-none"
          onClick={() => onChange(toISO(addDays(date, 1)))}
          disabled={future || today}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      {!today && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onChange(toISO(new Date()))}
          >
            Jump to today
          </Button>
          <span className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300">
            <AlertTriangle className="h-3 w-3" />
            Logging for {format(date, "MMM d")}
          </span>
        </>
      )}
    </div>
  );
}
