import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---------- Mocks ----------
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
import { toast as toastMock } from "sonner";

// Build a programmable supabase mock. Each .from(table).select()/insert()/delete()/update() chain
// is fluent and resolves with whatever we configure for that table.
type TableState = {
  rows: unknown[];
  insertError: { message: string } | null;
  deleteError: { message: string } | null;
};
const tables: Record<string, TableState> = {};
function setTable(name: string, partial: Partial<TableState>) {
  tables[name] = { rows: [], insertError: null, deleteError: null, ...(tables[name] ?? {}), ...partial };
}
const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
function fluent(table: string) {
  const state = tables[table] ?? { rows: [], insertError: null, deleteError: null };
  const builder: Record<string, unknown> = {};
  const thenable = (resolved: unknown) => Promise.resolve(resolved);
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.range = vi.fn(() => thenable({ data: state.rows, error: null }));
  builder.maybeSingle = vi.fn(() => thenable({ data: state.rows[0] ?? null, error: null }));
  builder.insert = vi.fn(() => thenable({ data: null, error: state.insertError }));
  builder.delete = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  // Allow awaiting the builder directly (e.g., await supabase.from(t).select().eq(..))
  (builder as { then?: unknown }).then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: state.rows, error: null });
  return builder;
}
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((t: string) => fluent(t)),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  },
}));

// Avoid ResizeObserver from Radix Slider
class ROStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof ROStub }).ResizeObserver = ROStub;

import ArenaFriends from "../ArenaFriends";

beforeEach(() => {
  Object.keys(tables).forEach((k) => delete tables[k]);
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  toastMock.info.mockReset();
  // Seed: profile of a blocked player exists, and they are blocked by me.
  setTable("profiles", {
    rows: [
      { user_id: "blocked-1", full_name: "Bobby Blocked", avatar_url: null, created_at: new Date().toISOString() },
    ],
  });
  setTable("user_blocks", { rows: [{ blocked_id: "blocked-1" }] });
  setTable("friendships", { rows: [] });
  setTable("player_ratings", { rows: [] });
  setTable("coding_problems", { rows: [{ slug: "two-sum", title: "Two Sum" }] });
  setTable("player_reports", { rows: [] });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ArenaFriends />
    </MemoryRouter>,
  );
}

describe("ArenaFriends — blocked-user gating", () => {
  it("hides blocked users from the discovery list and shows them in the Blocked section", async () => {
    renderPage();
    // Blocked section heading appears once blocks load
    await waitFor(() => expect(screen.getByText(/Blocked players/i)).toBeInTheDocument());
    // The blocked profile is NOT rendered in the player roster (filtered out)
    // — but the unblock card is rendered with the same name.
    expect(screen.getAllByText("Bobby Blocked").length).toBeGreaterThan(0);
    // No Add / Challenge buttons keyed to that user since they are filtered from list.
    expect(screen.queryByTestId("add-wrap-blocked-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("challenge-wrap-blocked-1")).not.toBeInTheDocument();
  });

  it("clicking Unblock opens the confirmation dialog and confirming shows a success toast", async () => {
    renderPage();
    const unblockBtn = await screen.findByRole("button", { name: /Unblock/i });
    fireEvent.click(unblockBtn);
    // AlertDialog visible
    await waitFor(() =>
      expect(screen.getByText(/Unblock Bobby Blocked\?/i)).toBeInTheDocument(),
    );
    // Confirm
    const confirm = screen.getAllByRole("button", { name: /^Unblock$/i })
      .find((b) => b.getAttribute("data-testid") !== unblockBtn.getAttribute("data-testid")) as HTMLElement;
    await act(async () => {
      fireEvent.click(confirm);
    });
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith(
        expect.stringMatching(/unblocked/i),
        expect.objectContaining({ description: expect.stringMatching(/friend requests and challenges/i) }),
      );
    });
  });
});
