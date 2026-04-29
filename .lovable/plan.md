## Goal

Upgrade the **Problem Statement** markdown editor on `/admin/problems/new` (and the edit page) into a feature-rich authoring surface with **drag-and-drop / paste / button image uploads** to a dedicated storage bucket, plus richer markdown tooling and a better preview.

## What admins will get

1. **Rich markdown toolbar** (extends the existing `MarkdownToolbar`):
   - Existing: bold, italic, inline code, link, H2, list, insert examples
   - New: H1/H2/H3 dropdown, bold/italic/strike, inline code, **fenced code block with language**, blockquote, ordered + unordered + task list, table (3×3 template), horizontal rule, **image (upload or URL)**, **inline LaTeX `$…$`** and **block math `$$…$$`** snippets
   - Undo/Redo via native textarea history; keyboard shortcuts (⌘B / ⌘I / ⌘K for link, ⌘⇧C for code, ⌘⇧I for image upload)

2. **Image upload — three input paths, one pipeline**:
   - **Drop** images onto the textarea
   - **Paste** images from clipboard (screenshots)
   - Click the **Image** toolbar button → file picker (multi-select supported)
   - Each upload shows an inline placeholder `![Uploading filename…]()` that's replaced with the final markdown `![alt](publicUrl)` once the upload finishes; on failure the placeholder is removed and a toast explains why
   - Validation: only `image/png|jpeg|webp|gif|svg+xml`, max **5 MB** per file, max 10 at once
   - Files stored at `problem-assets/{problem-slug-or-"drafts"}/{uuid}.{ext}` in a new **public** bucket so the rendered markdown works for learners
   - A small "Manage images" popover lists images uploaded in the current session with copy-URL and delete buttons

3. **Upgraded Preview pane**:
   - Adds `remark-gfm` (tables, task lists, strikethrough, autolinks) — already installed
   - Syntax-highlighted code fences via the already-installed `react-syntax-highlighter`
   - Renders uploaded images responsively (max-width 100%, rounded, subtle border)
   - Sticky preview while scrolling the editor; toggle **Edit / Split / Preview** layout
   - "Open full-screen preview" button for large statements

4. **Quality-of-life**:
   - Word/char/min-read counter (kept) + **broken-image detector** that scans the rendered preview for failed `<img>` loads and surfaces them in the publish checklist as `description` warnings
   - Auto-insert `alt` text prompt when uploading (defaults to filename without extension)
   - Existing field-highlight + autosave-draft behavior preserved
   - Keyboard hint footer under the textarea

## Technical details

**New storage bucket** (SQL migration):
```
insert into storage.buckets (id, name, public) values ('problem-assets','problem-assets', true);

-- Public read
create policy "problem-assets read" on storage.objects
  for select using (bucket_id = 'problem-assets');

-- Only admins can write/update/delete (uses existing has_role(uid,'admin'))
create policy "problem-assets admin write" on storage.objects
  for insert with check (bucket_id='problem-assets' and public.has_role(auth.uid(),'admin'));
create policy "problem-assets admin update" on storage.objects
  for update using (bucket_id='problem-assets' and public.has_role(auth.uid(),'admin'));
create policy "problem-assets admin delete" on storage.objects
  for delete using (bucket_id='problem-assets' and public.has_role(auth.uid(),'admin'));
```

**New / changed files**:
- `src/lib/admin/uploadProblemImage.ts` — single helper: validates file, generates key, uploads via `supabase.storage.from('problem-assets').upload(...)`, returns `{ publicUrl, path }`
- `src/hooks/useMarkdownImageUpload.ts` — wires drop, paste, file-picker events to a textarea; manages placeholder replacement and the in-session image list
- `src/components/admin/editor/MarkdownToolbar.tsx` — extend with new buttons (heading dropdown, code-block, blockquote, lists, table, hr, image, math). Accept `onRequestImageUpload` and `onUrlImage` callbacks. Keep API backward-compatible.
- `src/components/admin/editor/MarkdownPreview.tsx` *(new)* — wraps `ReactMarkdown` with `remark-gfm` + syntax highlighter + responsive `img` renderer; reused by hint preview later.
- `src/components/admin/editor/MarkdownEditor.tsx` *(new)* — composes toolbar + textarea + preview with the **Edit / Split / Preview** layout toggle and full-screen mode (uses existing `Dialog`). Hosts the upload hook and keyboard shortcuts.
- `src/pages/admin/ProblemEditor.tsx` — replaces the current Description card + Preview card with `<MarkdownEditor value={form.description} onChange={...} slug={form.slug} fieldId="description" highlightedField={...} />`. No other tabs change.
- `src/lib/admin/problemValidation.ts` — add a soft warning when description references an image URL whose hostname is not in the project's storage host (helps catch leftover localhost/imgur links).

**Reused / existing**:
- `react-markdown`, `remark-gfm`, `react-syntax-highlighter` (already in `package.json` — no new deps)
- `useFieldHighlight` and `fieldHighlightClass` keep working on the new textarea (forwarded ref + `data-field="description"`)
- Autosave drafts continue to capture the description as plain markdown text — uploaded image URLs persist naturally

**Out of scope** (can be a follow-up): a global image library across all problems, image cropping/resizing, video uploads.

## Step-by-step build order

1. Create storage bucket + RLS via migration
2. Add `uploadProblemImage` helper and `useMarkdownImageUpload` hook
3. Build `MarkdownPreview` and the extended `MarkdownToolbar`
4. Compose `MarkdownEditor` with layout toggle, full-screen, shortcuts
5. Swap the Statement tab in `ProblemEditor` to use it
6. Add description-asset warning to validator
7. Smoke-test: drop, paste, button upload; preview rendering; field highlighting; autosave round-trip