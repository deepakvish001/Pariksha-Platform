## Goal

Give every blog post an auto-generated, Notion/Mintlify-grade Table of Contents with three coordinated surfaces:

1. **Inline TOC** — a collapsible card placed before the content (top of the article).
2. **Sticky rail TOC** — refined right-side sticky with an animated active indicator, nested H2–H4, and per-section progress.
3. **Mobile "On this page" button** — opens a bottom sheet with the full TOC (replaces the current right-rail-only desktop UX on small screens).

All three are auto-generated from the post's markdown — no admin work required.

## What changes

### 1. Heading extraction (`src/lib/blog/extractToc.ts`)
- Extend regex to capture `H2 / H3 / H4` (currently only H2/H3).
- Keep ignoring fenced code blocks.
- Keep `github-slugger` IDs so existing in-content anchors still match.

### 2. New component: `InlineToc` (`src/components/blog/InlineToc.tsx`)
- Notion-style collapsible card rendered between the excerpt and cover image.
- Header row: `📑 On this page · N items · ~M min read` with a chevron toggle.
- Default state: **expanded** when `items.length ≤ 8`, **collapsed** otherwise (Notion behavior).
- Keyboard accessible (`button` with `aria-expanded`, `aria-controls`).
- Lists items with depth-based indent (H2 flush, H3 indent-4, H4 indent-8) and subtle bullet/dash markers.
- Click → smooth-scroll with 80px header offset; updates URL hash without jump.

### 3. Refactored `TableOfContents` (sticky rail)
- Animated **active indicator**: a 2px vertical bar that slides between items (Mintlify/Linear pattern) using a measured `top/height` transition.
- Nested rendering: H2 (bold, base), H3 (indent + smaller), H4 (further indent + muted).
- **Section progress**: compute % of viewport scrolled past each section; subtle progress-fill behind the active item.
- Smarter scroll-spy using `IntersectionObserver` with weighted thresholds so the "active" section matches what the reader actually sees (current implementation can flicker when multiple headings sit near the fold).
- Header chip: "Reading · X min left" derived from total reading_time_min and scroll progress.
- Optional **filter input** (auto-shows when items > 12) to type-filter headings.
- Keep existing keyboard support (Enter/Space).

### 4. Mobile "On this page" sheet
- New floating pill button (lg:hidden, anchored above the existing mobile bottom action bar) labeled `On this page · N`.
- Clicking opens a shadcn `Sheet` from the bottom containing the same nested list with active highlighting.
- Auto-closes on item click.

### 5. Layout integration in `BlogPost.tsx`
- Hide TOC surfaces entirely when `toc.length < 3` (avoids noise on short posts).
- Keep the right-rail grid (`lg:grid-cols-[minmax(0,1fr)_220px]`); replace its content with the new sticky TOC.
- Render `<InlineToc items={toc} readingTimeMin={post.reading_time_min} />` after the excerpt block, before the cover image.
- Add the new mobile sheet trigger inside the existing FAB/mobile bar area (or as a sibling rendered from `BlogPost`).

### 6. No DB / no admin changes
- Pure presentation. No migrations, no editor changes, no API changes.

## Technical notes

- Use existing `framer-motion` (already a project dep) for the sliding active bar and smooth expand/collapse on the inline card.
- IDs come from the same `github-slugger` instance the renderer already uses, so anchor links stay stable.
- Active section is tracked once at the page level (in `BlogPost`) and passed to both Inline + Rail + Mobile sheet to avoid three separate observers fighting each other.
- Respect `prefers-reduced-motion`: disable the sliding bar animation, fall back to instant active-state changes.

## Out of scope (can follow later if you want)

- Auto-numbering headings (1, 1.1, 1.1.1) — Notion doesn't do this.
- TOC search across the whole post body (only headings are filterable).
- Persisting collapsed/expanded state across visits.

```text
┌─────────────────────────────────────────────────────────┐
│  Title · meta · author                                  │
│  Excerpt                                                │
│  ┌───────────────────────────────────────────────┐  │   │
│  │ 📑 On this page · 9 items · 8 min     [v]     │  │ S │
│  │   • Introduction                              │  │ T │
│  │     – Why it matters                          │  │ I │
│  │   • Setup                                     │  │ C │
│  │   • ...                                       │  │ K │
│  └───────────────────────────────────────────────┘  │ Y │
│  Cover image                                            │
│  Article body...                                        │
└─────────────────────────────────────────────────────────┘
                                                 ▲
                                       sticky rail TOC
                                       (animated active bar)
```
