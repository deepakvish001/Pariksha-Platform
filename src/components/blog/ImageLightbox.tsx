import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: { src: string; alt?: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}

export function ImageLightbox({ images, index, onIndex, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onIndex, onClose]);

  if (!images[index]) return null;
  const img = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-card/80 p-2 text-foreground hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-5 w-5" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + images.length) % images.length);
            }}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground hover:bg-card",
              "focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % images.length);
            }}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-card/80 p-2 text-foreground hover:bg-card",
              "focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <figure
        className="max-h-[90vh] max-w-[92vw] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={img.src}
          alt={img.alt || ""}
          className="max-h-[85vh] max-w-full rounded-md border border-border shadow-2xl object-contain"
        />
        {img.alt && (
          <figcaption className="mt-2 text-sm text-muted-foreground text-center max-w-xl">
            {img.alt}
          </figcaption>
        )}
        {images.length > 1 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {index + 1} / {images.length}
          </p>
        )}
      </figure>
    </div>
  );
}
