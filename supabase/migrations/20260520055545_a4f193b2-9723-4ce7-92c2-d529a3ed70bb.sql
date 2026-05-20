-- 1. Extend xp_transactions into an auditable ledger
ALTER TABLE public.xp_transactions
  ADD COLUMN IF NOT EXISTS reference_id uuid,
  ADD COLUMN IF NOT EXISTS reversal_of uuid REFERENCES public.xp_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'posted',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS reversal_reason text;

ALTER TABLE public.xp_transactions
  DROP CONSTRAINT IF EXISTS xp_transactions_status_check;
ALTER TABLE public.xp_transactions
  ADD CONSTRAINT xp_transactions_status_check CHECK (status IN ('posted','reversed'));

-- 2. Idempotency: at most one active posted entry per (source, reference_id)
CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_source_ref_active_uniq
  ON public.xp_transactions (source, reference_id)
  WHERE reference_id IS NOT NULL AND status = 'posted' AND reversal_of IS NULL;

CREATE INDEX IF NOT EXISTS idx_xp_transactions_reference
  ON public.xp_transactions (source, reference_id);

-- 3. Admin-only secure function: award XP exactly once per (source, reference_id)
CREATE OR REPLACE FUNCTION public.award_xp_idempotent(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_reference_id uuid,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing uuid;
  v_new uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can award XP via the ledger';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Return existing active entry if one exists (idempotent)
  SELECT id INTO v_existing
  FROM public.xp_transactions
  WHERE source = p_source
    AND reference_id = p_reference_id
    AND status = 'posted'
    AND reversal_of IS NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.xp_transactions (
    user_id, amount, source, description, reference_id, metadata, created_by, status
  ) VALUES (
    p_user_id, p_amount, p_source, p_description, p_reference_id, COALESCE(p_metadata, '{}'::jsonb), auth.uid(), 'posted'
  )
  RETURNING id INTO v_new;

  RETURN v_new;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp_idempotent(uuid,integer,text,uuid,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.award_xp_idempotent(uuid,integer,text,uuid,text,jsonb) TO authenticated;

-- 4. Admin-only secure function: reverse a posted award
CREATE OR REPLACE FUNCTION public.reverse_xp_entry(
  p_source text,
  p_reference_id uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orig RECORD;
  v_reversal_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reverse XP entries';
  END IF;

  SELECT * INTO v_orig
  FROM public.xp_transactions
  WHERE source = p_source
    AND reference_id = p_reference_id
    AND status = 'posted'
    AND reversal_of IS NULL
  LIMIT 1;

  IF v_orig.id IS NULL THEN
    RETURN NULL; -- nothing active to reverse
  END IF;

  INSERT INTO public.xp_transactions (
    user_id, amount, source, description, reference_id, reversal_of, metadata, created_by, status
  ) VALUES (
    v_orig.user_id,
    -1 * v_orig.amount,
    v_orig.source,
    'Reversal: ' || COALESCE(p_reason, 'no reason provided'),
    v_orig.reference_id,
    v_orig.id,
    jsonb_build_object('reason', p_reason),
    auth.uid(),
    'posted'
  ) RETURNING id INTO v_reversal_id;

  UPDATE public.xp_transactions
  SET status = 'reversed',
      reversal_reason = p_reason
  WHERE id = v_orig.id;

  RETURN v_reversal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_xp_entry(text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_xp_entry(text,uuid,text) TO authenticated;

-- 5. Admin read policy so moderators can audit the full ledger
DROP POLICY IF EXISTS "Admins can view all XP transactions" ON public.xp_transactions;
CREATE POLICY "Admins can view all XP transactions"
ON public.xp_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));