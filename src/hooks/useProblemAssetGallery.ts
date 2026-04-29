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
const CACHE_KEY = "admin.problemAssets.cache.v1";
const CACHE_TTL_MS = 60_000; // 1 minute — fresh-enough across navigations.

interface CachedPayload {
  ts: number;
  images: GalleryImage[];
}

const readCache = (): CachedPayload | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPayload;
    if (!parsed?.ts || !Array.isArray(parsed.images)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (images: GalleryImage[]) => {
  try {
    const payload: CachedPayload = { ts: Date.now(), images };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
};

/** Lists images stored in the problem-assets bucket. Walks the top-level
 *  folders (one per slug, plus "drafts") and returns a flat list ordered by
 *  most recently updated. Hydrates instantly from a localStorage cache so
 *  the gallery feels persistent across refreshes. */
export const useProblemAssetGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>(
    () => readCache()?.images ?? [],
  );
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
      const folderNames = (folders ?? [])
        .filter((e) => e && e.name && !e.id) // folders have no id
        .map((e) => e.name);

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
      writeCache(all);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always refresh in the background; cached images render instantly.
    const cached = readCache();
    if (!cached || Date.now() - cached.ts > CACHE_TTL_MS) {
      void load();
    } else {
      // Still refresh quietly so deletes/uploads from another tab show up.
      void load();
    }
  }, [load]);

  // Persist any external mutation (e.g. delete from the panel).
  useEffect(() => {
    if (images.length) writeCache(images);
  }, [images]);

  return { images, loading, error, reload: load, setImages };
};
