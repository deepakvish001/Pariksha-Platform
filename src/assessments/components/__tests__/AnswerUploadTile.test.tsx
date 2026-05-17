import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---- Mock the Supabase client BEFORE the component import ----------------

const { invokeMock, channelMock, channelSub, removeChannelMock, pairTokenRow } = vi.hoisted(() => {
  const channelSub = { unsubscribe: vi.fn() };
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue(channelSub),
  };
  return {
    invokeMock: vi.fn(),
    channelMock,
    channelSub,
    removeChannelMock: vi.fn(),
    pairTokenRow: { pair_token: "a".repeat(48) },
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: pairTokenRow, error: null }),
    })),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    channel: vi.fn(() => channelMock),
    removeChannel: removeChannelMock,
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// qrcode.react renders an SVG — keep it simple
vi.mock("qrcode.react", () => ({ QRCodeSVG: () => null }));

import { AnswerUploadTile } from "../AnswerUploadTile";

describe("AnswerUploadTile — phone upload → laptop sync → onPagesChange", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    channelMock.on.mockClear();
    channelMock.subscribe.mockClear();
    removeChannelMock.mockClear();
  });

  it("initial sync surfaces phone-uploaded pages and notifies parent so the question becomes answered", async () => {
    const pages = [
      { id: "p1", ordinal: 1, url: "https://signed/p1.jpg", storage_path: "answers/a/q/1.jpg", uploaded_at: "2026-05-17T00:00:00Z" },
      { id: "p2", ordinal: 2, url: "https://signed/p2.jpg", storage_path: "answers/a/q/2.jpg", uploaded_at: "2026-05-17T00:00:01Z" },
    ];
    invokeMock.mockResolvedValue({ data: { pages }, error: null });

    const onPagesChange = vi.fn();
    render(
      <AnswerUploadTile
        attemptId="11111111-1111-1111-1111-111111111111"
        questionId="22222222-2222-2222-2222-222222222222"
        onPagesChange={onPagesChange}
      />
    );

    // Sync is called automatically on mount
    await waitFor(() =>
      expect(invokeMock).toHaveBeenCalledWith(
        "assessment-sidecam?action=answer-sign",
        expect.objectContaining({
          body: {
            attemptId: "11111111-1111-1111-1111-111111111111",
            questionId: "22222222-2222-2222-2222-222222222222",
          },
        })
      )
    );

    // Parent (Player) receives the page list — used to compute isAnswered
    await waitFor(() => expect(onPagesChange).toHaveBeenCalledWith(pages));

    // Counter pill reflects the real count (text nodes are split, so match loosely)
    await waitFor(() => {
      expect(screen.getByText(/page(s)? uploaded/i)).toBeInTheDocument();
      expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    });

    // Realtime subscription was wired so future phone uploads auto-pull
    expect(channelMock.subscribe).toHaveBeenCalledTimes(1);
  });

  it("manual Sync button re-fetches and updates the page list", async () => {
    invokeMock.mockResolvedValueOnce({ data: { pages: [] }, error: null });
    const user = userEvent.setup();
    const onPagesChange = vi.fn();

    render(
      <AnswerUploadTile
        attemptId="11111111-1111-1111-1111-111111111111"
        questionId="22222222-2222-2222-2222-222222222222"
        onPagesChange={onPagesChange}
      />
    );

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(onPagesChange).toHaveBeenLastCalledWith([]);

    // Phone uploads a page in the background; user clicks Sync
    const newPages = [
      { id: "p1", ordinal: 1, url: "u", storage_path: "s", uploaded_at: "" },
    ];
    invokeMock.mockResolvedValueOnce({ data: { pages: newPages }, error: null });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /sync/i }));
    });

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onPagesChange).toHaveBeenLastCalledWith(newPages));
    expect(await screen.findByText("1")).toBeInTheDocument();
  });
});
