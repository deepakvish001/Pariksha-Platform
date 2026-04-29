import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PROBLEM_ASSETS_BUCKET } from "@/lib/admin/uploadProblemImage";

export interface GalleryImage {
  name: string;
  path: string; // folder/file
  publicUrl: string;
  updatedAt?: string;
  size?: number;
}

const IMG_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

/** Lists images stored in the problem-assets bucket. Walks the top-level
 *  folders (one per slug, plus "drafts") and returns a flat list ordered by
 *  most recently updated. */
export const useProblemAssetGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: folders, error: fErr } = await supabase.storage
        .from(PROBLEM_ASSETS_BUCKET)
        .list("", { limit: 200, sortBy: { column: "updated_at", order: "desc" } });
      if (fErr) throw fErr;

      const all: GalleryImage[] = [];
      // The root listing returns folder pseudo-entries (no metadata) and any
      // files placed at the root. Iterate folders to fetch their contents.
      const folderNames = (folders ?? [])
        .filter((e) => e && e.name && !e.id) // folders have no id
        .map((e) => e.name);

      // Also include any root-level images.
      (folders ?? [])
        .filter((e) => e && e.id && IMG_RE.test(e.name))
        .forEach((e) => {
          const { data } = supabase.storage
            .from(PROBLEM_ASSETS_BUCKET)
            .getPublicUrl(e.name);
          all.push({
            name: e.name,
            path: e.name,
            publicUrl: data.publicUrl,
            updatedAt: (e as any).updated_at,
            size: (e as any).metadata?.size,
          });
        });

      for (const folder of folderNames) {
        const { data: files, error: lErr } = await supabase.storage
          .from(PROBLEM_ASSETS_BUCKET)
          .list(folder, {
            limit: 200,
            sortBy: { column: "updated_at", order: "desc" },
          });
        if (lErr) continue;
        (files ?? [])
          .filter((f) => f && f.id && IMG_RE.test(f.name))
          .forEach((f) => {
            const path = `${folder}/${f.name}`;
            const { data } = supabase.storage
              .from(PROBLEM_ASSETS_BUCKET)
              .getPublicUrl(path);
            all.push({
              name: f.name,
              path,
              publicUrl: data.publicUrl,
              updatedAt: (f as any).updated_at,
              size: (f as any).metadata?.size,
            });
          });
      }

      all.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
      setImages(all);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { images, loading, error, reload: load, setImages };
};
