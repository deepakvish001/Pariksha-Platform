import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

// ---------- Mocks ----------
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-1" }, profile: null }),
}));

vi.mock("@/components/admin/AdminShell", () => ({
  AdminShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/admin/useAdminContests", () => ({
  useAdminContest: () => ({ data: { id: "contest-1", title: "Test Contest", slug: "tc" } }),
}));

vi.mock("@/components/admin/contests/SimilarityTab", () => ({
  SimilarityTab: () => <div>SimilarityTab</div>,
}));

vi.mock("@/components/admin/contests/VivaQueueTab", () => ({
  VivaQueueTab: () => <div>VivaQueueTab</div>,
}));

const toastSuccess = vi.fn((..._a: any[]) => undefined);
const toastError = vi.fn((..._a: any[]) => undefined);
const toastDismiss = vi.fn((..._a: any[]) => undefined);
const toastLoading = vi.fn((..._a: any[]) => "loading-id");
vi.mock("sonner", () => ({
  toast: {
    success: (...a: any[]) => toastSuccess(...a),
    error: (...a: any[]) => toastError(...a),
    dismiss: (...a: any[]) => toastDismiss(...a),
    loading: (...a: any[]) => toastLoading(...a),
  },
}));

// Supabase mock --------------------------------------------------------------
const invokeMock = vi.fn();
const channel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
};

const sessionRow = {
  id: "session-42",
  user_id: "user-9",
  started_at: new Date().toISOString(),
  user_agent: "Mozilla/5.0",
};

// Build a chainable that resolves like a PostgREST query when awaited.
function buildFromQuery(table: string) {
  let resolved: { data: unknown; error: unknown };
  if (table === "contest_sessions") resolved = { data: [sessionRow], error: null };
  else if (table === "profiles")
    resolved = { data: [{ id: "user-9", full_name: "Alice" }], error: null };
  else if (table === "contest_violations") resolved = { data: [], error: null };
  else if (table === "contest_proctor_snapshots") resolved = { data: [], error: null };
  else resolved = { data: [], error: null };

  const chain: any = {};
  const passThrough = ["select", "eq", "in", "order", "limit", "neq", "is", "not", "gte", "lte", "range"];
  for (const m of passThrough) chain[m] = vi.fn(() => chain);
  chain.single = vi.fn(() => Promise.resolve(resolved));
  chain.update = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
  chain.insert = vi.fn(() => Promise.resolve({ error: null }));
  chain.upsert = vi.fn(() => Promise.resolve({ error: null }));
  chain.then = (
    onF: (v: { data: unknown; error: unknown }) => unknown,
    onR?: (e: unknown) => unknown,
  ) => Promise.resolve(resolved).then(onF, onR);
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((t: string) => buildFromQuery(t)),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() =>
          Promise.resolve({ data: { signedUrl: "blob://x" }, error: null }),
        ),
      })),
    },
    functions: { invoke: (...a: any[]) => invokeMock(...a) },
  },
}));

// Lightweight markdown / motion mocks
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <div {...props} /> },
  ),
}));

import AdminContestProctor from "@/pages/admin/contests/AdminContestProctor";

function renderProctor() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/admin/contests/contest-1/proctor"]}>
          <Routes>
            <Route
              path="/admin/contests/:id/proctor"
              element={<AdminContestProctor />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  invokeMock.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  toastLoading.mockReset();
  toastDismiss.mockReset();
});

describe("AdminContestProctor – scan actions", () => {
  it("Run Similarity Scan invokes contest-similarity-scan with thresholds and shows result", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, pairs: 3, dq_users: 1, viva_users: 2 },
      error: null,
    });

    renderProctor();

    // Switch to "Active sessions" tab
    fireEvent.click(await screen.findByRole("tab", { name: /active sessions/i }));

    const row = await screen.findByText("Alice");
    const rowEl = row.closest("tr")!;
    fireEvent.click(within(rowEl).getByRole("button", { name: /similarity/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());

    expect(invokeMock).toHaveBeenCalledWith("contest-similarity-scan", {
      body: {
        contest_id: "contest-1",
        autoflag_threshold: 0.85,
        autodq_threshold: 0.95,
      },
    });

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Similarity scan: 3 pairs · 1 auto-DQ/),
      ),
    );
  });

  it("Run Viva Scan invokes contest-viva-scan for the selected session and reports enqueue", async () => {
    invokeMock.mockResolvedValue({
      data: {
        ok: true,
        session_id: "session-42",
        checks_reviewed: 4,
        failed_checks: 1,
        low_match_checks: 0,
        flagged_violations: 0,
        enqueued_to_viva: true,
      },
      error: null,
    });

    renderProctor();
    fireEvent.click(await screen.findByRole("tab", { name: /active sessions/i }));

    const rowEl = (await screen.findByText("Alice")).closest("tr")!;
    fireEvent.click(within(rowEl).getByRole("button", { name: /viva/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());

    expect(invokeMock).toHaveBeenCalledWith("contest-viva-scan", {
      body: { contest_id: "contest-1", session_id: "session-42" },
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Enqueued to viva queue"),
    );
  });

  it("Viva scan with no findings reports no action needed", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, enqueued_to_viva: false },
      error: null,
    });

    renderProctor();
    fireEvent.click(await screen.findByRole("tab", { name: /active sessions/i }));
    const rowEl = (await screen.findByText("Alice")).closest("tr")!;
    fireEvent.click(within(rowEl).getByRole("button", { name: /viva/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("No viva action needed"),
    );
  });

  it("Surfaces errors from the similarity scan invocation", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: "AI gateway 429" },
    });

    renderProctor();
    fireEvent.click(await screen.findByRole("tab", { name: /active sessions/i }));
    const rowEl = (await screen.findByText("Alice")).closest("tr")!;
    fireEvent.click(within(rowEl).getByRole("button", { name: /similarity/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Similarity scan failed",
        expect.objectContaining({ description: "AI gateway 429" }),
      ),
    );
  });
});
