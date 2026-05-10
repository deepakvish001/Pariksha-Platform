# Rich Blog Markdown Rendering

## Problem
The `/blog/:slug` page currently reuses `MarkdownPreview` (built for admin problem statements). It renders at `prose-sm` inside another `prose prose-invert` wrapper, which causes:
- Tiny body text and broken typography (nested prose conflicts).
- No heading anchors, no table of contents, no scroll-spy.
- Code blocks lack language label / copy button on the public side.
- Blockquotes, callouts (`> [!note]`), task lists, tables, images with captions, and embeds aren't styled like a real CMS.
- No reading-progress indicator.

Goal: deliver a Medium / Ghost / Notion-grade reading experience for blog posts only — admin editor preview stays as-is.

## What to build

### 1. New dedicated blog renderer — `src/components/blog/BlogContent.tsx`
A blog-only markdown component (separate from `MarkdownPreview` so admin/problems are untouched).

Features:
- `react-markdown` + `remark-gfm`, `remark-breaks`, `rehype-slug`, `rehype-autolink-headings`, `rehype-raw` (sanitized).
- Typography: `prose prose-lg prose-invert` with custom Tailwind overrides — comfortable line-height, proper H1–H4 scale, drop-cap option for first paragraph.
- **Headings**: auto-generated `id`, hover anchor link icon, smooth scroll.
- **Code blocks**: reuse `CodeBlock` (already has language label + copy button + syntax highlight).
- **Inline code**: pill style with subtle background.
- **Blockquotes**: left accent border, italic, larger size.
- **GFM callouts** `> [!note]`, `> [!tip]`, `> [!warning]`, `> [!danger]` → colored callout boxes with icon.
- **Images**: lazy, rounded, bordered, optional caption from `title`, support `=WIDTHxHEIGHT` syntax (kept from existing).
- **Links**: external links open in new tab + tiny external icon; internal `/...` links use react-router.
- **Tables**: full-width, zebra rows, sticky header on overflow, horizontal scroll wrapper.
- **Task lists**: styled checkboxes.
- **Horizontal rules**: centered ornament.
- **Embeds**: auto-detect bare YouTube / Vimeo / Tweet / CodePen / Gist URLs on their own line and render responsive iframes.

### 2. Reading UX shell on `/blog/:slug`
Update `src/pages/blog/BlogPost.tsx`:
- Remove the outer `prose prose-invert` wrapper (the new component owns prose).
- Add a top **reading progress bar** (fixed, primary gradient, scroll-driven).
- Add a **sticky Table of Contents** on `lg+` screens (right rail) generated from H2/H3 with scroll-spy highlighting active section; collapsed to a popover on smaller screens.
- Keep existing header (title, author, cover, like/bookmark/share, comments, related).

### 3. Helpers
- `src/lib/blog/extractToc.ts` — parse markdown headings (regex on fenced-code-stripped source) into `{depth, text, id}` using the same slugifier as `rehype-slug` (`github-slugger`).
- `src/lib/blog/embeds.ts` — URL → embed iframe mapping.

### 4. Verification
- Create a draft post containing every element (H1–H4, lists, task list, table, blockquote, all 4 callouts, code block in JS/TS/SQL, inline code, image with caption + width syntax, external + internal links, hr, YouTube embed) and render `/blog/:slug` in the preview to visually confirm each one. Iterate until clean.

## Out of scope
- Admin editor preview pane (stays on `MarkdownPreview`).
- Schema or backend changes — pure presentation.
- New dependencies beyond `remark-breaks`, `rehype-slug`, `rehype-autolink-headings`, `rehype-raw`, `github-slugger` (small, well-maintained).

## Files
- **Create**: `src/components/blog/BlogContent.tsx`, `src/components/blog/ReadingProgress.tsx`, `src/components/blog/TableOfContents.tsx`, `src/lib/blog/extractToc.ts`, `src/lib/blog/embeds.ts`.
- **Edit**: `src/pages/blog/BlogPost.tsx` (swap renderer, add progress bar + TOC layout).
- **Add deps**: `remark-breaks`, `rehype-slug`, `rehype-autolink-headings`, `rehype-raw`, `github-slugger`.
