import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCodeDraft = (problemSlug: string, language: string) => {
  const { user } = useAuth();
  const [draft, setDraft] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
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

  // Debounced save
  const save = (source_code: string) => {
    if (!user) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      await supabase.from("code_drafts").upsert(
        {
          user_id: user.id,
          problem_slug: problemSlug,
          language,
          source_code,
        },
        { onConflict: "user_id,problem_slug,language" },
      );
    }, 1500);
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
  }, []);

  return { draft, draftLoaded: loaded, saveDraft: save };
};
