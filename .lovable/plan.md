
# Blog Management System — Build from Scratch on Lovable Cloud

A production-grade blog CMS integrated into the existing admin panel and public site. No external CMS — everything lives in your Supabase + React stack.

## 1. Database (Supabase)

New tables with strict RLS:

- **`blog_posts`** — `id, slug (unique), title, excerpt, content_md, content_html, cover_image_url, author_id, status ('draft'|'scheduled'|'published'|'archived'), published_at, scheduled_for, reading_time_min, view_count, like_count, seo_title, seo_description, og_image_url, canonical_url, is_featured, created_at, updated_at`
- **`blog_categories`** — `id, slug, name, description, color, icon`
- **`blog_tags`** — `id, slug, name`
- **`blog_post_categories`** — join table
- **`blog_post_tags`** — join table
- **`blog_comments`** — `id, post_id, user_id, parent_id (threaded), body, status ('visible'|'hidden'|'reported'), created_at`
- **`blog_likes`** — `post_id, user_id` (composite PK)
- **`blog_bookmarks`** — `post_id, user_id`
- **`blog_views`** — `post_id, user_id (nullable), session_id, viewed_at` (for analytics + dedup)
- **`blog_revisions`** — `id, post_id, content_md, title, saved_by, created_at` (version history)

**RLS rules:**
- Public can read only `status='published'` posts, categories, tags, visible comments
- Authors/admins can CRUD their own drafts
- Admins/moderators can manage all posts and moderate comments
- Authenticated users can like, bookmark, comment

**Database functions:**
- `publish_scheduled_posts()` — pg_cron job runs every 5 min to flip `scheduled` → `published`
- `increment_post_view(post_id, session_id)` — dedup view counting
- `compute_reading_time(content)` — auto-calculate on save

## 2. Admin Side (`/admin/blog`)

Full content management UI integrated into the existing Admin Control Center:

- **Posts list** — table with status badges, search, filters (status, category, author, date), bulk actions (publish, archive, delete), sortable columns
- **Post editor** (`/admin/blog/new`, `/admin/blog/:id/edit`):
  - Reuse existing `MarkdownEditor` (drag-drop images, gallery, ⌘B/I/K shortcuts already built)
  - Sidebar: status, scheduling (date/time picker), categories multi-select, tags creatable input, cover image upload, featured toggle
  - **SEO panel**: title, meta description (with char count), OG image, canonical URL, live Google snippet preview
  - **AI assist** (Gemini via existing edge function): one-click "Generate SEO meta", "Suggest tags", "Generate excerpt", "Generate cover image"
  - Auto-save drafts every 30s + revision history with restore
  - Live preview pane reuses `MarkdownPreview`
- **Categories & Tags manager** — CRUD with color picker
- **Comments moderation** — queue of reported/new comments, hide/delete/ban
- **Analytics tab** — top posts by views/likes, traffic over time, comment activity (charts via existing recharts)

Admin pages gated by existing `AdminRoute` + `useUserRole` (admin/moderator).

## 3. Public Blog Side

- **`/blog`** — index page: hero featured post, grid of cards (cover, title, excerpt, author avatar, reading time, category chip, date), category filter chips, tag cloud, search bar, pagination
- **`/blog/:slug`** — article page:
  - Hero cover image, title, author card, publish date, reading time, categories
  - Rendered markdown with syntax highlighting (reuse existing renderer)
  - Sticky table of contents (auto from headings)
  - Like / Bookmark / Share buttons (with copy-link, Twitter, LinkedIn, WhatsApp)
  - Comments section (threaded, login required to post)
  - Related posts (same category)
  - Reading progress bar at top
- **`/blog/category/:slug`** and **`/blog/tag/:slug`** — filtered listings
- **`/blog/author/:username`** — author profile + their posts

## 4. Resources Articles Integration

On the existing Resources Articles section (`src/data/learningResourcesData.ts` / Resources page):
- Add a new "From the Blog" rail at the top showing latest 6 published posts pulled live from `blog_posts`
- Existing static articles continue to work; blog posts appear alongside with a "Blog" badge
- Clicking opens `/blog/:slug` (in-app), not external link

## 5. SEO & Distribution

- **Per-post `<head>`** via `react-helmet-async`: title, meta desc, canonical, OG tags, Twitter cards, JSON-LD `Article` schema
- **`/sitemap.xml`** — extend existing sitemap with all published post URLs (edge function generates dynamically)
- **`/blog/rss.xml`** — RSS feed edge function
- **`robots.txt`** — already present, no change

## 6. Engagement & Notifications

- View counting (deduped per session, throttled)
- Reading time auto-calculated
- Likes update in real-time via Supabase Realtime
- Email notification when admin publishes a new post (uses existing notification system + weekly digest)
- In-app notification when someone replies to a user's comment

## 7. Technical Architecture

```text
src/
├── pages/
│   ├── blog/
│   │   ├── BlogIndex.tsx
│   │   ├── BlogPost.tsx
│   │   ├── BlogCategory.tsx
│   │   ├── BlogTag.tsx
│   │   └── BlogAuthor.tsx
│   └── admin/blog/
│       ├── BlogPostsList.tsx
│       ├── BlogPostEditor.tsx
│       ├── BlogCategories.tsx
│       ├── BlogTags.tsx
│       └── BlogComments.tsx
├── components/blog/
│   ├── PostCard.tsx
│   ├── PostHero.tsx
│   ├── TableOfContents.tsx
│   ├── ShareButtons.tsx
│   ├── CommentThread.tsx
│   ├── LikeButton.tsx
│   ├── BookmarkButton.tsx
│   └── ReadingProgressBar.tsx
├── hooks/
│   ├── useBlogPosts.ts
│   ├── useBlogPost.ts
│   ├── useBlogComments.ts
│   ├── useBlogLikes.ts
│   └── admin/useAdminBlog.ts
└── supabase/functions/
    ├── blog-ai-assist/        # Gemini for SEO/tags/excerpt
    ├── blog-sitemap/          # dynamic sitemap.xml
    ├── blog-rss/              # RSS feed
    └── blog-publish-scheduled/  # invoked by pg_cron
```

**Tech choices:**
- Markdown rendering: existing `MarkdownPreview` + `react-syntax-highlighter`
- Forms: `react-hook-form` + `zod` (already in project)
- Data: TanStack Query (already in project)
- Realtime: Supabase Realtime channels for likes/comments
- Storage: new `blog-media` Supabase bucket (public read, admin write)
- AI: existing Lovable AI Gateway (Gemini) — no new keys needed

## 8. Navigation & Access

- Add **Blog** link to public landing nav and authenticated header
- Add **Blog** group in Admin sidebar (Posts, Categories, Tags, Comments, Analytics)
- Sitemap link from footer

## 9. Build Order (suggested batches for scope control)

1. **Schema + RLS + storage bucket** (DB migration)
2. **Admin posts CRUD + Markdown editor reuse + categories/tags** (core authoring)
3. **Public `/blog` index + `/blog/:slug` reading experience + SEO**
4. **Likes, bookmarks, comments, share, view counting**
5. **Resources Articles integration + scheduling/cron + RSS/sitemap**
6. **AI assist + analytics + email digest**

Each batch is independently shippable. We can stop at any batch and the prior ones remain fully functional.

---

**Kuch points confirm karna hai before implementation:**
- Aap chahte ho ki **comments** authenticated users only post karein (recommended), ya guests bhi (with moderation)?
- **Multi-author** support chahiye (har user blog post likh sake) ya **admin-only authoring**?
- Build order — main pura ek saath build karu ya batch-by-batch (recommended for review)?
