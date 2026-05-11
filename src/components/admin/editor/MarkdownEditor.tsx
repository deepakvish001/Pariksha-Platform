import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { AltTextDialog, type InsertImageDetails } from "./AltTextDialog";
import { useMarkdownImageUpload } from "@/hooks/useMarkdownImageUpload";
import { deleteProblemImage } from "@/lib/admin/uploadProblemImage";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/hooks/useProblemAssetGallery";
import { htmlToMarkdown, isRichHtml } from "@/lib/admin/paste/htmlToMarkdown";
import { parseFrontMatter, mapFrontMatter, type FrontMatterApply } from "@/lib/admin/paste/frontMatter";
import { normalizePastedText } from "@/lib/admin/paste/normalize";
import { detectMarkdownFeatures, type DetectedFeatures } from "@/lib/admin/paste/detectFeatures";
import { sanitizeGfmTables, type TableReport } from "@/lib/admin/paste/sanitizeTables";
import { TablePreviewDialog } from "./TablePreviewDialog";

type Mode = "edit" | "split" | "preview";

interface FrontMatterResult {
  applied: number;
  /** Optional: roll back the field changes the parent just performed. */
  undo?: () => void;
}

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
  /** Called when pasted content begins with YAML/TOML front-matter. May
   *  return either a number of applied fields, or a `{ applied, undo }`
   *  object so the editor can offer an "Undo" button. */
  onFrontMatter?: (fm: FrontMatterApply) => number | FrontMatterResult | void;
}

export interface MarkdownEditorHandle {
  focus: () => void;
}

const GALLERY_OPEN_KEY = "admin.markdownEditor.galleryOpen.v1";
const MODE_KEY = "admin.markdownEditor.mode.v1";
const DETECTED_KEY = "admin.markdownEditor.detected.v1";

interface DetectedSummary {
  features: DetectedFeatures;
  /** Length of the document right after paste — used to clear the chip
   *  when the content drifts substantially from the pasted snapshot. */
  pastedLength: number;
  convertedFromHtml: boolean;
  fmApplied: number;
}

const readDetected = (): DetectedSummary | null => {
  try {
    const raw = localStorage.getItem(DETECTED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.features) return parsed;
  } catch {
    /* ignore */
  }
  return null;
};

const writeDetected = (s: DetectedSummary | null) => {
  try {
    if (s) localStorage.setItem(DETECTED_KEY, JSON.stringify(s));
    else localStorage.removeItem(DETECTED_KEY);
  } catch {
    /* ignore */
  }
};

const readBoolKey = (k: string, fallback: boolean): boolean => {
  try {
    const v = localStorage.getItem(k);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
};

const writeBoolKey = (k: string, v: boolean) => {
  try {
    localStorage.setItem(k, v ? "1" : "0");
  } catch {
    /* ignore */
  }
};

const readModeKey = (): Mode => {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === "edit" || v === "split" || v === "preview") return v;
  } catch {
    /* ignore */
  }
  return "split";
};

/** Append a markdown title that encodes a width hint readable by MarkdownPreview. */
const buildImageMarkdown = (alt: string, url: string, width?: number) => {
  if (width && width > 0) return `![${alt}](${url} "=${Math.round(width)}px")`;
  return `![${alt}](${url})`;
};

