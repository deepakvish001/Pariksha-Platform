import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pencil,
  Eye,
  Columns,
  Maximize2,
  Image as ImageIcon,
  Copy,
  Trash2,
  Loader2,
  Images,
} from "lucide-react";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { MarkdownPreview } from "./MarkdownPreview";
import { ImageGalleryPanel } from "./ImageGalleryPanel";
import { useMarkdownImageUpload } from "@/hooks/useMarkdownImageUpload";
import { deleteProblemImage } from "@/lib/admin/uploadProblemImage";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Mode = "edit" | "split" | "preview";

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Optional problem slug — used as the storage folder for uploaded images. */
  slug?: string;
  /** data-field id forwarded to the textarea so validation highlighting works. */
  fieldId?: string;
  /** Class to apply when the field is currently highlighted by the checklist. */
  highlightClassName?: string;
  rows?: number;
  /** Optional callback for "Insert examples" toolbar action. */
  onInsertExamples?: () => void;
}

export interface MarkdownEditorHandle {
  focus: () => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, Props>(
  (
    {
      value,
      onChange,
      slug,
      fieldId,
      highlightClassName,
      rows = 20,
      onInsertExamples,
    },
    ref,
  ) => {
    const [mode, setMode] = useState<Mode>("split");
    const [fullscreen, setFullscreen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /** Inserts arbitrary text at the textarea cursor (or appends). Used by the
     *  gallery panel and the URL prompt. */
    const insertAtCursor = (snippet: string) => {
      const el = textareaRef.current;
      if (!el) {
        onChange((value ? value + "\n" : "") + snippet + "\n");
        return;
      }
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + snippet.length;
      });
    };

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const { uploading, sessionImages, uploadFiles, onDrop, onPaste } =
      useMarkdownImageUpload({
        textareaRef,
        value,
        onChange,
        slug,
      });

    const handlePickImage = () => fileInputRef.current?.click();

    const handleInsertImageUrl = () => {
      const url = window.prompt("Image URL");
      if (!url) return;
      const alt = window.prompt("Alt text (for screen readers)", "") ?? "";
      const md = `![${alt}](${url})`;
      const el = textareaRef.current;
      if (!el) {
        onChange(value + "\n" + md + "\n");
        return;
      }
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + md + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + md.length;
      });
    };

    // Keyboard shortcuts: ⌘B / ⌘I / ⌘K / ⌘⇧I
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      const el = e.currentTarget;
      const wrap = (b: string, a: string, ph: string) => {
        e.preventDefault();
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = value.slice(start, end) || ph;
        const next = value.slice(0, start) + b + sel + a + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = start + b.length;
          el.selectionEnd = start + b.length + sel.length;
        });
      };
      if (key === "b") return wrap("**", "**", "bold");
      if (key === "i" && !e.shiftKey) return wrap("*", "*", "italic");
      if (key === "k") return wrap("[", "](https://)", "link");
      if (key === "i" && e.shiftKey) {
        e.preventDefault();
        handlePickImage();
      }
    };

    const stats = useMemo(() => {
      const chars = value.length;
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      const minRead = Math.max(1, Math.round(words / 200));
      return { chars, words, minRead };
    }, [value]);

    const editorBody = (
      <div
        className={cn(
          "grid gap-3",
          galleryOpen
            ? mode === "split"
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_280px]"
              : "lg:grid-cols-[minmax(0,1fr)_280px]"
            : mode === "split"
              ? "lg:grid-cols-2"
              : "grid-cols-1",
        )}
      >
        {(mode === "edit" || mode === "split") && (
          <div className="flex flex-col">
            <MarkdownToolbar
              textareaRef={textareaRef}
              value={value}
              onChange={onChange}
              onInsertExamples={onInsertExamples}
              onPickImageUpload={handlePickImage}
              onInsertImageUrl={handleInsertImageUrl}
              uploading={uploading > 0}
            />
            <Textarea
              ref={textareaRef}
              data-field={fieldId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onDrop={onDrop}
              onPaste={onPaste}
              onKeyDown={handleKeyDown}
              rows={fullscreen ? 30 : rows}
              spellCheck
              className={cn(
                "font-mono text-sm",
                fullscreen && "min-h-[60vh]",
                highlightClassName,
              )}
              placeholder="Write the problem statement in Markdown. Drop or paste images to upload them automatically."
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Drop / paste images · ⌘B bold · ⌘I italic · ⌘K link · ⌘⇧I upload
              </span>
              {uploading > 0 && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading {uploading}
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) {
                  void uploadFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>
        )}

        {(mode === "preview" || mode === "split") && (
          <div className="flex flex-col">
            <Label className="mb-2 text-xs text-muted-foreground">Preview</Label>
            <div
              className={cn(
                "rounded-md border bg-muted/30 p-3 overflow-auto",
                fullscreen ? "min-h-[60vh]" : "min-h-[200px]",
              )}
            >
              <MarkdownPreview source={value} />
            </div>
          </div>
        )}

        {galleryOpen && (
          <ImageGalleryPanel
            open={galleryOpen}
            onClose={() => setGalleryOpen(false)}
            currentSlug={slug}
            onInsert={(md) => insertAtCursor(md)}
          />
        )}
      </div>
    );

    const header = (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("edit")}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "split" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("split")}
          >
            <Columns className="mr-1 h-3.5 w-3.5" /> Split
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("preview")}
          >
            <Eye className="mr-1 h-3.5 w-3.5" /> Preview
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {stats.chars} chars · {stats.words} words · ~{stats.minRead} min read
          </span>
          <ImagesPopover
            images={sessionImages}
            onCopy={(url) => {
              navigator.clipboard?.writeText(url);
              toast({ title: "Copied", description: "Image URL copied." });
            }}
            onDelete={async (path) => {
              try {
                await deleteProblemImage(path);
                toast({ title: "Deleted", description: "Image removed from storage." });
              } catch (e: any) {
                toast({
                  title: "Delete failed",
                  description: e?.message ?? "Unknown error",
                  variant: "destructive",
                });
              }
            }}
          />
          {!fullscreen && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => setFullscreen(true)}
            >
              <Maximize2 className="mr-1 h-3.5 w-3.5" /> Full-screen
            </Button>
          )}
        </div>
      </div>
    );

    return (
      <>
        <Card className="p-4">
          {header}
          {editorBody}
        </Card>

        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="max-w-[96vw] sm:max-w-[96vw]">
            <DialogHeader>
              <DialogTitle>Edit problem statement</DialogTitle>
            </DialogHeader>
            {header}
            {editorBody}
          </DialogContent>
        </Dialog>
      </>
    );
  },
);
MarkdownEditor.displayName = "MarkdownEditor";

interface ImagesPopoverProps {
  images: { name: string; publicUrl: string; path: string; uploadedAt: number }[];
  onCopy: (url: string) => void;
  onDelete: (path: string) => void;
}

const ImagesPopover = ({ images, onCopy, onDelete }: ImagesPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2">
          <ImageIcon className="mr-1 h-3.5 w-3.5" />
          Images {images.length > 0 ? `(${images.length})` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        {images.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            Uploaded images from this session will appear here.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-auto">
            {images.map((img) => (
              <li
                key={img.path}
                className="flex items-center gap-2 rounded-md border p-1.5 hover:bg-accent"
              >
                <img
                  src={img.publicUrl}
                  alt={img.name}
                  className="h-10 w-10 flex-shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{img.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {img.path}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  title="Copy URL"
                  onClick={() => onCopy(img.publicUrl)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  title="Delete from storage"
                  onClick={() => onDelete(img.path)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
