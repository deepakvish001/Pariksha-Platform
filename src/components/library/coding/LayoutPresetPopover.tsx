import { Layout as LayoutIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  LAYOUT_PRESETS,
  type LayoutPreset,
  type LayoutPresetId,
} from "@/hooks/useEditorLayoutPreset";

interface LayoutPresetPopoverProps {
  current: LayoutPresetId;
  onSelect: (id: LayoutPresetId) => void;
}

/**
 * Renders a mini schematic of the preset using its split percentages so users
 * can recognize the layout visually at a glance — matching the LeetCode-style
 * "Layouts" popover.
 */
const PresetThumbnail = ({ preset }: { preset: LayoutPreset }) => {
  const [leftPct, rightPct] = preset.horizontal;
  const [topPct, bottomPct] = preset.vertical;
  return (
    <div className="flex h-16 w-full gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
      <div
        className="rounded-sm bg-muted-foreground/20"
        style={{ width: `${leftPct}%` }}
        aria-hidden
      />
      <div
        className="flex flex-col gap-1"
        style={{ width: `${rightPct}%` }}
        aria-hidden
      >
        <div
          className="rounded-sm bg-muted-foreground/20"
          style={{ height: `${topPct}%` }}
        />
        <div
          className="rounded-sm bg-muted-foreground/20"
          style={{ height: `${bottomPct}%` }}
        />
      </div>
    </div>
  );
};

export const LayoutPresetPopover = ({
  current,
  onSelect,
}: LayoutPresetPopoverProps) => {
  return (
    <Popover>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  current !== "default" && "text-primary",
                )}
                aria-label="Editor layout presets"
              >
                <LayoutIcon className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Editor layouts</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Layouts</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Per problem &amp; language
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_PRESETS.map((preset) => {
            const isActive = preset.id === current;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelect(preset.id)}
                className={cn(
                  "group relative flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-all hover:border-primary/60 hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background",
                )}
                aria-pressed={isActive}
              >
                <PresetThumbnail preset={preset} />
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium">{preset.label}</span>
                  {isActive && (
                    <Check className="h-3 w-3 text-primary" aria-hidden />
                  )}
                </div>
                <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
