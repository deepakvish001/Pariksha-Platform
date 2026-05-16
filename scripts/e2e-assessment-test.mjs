#!/usr/bin/env node
/**
 * End-to-end assessment test
 *
 * Drives a real attempt against Lovable Cloud, submits prefilled answers for
 * every supported question type (MCQ, Coding, SQL, Subjective, True/False,
 * Matching, Short Answer), and verifies each one is graded as expected.
 *
 * Requires the following env vars:
 *   SUPABASE_URL          (defaults to VITE_SUPABASE_URL if available)
 *   SUPABASE_ANON_KEY     (defaults to VITE_SUPABASE_PUBLISHABLE_KEY)
 *   TEST_EMAIL            college/recruiter user with access to the draft
 *   TEST_PASSWORD
 *   DRAFT_ASSESSMENT_ID   uuid of the seeded draft assessment
 *
 * Usage:
 *   node scripts/e2e-assessment-test.mjs
 *
 * Exit code is non-zero if any question fails to grade or any RPC errors.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const DRAFT_ASSESSMENT_ID = process.env.DRAFT_ASSESSMENT_ID;

function bail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) bail("Missing SUPABASE_URL / SUPABASE_ANON_KEY");
if (!TEST_EMAIL || !TEST_PASSWORD) bail("Missing TEST_EMAIL / TEST_PASSWORD");
if (!DRAFT_ASSESSMENT_ID) bail("Missing DRAFT_ASSESSMENT_ID");

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SUPPORTED = [
  "mcq",
  "coding",
  "sql",
  "subjective",
  "true_false",
  "matching",
  "short_answer",
];

async function main() {
  console.log("→ Signing in as", TEST_EMAIL);
  {
    const { error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) bail(`sign-in failed: ${error.message}`);
  }

  console.log("→ Starting preview attempt for", DRAFT_ASSESSMENT_ID);
  const { data: attemptId, error: startErr } = await supabase.rpc(
    "start_preview_attempt",
    { _assessment: DRAFT_ASSESSMENT_ID }
  );
  if (startErr) bail(`start_preview_attempt: ${startErr.message}`);
  console.log("  attempt =", attemptId);

  const { data: paper, error: paperErr } = await supabase.rpc(
    "get_attempt_paper",
    { _attempt: attemptId }
  );
  if (paperErr) bail(`get_attempt_paper: ${paperErr.message}`);

  const questions = (paper?.sections ?? []).flatMap((s) => s.questions ?? []);
  if (questions.length === 0) bail("paper has no questions");
  console.log(`  ${questions.length} question(s) loaded`);

  const seenTypes = new Set(questions.map((q) => q.type));
  const missingTypes = SUPPORTED.filter((t) => !seenTypes.has(t));
  if (missingTypes.length) {
    console.warn(`! Draft is missing types: ${missingTypes.join(", ")}`);
  }

  const { data: answerKey, error: keyErr } = await supabase.rpc(
    "get_assessment_answer_key",
    { _assessment: DRAFT_ASSESSMENT_ID }
  );
  if (keyErr) bail(`get_assessment_answer_key: ${keyErr.message}`);

  console.log("→ Saving prefilled answers");
  for (const q of questions) {
    const answer = answerKey?.[q.id] ?? {};
    const { error } = await supabase
      .from("attempt_answers")
      .upsert(
        { attempt_id: attemptId, question_id: q.id, answer },
        { onConflict: "attempt_id,question_id" }
      );
    if (error) bail(`save ${q.type} (${q.id}): ${error.message}`);
  }

  console.log("→ Submitting attempt");
  const { error: subErr } = await supabase.rpc("submit_attempt", {
    _attempt: attemptId,
  });
  if (subErr) bail(`submit_attempt: ${subErr.message}`);

  const { data: graded, error: gErr } = await supabase
    .from("attempt_answers")
    .select("question_id, auto_score, manual_score")
    .eq("attempt_id", attemptId);
  if (gErr) bail(`fetch graded answers: ${gErr.message}`);
  const scoreByQ = new Map(graded.map((g) => [g.question_id, g]));

  console.log("\n  Results by question");
  console.log("  ─────────────────────────────────────────────");
  let failed = 0;
  const autoTypes = new Set(["mcq", "true_false", "sql", "short_answer", "matching"]);
  for (const q of questions) {
    const row = scoreByQ.get(q.id) ?? {};
    const score = Number(row.auto_score ?? 0);
    const expectFull = autoTypes.has(q.type);
    const ok = expectFull ? score >= q.points : true; // coding/subjective need manual grading
    const status = ok ? "✓" : "✗";
    console.log(
      `  ${status} ${q.type.padEnd(12)} ${score}/${q.points}  ${q.title.slice(0, 50)}`
    );
    if (!ok) failed++;
  }

  if (failed > 0) bail(`${failed} question(s) failed to grade as expected`);
  console.log("\n✓ End-to-end assessment test passed");
}

main().catch((e) => bail(e?.message || String(e)));
