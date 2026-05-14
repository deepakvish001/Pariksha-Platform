
-- Remove sensitive tables from Realtime publication (prevents broadcast of session tokens, IP, role changes, forensic data)
ALTER PUBLICATION supabase_realtime DROP TABLE public.contest_sessions;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.sideeye_evidence_chain;
ALTER PUBLICATION supabase_realtime DROP TABLE public.contest_trust_scores;
ALTER PUBLICATION supabase_realtime DROP TABLE public.contest_similarity_pairs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.contest_violations;

-- Restrict ai_content_likes: drop the public-readable policy, owner-only reads.
-- Aggregate like counts are already exposed via ai_generated_content.likes_count.
DROP POLICY IF EXISTS "Anyone can view likes count" ON public.ai_content_likes;
CREATE POLICY "Users can view their own likes"
ON public.ai_content_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
