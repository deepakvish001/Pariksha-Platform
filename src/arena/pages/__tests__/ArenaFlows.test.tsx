import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ---------- Mocks ----------
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

// Channel + supabase mock
const channelHandlers: Record<string, (p: unknown) => void> = {};
const channel = {
  on: vi.fn((_evt: string, cfg: { table: string }, cb: (p: unknown) => void) => {
    channelHandlers[cfg.table] = cb;
    return channel;
  }),
  subscribe: vi.fn(() => channel),
};

const rpcMock = vi.fn();
const fromUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
const fromDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
const fromSelect = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: vi.fn(() => ({
      update: fromUpdate,
      delete: fromDelete,
      select: fromSelect,
      insert: vi.fn().mockResolvedValue({}),
    })),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Simplify heavy visual children
vi.mock("../components/MatchmakingOrb", () => ({ MatchmakingOrb: () => <div data-testid="orb" /> }));
vi.mock("../components/ArenaBackground", () => ({ ArenaBackground: () => null }));
vi.mock("framer-motion", () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => <div {...props} /> }),
}));

import ArenaQueue from "../ArenaQueue";
import ArenaJoinCode from "../ArenaJoinCode";
import ArenaRoom from "../ArenaRoom";
import BattleResult from "../BattleResult";

beforeEach(() => {
  vi.useFakeTimers();
  navigateMock.mockReset();
  rpcMock.mockReset();
  fromSelect.mockReset();
  Object.keys(channelHandlers).forEach((k) => delete channelHandlers[k]);
});
afterEach(() => {
  vi.useRealTimers();
});

function renderWithRouter(ui: React.ReactElement, initial = "/") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/arena/queue" element={ui} />
        <Route path="/arena/join/:code" element={ui} />
        <Route path="/arena/room/:code" element={ui} />
        <Route path="/arena/result/:id" element={ui} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

// =========================================================
describe("ArenaQueue (Quick Match)", () => {
  it("shows searching UI, increments attempts, and auto-retries every 5s", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null }); // no match yet
    renderWithRouter(<ArenaQueue />, "/arena/queue");

    // Initial attempt fires
    await waitFor(() => expect(rpcMock).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("queue-searching")).toBeInTheDocument();
    expect(screen.getByTestId("queue-attempts").textContent).toMatch(/Attempt 1/);

    // 5s later -> retry
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(rpcMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("queue-attempts").textContent).toMatch(/Attempt 2/);
  });

  it("navigates to battle when matchmaking RPC returns a battle id", async () => {
    rpcMock.mockResolvedValue({ data: "battle-42", error: null });
    renderWithRouter(<ArenaQueue />, "/arena/queue");
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/arena/battle/battle-42"));
  });

  it("redirects via realtime when a battle INSERT includes the user", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    renderWithRouter(<ArenaQueue />, "/arena/queue");
    await waitFor(() => expect(channelHandlers["battles"]).toBeDefined());
    act(() => channelHandlers["battles"]!({ new: { id: "b-9", player_a: "user-1", player_b: "x" } }));
    expect(navigateMock).toHaveBeenCalledWith("/arena/battle/b-9");
  });

  it("shows failure state with retry when RPC throws", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });
    renderWithRouter(<ArenaQueue />, "/arena/queue");
    await waitFor(() => expect(screen.getByTestId("queue-error")).toBeInTheDocument());
    expect(screen.getByText(/Matchmaking failed/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();

    rpcMock.mockResolvedValue({ data: null, error: null });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.getByTestId("queue-searching")).toBeInTheDocument());
  });
});

// =========================================================
describe("ArenaJoinCode (deep link)", () => {
  it("rejects malformed codes with explicit validation", async () => {
    renderWithRouter(<ArenaJoinCode />, "/arena/join/bad");
    expect(await screen.findByTestId("join-invalid")).toBeInTheDocument();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("auto-joins valid code and navigates to battle", async () => {
    rpcMock.mockResolvedValue({ data: "battle-77", error: null });
    renderWithRouter(<ArenaJoinCode />, "/arena/join/ABC123");
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/arena/battle/battle-77", { replace: true }));
  });

  it("shows expiry messaging when RPC reports expired code", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "Invite has expired" } });
    renderWithRouter(<ArenaJoinCode />, "/arena/join/ABC123");
    expect(await screen.findByTestId("join-error-expired")).toBeInTheDocument();
    expect(screen.getByText(/Room code expired/i)).toBeInTheDocument();
    // Expired errors should NOT show retry
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("shows not-found error with retry option", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "Invite not found" } });
    renderWithRouter(<ArenaJoinCode />, "/arena/join/ZZZ999");
    expect(await screen.findByTestId("join-error-notfound")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

// =========================================================
describe("ArenaRoom (waiting room realtime)", () => {
  it("subscribes to invite updates and redirects when opponent joins", async () => {
    fromSelect.mockReturnValue({
      eq: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: "inv-1", problem_slug: null } }),
        }),
      }),
    });
    renderWithRouter(<ArenaRoom />, "/arena/room/ABC123");

    await waitFor(() => expect(channelHandlers["battle_invites"]).toBeDefined());
    act(() => channelHandlers["battle_invites"]!({ new: { status: "accepted", battle_id: "battle-99" } }));
    expect(navigateMock).toHaveBeenCalledWith("/arena/battle/battle-99");
  });
});

// =========================================================
describe("BattleResult (Rematch)", () => {
  it("creates a new code room on Rematch and navigates to it", async () => {
    fromSelect.mockImplementation(() => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({
          data: {
            id: "b-1", player_a: "user-1", player_b: "user-2",
            winner_id: "user-1", end_reason: "solved",
            elo_a_before: 1000, elo_a_after: 1015,
            problem_slug: "two-sum", difficulty: "medium", duration_sec: 900,
          },
        }),
        order: () => Promise.resolve({ data: [] }),
      }),
    }));
    rpcMock.mockResolvedValue({ data: [{ invite_id: "inv-9", code: "REMTCH" }], error: null });

    renderWithRouter(<BattleResult />, "/arena/result/b-1");

    const btn = await screen.findByRole("button", { name: /rematch/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "battle_create_code",
        expect.objectContaining({ _problem_slug: "two-sum", _difficulty: "medium", _duration: 900 }),
      );
      expect(navigateMock).toHaveBeenCalledWith("/arena/room/REMTCH", { state: { inviteId: "inv-9" } });
    });
  });
});
