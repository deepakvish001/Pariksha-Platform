import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface InsertImageDetails {
  alt: string;
  /** Optional pixel width to inject as a markdown title (=NNNpx). */
  width?: number;
}

interface Props {
  open: boolean;
  imageUrl?: string;
  defaultAlt?: string;
  onCancel: () => void;
  onConfirm: (details: InsertImageDetails) => void;
}

/**
 * Accessible prompt for an image's alt text and optional render width.
 * Replaces the previous `window.prompt` flow so we can provide focus
 * management, a live preview, and width controls.
 */
export const AltTextDialog = ({
  open,
  imageUrl,
  defaultAlt = "",
  onCancel,
  onConfirm,
}: Props) => {
  const [alt, setAlt] = useState(defaultAlt);
  const [useWidth, setUseWidth] = useState(false);
  const [width, setWidth] = useState(480);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAlt(defaultAlt);
      setUseWidth(false);
      setWidth(480);
      // Focus once the dialog opens so screen readers announce the field.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, defaultAlt]);

  const submit = () => {
    onConfirm({
      alt: alt.trim(),
      width: useWidth ? width : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent
        className="max-w-md"
        aria-describedby="alt-text-help"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription id="alt-text-help">
            Add a short description for screen readers. Leave alt empty for
            decorative-only images.
          </DialogDescription>
        </DialogHeader>

        {imageUrl && (
          <div className="overflow-hidden rounded-md border bg-muted/20">
            <img
              src={imageUrl}
              alt=""
              className="mx-auto max-h-40 w-auto object-contain"
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="img-alt">Alt text</Label>
            <Input
              id="img-alt"
              ref={inputRef}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Diagram showing the algorithm flow"
              aria-describedby="alt-text-help"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-2">
            <div className="space-y-0.5">
              <Label htmlFor="img-width-toggle" className="text-sm">
                Custom render width
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Constrain how the image displays in the statement.
              </p>
            </div>
            <Switch
              id="img-width-toggle"
              checked={useWidth}
              onCheckedChange={setUseWidth}
              aria-label="Toggle custom width"
            />
          </div>

          {useWidth && (
            <div className="space-y-2 rounded-md border p-2">
              <div className="flex items-center justify-between text-xs">
                <Label htmlFor="img-width-slider">Width</Label>
                <span className="font-mono">{width}px</span>
              </div>
              <Slider
                id="img-width-slider"
                value={[width]}
                onValueChange={(v) => setWidth(v[0] ?? 480)}
                min={120}
                max={1200}
                step={20}
                aria-label="Image width in pixels"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={submit}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
