/**
 * Client-side image resizing & optional cropping before upload.
 *
 * Goals:
 * - Keep uploads small & fast (slow networks, storage costs).
 * - Avoid huge images breaking the markdown preview layout.
 * - Skip resizing SVG / GIF (vector / animated) — pass them through.
 */

export interface ResizeOptions {
  /** Maximum width in CSS px. Defaults to 1600. */
  maxWidth?: number;
  /** Maximum height in CSS px. Defaults to 1600. */
  maxHeight?: number;
  /** JPEG/WebP quality (0-1). Defaults to 0.86. */
  quality?: number;
  /** Optional center crop to a target aspect ratio (width / height). */
  cropAspect?: number;
  /** Force output mime; otherwise keeps the source mime (PNG stays PNG). */
  outputMime?: "image/jpeg" | "image/png" | "image/webp";
}

const PASSTHROUGH = new Set(["image/gif", "image/svg+xml"]);

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

/**
 * Resize and optionally center-crop an image file. Returns the original file
 * untouched if it's already small enough or a format we shouldn't recompress.
 */
export const resizeImageFile = async (
  file: File,
  opts: ResizeOptions = {},
): Promise<File> => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.86,
    cropAspect,
    outputMime,
  } = opts;

  if (PASSTHROUGH.has(file.type)) return file;
  if (typeof document === "undefined") return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file; // best-effort — fall back to the original
  }

  const sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (!sw || !sh) return file;

  // Decide source rect (cropping) and destination size (scaling).
  let sx = 0;
  let sy = 0;
  let scw = sw;
  let sch = sh;
  if (cropAspect && cropAspect > 0) {
    const srcAspect = sw / sh;
    if (srcAspect > cropAspect) {
      // Too wide — trim sides.
      scw = Math.round(sh * cropAspect);
      sx = Math.round((sw - scw) / 2);
    } else if (srcAspect < cropAspect) {
      // Too tall — trim top/bottom.
      sch = Math.round(sw / cropAspect);
      sy = Math.round((sh - sch) / 2);
    }
  }

  const ratio = Math.min(1, maxWidth / scw, maxHeight / sch);
  const dw = Math.round(scw * ratio);
  const dh = Math.round(sch * ratio);

  // Skip if there's nothing to do.
  if (ratio === 1 && !cropAspect && !outputMime) return file;

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, scw, sch, 0, 0, dw, dh);

  const targetMime = outputMime ?? (file.type === "image/png" ? "image/png" : "image/jpeg");
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, targetMime, quality),
  );
  if (!blob) return file;
  // If we somehow inflated the file, keep the original.
  if (blob.size >= file.size && targetMime === file.type) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = extMap[targetMime] ?? "jpg";
  return new File([blob], `${baseName}.${ext}`, {
    type: targetMime,
    lastModified: Date.now(),
  });
};
