import { useMemo, useState } from "react";
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
  /** Optional: bias matches toward this slug's folder. */
  currentSlug?: string;
  open: boolean;
  onClose: () => void;
}

const formatSize = (b?: number) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/** Side panel listing every image already uploaded to the problem-assets
 *  bucket. Click a tile to insert it at the editor cursor. */
export const ImageGalleryPanel = ({ onInsert, currentSlug, open, onClose }: Props) => {
  const { images, loading, error, reload, setImages } = useProblemAssetGallery();
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("");

  const folders = useMemo(() => {
    const set = new Set<string>();
    images.forEach((i) => {
      const folder = i.path.includes("/") ? i.path.split("/")[0] : "(root)";
      set.add(folder);
    });
    return Array.from(set).sort((a, b) => {
      // Surface the current slug folder first.
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

  if (!open) return null;

  return (
    <aside
      className={cn(
        "flex flex-col rounded-md border bg-background",
        "h-[600px] lg:h-auto lg:max-h-none",
      )}
      aria-label="Image gallery"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <Images className="h-4 w-4" /> Image gallery
          <span className="text-xs text-muted-foreground">
            ({filtered.length})
          </span>
        </Label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7"
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
            title="Hide gallery"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-b p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filename or path…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        {folders.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setFolderFilter("")}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px]",
                !folderFilter
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent",
              )}
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
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </p>
        )}
        {!loading && filtered.length === 0 && !error && (
          <p className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            No images match. Drop or paste images into the editor to upload.
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
                className="block aspect-square w-full overflow-hidden"
                title={`Insert ${img.name}`}
              >
                <img
                  src={img.publicUrl}
                  alt={img.name}
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
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-6 w-6"
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
