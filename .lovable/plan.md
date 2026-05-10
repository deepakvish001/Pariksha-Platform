# Blog renderer: theming, robustness, a11y & tests

## 1. Light/dark theming

Currently `BlogContent`, `TableOfContents`, and the embed wrapper use:
- `prose-invert` (locked to dark)
- Hardcoded Tailwind palette utilities (`text-sky-100`, `bg-sky-500/5`, `bg-black`, `bg-muted/70`, etc.)
- `oneDark` syntax-highlighter theme regardless of mode

This breaks the showcase in light mode. Switch to theme-aware semantic tokens.

### Renderer (`src/components/blog/BlogContent.tsx`)
- Drop `prose-invert`; use `prose dark:prose-invert` so prose flips with the theme.
- Inline code pill: use semantic tokens `bg-muted text-foreground` + a subtle `ring-1 ring-border`. Keep `text-primary` accent only on the keyword color, not the whole pill.
- Blockquote (non-callout): use `border-primary/60` + `bg-muted/40` (already token-based) — keep but verify both modes.
- Callouts: replace fixed sky/emerald/amber/rose `text-*-100` with token-aware classes. Pattern per kind:
  - container: `border-<accent>/40 bg-<accent>/8 text-foreground`
  - title: `text-<accent>` (saturated)
  - icon: `text-<accent>`
  Use the canonical Tailwind palette anchors (`sky-500`, `emerald-500`, `amber-500`, `rose-500`) for the *accent* only, with opacity for backgrounds — those colors read fine on both light and dark surfaces. Body text uses `text-foreground` instead of forced `*-100`.
- Tables: replace `bg-muted/50` header background with `bg-muted` and ensure border tokens (`border-border`) — already token-based, just verify.
- HR ornament: replace `text-muted-foreground/50` with `text-border` for consistency.
- Embed iframe wrapper: replace `bg-black` with `bg-muted` so light mode isn't a dark hole.

### Code blocks (`src/components/CodeBlock.tsx`)
- Header bar: keep `bg-muted/80` (token), but ensure copy button is visible — currently `opacity-0 group-hover:opacity-100` hides it on touch devices. Change to `opacity-60 hover:opacity-100 focus:opacity-100` always-on, with focus ring.
- Code body: load both `oneDark` and `oneLight` from `react-syntax-highlighter`; pick by reading `useTheme()` from `next-themes` (with safe fallback when SSR/undefined). Pass the chosen style to `SyntaxHighlighter`.
- Wrap copy button in proper `aria-label="Copy code"` and toggle `aria-live` polite region for "Copied" state.

### Table of Contents (`src/components/blog/TableOfContents.tsx`)
- Already uses `text-muted-foreground`, `text-primary`, `border-border` — fine for theming.
- Verify the "ON THIS PAGE" label still reads in light mode (it does — `text-muted-foreground`).

### Reading progress (`src/components/blog/ReadingProgress.tsx`)
- Already uses `bg-primary` — theme-aware.

## 2. Harden callout parsing

In `BlogContent.tsx`, replace the brittle regex-on-flattened-text approach with one that survives edge cases:

- Match `^\s*\[!(note|tip|warning|danger|important|caution)\]\s*\n?` (case-insensitive, allow leading/trailing whitespace and an optional newline before content).
- Children may start with whitespace nodes, line breaks (from `remark-breaks`), or inline elements. Walk into the first `<p>` child and:
  1. Find the first non-empty text leaf.
  2. Apply the regex; if it matches, strip the matched substring **only from that exact leaf** (not via stringify-and-replace), and discard any leading whitespace/empty text or `<br/>` siblings that come before content.
- Keep the inline `<strong>`, `<code>`, links, etc. inside the callout body — they should pass through `react-markdown` unchanged.
- Fallback: if the leaf still contains only whitespace after stripping, drop it entirely so the callout doesn't render an empty first line.

Helper to add: `stripCalloutTag(children, regex) -> { matched, kind, cleanChildren }` — returns `null` when there's no match so `blockquote` falls back to the regular prose blockquote.

## 3. Accessibility for TOC + heading anchors

