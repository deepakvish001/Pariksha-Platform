## Next: wire Layer 5 + ship Layer 1

Layer 5's foundation (signed-transport DB, `contest-session-sign` edge function, `_shared/contest-signing.ts` verifier, `useContestSessionSigner` hook) is already in. Below is the next batch of work.

---

### Part A — Activate Layer 5 in the player and the two highest-risk functions

1. **`src/pages/contests/ContestPlayProblem.tsx`**
   - Call `useContestSessionSigner(sessionId)` after the Trust Gate passes.
   - Block answer submission and violation reporting until `ready === true`.
   - If `missedRotations() >= 2`, push a `signature_invalid` violation and trigger the existing termination lockout.

2. **`supabase/functions/contest-violation-engine/index.ts`**
   - Read raw body once, call `verifySignedRequest(req, rawBody)`.
   - On `{ ok: false }`, return 401 AND insert a self-report `signature_invalid` violation (critical) so the engine still terminates the session.

3. **`supabase/functions/contest-answer-submit/index.ts`** (or the equivalent submit function — confirm exact name during exploration)
   - Same verifier guard. Reject unsigned submits.

4. **Client call sites** for the two functions above switch to `supabase.functions.invoke(name, { body, headers: await sign(...) })`. A tiny wrapper `invokeSigned(name, body)` in the signer hook keeps call sites clean.

---

### Part B — Layer 1: question randomization + per-candidate watermark

1. **Migration**
   - `contest_session_question_order` table: `session_id`, `question_ids uuid[]`, `option_orders jsonb`, `created_at`. Admin-only RLS; service role writes.
   - Optional `contest_questions.pool_size` hint column already exists in most schemas — confirm and reuse.

2. **`supabase/functions/contest-question-allocator/index.ts`** (new)
   - Input: `sessionId`. Auth: JWT-verified candidate owning the session.
   - Deterministic shuffle seeded by `sha256(sessionId + contest_secret)` so the same session always returns the same order (idempotent on reconnect).
   - Picks N questions from the contest's pool (oversized 3-5x if available), shuffles option indices per question, persists once.
   - Returns sanitized questions (no answer key).

3. **Player integration**
   - `ContestPlayProblem` loads questions via the allocator instead of the current direct table read.
   - Server-side answer-check uses the persisted `option_orders` to map the candidate's chosen index back to the canonical option.

4. **Watermark overlay** — new `src/components/contests/SessionWatermark.tsx`
   - Fixed full-viewport, `pointer-events-none`, z-index just under modals.
   - Renders 6 faint diagonal repetitions of `{candidate_email} · {sessionId.slice(0,8)} · {timestamp}` at 4% opacity.
   - Injects zero-width-character encoding of `sessionId` into every question/option DOM node (forensic fingerprint if text is copy-pasted).
   - Mounted by `ContestPlayProblem` once Trust Gate passes.

5. **Print Screen / clipboard hardening**
   - Extend `useZeroTrustWatcher`: `keydown` listener for `PrintScreen` → `critical` violation `print_screen_attempt` (PrintScreen can't be fully blocked in browsers but the attempt is loggable on `keyup`).
   - Block `copy` event on the question container, log `copy_attempt` at `high`.

---

### Part C — Light verification

- Smoke-test `contest-session-sign` with `supabase--curl_edge_functions` (issue → rotate → revoke).
- Confirm `verifySignedRequest` rejects: missing headers, wrong signature, replayed sequence, expired key.
- Confirm allocator returns the same order on a second call with the same `sessionId` (idempotency).

---

### Out of scope this turn

Layers 2, 3, 4, 6 stay queued. Each is a separate, self-contained turn after this batch lands cleanly.

Reply **yes** to execute Part A + Part B together, or **A only** / **B only** to split.