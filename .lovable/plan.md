## Goal

Recreate the polished, step-by-step student exam experience shown in the SRM/CodeTantra manual on top of our existing Parikshaa assessments + Side Eye stack. The manual's strength is *guidance* — every screen tells the student exactly what to do next, with visuals. We'll mirror that flow with our deep-black/amber theme.

We already have most building blocks (`Lobby`, `Player`, `SideCamera`, `SideCameraPairing`, `WebcamPip`, `useProctoring`, `assessment-sidecam` edge fn). The work is mostly **UX polish + a few missing screens (env check, descriptive-answer mobile upload, submit summary)** — not new backend.

---

## Flow we'll build (mapped to manual steps)

```text
Login → My Assessments → [Open Test] → Pre-flight Wizard ──┐
                                                            │
  ┌─ Step 1  Device & browser check (auto-detect)           │
  ├─ Step 2  Permissions: cam + mic + screen (Allow chain)  │
  ├─ Step 3  Audio/Webcam/Mic self-test (Play / Yes)        │
  ├─ Step 4  Pair Third Eye (QR → mobile)                   │
  │           └─ mobile: login → Third Eye → Allow camera   │
  │                    → place phone → "Connected" pulse    │
  └─ Step 5  Proctor ready → [Start Test] unlocks           │
                                                            ▼
                                                  ┌── In-Test Shell ──┐
                                                  │  Top: timer, SOS  │
                                                  │  Left: palette    │
                                                  │  Center: question │
                                                  │  Right: chat dock │
                                                  │  Bottom: nav      │
                                                  └───────┬───────────┘
                                                          │
                              Descriptive Q → "Upload from phone" tile
                                  └─ phone: capture pages → reorder
                                     → upload → laptop "Sync" → preview
                                                          │
                                                Finish → Summary modal
                                                       → Confirmation screen
```

---

## Screens & components to add / refine

