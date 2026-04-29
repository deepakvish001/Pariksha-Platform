import { supabase } from "@/integrations/supabase/client";

export const PROBLEM_ASSETS_BUCKET = "problem-assets";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadedProblemImage {
  publicUrl: string;
  path: string;
}

const extFromType = (type: string, fallbackName: string) => {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  if (map[type]) return map[type];
  const m = fallbackName.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "bin";
};

const safeId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.has(file.type)) {
    return `Unsupported type: ${file.type || "unknown"}. Use PNG, JPG, WebP, GIF or SVG.`;
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is 5 MB.`;
  }
  return null;
};

/** Uploads an image to the problem-assets bucket and returns its public URL. */
export const uploadProblemImage = async (
  file: File,
  opts: { slug?: string } = {},
): Promise<UploadedProblemImage> => {
  const err = validateImageFile(file);
  if (err) throw new Error(err);

  const folder = (opts.slug && opts.slug.trim()) || "drafts";
  const ext = extFromType(file.type, file.name);
  const path = `${folder}/${safeId()}.${ext}`;

  const { error } = await supabase.storage
    .from(PROBLEM_ASSETS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
  if (error) throw error;

  const { data } = supabase.storage.from(PROBLEM_ASSETS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
};

export const deleteProblemImage = async (path: string) => {
  const { error } = await supabase.storage
    .from(PROBLEM_ASSETS_BUCKET)
    .remove([path]);
  if (error) throw error;
};
