# Parikshaa

Parikshaa runs secure, AI-proctored contests and structured learning for colleges — with proctoring, analytics, and integrity reports.

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (database, auth, edge functions)

## Prerequisites

- Node.js 20 or later
- npm (comes with Node.js)
- A Supabase project (for the database, auth, and edge functions)

## Getting Started

1. **Clone the repository**

   ```sh
   git clone <YOUR_GIT_URL>
   cd pariksha-platform
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your Supabase project credentials:

   ```sh
   cp .env.example .env
   ```

   At minimum you need:

   | Variable | Description |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key |
   | `VITE_SUPABASE_PROJECT_ID` | Your Supabase project reference ID |

   See the comments in `.env.example` for the remaining optional variables (site URL for canonical/OG links, feature flags, and end-to-end test credentials).

4. **Start the dev server**

   ```sh
   npm run dev
   ```

   The app will be available at the URL printed in your terminal (typically `http://localhost:5173`).

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |
| `npm test` | Run the unit test suite once (Vitest) |
| `npm run test:watch` | Run the unit test suite in watch mode |
| `npm run e2e` | Run end-to-end tests (Playwright) |
| `npm run e2e:headed` | Run end-to-end tests with a visible browser |
| `npm run e2e:ui` | Run end-to-end tests with the Playwright UI |

## Backend (Supabase)

The `supabase/` directory contains:

- `migrations/` — SQL migrations for the database schema
- `functions/` — Edge functions used for things like AI proctoring, quiz summaries, and notification emails
- `config.toml` — Supabase project configuration

If you're working against your own Supabase project, apply the migrations and deploy the edge functions using the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Testing

- Unit tests live alongside the source under `src/` and run with Vitest (`npm test`).
- End-to-end tests live in `e2e/` and run with Playwright (`npm run e2e`). Some end-to-end checks require the optional Supabase test credentials described in `.env.example`.

## Building for Production

```sh
npm run build
```

This produces a static `dist/` folder that can be deployed to any static hosting provider (e.g. Vercel, Netlify, Cloudflare Pages, or your own server).

## Project Structure

```
src/
  arena/         # Contest/arena feature
  components/    # Shared UI components
  pages/         # Route-level pages
  data/          # Static data and config
supabase/
  functions/     # Edge functions
  migrations/    # Database migrations
e2e/             # Playwright end-to-end tests
scripts/         # Build and maintenance scripts
```