### `TableOfContents.tsx`
- Wrap the list in `<nav aria-label="Table of contents">` (already present) and add `role="doclist"` is not needed; `<ul>` semantics are sufficient.
- Each `<a>` already focusable. Add:
  - `aria-current={active === id ? "location" : undefined}` so screen readers announce the active section.
  - Visible focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm`.
  - On Enter / Space: same smooth-scroll handler as click. Today the click handler runs for keyboard "Enter" automatically (anchor default), but smooth scroll path needs `onKeyDown` for Space — add it.
  - After scrolling, move focus to the heading element (`heading.setAttribute('tabindex','-1'); heading.focus()`) so subsequent Tab continues from the section, mirroring Ghost/Notion behavior.
- Provide a "Skip to comments" link inside the TOC for long posts.

### `BlogContent.tsx` heading anchors
- `rehype-autolink-headings` `properties` — add `tabIndex: 0` is unnecessary (anchors are focusable), but extend with `title: "Copy link to section"` and a visible `focus-visible` style in `index.css` (`.heading-anchor:focus-visible { opacity: 1; outline: 2px solid hsl(var(--ring)); border-radius: 4px; }`).
- On click, copy `window.location.origin + pathname + #id` to clipboard and toast "Section link copied" — small UX win, common in top CMS. Implemented via a small global `click` delegation inside `BlogContent` (single `onClick` on the prose container, target check for `.heading-anchor`).

## 4. Tests

### Unit (Vitest + Testing Library)
New file: `src/components/blog/__tests__/BlogContent.test.tsx`
- Renders all four callouts (`note`, `tip`, `warning`, `danger`) → asserts label text, role, and that the icon is present.
- Callout regex robustness: accepts `> [!NOTE]`, `>   [!tip]   `, `> [!Warning]\n> body`, and rejects `> [note]` and plain `> hello`.
- Heading anchors: H2 receives an `id` matching slug; an `<a class="heading-anchor">` is appended.
- Inline code renders as `<code>` with the pill class; fenced ``` ```ts ``` ``` block renders the `CodeBlock` (assert `<button>` with aria-label "Copy code" exists).
- External link gets `target="_blank"` + `rel="noopener noreferrer"`; internal `/path` link renders a react-router `<a>` (asserted via `MemoryRouter` wrapper).
- YouTube URL on its own line becomes an `<iframe>` with `src` containing `youtube.com/embed/`.
- Table renders inside the responsive scroll wrapper.

New file: `src/components/blog/__tests__/TableOfContents.test.tsx`
- Renders items with correct nesting (depth 2 vs 3 indentation class).
- IntersectionObserver mocked: simulating intersection updates `aria-current="location"` on the active item.
- Keyboard: pressing Enter on a TOC item scrolls (mock `scrollIntoView`) and moves focus to the heading.

New file: `src/components/blog/__tests__/ReadingProgress.test.tsx`
- Mounts component, sets `document.documentElement.scrollHeight` / `clientHeight` / `scrollTop`, fires `scroll` event, asserts inner bar `style.width` equals expected percentage.

New file: `src/lib/blog/__tests__/extractToc.test.ts`
- Strips fenced code so `# fake` inside a fence is ignored.
- Parses H2/H3 only, slugifies via `github-slugger` (collisions get `-1`, `-2`).
- Strips inline markdown markers (`*`, `_`, `` ` ``).

New file: `src/lib/blog/__tests__/embeds.test.ts`
- `youtube.com/watch?v=ID`, `youtu.be/ID`, `vimeo.com/123`, `codepen.io/u/pen/abc` → expected `src` and `aspect`.
- Random URL → `null`.

### E2E (Playwright)
New file: `e2e/blog-markdown-showcase.spec.ts`
- Navigate to `/blog/markdown-showcase` (the seeded post).
- Asserts visible: callout boxes (`Note`, `Tip`, `Warning`, `Danger` titles), code block copy button, embedded YouTube iframe, table.
- Click a TOC item → URL hash updates, target heading is in view (`expect(heading).toBeInViewport()`), `aria-current="location"` is set on that item.
- Hover a heading → `.heading-anchor` becomes visible (`opacity` not 0).
- Scroll to bottom → reading-progress bar's inline `width` is ≥ 95%.
- Toggle theme button → callouts and code block remain readable (assert background color computed style is not transparent and contrast > threshold via a simple luminance check).

## 5. Files

- **Edit**: `src/components/blog/BlogContent.tsx`, `src/components/blog/TableOfContents.tsx`, `src/components/CodeBlock.tsx`, `src/index.css` (focus-visible style for `.heading-anchor`).
- **Create**:
  - `src/components/blog/__tests__/BlogContent.test.tsx`
  - `src/components/blog/__tests__/TableOfContents.test.tsx`
  - `src/components/blog/__tests__/ReadingProgress.test.tsx`
  - `src/lib/blog/__tests__/extractToc.test.ts`
  - `src/lib/blog/__tests__/embeds.test.ts`
  - `e2e/blog-markdown-showcase.spec.ts`
- **No** schema changes, no new runtime dependencies (CodeBlock theme switch uses already-installed `next-themes` and the `oneLight` style ships with `react-syntax-highlighter`).

## Out of scope
- Changing the admin-side `MarkdownPreview` (problem statements) — stays as-is.
- Restyling the rest of the blog page (header, comments, related posts) beyond what's required for theme parity.
