## Re-audit result

After reading the code, 2 of the 6 "partial" items from my previous list are actually **already done**:

- **Image reorder + preview before upload** — `AnswerUploadTile.tsx` already has drag-reorder (`@dnd-kit`), lightbox preview with ←/→/Esc, delete, and download.
- **"Sync uploaded images" button** — same file has an explicit `Sync` button plus Realtime auto-sync on `assessment_answer_uploads`.

So only **3 genuine gaps** remain vs. the PDF.

## Gaps to close

### 1. Speaker playback self-test in Preflight (PDF p.11)
Today `Preflight.tsx` checks **mic input + webcam** (`audioOk`, `videoOk`). The PDF flow also asks the candidate to **press Play and confirm they can hear** a sample tone — proving the speaker works, not just the mic.

Add a small "Can you hear this?" step inside the existing Preflight card:
- A `<audio>` element with a short generated tone (or a tiny bundled `tone.mp3` in `public/assets/`).
- `Play` button → on `ended`, show **Yes / No, replay** buttons.
- New `speakerOk` state; gate `onPass()` on `audioOk && videoOk && speakerOk`.
- No DB / RLS changes.

### 2. General Instructions modal + Zoom in/out in Player (PDF p.43–44)
`PlayerTopBar` / `PlayerHelpSheet` cover help, but there is no per-question **font-size zoom** and no dedicated **General Instructions** dialog.

- Add two buttons to `PlayerTopBar.tsx`: `A−` / `A+` (cycles 90% / 100% / 115% / 130%) and an **Instructions** (ℹ) button.
- Font-size state lives in `useEditorPrefs` (already exists) so it persists per attempt; apply via a CSS variable on the question-body container.
- `Instructions` opens a new `GeneralInstructionsDialog.tsx` that renders the assessment's existing `instructions` markdown field (already on `assessments` table) plus a static "Proctoring rules" block.

### 3. Mobile pairing guidance: Auto-Rotate + Do Not Disturb (PDF p.20)
`SideCameraPairing` + `SideEyeMobile` go straight from "Allow camera" to "stream live". The PDF inserts a small **before-you-place-the-phone** checklist.

- Add a one-screen `SideEyeReadyCheck.tsx` shown after camera permission on the **mobile** route (`/contests/side-eye/...` / `/assessments/sidecam/...`):
  - 3 checkbox items: "Auto-rotate on", "Do Not Disturb on", "Phone propped at table height".
  - "I'm ready" button to advance to streaming.
- Pure UI, no backend.

## Out of scope

- SRM-specific portal / NetID — Parikshaa uses email + Google.
- "Open Test / Third Eye" button labels — keep current Parikshaa wording.
- CodeTantra branding, support phone numbers.

## File touch-list (technical)

- `src/assessments/pages/Preflight.tsx` — add speaker test step + `speakerOk` gate.
- `public/assets/preflight-tone.mp3` — short tone asset (or generate via `AudioContext`, no asset needed).
- `src/assessments/components/PlayerTopBar.tsx` — add zoom buttons + Instructions trigger.
- `src/assessments/components/GeneralInstructionsDialog.tsx` — **new**, renders assessment `instructions` markdown.
- `src/assessments/hooks/useEditorPrefs.ts` — add `questionFontScale` field.
- `src/assessments/pages/Player.tsx` — read `questionFontScale`, apply CSS var to question body.
- `src/assessments/components/SideEyeReadyCheck.tsx` — **new**, mobile readiness checklist.
- `src/pages/contests/SideEyeMobile.tsx` + `src/assessments/pages/SideCamera.tsx` — render the ready-check between permission grant and live stream.

No migrations, no RLS changes, no new env vars.
