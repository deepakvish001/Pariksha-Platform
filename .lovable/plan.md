## Goal

Push the blog markdown system to "best-in-class CMS" territory: deeper rich features, a true dark-black code experience, and meaningful UX wins for both **readers** and **admins**. No backend/schema changes — purely frontend additions on top of `BlogContent`, `CodeBlock`, `TableOfContents`, and `MarkdownEditor`.

---

## 1. Code block — premium dark-black experience

Upgrade `src/components/CodeBlock.tsx`:

- **Forced dark "obsidian" palette** in dark mode (deep `#0a0a0c` background, subtle border glow), light mode keeps `oneLight`. Use semantic CSS vars so it adapts cleanly.
- **macOS-style window chrome** (3 dots) + language pill + filename support: ` ```ts title="src/index.ts" ` parsed as caption above the code.
- **Line numbers** (toggle, default on for >3 lines).
- **Line highlighting**: ` ```ts {2,4-6} ` highlights those lines with a left accent bar.
- **Diff highlighting** for `language="diff"` (green/red gutters).
- **Word-wrap toggle** + **collapse/expand** for blocks > 25 lines (with "Show all" button).
- **Copy** stays, plus **Download as file** (uses filename or `snippet.<ext>`).
- Persistent toolbar visible on hover/focus, always visible on touch.

## 2. Richer markdown features in `BlogContent.tsx`

- **More callout kinds**: `note`, `tip`, `warning`, `danger`, `info`, `success`, `question`, `quote` — each with icon + accent. Support optional custom title: `> [!tip] Pro tip — keep it small`.
- **Collapsible callouts**: `> [!note]+` (open) / `> [!note]-` (collapsed) like Obsidian.
- **Footnotes** (already via remark-gfm) — style with hover preview popover on the superscript.
- **Definition lists** via `remark-deflist`.
- **Math** via `remark-math` + `rehype-katex` (KaTeX CSS imported lazily) for `$inline$` and `$$block$$`.
- **Mermaid diagrams** for ` ```mermaid ` blocks (lazy-loaded `mermaid` package; renders to SVG; theme-aware).
- **Keyboard keys**: ` ```kbd ` and inline `<kbd>` styled as physical keys.
- **Task list progress**: detect `- [ ]` / `- [x]` lists and show a small progress bar above the list.
- **More embeds** (extend `lib/blog/embeds.ts`): Twitter/X, GitHub Gist, Loom, Spotify, Figma, generic OEmbed fallback for known patterns.
- **Image lightbox**: clicking content images opens a full-screen viewer with arrow-key nav between images in the post.
- **Image zoom/pan** in lightbox; ESC to close.
- **Responsive iframe wrapper** + lazy + skeleton placeholder.

## 3. Reader UX upgrades

- **Floating action rail** (left side, sticky on lg+): like, bookmark, share, copy-link, scroll-to-top, scroll-to-comments — with counts and tooltips. Mobile: collapses to a bottom action bar.
- **Estimated reading time remaining** in `ReadingProgress` (e.g., "3 min left").
- **TOC improvements**: auto-collapse deep H3 children under their parent until active; "Back to top" link; show H2 progress dot fill; smooth `IntersectionObserver` debouncing.
- **"Copy section link" toast** already exists — add a tiny inline `#` icon hint and a keyboard shortcut (`?` opens help, `t` jumps to top, `c` jumps to comments).
- **Print stylesheet**: hide TOC/rail/comments, expand all collapsibles, force light theme for code blocks.
- **Accessibility**: every interactive control has aria labels; respect `prefers-reduced-motion` (no smooth scroll, no transitions).
- **Comment UX**: show character counter, Cmd/Ctrl+Enter to submit, optimistic insert with "posting…" pill.

## 4. Admin UX upgrades (`AdminBlogEditor` + `MarkdownEditor`)

