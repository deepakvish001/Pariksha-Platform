## Goal
Upgrade `src/components/CodeBlock.tsx` so a single block can host **multiple language variants behind tabs** (e.g. JS / TS / Python), and refresh the dark theme to feel more like a premium IDE (deeper obsidian background, subtler chrome, better syntax contrast).

## 1. Multi-language tabs

### Markdown authoring pattern
Authors group consecutive fenced code blocks by adding a `tabs` meta flag and a shared `group` id to the fence info string:

````md
```ts tabs group=install filename=setup.ts
// typescript variant
```

```js tabs group=install filename=setup.js
// javascript variant
```

```bash tabs group=install
npm i byteskill
```
````

A small remark-style preprocessor (new file `src/lib/blog/remarkCodeTabs.ts`) walks the MDAST, finds adjacent `code` nodes that share the same `group=` token, and merges them into a single custom node `codeTabs` with a `variants: [{ lang, filename, highlightLines, code }]` array. Non-tabbed blocks pass through untouched.

The renderer (where `ReactMarkdown` is configured for blog posts and `AnswerPanel`) maps that node to the upgraded `CodeBlock`.

### CodeBlock API change
`CodeBlock` accepts either the existing single-language props **or** a new `variants` prop:

```ts
type Variant = { language: string; filename?: string; highlightLines?: number[]; code: string };
interface CodeBlockProps {
  variants?: Variant[];      // when provided, renders tabs
  defaultTab?: string;       // language id of initial tab
  // ...existing single-block props remain for backwards compat
}
```

Internally it normalises single-block usage into a one-element `variants` array so the rendering path is unified.

### Tab UI
- Tab strip lives in the existing chrome row, replacing the static language label when `variants.length > 1`.
- Built on the existing `@/components/ui/tabs` primitives for consistent focus styling and keyboard nav (Arrow keys + Home/End come for free from Radix).
- Active tab gets the orange underline (`border-b-2 border-primary`), inactive tabs are muted; macOS dots stay on the left, action buttons (wrap / download / copy) stay on the right and operate on the **active variant**.
- Selected tab is remembered per `group` id in `localStorage` (`codeblock:tab:<group>`) so a reader's "I prefer Python" choice persists across the post.
- `sr-only` live region announces "Switched to TypeScript example" on tab change.

### Behaviour details
- Copy / download use the active variant's text and filename (extension auto-derived as today).
- Collapse / "Show all N lines" recomputes from the active variant.
- Highlight-lines and diff styling continue to work per variant.

## 2. Refined dark theme

Goals: less "GitHub light port", more "obsidian IDE".

- **Surface**: switch dark background from `#0a0a0c` to a layered look — outer card `hsl(220 15% 6%)`, inner code area `hsl(220 14% 4%)`, with a 1px inner highlight (`shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)]`) for that subtle "glass lip".
- **Chrome row**: thinner (28px), `bg-white/[0.025]` with a hairline `border-white/[0.06]` divider; macOS dots get a soft inner glow so they read on darker bg.
- **Tabs**: inactive `text-muted-foreground/70`, hover `text-foreground/90 bg-white/[0.03]`, active `text-foreground bg-white/[0.05]` with a 2px primary underline that animates in (`transition-[background,color] duration-150`).
- **Syntax palette**: replace `oneDark` with a custom token map tuned for the new bg — keywords `hsl(265 90% 78%)`, strings `hsl(150 60% 70%)`, numbers `hsl(28 95% 70%)`, comments `hsl(220 10% 45%) italic`, functions `hsl(200 95% 72%)`, punctuation `hsl(220 10% 65%)`. Defined once in a new `src/components/codeblock/obsidianTheme.ts` so it's easy to tweak.
- **Line numbers**: `text-white/25`, right-aligned, with a 1px right border `border-white/[0.04]` separating the gutter from code.
- **Selection**: `selection:bg-primary/25 selection:text-foreground`.
- **Highlight-line band**: stronger primary tint (`bg-primary/[0.08]`) plus a 2px left bar — keeps current behaviour, just tuned to the new bg.
- **Diff lines**: keep red/green but desaturate slightly (`emerald-400/15` & `rose-400/15`) for the darker surface.
- **Collapsed gradient**: re-tune the fade to the new outer card colour so it actually blends.
- Light mode is preserved (only the dark token map and a couple of layered classes change behind the `isDark` check).

## 3. Tests
Add `src/components/__tests__/CodeBlock.test.tsx` covering:
- renders tabs when `variants.length > 1`, hides tab strip otherwise
- switching tab changes copy payload and filename
- active tab persisted to `localStorage` under the supplied `group` id

Add `src/lib/blog/__tests__/remarkCodeTabs.test.ts` covering:
- groups two adjacent fences with same `group=`
- leaves un-grouped fences alone
- preserves `filename` and `{1,3-5}` highlight meta per variant

## Files
- **New**: `src/components/codeblock/obsidianTheme.ts`, `src/lib/blog/remarkCodeTabs.ts`, the two test files above.
- **Edited**: `src/components/CodeBlock.tsx` (variants + theme), the blog `ReactMarkdown` setup that registers remark plugins and the `code`/`codeTabs` renderers (likely `src/pages/blog/BlogPost.tsx` and `src/components/library/AnswerPanel.tsx`).
- **Untouched**: Tailwind config, design tokens — all colour tweaks live inside the component / theme map and use existing semantic tokens (`--primary`, `--foreground`, `--muted-foreground`) where possible.

## Open question
Authoring syntax for grouping — happy with `tabs group=install` in the fence meta, or do you prefer a wrapper directive like `:::tabs install` … `:::`? The `tabs group=` form is zero-config for plain Markdown pastes; the directive form reads nicer but needs `remark-directive`.
