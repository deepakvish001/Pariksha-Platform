# Admin sidebar polish — make it scan better and feel standard

The sidebar already has groups, sub-nav, badges, and tooltips. With 40+ items across 9 groups it's still slow to scan. The plan focuses on **findability**, **persistence**, and **a header that grounds you in the page** — the parts where the current shell falls short of "standard admin console" expectations.

## What changes (UX)

### 1. Inline filter + ⌘K command palette

- Add a small **Search** input pinned to the top of the sidebar (under the header). Typing filters every group/item by label in real time; non-matching groups collapse and hide their label, matching items are highlighted. ESC clears.
- Add a global **⌘K / Ctrl+K command palette** (`cmdk` already shipped via shadcn) that lists every nav item, grouped, with icon + keyboard hints. Opens from anywhere in `/admin/*`. Hitting Enter navigates. Includes recent + pinned at the top.
- Header gets a `⌘K` chip next to the breadcrumb so the shortcut is discoverable.

### 2. Pinned + Recent groups (persisted)

- Each item in the sidebar gets a **star icon** on hover that toggles "Pinned". Pinned items render in a **Pinned** group at the very top of the sidebar (also surfaced in ⌘K).
- A **Recent** section (last 5 visited admin routes) sits between Pinned and the regular groups. Both lists persist to `localStorage` per user.
- "Mark all read" lives in the header dropdown; "Reset pinned" / "Reset recent" added there too.

### 3. Persist group open/close + remember last view

- Currently `openMap` is initialised every mount (always open). Persist it to `localStorage("admin:sidebar:groups")` so an admin who collapses **System** keeps it collapsed across reloads.
- Persist `Sidebar` collapse state (icon-rail vs full) the same way.

### 4. Group hygiene

- Reduce visual noise without losing items by **merging small adjacent groups**:
  - **Communications** → fold into **Engagement** (Notifications, Support move there).
  - **Security** → fold into **People** (Security Center, Sessions move there as a sub-nav under "Roles").
  - Keep **System** and **Platform** distinct — they're operationally different.
- Add a thin **separator line** (1px, `border-border/40`) between groups, plus a small "section number" hint when the sidebar is in icon-rail mode so groups still read.
- Show the **group badge count even when the group is open** (currently only when closed), placed before the chevron.

### 5. Header / breadcrumb upgrade

- Replace the static "Admin" label in the top bar with a **dynamic breadcrumb** derived from the nav config, e.g. `Admin › Engagement › Contests › Edit`. Each crumb is a link.
- Add a right-side **shortcut chip row**: `⌘K` (palette), `g h` (go to dashboard), `[` / `]` (prev/next group). Wire the keyboard shortcuts in a small hook.
- Keep the `Live` indicator and add a tooltip that explains it.

### 6. Better tooltips for every item

- Today only "tracked" routes get tooltips. When the sidebar is collapsed, **every** item should show a tooltip with the label + (if any) badge count + last-visited timestamp.
- When expanded, badge tooltips show "X new since last visit · Y total".

### 7. Visual polish (small but standard)

- Slimmer rail in collapsed mode (`w-12` instead of default), icons centred.
- Active item gets a 2px left accent bar in addition to the tinted background — a familiar pattern from Linear/Notion/Stripe admins.
- Sub-nav indent uses a true tree connector (┌ └) instead of a flat border line.

## What changes (code)

- **`src/components/admin/AdminShell.tsx`** — add `SidebarSearch` slot, breadcrumb header, persisted group state, pinned/recent rendering, keyboard shortcut listener.
- **`src/components/admin/AdminCommandPalette.tsx`** *(new)* — cmdk-based palette wired to `GROUPS` plus pinned/recent.
- **`src/hooks/admin/useAdminSidebarPrefs.ts`** *(new)* — localStorage-backed reader/writer for `pinned`, `recent`, `openGroups`, `collapsed`.
- **`src/hooks/admin/useAdminBreadcrumb.ts`** *(new)* — given pathname, walks `GROUPS` + dynamic children to build crumb segments.
- **No backend changes.** Pinned/recent stay client-side per device — keeps it instant and avoids polluting RLS.

## Out of scope

- No reorganisation of admin **routes** themselves. Only sidebar grouping/visuals.
- No new permissions or RBAC tiers.
- Not touching mobile FAB or guest sidebar — admin shell only.
