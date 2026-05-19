## Step 2: Assessment Defaults + DB columns

Add an "Assessment defaults" settings section backed by new columns on the `organizations` table. These defaults pre-fill new assessments so admins don't re-enter them every time.

### Database

New columns on `public.organizations` (all nullable with sensible fallbacks in UI):

- `default_duration_min` int — default test length in minutes (fallback 60)
- `default_proctoring` text — `off` | `basic` | `strict` (fallback `basic`)
- `default_pass_mark` int — 0–100 percentage (fallback 40)
- `allow_retake_default` boolean — default false
- `auto_release_results` boolean — default true

No RLS changes needed — existing org policies already cover these columns.

### UI

New file: `src/b2b/pages/settings/DefaultsSection.tsx`, wired into `SettingsLayout` under the existing "Defaults" tab (currently a ComingSoon placeholder).

Fields:
- Duration — number input with min 5 / max 600, suffix "minutes"
- Proctoring profile — Select with three options + short descriptions
- Pass mark — number input 0–100, suffix "%"
- Allow retakes by default — Switch
- Auto-release results — Switch with helper "When off, results stay hidden until you publish them manually"

All fields participate in the existing dirty/save flow in `Settings.tsx` (sticky action bar, discard, toast). Validation: duration and pass mark must be within range; otherwise Save is disabled with an inline error.

### Out of scope for this step

Wiring these defaults into the actual assessment-creation flow — that's a follow-up once the values exist.

### Files

- migration: add 5 columns to `organizations`
- create `src/b2b/pages/settings/DefaultsSection.tsx`
- edit `src/b2b/pages/settings/SettingsLayout.tsx` (swap ComingSoon → DefaultsSection)
- edit `src/b2b/pages/Settings.tsx` (extend form state + save payload)
