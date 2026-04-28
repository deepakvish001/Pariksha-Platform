import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FormatOnSubmit } from "@/hooks/useEditorPrefs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorSettingsPopoverProps {
  /** Effective format-on-submit currently in use (override or global). */
  formatOnSubmit: FormatOnSubmit;
  /** Updates the global default. */
  onFormatOnSubmitChange: (mode: FormatOnSubmit) => void;
  /** Per-(problem, language) override info. Optional. */
  perTaskOverride?: FormatOnSubmit | null;
  perTaskLabel?: string;
  onPerTaskOverrideChange?: (mode: FormatOnSubmit | null) => void;
}

export const EditorSettingsPopover = ({
  formatOnSubmit,
  onFormatOnSubmitChange,
  perTaskOverride = null,
  perTaskLabel,
  onPerTaskOverrideChange,
}: EditorSettingsPopoverProps) => {
  const enabled = formatOnSubmit !== "off";
  const mode = formatOnSubmit === "off" ? "format" : formatOnSubmit;
  const hasPerTask = !!onPerTaskOverrideChange;
  const usingOverride = perTaskOverride !== null;

  const handleModeChange = (next: FormatOnSubmit) => {
    if (hasPerTask && usingOverride) {
      onPerTaskOverrideChange!(next);
    } else {
      onFormatOnSubmitChange(next);
    }
  };

  const handleEnableToggle = (checked: boolean) => {
    const next: FormatOnSubmit = checked ? mode : "off";
    handleModeChange(next);
  };

  return (
    <Popover>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Editor settings"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Editor settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-1">Format on submit</h4>
          <p className="text-xs text-muted-foreground">
            Auto-clean your code right before it's judged so submissions stay
            consistent.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="format-on-submit-toggle" className="text-sm">
            Enable
          </Label>
          <Switch
            id="format-on-submit-toggle"
            checked={enabled}
            onCheckedChange={handleEnableToggle}
          />
        </div>

        <div className={enabled ? "" : "opacity-50 pointer-events-none"}>
          <RadioGroup
            value={mode}
            onValueChange={(v) => handleModeChange(v as FormatOnSubmit)}
            className="space-y-2"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value="format" id="fmt-basic" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="fmt-basic" className="text-sm cursor-pointer">
                  Basic formatting
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Runs Monaco's built-in document formatter only.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="format+lint" id="fmt-lint" className="mt-0.5" />
              <div className="space-y-0.5">
                <Label htmlFor="fmt-lint" className="text-sm cursor-pointer">
                  Format + lint cleanup
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Format, then trim trailing whitespace, collapse extra blank
                  lines, and ensure a single trailing newline.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {hasPerTask && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Label htmlFor="per-task-toggle" className="text-sm">
                  Remember for this task
                </Label>
                {perTaskLabel && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {perTaskLabel}
                  </p>
                )}
              </div>
              <Switch
                id="per-task-toggle"
                checked={usingOverride}
                onCheckedChange={(checked) => {
                  if (checked) {
                    // Lock the current effective mode in for this problem+language.
                    onPerTaskOverrideChange!(formatOnSubmit);
                  } else {
                    onPerTaskOverrideChange!(null);
                  }
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {usingOverride
                ? "Changes here only affect this problem in this language. Your global default stays the same."
                : "Turn this on to keep a different format-on-submit setting for this problem and language."}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
