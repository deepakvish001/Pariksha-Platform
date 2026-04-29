import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Images,
  Loader2,
  RefreshCw,
  Search,
  Copy,
  Trash2,
  Plus,
  X,
  Upload,
  UploadCloud,
} from "lucide-react";
import {
  useProblemAssetGallery,
  type GalleryImage,
} from "@/hooks/useProblemAssetGallery";
import { deleteProblemImage } from "@/lib/admin/uploadProblemImage";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Props {
  /** Insert markdown image syntax at the cursor of the editor. */
  onInsert: (markdown: string) => void;
  /** Called when the user picks an image to insert — gives the host a chance
   *  to prompt for alt text / width before writing markdown. */
  onRequestInsert?: (image: GalleryImage) => void;
  /** Optional: bias matches toward this slug's folder. */
  currentSlug?: string;
  open: boolean;
  onClose: () => void;
  /** Upload one or more files into the gallery. Refreshes the listing on success. */
  onUploadFiles?: (files: FileList | File[]) => Promise<void> | void;
  /** Whether an upload is currently in flight (used to disable the upload button). */
  uploading?: boolean;
}

const FILTER_KEY = "admin.galleryPanel.filters.v1";

interface PersistedFilters {
  query: string;
  folder: string;
}

const readFilters = (): PersistedFilters => {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    if (!raw) return { query: "", folder: "" };
    const parsed = JSON.parse(raw);
    return {
      query: typeof parsed?.query === "string" ? parsed.query : "",
      folder: typeof parsed?.folder === "string" ? parsed.folder : "",
    };
  } catch {
    return { query: "", folder: "" };
  }
};

const writeFilters = (f: PersistedFilters) => {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(f));
  } catch {
    /* ignore */
  }
};

const formatSize = (b?: number) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/** Side panel listing every image already uploaded to the problem-assets
 *  bucket. Click a tile to insert it at the editor cursor. Supports drag-and-
 *  drop uploads and a direct upload button. */
export const ImageGalleryPanel = ({
  onInsert,
  onRequestInsert,
  currentSlug,
  open,
  onClose,
  onUploadFiles,
  uploading,
}: Props) => {
  const { images, loading, error, reload, setImages } = useProblemAssetGallery();
  const initialFilters = useRef<PersistedFilters>(readFilters());
  const [query, setQuery] = useState(initialFilters.current.query);
  const [folderFilter, setFolderFilter] = useState<string>(
    initialFilters.current.folder,
  );
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist filters as the user changes them.
  useEffect(() => {
    writeFilters({ query, folder: folderFilter });
  }, [query, folderFilter]);

  const folders = useMemo(() => {
    const set = new Set<string>();
    images.forEach((i) => {
      const folder = i.path.includes("/") ? i.path.split("/")[0] : "(root)";
      set.add(folder);
    });
    return Array.from(set).sort((a, b) => {
      if (currentSlug && a === currentSlug) return -1;
      if (currentSlug && b === currentSlug) return 1;
      if (a === "drafts") return -1;
      if (b === "drafts") return 1;
      return a.localeCompare(b);
    });
  }, [images, currentSlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return images.filter((img) => {
      const folder = img.path.includes("/") ? img.path.split("/")[0] : "(root)";
      if (folderFilter && folder !== folderFilter) return false;
      if (!q) return true;
      return (
        img.name.toLowerCase().includes(q) || img.path.toLowerCase().includes(q)
      );
    });
  }, [images, query, folderFilter]);

  const insert = (img: GalleryImage) => {
    if (onRequestInsert) {
      onRequestInsert(img);
      return;
    }
    const alt = img.name.replace(/\.[^.]+$/, "");
    onInsert(`![${alt}](${img.publicUrl})`);
    toast({ title: "Inserted", description: img.name });
  };

  const remove = async (img: GalleryImage) => {
    if (!window.confirm(`Delete ${img.name}? This cannot be undone.`)) return;
    try {
      await deleteProblemImage(img.path);
      setImages((prev) => prev.filter((i) => i.path !== img.path));
      toast({ title: "Deleted", description: img.name });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyUrl = (img: GalleryImage) => {
    navigator.clipboard?.writeText(img.publicUrl);
    toast({ title: "Copied", description: "Image URL copied." });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!onUploadFiles) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    await onUploadFiles(list);
    // Refresh the gallery listing so the new asset appears immediately.
    void reload();
  };

  const onDragEnter = (e: React.DragEvent) => {
    if (!onUploadFiles) return;
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (!onUploadFiles) return;
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!onUploadFiles) return;
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    if (!onUploadFiles) return;
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files?.length) void handleFiles(files);
  };

  if (!open) return null;

  return (
    <aside
      className={cn(
        "relative flex flex-col rounded-md border bg-background",
        "h-[600px] lg:h-auto lg:max-h-none",
        dragActive && "ring-2 ring-primary ring-offset-2",
      )}
      role="complementary"
      aria-label="Image gallery"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragActive && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-primary/10 backdrop-blur-sm"
          aria-hidden="true"
        >
          <UploadCloud className="h-8 w-8 text-primary" />
          <p className="mt-2 text-sm font-medium text-primary">
            Drop to upload &amp; insert
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-b px-3 py-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Images className="h-4 w-4" /> Image gallery
          <span className="text-xs text-muted-foreground">
            ({filtered.length})
          </span>
        </Label>
        <div className="flex items-center gap-1">
          {onUploadFiles && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Upload images to gallery"
              title="Upload images"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Refresh gallery"
            title="Refresh"
            onClick={() => void reload()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            aria-label="Hide gallery"
            title="Hide gallery"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        multiple
        hidden
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files?.length) {
            void handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      <div className="space-y-2 border-b p-2">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename or path…"
            className="h-8 pl-7 text-xs"
            aria-label="Search gallery images"
          />
        </div>
        {folders.length > 1 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by folder">
            <button
              type="button"
              onClick={() => setFolderFilter("")}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px]",
                !folderFilter
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
              aria-pressed={!folderFilter}
            >
              All
            </button>
            {folders.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolderFilter(f === folderFilter ? "" : f)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] transition",
                  folderFilter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
                aria-pressed={folderFilter === f}
                title={f === currentSlug ? "Current problem" : f}
              >
                {f}
                {f === currentSlug ? " ★" : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
          >
            {error}
          </p>
        )}
        {!loading && filtered.length === 0 && !error && (
          <p className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            No images match. Drop files here or use the upload button.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((img) => (
            <div
              key={img.path}
              className="group relative overflow-hidden rounded-md border bg-muted/20"
            >
              <button
                type="button"
                onClick={() => insert(img)}
                className="block aspect-square w-full overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Insert ${img.name}`}
                title={`Insert ${img.name}`}
              >
                <img
                  src={img.publicUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </button>
              <div className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1.5 py-1 text-[10px] backdrop-blur-sm">
                <p className="truncate font-medium">{img.name}</p>
                <p className="truncate text-muted-foreground">
                  {img.path.split("/")[0]} · {formatSize(img.size)}
                </p>
              </div>
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  aria-label={`Insert ${img.name} at cursor`}
                  title="Insert at cursor"
                  onClick={() => insert(img)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
                  aria-label={`Copy URL of ${img.name}`}
                  title="Copy URL"
                  onClick={() => copyUrl(img)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-6 w-6"
                  aria-label={`Delete ${img.name}`}
                  title="Delete"
                  onClick={() => remove(img)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
