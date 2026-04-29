import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  uploadProblemImage,
  validateImageFile,
  type UploadedProblemImage,
} from "@/lib/admin/uploadProblemImage";
import { toast } from "@/hooks/use-toast";

const MAX_FILES_PER_BATCH = 10;
const SESSION_KEY = "admin.problemEditor.sessionImages.v1";
const SESSION_LIMIT = 30;

interface Options {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (next: string) => void;
  slug?: string;
}

export interface SessionImage extends UploadedProblemImage {
  name: string;
  uploadedAt: number;
}

const readSession = (): SessionImage[] => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSession = (imgs: SessionImage[]) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(imgs.slice(0, SESSION_LIMIT)));
  } catch {
    /* ignore quota errors */
  }
};

/** Wires drop, paste and file-picker events to a textarea, replacing
 *  inline `![Uploading…]()` placeholders with the final markdown image
 *  syntax once the upload finishes. Persists session images to
 *  localStorage so they survive refreshes / route changes. */
export const useMarkdownImageUpload = ({
  textareaRef,
  value,
  onChange,
  slug,
}: Options) => {
  const [uploading, setUploading] = useState(0);
  const [sessionImages, setSessionImages] = useState<SessionImage[]>(() =>
    readSession(),
  );
  const valueRef = useRef(value);
  valueRef.current = value;

  // Persist session image manager so listings remain across refreshes.
  useEffect(() => {
    writeSession(sessionImages);
  }, [sessionImages]);

  const insertAtCursor = useCallback(
    (snippet: string) => {
      const el = textareaRef.current;
      const current = valueRef.current;
      if (!el) {
        const next = current + snippet;
        valueRef.current = next;
        onChange(next);
        return;
      }
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const next = current.slice(0, start) + snippet + current.slice(end);
      valueRef.current = next;
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + snippet.length;
        el.selectionStart = el.selectionEnd = pos;
      });
    },
    [onChange, textareaRef],
  );

  const replaceInValue = useCallback(
    (needle: string, replacement: string) => {
      const current = valueRef.current;
      if (!current.includes(needle)) return;
      const next = current.replace(needle, replacement);
      valueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const recordSession = useCallback((img: SessionImage) => {
    setSessionImages((prev) => {
      const next = [img, ...prev.filter((i) => i.path !== img.path)].slice(
        0,
        SESSION_LIMIT,
      );
      return next;
    });
  }, []);

  /** Lower-level upload that does NOT touch the editor — useful for the
   *  gallery sidebar which inserts after collecting alt text from the user. */
  const uploadOnly = useCallback(
    async (file: File): Promise<UploadedProblemImage | null> => {
      const err = validateImageFile(file);
      if (err) {
        toast({ title: "Image rejected", description: err, variant: "destructive" });
        return null;
      }
      setUploading((n) => n + 1);
      try {
        const res = await uploadProblemImage(file, { slug });
        recordSession({ ...res, name: file.name, uploadedAt: Date.now() });
        return res;
      } catch (e: any) {
        toast({
          title: "Upload failed",
          description: e?.message ?? "Could not upload image.",
          variant: "destructive",
        });
        return null;
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    },
    [recordSession, slug],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const err = validateImageFile(file);
      if (err) {
        toast({ title: "Image rejected", description: err, variant: "destructive" });
        return;
      }
      const tag = `![Uploading ${file.name}…](uploading-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)})`;
      insertAtCursor(tag + "\n");
      setUploading((n) => n + 1);
      try {
        const res = await uploadProblemImage(file, { slug });
        const altBase = file.name.replace(/\.[^.]+$/, "");
        const md = `![${altBase}](${res.publicUrl})`;
        replaceInValue(tag, md);
        recordSession({ ...res, name: file.name, uploadedAt: Date.now() });
      } catch (e: any) {
        replaceInValue(tag + "\n", "");
        replaceInValue(tag, "");
        toast({
          title: "Upload failed",
          description: e?.message ?? "Could not upload image.",
          variant: "destructive",
        });
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    },
    [insertAtCursor, recordSession, replaceInValue, slug],
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).slice(0, MAX_FILES_PER_BATCH);
      if (!list.length) return;
      if (files.length > MAX_FILES_PER_BATCH) {
        toast({
          title: "Too many files",
          description: `Only the first ${MAX_FILES_PER_BATCH} files were uploaded.`,
        });
      }
      for (const f of list) {
        // eslint-disable-next-line no-await-in-loop
        await uploadFile(f);
      }
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!images.length) return;
      e.preventDefault();
      void uploadFiles(images);
    },
    [uploadFiles],
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const images: File[] = [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) images.push(f);
        }
      }
      if (!images.length) return;
      e.preventDefault();
      void uploadFiles(images);
    },
    [uploadFiles],
  );

  const removeFromSession = useCallback((path: string) => {
    setSessionImages((prev) => prev.filter((i) => i.path !== path));
  }, []);

  return {
    uploading,
    sessionImages,
    uploadFiles,
    uploadOnly,
    onDrop,
    onPaste,
    removeFromSession,
  };
};
