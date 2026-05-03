#!/usr/bin/env node
/**
 * Admin hygiene check (CI guard)
 *
 * Fails the build if the admin area regresses on any of:
 *   1. An admin page file exists under src/pages/admin/** but is never imported
 *      anywhere in the source tree (orphaned page → likely unused).
 *   2. A route declared in src/App.tsx points to a component that no longer
 *      resolves to a real file (broken route).
 *   3. An admin sidebar entry in src/components/admin/AdminShell.tsx points to
 *      a path that has no matching <Route> in src/App.tsx (dead nav link).
 *
 * Run as: `node scripts/check-admin-hygiene.mjs`
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const ADMIN_PAGES_DIR = join(SRC, "pages", "admin");

const failures = [];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(entry)) files.push(p);
  }
  return files;
}

const allFiles = walk(SRC);
const allSource = new Map(allFiles.map((f) => [f, readFileSync(f, "utf8")]));

// ─────────── 1. Orphan admin page detector
const adminPageFiles = walk(ADMIN_PAGES_DIR);
const orphans = [];
for (const file of adminPageFiles) {
  const rel = relative(SRC, file).replace(/\\/g, "/").replace(/\.(tsx|ts)$/, "");
  // Aliased import: @/pages/admin/Foo or @/pages/admin/contests/Bar
  const aliasNeedle = `@/${rel}`;
  // Relative import from App.tsx etc: ./pages/admin/Foo or ./pages/admin/contests/Bar
  const relativeNeedle = `./${rel}`;
  let referenced = false;
  for (const [other, src] of allSource) {
    if (other === file) continue;
    if (
      src.includes(`"${aliasNeedle}"`) ||
      src.includes(`'${aliasNeedle}'`) ||
      src.includes(`"${relativeNeedle}"`) ||
      src.includes(`'${relativeNeedle}'`)
    ) {
      referenced = true;
      break;
    }
  }
  if (!referenced) {
    orphans.push(relative(ROOT, file));
  }
}
if (orphans.length) {
  failures.push(
    `Orphan admin page files (no imports found):\n  - ${orphans.join("\n  - ")}`
  );
}

// ─────────── 2. Broken-route + 3. dead-sidebar-link checks
const appSrc = readFileSync(join(SRC, "App.tsx"), "utf8");

// Collect imports: import Foo from "./pages/admin/Foo";
const importRe = /import\s+(\w+)\s+from\s+["']\.\/pages\/admin\/([\w/]+)["']/g;
const adminImports = new Map();
for (const m of appSrc.matchAll(importRe)) {
  adminImports.set(m[1], m[2]);
}

// Collect routes inside the /admin segment: <Route path="foo" element={<Foo />} />
const routeRe = /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/g;
const adminRoutePaths = new Set(["/admin"]);
for (const m of appSrc.matchAll(routeRe)) {
  const componentName = m[2];
  // Only consider routes whose component was imported from pages/admin/*
  if (!adminImports.has(componentName)) continue;
  const pageRel = adminImports.get(componentName);
  const pageFile = join(SRC, "pages", "admin", `${pageRel}.tsx`);
  if (!existsSync(pageFile)) {
    failures.push(`Broken admin route: <${componentName}> → ${pageRel}.tsx (file missing)`);
  }
  const path = m[1].startsWith("/") ? m[1] : `/admin/${m[1]}`;
  adminRoutePaths.add(path.replace(/\/$/, ""));
}

// Sidebar links from AdminShell.tsx
const shellSrc = readFileSync(join(SRC, "components", "admin", "AdminShell.tsx"), "utf8");
const navRe = /to:\s*["'](\/admin[^"']*)["']/g;
const declaredNavPaths = new Set();
for (const m of shellSrc.matchAll(navRe)) {
  declaredNavPaths.add(m[1].replace(/\/$/, ""));
}

const dynamicAllowed = new Set([
  "/admin/contests/new",
  // dynamic /admin/contests/:id/(edit|registrations|leaderboard) handled below
]);

const deadLinks = [];
for (const p of declaredNavPaths) {
  if (adminRoutePaths.has(p)) continue;
  if (dynamicAllowed.has(p)) continue;
  // Allow the contests parent (route is /admin/contests via App.tsx pattern)
  if (p === "/admin/contests" && adminRoutePaths.has("/admin/contests")) continue;
  deadLinks.push(p);
}
if (deadLinks.length) {
  failures.push(
    `Sidebar nav links with no matching route:\n  - ${deadLinks.join("\n  - ")}`
  );
}

// ─────────── Report
if (failures.length) {
  console.error("\n❌ Admin hygiene check failed:\n");
  for (const f of failures) console.error(f + "\n");
  console.error("Fix the issues above (delete orphaned files, remove dead nav entries, or restore the route).");
  process.exit(1);
}
console.log("✅ Admin hygiene check passed.");
console.log(`   ${adminPageFiles.length} admin pages, ${adminRoutePaths.size - 1} admin routes, ${declaredNavPaths.size} sidebar links.`);
