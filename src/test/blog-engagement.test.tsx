/**
 * Unit tests for blog like/bookmark optimistic UI + count rendering + URL persistence
 * for the admin moderation page.
 *
 * These tests stub the supabase client at the module level so the hooks can run
 * in isolation against an in-memory state.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";

// ───────── Supabase mock ─────────
type Row = Record<string, any>;
const tables: Record<string, Row[]> = {};
const ensure = (name: string) => (tables[name] ??= []);

const userId = "user-1";

function buildQuery(table: string) {
  let rows = [...ensure(table)];
  const filters: Array<(r: Row) => boolean> = [];
  const apply = () => rows.filter((r) => filters.every((f) => f(r)));
  const api: any = {
    select: () => api,
    eq: (col: string, val: any) => { filters.push((r) => r[col] === val); return api; },
    in: (col: string, vals: any[]) => { filters.push((r) => vals.includes(r[col])); return api; },
    order: () => api,
    limit: () => api,
    ilike: (col: string, pat: string) => {
      const needle = pat.replace(/%/g, "").toLowerCase();
      filters.push((r) => String(r[col] ?? "").toLowerCase().includes(needle));
      return api;
    },
    maybeSingle: async () => ({ data: apply()[0] ?? null, error: null }),
    single: async () => ({ data: apply()[0] ?? null, error: null }),
    then: (resolve: any) => resolve({ data: apply(), error: null }),
    insert: async (payload: Row | Row[]) => {
      const arr = Array.isArray(payload) ? payload : [payload];
      ensure(table).push(...arr.map((r) => ({ id: r.id ?? crypto.randomUUID(), ...r })));
      return { data: arr, error: null };
    },
    update: (patch: Row) => ({
      eq: async (col: string, val: any) => {
        ensure(table).forEach((r) => { if (r[col] === val) Object.assign(r, patch); });
        return { error: null };
      },
    }),
    delete: () => ({
      eq: (col: string, val: any) => {
        const next: any = {
          eq: async (col2: string, val2: any) => {
            tables[table] = ensure(table).filter((r) => !(r[col] === val && r[col2] === val2));
            return { error: null };
          },
          then: (resolve: any) => {
            tables[table] = ensure(table).filter((r) => r[col] !== val);
            resolve({ error: null });
          },
        };
        return next;
      },
    }),
  };
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (t: string) => buildQuery(t),
    auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    rpc: async () => ({ data: null, error: null }),
  },
}));

// Toast mocks — capture undo actions
const toastSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: (...args: any[]) => toastSpy(...args),
}));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { useBlogLike, useBlogBookmark } from "@/hooks/useBlog";

// ───────── Helpers ─────────
function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function withClient(client: QueryClient, ui: React.ReactElement) {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

const POST_ID = "post-1";

function seedPost(likes = 5, bookmarks = 2) {
  tables.blog_posts = [{ id: POST_ID, like_count: likes, bookmark_count: bookmarks, slug: "p" }];
  tables.blog_likes = [];
  tables.blog_bookmarks = [];
}

function PostCountsView() {
  const { liked, toggle: toggleLike } = useBlogLike(POST_ID);
  const { bookmarked, toggle: toggleBookmark } = useBlogBookmark(POST_ID);
  return (
    <div>
      <button data-testid="like" onClick={() => toggleLike()}>{liked ? "yes" : "no"}</button>
      <button data-testid="bookmark" onClick={() => toggleBookmark()}>{bookmarked ? "yes" : "no"}</button>
    </div>
  );
}

// ───────── Tests ─────────
describe("blog like/bookmark optimistic UI", () => {
  beforeEach(() => {
    seedPost();
    toastSpy.mockClear();
  });

  it("optimistically flips liked state and bumps like_count in cache", async () => {
    const qc = makeClient();
    qc.setQueryData(["blog-posts", {}], [{ id: POST_ID, like_count: 5, bookmark_count: 2 }]);

    render(withClient(qc, <PostCountsView />));
    await waitFor(() => expect(screen.getByTestId("like")).toHaveTextContent("no"));

    fireEvent.click(screen.getByTestId("like"));

    // Optimistic flip is immediate
    expect(screen.getByTestId("like")).toHaveTextContent("yes");
    const cached = qc.getQueryData<any[]>(["blog-posts", {}]);
    expect(cached?.[0].like_count).toBe(6);

    // Wait for mutation to settle and undo toast to fire
    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    const [label, opts] = toastSpy.mock.calls[0];
    expect(label).toMatch(/Liked/);
    expect(opts.action.label).toBe("Undo");
  });

  it("rolls back optimistic like change when server fails", async () => {
    const qc = makeClient();
    qc.setQueryData(["blog-posts", {}], [{ id: POST_ID, like_count: 5 }]);

    // Force the next insert to error
    const orig = (await import("@/integrations/supabase/client")).supabase;
    const insertSpy = vi.spyOn(orig, "from");
    insertSpy.mockImplementationOnce((t: string) => {
      const real = buildQuery(t);
      real.insert = async () => ({ data: null, error: { message: "boom", code: "X" } });
      return real;
    });

    render(withClient(qc, <PostCountsView />));
    await waitFor(() => expect(screen.getByTestId("like")).toHaveTextContent("no"));
    fireEvent.click(screen.getByTestId("like"));

    await waitFor(() => expect(screen.getByTestId("like")).toHaveTextContent("no"));
    expect(qc.getQueryData<any[]>(["blog-posts", {}])?.[0].like_count).toBe(5);
    insertSpy.mockRestore();
  });

  it("optimistically bumps bookmark_count and shows undo toast", async () => {
    const qc = makeClient();
    qc.setQueryData(["blog-posts", {}], [{ id: POST_ID, bookmark_count: 2 }]);

    render(withClient(qc, <PostCountsView />));
    await waitFor(() => expect(screen.getByTestId("bookmark")).toHaveTextContent("no"));

    fireEvent.click(screen.getByTestId("bookmark"));
    expect(screen.getByTestId("bookmark")).toHaveTextContent("yes");
    expect(qc.getQueryData<any[]>(["blog-posts", {}])?.[0].bookmark_count).toBe(3);

    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    const [label, opts] = toastSpy.mock.calls[0];
    expect(label).toMatch(/Bookmarked/);
    expect(typeof opts.action.onClick).toBe("function");

    // Undo toggles back
    act(() => opts.action.onClick());
    await waitFor(() =>
      expect(qc.getQueryData<any[]>(["blog-posts", {}])?.[0].bookmark_count).toBe(2),
    );
  });
});

// ───────── URL persistence tests ─────────
function ParamProbe() {
  const [params, setParams] = useSearchParams();
  return (
    <div>
      <span data-testid="tab">{params.get("tab") ?? ""}</span>
      <span data-testid="q">{params.get("q") ?? ""}</span>
      <span data-testid="page">{params.get("page") ?? ""}</span>
      <button onClick={() => { const n = new URLSearchParams(params); n.set("tab", "hidden"); setParams(n); }}>set-tab</button>
      <button onClick={() => { const n = new URLSearchParams(params); n.set("q", "spam"); setParams(n); }}>set-q</button>
      <button onClick={() => { const n = new URLSearchParams(params); n.set("page", "3"); setParams(n); }}>set-page</button>
    </div>
  );
}

describe("admin moderation URL persistence", () => {
  it("reads tab + q + page from initial URL and reloads to same view", () => {
    render(
      <MemoryRouter initialEntries={["/admin/blog/comments?tab=hidden&q=spam&page=2"]}>
        <Routes>
          <Route path="/admin/blog/comments" element={<ParamProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("tab").textContent).toBe("hidden");
    expect(screen.getByTestId("q").textContent).toBe("spam");
    expect(screen.getByTestId("page").textContent).toBe("2");
  });

  it("updating params writes them to URL state", () => {
    render(
      <MemoryRouter initialEntries={["/admin/blog/comments"]}>
        <Routes>
          <Route path="/admin/blog/comments" element={<ParamProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("set-tab"));
    fireEvent.click(screen.getByText("set-q"));
    fireEvent.click(screen.getByText("set-page"));
    expect(screen.getByTestId("tab").textContent).toBe("hidden");
    expect(screen.getByTestId("q").textContent).toBe("spam");
    expect(screen.getByTestId("page").textContent).toBe("3");
  });
});
