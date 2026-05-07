import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DraftSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export const useCodeDraft = (problemSlug: string, language: string) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<DraftSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<number | null>(null);

  // Load draft when problem/lang changes
  useEffect(() => {
    if (!user) {
      setDraft(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    (async () => {
      const { data } = await supabase
        .from("code_drafts")
        .select("source_code")
        .eq("user_id", user.id)
        .eq("problem_slug", problemSlug)
        .eq("language", language)
        .maybeSingle();
      setDraft(data?.source_code ?? null);
      setLoaded(true);
    })();
  }, [user, problemSlug, language]);

  // Track latest pending value for flush-on-unload / explicit flush.
  const pendingRef = useRef<string | null>(null);
  // Local fallback so refresh doesn't lose changes even if the network save
  // hasn't fired yet (e.g. user refreshes within the 1.5s debounce window).
  const localKey = `parikshaa:code-draft:${problemSlug}:${language}`;

  // Hydrate from local fallback while remote fetch is in-flight, so the editor
  // never momentarily flashes back to the starter template after a refresh.
  useEffect(() => {
    if (!problemSlug) return;
    try {
      const local = localStorage.getItem(localKey);
      if (local && draft === null && !loaded) {
        setDraft(local);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSlug, language]);

  const persistRemote = async (source_code: string) => {
    if (!user) return;
    setStatus("saving");
    try {
      await supabase.from("code_drafts").upsert(
        {
          user_id: user.id,
          problem_slug: problemSlug,
          language,
          source_code,
        },
        { onConflict: "user_id,problem_slug,language" },
      );
      pendingRef.current = null;
      setStatus("saved");
      setLastSavedAt(Date.now());
    } catch {
      setStatus("error");
    }
  };

  // Debounced save (also writes a local fallback immediately).
  const save = (source_code: string) => {
    pendingRef.current = source_code;
    try {
      localStorage.setItem(localKey, source_code);
    } catch {
      /* ignore quota errors */
    }
    if (!user) return;
    setStatus("pending");
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void persistRemote(source_code);
    }, 1500);
  };

  // Force-flush any pending change (used before unload / on demand).
  const flushDraft = async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (pendingRef.current !== null && user) {
      await persistRemote(pendingRef.current);
    }
  };

  // Flush on tab hide / unload so refreshes never lose unsaved edits.
  useEffect(() => {
    const onHide = () => {
      if (pendingRef.current !== null && user) {
        // Fire-and-forget; browsers will let the request go out on pagehide.
        void persistRemote(pendingRef.current);
      }
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, problemSlug, language]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  return {
    draft,
    draftLoaded: loaded,
    saveDraft: save,
    flushDraft,
    saveStatus: status,
    lastSavedAt,
  };
};
