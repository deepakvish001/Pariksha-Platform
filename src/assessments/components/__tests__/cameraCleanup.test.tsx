/**
 * Regression tests for camera stream cleanup.
 *
 * - Selfie camera (CandidateDetailsStep): must release tracks on unmount and on
 *   `pagehide` so the browser's "camera in use" indicator clears the moment the
 *   step is no longer active.
 * - Proctoring camera (Player pattern): must release tracks whenever the
 *   attempt enters a terminal state — local `submitted`, server-reported
 *   status flips (`completed`, `auto_submitted`, `timed_out`, `abandoned`,
 *   `disqualified`), and unmount.
 *
 * The proctoring test uses a small harness component that mirrors the exact
 * effect inside `src/assessments/pages/Player.tsx` so we can drive every
 * transition without standing up the full player tree.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useEffect, useState } from "react";

// ---- Common test helpers --------------------------------------------------

interface FakeTrack {
  kind: "video" | "audio";
  readyState: "live" | "ended";
  stop: ReturnType<typeof vi.fn>;
}

function makeFakeStream(
  kinds: Array<"video" | "audio"> = ["video"],
): { stream: MediaStream; tracks: FakeTrack[] } {
  const tracks: FakeTrack[] = kinds.map((kind) => ({
    kind,
    readyState: "live" as const,
    stop: vi.fn(function (this: FakeTrack) { this.readyState = "ended"; }),
  }));
  // Minimal MediaStream surface used by the production code (getTracks /
  // getVideoTracks / getAudioTracks). Cast through unknown to keep TS happy
  // without pulling in a real WebRTC polyfill.
  const stream = {
    getTracks: () => tracks,
    getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
    getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
  } as unknown as MediaStream;
  return { stream, tracks };
}

function expectAllEnded(tracks: FakeTrack[]) {
  for (const t of tracks) {
    expect(t.stop).toHaveBeenCalledTimes(1);
    expect(t.readyState).toBe("ended");
  }
}

// ---- Mocks for CandidateDetailsStep --------------------------------------

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({ upload: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    },
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u" } } }) },
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { CandidateDetailsStep } from "../CandidateDetailsStep";

describe("Selfie camera cleanup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("stops every selfie-cam track when the step unmounts", async () => {
    const { stream, tracks } = makeFakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) },
    });

    const user = userEvent.setup();
    const { unmount, getByRole } = render(
      <CandidateDetailsStep
        attemptId="11111111-1111-1111-1111-111111111111"
        userId="u"
        done={false}
        onComplete={() => {}}
      />,
    );

    await user.click(getByRole("button", { name: /start camera/i }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(tracks[0].stop).not.toHaveBeenCalled();

    unmount();

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(tracks[0].readyState).toBe("ended");
  });

  it("stops the selfie-cam tracks when the browser fires `pagehide`", async () => {
    const { stream, tracks } = makeFakeStream();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) },
    });

    const user = userEvent.setup();
    const { getByRole, unmount } = render(
      <CandidateDetailsStep
        attemptId="11111111-1111-1111-1111-111111111111"
        userId="u"
        done={false}
        onComplete={() => {}}
      />,
    );

    await user.click(getByRole("button", { name: /start camera/i }));
    expect(tracks[0].stop).not.toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    unmount();
  });
});

// ---- Proctoring-camera harness -------------------------------------------
//
// The harness below mirrors the exact `stopCamStream` callback and terminal-
// status effect in `src/assessments/pages/Player.tsx`. Keeping the logic
// identical (and tested) protects us from regressing the cleanup behaviour
// without having to mount the entire Player tree (auth, react-query, paper
// loader, proctoring hooks, etc.).

interface HarnessProps {
  stream: MediaStream | null;
  submitted: boolean;
  status: string;
}

function ProctorCamHarness({ stream, submitted, status }: HarnessProps) {
  const [camStream, setCamStream] = useState<MediaStream | null>(stream);

  // Mirror Player.stopCamStream — synchronous track.stop() + state clear.
  const stopCamStream = useCallback((_reason: string = "manual") => {
    setCamStream((s) => {
      s?.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
      return null;
    });
  }, []);

  // Unmount cleanup.
  useEffect(() => () => { stopCamStream("unmount"); }, [stopCamStream]);

  // Terminal-state cleanup, mirroring the Player effect verbatim.
  useEffect(() => {
    if (submitted) {
      stopCamStream("local_submitted");
      return;
    }
    if (status && status !== "in_progress") {
      stopCamStream(`server_status:${status}`);
    }
  }, [submitted, status, stopCamStream]);

  return <div data-testid="cam">{camStream ? "live" : "off"}</div>;
}

describe("Proctoring camera cleanup", () => {
  it.each([
    ["completed"],
    ["auto_submitted"],
    ["timed_out"],
    ["abandoned"],
    ["disqualified"],
  ])("releases tracks when server status flips to %s", (terminalStatus) => {
    const { stream, tracks } = makeFakeStream();
    const { rerender, getByTestId } = render(
      <ProctorCamHarness stream={stream} submitted={false} status="in_progress" />,
    );
    expect(getByTestId("cam").textContent).toBe("live");
    expect(tracks[0].stop).not.toHaveBeenCalled();

    rerender(<ProctorCamHarness stream={stream} submitted={false} status={terminalStatus} />);

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(getByTestId("cam").textContent).toBe("off");
  });

  it("releases tracks when the local `submitted` flag goes true (submit / auto-submit)", () => {
    const { stream, tracks } = makeFakeStream();
    const { rerender } = render(
      <ProctorCamHarness stream={stream} submitted={false} status="in_progress" />,
    );
    expect(tracks[0].stop).not.toHaveBeenCalled();

    rerender(<ProctorCamHarness stream={stream} submitted={true} status="in_progress" />);

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
  });

  it("releases tracks on unmount even if the attempt is still in progress", () => {
    const { stream, tracks } = makeFakeStream();
    const { unmount } = render(
      <ProctorCamHarness stream={stream} submitted={false} status="in_progress" />,
    );
    expect(tracks[0].stop).not.toHaveBeenCalled();

    unmount();

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
  });

  it("does not double-stop tracks if status flips after submit already released them", () => {
    const { stream, tracks } = makeFakeStream();
    const { rerender } = render(
      <ProctorCamHarness stream={stream} submitted={false} status="in_progress" />,
    );

    rerender(<ProctorCamHarness stream={stream} submitted={true} status="in_progress" />);
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);

    rerender(<ProctorCamHarness stream={stream} submitted={true} status="completed" />);
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
  });
});