- **Live preview parity**: switch `MarkdownPreview` (or wire admin preview) to render via the same `BlogContent` so admins see exactly what readers see (callouts, embeds, mermaid, math, code chrome).
- **Slash command menu** in the textarea: typing `/` at line-start pops a command palette (Insert: callout, code block, table, image, embed, mermaid, math, divider, TOC marker).
- **Toolbar additions**: callout dropdown (note/tip/warning/danger), insert code block w/ language picker, insert mermaid template, insert math, insert table builder (rows × cols), insert YouTube embed.
- **Drag-and-drop image paste**: already partially via `useMarkdownImageUpload` — extend to drag-drop on the textarea and clipboard image paste.
- **Word/char/reading-time counter** in the editor footer; warn when SEO desc/title exceed limits (already there, make it color-coded).
- **Auto-save draft to localStorage** every 5s with "Restored from draft" banner if browser was closed mid-edit.
- **Unsaved-changes guard** (`beforeunload` + react-router blocker) when content is dirty.
- **"Open public preview"** button — opens `/blog/<slug>?preview=1` in a new tab so admins can QA the actual reader layout before publishing.
- **Keyboard shortcuts**: Cmd/Ctrl+S save, Cmd/Ctrl+B/I bold/italic, Cmd/Ctrl+K link, Cmd/Ctrl+Shift+P toggle preview mode.
- **Status pill** in header showing autosave state (Saved · Saving · Unsaved).

## 5. Theming polish

- Replace remaining hardcoded color classes in callouts with CSS-var driven tokens (`--callout-note-bg`, `--callout-tip-bg`, ...) defined in `index.css` for both themes — gives us one source of truth and lets future themes override.
- Add a deep-black `.code-obsidian` token block in `index.css` used by CodeBlock so the "true black" look is consistent.
- Verify all new surfaces in both light and dark themes (callouts, mermaid, katex, lightbox, action rail).

## 6. Tests

- Unit: callout variants (info/success/question/quote, collapsible, custom title); CodeBlock filename/line-numbers/highlight/diff/wrap/collapse; embed detectors (twitter, gist, loom, spotify, figma); mermaid lazy mount; math renders; lightbox open/close + keyboard nav.
- Component: floating action rail (counts, tooltips, mobile collapse); TOC auto-collapse + keyboard shortcuts; ReadingProgress "min left" calc.
- Editor: slash menu opens/inserts; toolbar callout/table/embed insert correct markdown; autosave restore; unsaved-changes guard fires.
- E2E (`blog-markdown-showcase.spec.ts`): extend showcase markdown with new features and assert they render.

## Files

**Edit**
- `src/components/CodeBlock.tsx` — chrome, line numbers, highlights, wrap/collapse, download
- `src/components/blog/BlogContent.tsx` — new callouts, mermaid, math, kbd, deflist, task progress, lightbox
- `src/components/blog/TableOfContents.tsx` — auto-collapse, back-to-top, debounce
- `src/components/blog/ReadingProgress.tsx` — "min left"
- `src/lib/blog/embeds.ts` — twitter/gist/loom/spotify/figma
- `src/pages/blog/BlogPost.tsx` — mount FloatingActionRail, ImageLightbox, keyboard shortcuts
- `src/pages/admin/blog/AdminBlogEditor.tsx` — autosave, unsaved guard, public preview, status pill
- `src/components/admin/editor/MarkdownEditor.tsx` — slash menu, drag/paste images, shortcuts
- `src/components/admin/editor/MarkdownToolbar.tsx` — callout/table/embed/mermaid/math actions
- `src/components/admin/editor/MarkdownPreview.tsx` — render via shared `BlogContent`
- `src/index.css` — callout/code CSS vars, print styles
- `tailwind.config.ts` — none expected

**Create**
- `src/components/blog/FloatingActionRail.tsx`
- `src/components/blog/ImageLightbox.tsx`
- `src/components/blog/Mermaid.tsx`
- `src/components/blog/KeyboardShortcuts.tsx`
- `src/components/admin/editor/SlashMenu.tsx`
- `src/components/admin/editor/TableBuilderDialog.tsx`
- `src/hooks/useAutosaveDraft.ts`
- `src/hooks/useUnsavedChangesGuard.ts`
- Tests: `src/components/blog/__tests__/CodeBlock.test.tsx`, `FloatingActionRail.test.tsx`, `ImageLightbox.test.tsx`, `Mermaid.test.tsx`, `src/hooks/__tests__/useAutosaveDraft.test.ts`, plus extending existing `BlogContent.test.tsx` and `e2e/blog-markdown-showcase.spec.ts`

**Dependencies (new)**
- `remark-math`, `rehype-katex`, `katex` (math)
- `mermaid` (lazy-imported only when a mermaid block is detected)
- `remark-deflist` (definition lists)

No DB or edge function changes.