interface PendingInsert {
  url: string;
  defaultAlt: string;
  /** When true, the alt dialog will allow choosing a width. */
  allowWidth: boolean;
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
      onFrontMatter,
    },
    ref,
  ) => {
    const [mode, setMode] = useState<Mode>(() => readModeKey());
    const [fullscreen, setFullscreen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState<boolean>(() =>
      readBoolKey(GALLERY_OPEN_KEY, false),
    );
    const [pendingInsert, setPendingInsert] = useState<PendingInsert | null>(null);
    const [detected, setDetected] = useState<DetectedSummary | null>(() => readDetected());
    const lastUndoRef = useRef<null | (() => void)>(null);
    const [canUndo, setCanUndo] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fullscreenTriggerRef = useRef<HTMLButtonElement>(null);

    // Persist UI state across navigations.
    useEffect(() => writeBoolKey(GALLERY_OPEN_KEY, galleryOpen), [galleryOpen]);
    useEffect(() => {
      try {
        localStorage.setItem(MODE_KEY, mode);
      } catch {
        /* ignore */
      }
    }, [mode]);

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

    const { uploading, sessionImages, uploadFiles, uploadOnly, onDrop, onPaste } =
      useMarkdownImageUpload({
        textareaRef,
        value,
        onChange,
        slug,
      });

    /** Insert text at the current cursor position (alias of insertAtCursor). */
    const insertText = (snippet: string) => insertAtCursor(snippet);


    /** Pending table-cleanup confirmation. While set, the editor shows the
     *  TablePreviewDialog and waits for Apply / Cancel before mutating state.
     *  `apply` accepts user edits keyed by table index from the dialog. */
    const [tablePreview, setTablePreview] = useState<{
      cleaned: string;
      original: string;
      report: TableReport;
      apply: (edits: Record<number, string>) => void;
    } | null>(null);

    /** Commit an already-converted Markdown body: insert into the editor,
     *  apply front-matter, build the detected summary + undo entry, and toast. */
    const commitPaste = (
      body: string,
      ctx: {
        valueBefore: string;
        convertedFromHtml: boolean;
        fmFound: boolean;
        fmApply: () => { applied: number; undo?: () => void };
        tableReport?: TableReport;
      },
    ) => {
      const { valueBefore, convertedFromHtml, fmFound, fmApply, tableReport } = ctx;
      const fmRes = fmFound ? fmApply() : { applied: 0, undo: undefined as undefined | (() => void) };
      const appliedFmCount = fmRes.applied;
      const fmUndo = fmRes.undo;

      insertText(body);

      const features = detectMarkdownFeatures(body);
      const summary: DetectedSummary = {
        features,
        pastedLength: (valueBefore?.length || 0) + body.length,
        convertedFromHtml,
        fmApplied: appliedFmCount,
      };
      setDetected(summary);
      writeDetected(summary);

      lastUndoRef.current = () => {
        onChange(valueBefore);
        try {
          fmUndo?.();
        } catch {
          /* ignore */
        }
        setDetected(null);
        writeDetected(null);
        setCanUndo(false);
        lastUndoRef.current = null;
        toast({ title: "Paste undone", description: "Restored content and reverted applied fields." });
      };
      setCanUndo(true);

      const parts: string[] = [];
      if (convertedFromHtml) parts.push("HTML → Markdown");
      else parts.push("Markdown");
      if (fmFound)
        parts.push(`front-matter (${appliedFmCount} field${appliedFmCount === 1 ? "" : "s"})`);
      if (tableReport && tableReport.tablesNormalized > 0)
        parts.push(
          `${tableReport.tablesNormalized} table${tableReport.tablesNormalized === 1 ? "" : "s"} cleaned`,
        );
      const detail: string[] = [];
      if (features.headings) detail.push(`${features.headings} headings`);
      if (features.codeBlocks) detail.push(`${features.codeBlocks} code`);
      if (features.tables) detail.push(`${features.tables} tables`);
      if (features.images) detail.push(`${features.images} images`);
      if (features.math) detail.push(`${features.math} math`);
      if (features.callouts) detail.push(`${features.callouts} callouts`);
      toast({
        title: `Pasted ${parts.join(" + ")}`,
        description: detail.length ? detail.join(" · ") : undefined,
        action: (
          <ToastAction altText="Undo paste" onClick={() => lastUndoRef.current?.()}>
            Undo
          </ToastAction>
        ),
      });
    };

    /** Smart paste: HTML→Markdown, front-matter parsing, table sanitization. */
    const handleSmartPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Image-paste handler runs first; it calls preventDefault when it consumes the event.
      onPaste(e);
      if (e.defaultPrevented) return;

      const cd = e.clipboardData;
      if (!cd) return;
      const html = cd.getData("text/html");
      const plain = cd.getData("text/plain");
      if (!html && !plain) return;

      let md: string;
      let convertedFromHtml = false;
      if (html && isRichHtml(html, plain)) {
        md = htmlToMarkdown(html);
        convertedFromHtml = true;
      } else {
        md = plain;
      }
      if (!md) return;

      const normalized = normalizePastedText(md);
      const fm = parseFrontMatter(normalized);
      const rawBody = fm.body;

      // Sanitize any GFM tables before insertion.
      const { markdown: cleanedBody, report } = sanitizeGfmTables(rawBody);

      e.preventDefault();
      const valueBefore = value;
      const fmApply = () => {
        if (!fm.found || !onFrontMatter) return { applied: 0 };
        try {
          const r = onFrontMatter(mapFrontMatter(fm.data));
          if (typeof r === "number") return { applied: r };
          if (r && typeof r === "object") return { applied: r.applied || 0, undo: r.undo };
        } catch {
          /* ignore */
        }
        return { applied: 0 };
      };

      // Show preview + confirmation when at least one table needed cleanup.
      if (report.tablesNormalized > 0) {
        setTablePreview({
          cleaned: cleanedBody,
          original: rawBody,
          report,
          apply: () =>
            commitPaste(cleanedBody, {
              valueBefore,
              convertedFromHtml,
              fmFound: fm.found,
              fmApply,
              tableReport: report,
            }),
        });
        return;
      }

      commitPaste(cleanedBody, {
        valueBefore,
        convertedFromHtml,
        fmFound: fm.found,
        fmApply,
        tableReport: report,
      });
    };

    /** Auto-clear the detected summary when the document drifts substantially
     *  from the post-paste snapshot (more than 40% length change or fully cleared). */
    useEffect(() => {
      if (!detected) return;
      const len = value.length;
      const base = detected.pastedLength || 1;
      const drift = Math.abs(len - base) / base;
      if (len === 0 || drift > 0.4) {
        setDetected(null);
        writeDetected(null);
        lastUndoRef.current = null;
        setCanUndo(false);
      }
    }, [value, detected]);

    const handlePickImage = () => fileInputRef.current?.click();

    const handleInsertImageUrl = () => {
      const url = window.prompt("Image URL");
      if (!url) return;
      setPendingInsert({
        url,
        defaultAlt: "",
        allowWidth: false,
      });
    };

    const handleInsertImageWithSize = () => {
      const url = window.prompt("Image URL");
      if (!url) return;
      setPendingInsert({ url, defaultAlt: "", allowWidth: true });
    };

    /** Gallery click → prompt for alt text first, then insert. */
    const handleGalleryRequestInsert = (img: GalleryImage) => {
      setPendingInsert({
        url: img.publicUrl,
        defaultAlt: img.name.replace(/\.[^.]+$/, ""),
        allowWidth: true,
      });
    };

    const handleConfirmInsert = (details: InsertImageDetails) => {
      if (!pendingInsert) return;
      const md = buildImageMarkdown(details.alt, pendingInsert.url, details.width);
      insertAtCursor(md);
      setPendingInsert(null);
    };

    /** Upload-from-gallery: route through uploadOnly (no placeholder) and then
     *  ask for alt text via the dialog before inserting markdown. */
    const handleGalleryUpload = async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const f of list) {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadOnly(f);
        if (res) {
          setPendingInsert({
            url: res.publicUrl,
            defaultAlt: f.name.replace(/\.[^.]+$/, ""),
            allowWidth: true,
          });
        }
      }
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
              onInsertImageWithSize={handleInsertImageWithSize}
              uploading={uploading > 0}
            />
            <Textarea
              ref={textareaRef}
              data-field={fieldId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onDrop={onDrop}
              onPaste={handleSmartPaste}
              onKeyDown={handleKeyDown}
              rows={fullscreen ? 30 : rows}
              spellCheck
              aria-label="Problem statement markdown source"
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
                <span
                  className="flex items-center gap-1 text-amber-500"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Uploading {uploading}
                </span>
              )}
            </div>
            {detected && (() => {
              const f = detected.features;
              return (
                <div
                  className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  <span className="font-medium text-foreground/80">
                    {detected.convertedFromHtml ? "HTML → Markdown" : "Markdown"} pasted
                    {detected.fmApplied > 0 ? ` · ${detected.fmApplied} field${detected.fmApplied === 1 ? "" : "s"}` : ""}
                    :
                  </span>
                  {f.headings > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.headings} headings
                    </span>
                  )}
                  {f.codeBlocks > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.codeBlocks} code
                    </span>
                  )}
                  {f.tables > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.tables} tables
                    </span>
                  )}
                  {f.images > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.images} images
                    </span>
                  )}
                  {f.math > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.math} math
                    </span>
                  )}
                  {f.callouts > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.callouts} callouts
                    </span>
                  )}
                  {f.links > 0 && (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                      {f.links} links
                    </span>
                  )}
                  {canUndo && (
                    <button
                      type="button"
                      onClick={() => lastUndoRef.current?.()}
                      className="ml-auto rounded-md border border-border bg-background px-2 py-0.5 text-foreground hover:bg-muted"
                    >
                      Undo paste
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDetected(null);
                      writeDetected(null);
                    }}
                    className={cn(
                      "text-muted-foreground/70 hover:text-foreground",
                      canUndo ? "" : "ml-auto",
                    )}
                    aria-label="Dismiss detected paste summary"
                  >
                    ×
                  </button>
                </div>
              );
            })()}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              multiple
              hidden
              aria-hidden="true"
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
              role="region"
              aria-label="Markdown preview"
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
            onRequestInsert={handleGalleryRequestInsert}
            onUploadFiles={handleGalleryUpload}
            uploading={uploading > 0}
          />
        )}
      </div>
    );

    const header = (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex items-center gap-1 rounded-md border p-0.5"
          role="radiogroup"
          aria-label="Editor view mode"
        >
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("edit")}
            role="radio"
            aria-checked={mode === "edit"}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "split" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("split")}
            role="radio"
            aria-checked={mode === "split"}
          >
            <Columns className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Split
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            className="h-7 px-2"
            onClick={() => setMode("preview")}
            role="radio"
            aria-checked={mode === "preview"}
          >
            <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Preview
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-live="off">
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
              variant={galleryOpen ? "secondary" : "outline"}
              className="h-7 px-2"
              onClick={() => setGalleryOpen((v) => !v)}
              aria-pressed={galleryOpen}
              aria-label={galleryOpen ? "Hide image gallery" : "Show image gallery"}
              title="Show gallery of all uploaded images"
            >
              <Images className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {galleryOpen ? "Hide gallery" : "Gallery"}
            </Button>
          )}
          {!fullscreen && (
            <Button
              ref={fullscreenTriggerRef}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => setFullscreen(true)}
              aria-label="Open editor in full-screen"
            >
              <Maximize2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Full-screen
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

        <Dialog
          open={fullscreen}
          onOpenChange={(open) => {
            setFullscreen(open);
            // Restore focus on the trigger when the dialog closes (a11y).
            if (!open) {
              requestAnimationFrame(() => fullscreenTriggerRef.current?.focus());
            }
          }}
        >
          <DialogContent
            className="max-w-[96vw] sm:max-w-[96vw]"
            aria-describedby="md-fullscreen-desc"
          >
            <DialogHeader>
              <DialogTitle>Edit problem statement</DialogTitle>
              <DialogDescription id="md-fullscreen-desc">
                Distraction-free Markdown authoring. Press Escape to exit.
              </DialogDescription>
            </DialogHeader>
            {header}
            {editorBody}
          </DialogContent>
        </Dialog>

        <AltTextDialog
          open={!!pendingInsert}
          imageUrl={pendingInsert?.url}
          defaultAlt={pendingInsert?.defaultAlt}
          onCancel={() => setPendingInsert(null)}
          onConfirm={handleConfirmInsert}
        />

        <TablePreviewDialog
          open={!!tablePreview}
          report={tablePreview?.report ?? null}
          onCancel={() => setTablePreview(null)}
          onApply={() => {
            tablePreview?.apply();
            setTablePreview(null);
          }}
        />
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2"
          aria-label={`Recent uploaded images (${images.length})`}
        >
          <ImageIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Images {images.length > 0 ? `(${images.length})` : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-2"
        aria-label="Recent uploaded images"
      >
        {images.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">
            Uploaded images will appear here. They persist across refreshes.
          </p>
        ) : (
          <ul
            className="max-h-72 space-y-1 overflow-auto"
            aria-label="Uploaded images list"
          >
            {images.map((img) => (
              <li
                key={img.path}
                className="flex items-center gap-2 rounded-md border p-1.5 hover:bg-accent"
              >
                <img
                  src={img.publicUrl}
                  alt=""
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
                  aria-label={`Copy URL of ${img.name}`}
                  title="Copy URL"
                  onClick={() => onCopy(img.publicUrl)}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  aria-label={`Delete ${img.name} from storage`}
                  title="Delete from storage"
                  onClick={() => onDelete(img.path)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};
