## Goal

When you paste any blog content into the Markdown editor — whether it's plain Markdown, HTML copied from Notion / Medium / Google Docs / a website, or a Markdown file with front-matter — the editor should auto-detect the format, convert it cleanly, and the preview should render every element correctly (headings, code blocks with language, callouts, tables, math, images, embeds).

## Current state

- The editor (`MarkdownEditor` → `MarkdownPreview` → `BlogContent`) already renders a full feature set live: GFM, KaTeX math, Mermaid, callouts (`> [!note]`), code with language + filename + line highlights, YouTube/Vimeo/CodePen/Twitter embeds, tables, footnotes, image lightbox.
- The current `onPaste` handler only intercepts **image files** for upload. Any other paste (HTML, rich text, Markdown with front-matter) falls through to the browser's default `text/plain` insertion, which loses formatting and dumps front-matter into the body.

So the pipeline already "renders everything correctly" — the gap is the **paste step**, which doesn't translate non-Markdown clipboard payloads into Markdown the renderer can understand.

## What to build

### 1. Smart paste in the Markdown textarea

Extend the existing `onPaste` chain (without breaking image paste) with these stages, in order:

1. **Image files** → existing upload flow (unchanged).
2. **HTML clipboard** (`text/html` present and richer than the plain fallback) → convert to Markdown using `turndown` + `turndown-plugin-gfm`, with custom rules for:
   - Code blocks → fenced ``` with language inferred from `class="language-xxx"` / `data-lang` / `<pre><code>` hints.
   - Notion / Medium callout blocks (`<aside>`, `<div class="callout">`, colored blockquotes) → `> [!note] Title`.
   - Notion toggles → `> [!note]- Title` (collapsible).
   - `<figure><img><figcaption>` → `![alt](src "caption")`.
   - `<table>` → GFM pipe table.
   - `<kbd>`, `<mark>`, `<sub>`, `<sup>` preserved as raw HTML (already supported by the renderer).
3. **Plain text that looks like Markdown** (heuristic: contains `#`, ` ``` `, `|`, `- [ ]`, `> `, etc.) → insert as-is, but normalized (see step 3).
4. **Plain text** → insert as-is (default).

A small toast confirms what happened: "Pasted HTML — converted to Markdown" / "Pasted Markdown" / "Front-matter applied".

### 2. Front-matter auto-fill

If the pasted content starts with a YAML (`---`) or TOML (`+++`) front-matter block:

- Parse it with a minimal YAML parser (no new heavy dep — small inline parser, or use `js-yaml` which is already small).
- Strip it from the inserted body.
- Auto-fill the matching editor fields when they're currently empty: `title`, `excerpt` / `description`, `cover` / `cover_image`, `tags`, `categories`, `slug`, `seo_title`, `seo_description`, `canonical_url`.
- Never overwrite fields the user already filled in.
- Toast: "Front-matter detected — applied 4 fields."

### 3. Content normalization

Run on every paste (after HTML→MD, before insertion):

- CRLF / CR → LF.
- Smart quotes (`" " ' '`), en/em dashes from Word, NBSP (`\u00A0`), zero-width chars → ASCII equivalents.
- Strip Notion-style "Open in Notion" / share footers and Google Docs comment markers.
- Collapse 3+ blank lines to 2.
- Ensure code fences have a trailing newline.

### 4. Preview accuracy verification

The preview already covers everything BlogContent supports. To make sure pasted content "shows correctly", add:

- A small "Detected" chip row under the editor header showing what the pasted source contained: `Headings · Code (3) · Tables · Math · Images (5)`. This gives the author instant confidence the paste landed.
- Re-run TOC / reading-time stats on every change (already happens via the controlled `value`).

### 5. Tests

- Unit test for the HTML→Markdown converter with fixtures: a Notion export snippet, a Medium snippet, a GitHub README HTML snippet.
- Unit test for the front-matter parser: applies fields, strips body, ignores when fields already set.
- Unit test for the normalizer (smart quotes, NBSP, CRLF).

## Out of scope

- Pasting from Word `.docx` binary (clipboard already exposes HTML for Word; covered).
- MDX / JSX components (the renderer is Markdown-only by design).
- Bulk import of multiple posts.
- Remote URL fetching ("paste a URL → import the article").

## Technical notes

- New dep: `turndown` + `turndown-plugin-gfm` (~25 KB gz, tree-shakeable, only loaded in the admin editor).
- New util files:
  - `src/lib/admin/paste/htmlToMarkdown.ts` — turndown setup + custom rules.
  - `src/lib/admin/paste/frontMatter.ts` — parse + strip + map to field names.
  - `src/lib/admin/paste/normalize.ts` — text normalization.
  - `src/lib/admin/paste/detectFeatures.ts` — chip data (counts headings, code, tables, math, images).
- Wire into `MarkdownEditor` by composing a new `onPaste` that calls the existing image handler first, then runs the new pipeline if no images were consumed. Front-matter callback is passed in as a prop from `AdminBlogEditor` so it can update its own state.
- No changes to `BlogContent` / `MarkdownPreview` — the renderer is already correct.