### 1. Pre-flight Wizard (`src/assessments/pages/Preflight.tsx`, new)
Replaces the current ad-hoc Lobby allow-prompts. Single fullscreen page, 5 numbered steps in a left rail (like the manual's "Step 01… Step 15"), big preview on the right.
- **Step cards** with states: `pending / active / passed / failed`, semantic amber active ring.
- Auto-detect: OS, browser, version; show the manual's OS×browser compatibility matrix with our row highlighted ✓.
- Webcam preview tile + audio meter (reuse `WebcamPip`).
- "Proceed to test" stays disabled until all steps pass and Third Eye is paired.

### 2. Third Eye Pairing — restyled (`SideCameraPairing.tsx`)
- Replace the current minimal QR card with a two-pane layout: left = QR + numbered phone instructions ("Open camera, place 3–4 ft to your side, landscape"); right = live phone preview thumbnail once connected with a green "Connected" pulse.
- Mobile side (`SideCamera.tsx`): add the manual's placement diagram, auto-rotate / DND reminder, and a "Connected — keep this screen on" confirmation page.

### 3. In-Test Shell polish (`Player.tsx`, `PlayerTopBar`, `PlayerBottomBar`, `QuestionPalette`)
- **Top bar**: countdown chip (color shifts red < 5 min), candidate name + photo, network/proctor status dots, **SOS** button (opens a dialog like manual p.45 with preset reasons).
- **Palette** (left): grid of question numbers with legend (Answered / Marked / Not visited / Current) matching manual p.41. Sticky, collapsible on narrow screens.
- **Chat with Proctor** dock (right): floating green chat FAB → slide-over panel, unread badge.
- **Zoom controls** + **General Instructions** modal accessible from top-right (matches p.43–44).

### 4. Descriptive answer upload (the big missing piece)
New mobile route `src/assessments/pages/SideCameraUpload.tsx` (or extend `SideCamera.tsx`):
- On laptop, descriptive questions show an **"Upload answer sheets from phone"** tile with a counter ("0 / N pages uploaded") and a **Sync** button.
- On phone Third Eye: tap **Upload for Q3** → camera capture sheet by sheet → preview grid → drag-to-reorder (use existing `@dnd-kit`) → **Upload** with confirmation dialog → "Uploaded ✓".
- Laptop polls / realtime-subscribes; **Sync** pulls signed thumbnails into the question's answer slot.

Storage: reuse `assessment-proctor` bucket with a new prefix `answers/{attempt_id}/{question_id}/{n}.jpg`; new table `assessment_answer_uploads (attempt_id, question_id, storage_path, ordinal, uploaded_at)` with strict RLS (attempt owner + org proctors only). Existing `assessment-sidecam` edge fn handles signed upload URLs.

### 5. Submit flow
- **Test Summary modal** before submit: table of Answered / Marked / Not answered counts per section, matches manual p.46.
- **Confirmation screen** (`Submitted.tsx`): big check, "Congratulations! You have successfully submitted." + attempt id, proctor disconnect, support contact block (email/phone from org settings).

### 6. Help & Support
- Persistent `?` button in top bar opens `PlayerHelpSheet` with the manual's troubleshooting tree (browser update, mic not detected, phone disconnected, re-pair Third Eye) and org support contacts.

---

## Visual language

Stay 100% on the existing B2B theme (`.theme-b2b`, deep black + amber primary, glassmorphism cards). No new tokens. Use:
- `GlassPanel` for every wizard step card and the chat dock.
- Numbered step circles: 32px, `bg-primary text-primary-foreground` when active, `bg-secondary` when pending, `bg-emerald-500` when passed.
- Subtle framer-motion fade+slide between wizard steps (200ms, ease-out) — same vocabulary as the rest of the app.
- All copy short and instructional, matching the manual's tone ("Click on **Allow** to continue").

---

## Technical notes

- **No new auth.** Mobile pairs via existing signed pair-token in `contest-sideeye-pair` style; reuse `assessment-sidecam` edge function for upload URLs (already deployed).
- **Realtime sync** for phone→laptop uses the existing `assessment_side_camera_frames` channel pattern; add a sibling channel for `assessment_answer_uploads`.
- **RLS**: new `assessment_answer_uploads` table — owner can insert/select own rows, proctors of the org can select via `has_role`/`useCanProctor` server equivalent, no updates/deletes from clients.
- **Routes added**:
  - `/assessments/:id/preflight`
  - `/assessments/:id/submitted`
  - `/side-camera/:token/upload/:questionId` (mobile)
- **Files added**: `Preflight.tsx`, `Submitted.tsx`, `SideCameraUpload.tsx`, `PreflightStep.tsx`, `SosDialog.tsx`, `ProctorChatDock.tsx`, `TestSummaryDialog.tsx`, `CompatibilityMatrix.tsx`.
- **Files refined**: `Lobby.tsx` (becomes a thin shell that redirects into Preflight), `Player.tsx` (mount chat dock + summary dialog), `SideCameraPairing.tsx`, `SideCamera.tsx`, `PlayerTopBar.tsx`, `PlayerBottomBar.tsx`, `QuestionPalette.tsx`.

---

## Out of scope (call out explicitly)

- No changes to grading, question authoring, or org admin screens.
- No new AI proctoring rules — existing `assessment-snapshot-review` keeps running on the new uploads only if you want; otherwise answer uploads are excluded from AI review.
- No native mobile app — phone side stays a PWA-friendly web page like today.

---

## Suggested build order

1. Preflight wizard + compatibility matrix + restyled pairing  (biggest UX win, no schema)
2. In-test shell polish: palette legend, SOS dialog, chat dock, summary modal, submitted screen
3. Descriptive answer upload (new table + mobile capture/reorder + laptop sync tile)
4. Help sheet content pass + final QA on mobile breakpoints

Shall I proceed with step 1 first, or do you want all four batched into one go?
