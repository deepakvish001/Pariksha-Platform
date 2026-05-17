## What the PDF covers vs what we already have

I walked the PDF manual page-by-page and matched it against the current `src/assessments/*` code. Almost the entire flow is already built:

| Manual step (page) | Status in our app |
|---|---|
| Devices required, 2-device setup (p.2) | ✓ Preflight wizard explains Laptop + Phone |
| OS × browser compatibility matrix (p.3) | ✓ `CompatibilityMatrix.tsx` |
| Browser update guidance (p.4) | ✓ Inside `PlayerHelpSheet.tsx` |
| Login (p.5–8) | ✓ Existing auth + `MyAssessments` |
| Open Test (p.9) | ✓ `MyAssessments` → `Preflight` |
| Allow cam/mic (p.10) | ✓ Preflight step "Permissions" |
| Audio / webcam / mic self-test (p.11) | ✓ Preflight step "Audio / Video" |
| "Proceed to test" gate (p.12) | ✓ Preflight summary dialog |
| Connect to 3rd Eye + QR (p.13–18) | ✓ `SideCameraPairing.tsx` |
| Phone placement / auto-rotate / DND (p.19–22) | ✓ Pairing instructions |
| Proctor view (p.23) | ✓ Admin Side-Eye console |
| Start test (p.24–25) | ✓ Preflight "Ready" → Player |
| Answer MCQ (p.26) | ✓ Player |
| **Descriptive Q answer-sheet upload via phone (p.27–36)** | **✗ Missing** |
| **Laptop "Sync" tile to pull uploads (p.37–39)** | **✗ Missing** |
| Jump-to navigation palette (p.41) | ✓ `QuestionPalette` |
| Chat with proctor (p.42) | ✓ `AssessmentChatDock` |
| General instructions modal (p.43) | ✓ `PlayerHelpSheet` |
| Zoom in/out (p.44) | ✓ Player zoom controls |
| SOS (p.45) | ✓ `PlayerSosButton` + dialog |
| Test Summary before submit (p.46) | ✓ Player submit `AlertDialog` with Answered/Unanswered/Flagged + jump chips |
| "Successfully submitted" screen (p.47) | ✓ `Submitted.tsx` |
| Support contacts (p.48) | ✓ `SupportLink.tsx` + Help Sheet |

So the **only meaningful gap** is the descriptive-answer phone-upload feature (PDF pages 27–39). Everything else already matches or exceeds the manual.

## What I'll build

### 1. Backend (Lovable Cloud)
Migration adding one table + RLS:
```text
assessment_answer_uploads
  id uuid pk
  attempt_id uuid  -> attempts (owner only)
  question_id uuid
  storage_path text          -- in existing 'assessment-proctor' bucket
  ordinal int                -- page order, 1..n
  uploaded_at timestamptz default now()
  unique (attempt_id, question_id, ordinal)
```
RLS:
- Owner of the attempt can `select` / `insert` / `delete` their own rows (delete only while attempt is in_progress).
- Org proctors can `select` rows whose `attempt → assessment → org` they belong to (reuse existing `has_role`-style helper used by `ProctoringTriagePanel`).
- No client `update`.

Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_answer_uploads;`

Storage: reuse existing `assessment-proctor` bucket, prefix `answers/{attempt_id}/{question_id}/{ordinal}.jpg`. The existing `assessment-sidecam` edge function already mints signed upload URLs — extend it with an `answer-upload` action that validates the pair token + attempt and returns a signed URL for that path.

### 2. Mobile capture page — new
`src/assessments/pages/SideCameraUpload.tsx` mounted at `/side-camera/:token/upload/:attemptId/:questionId`.
- Reuse the existing pair-token check from `SideCamera.tsx`.
- Camera capture (getUserMedia, environment-facing) → snap → thumbnail preview grid.
- Drag-to-reorder with existing `@dnd-kit` (already in deps).
- Per-page delete + retake.
- "Upload" → signed-URL PUT for each page → insert row → confirmation dialog.
- "Uploaded ✓" screen with page count.

### 3. Laptop tile — Player subjective renderer
Inside `Player.tsx` `if (question.type === "subjective") { … }`, render under the existing textarea:
- A `GlassPanel` tile "Upload answer sheets from phone" with counter `N pages uploaded`, last-uploaded timestamp, and a `Sync` button.
- Thumbnail strip of currently synced pages (signed download URLs) with click-to-zoom.
- Subscribes to the realtime channel for `assessment_answer_uploads` filtered by `attempt_id=eq.{attemptId}` and refreshes on insert.
- Persists the list of `storage_path`s into the existing answer JSON (`answers[qq.id].pages = [...]`) so `isAnswered` returns true when at least one page is uploaded, and grading + the submit summary stay accurate.
- Stays hidden when the assessment's `proctoring_config.allow_phone_upload` is false (default true).

### 4. Pairing → instruct mobile when subjective question is open
The mobile Third Eye page (`SideCamera.tsx`) gains a small "Pending uploads" banner that deep-links into `SideCameraUpload` for whichever question the laptop currently has open. The laptop publishes the active `questionId` on the existing presence channel; phone subscribes.

### 5. Tests
- Vitest: helper that builds the answer JSON from upload rows + `isAnswered` returns true with ≥1 page.
- Playwright: skipped here (camera access requires a real device); add a TODO note.

## Out of scope

- No changes to grading pipeline beyond surfacing uploaded page URLs.
- AI proctoring (snapshot review) is **not** run against these answer-sheet images.
- Existing flows (Preflight, SOS, chat, submit dialog, Submitted page, integrity score) are unchanged.

## Suggested order

1. Migration + storage path + edge-fn `answer-upload` action.
2. `SideCameraUpload.tsx` mobile page + route.
3. Player subjective tile + realtime sync + `isAnswered` integration.
4. Phone "pending upload" banner + presence wiring.

Want me to ship all four in one go, or stop after step 1 for review?
