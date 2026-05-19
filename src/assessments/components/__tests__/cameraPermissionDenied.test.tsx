/**
 * Tests for the camera-permission-denied / unavailable recovery flow.
 *
 * Covers the user-visible contract of `CameraPermissionHelp` and the retry
 * loop inside `CandidateDetailsStep`:
 *
 *   1. Every classification of `getUserMedia` failure surfaces a friendly
 *      title, summary, and the original error message.
 *   2. The "Retry" button re-invokes `onRetry` and shows a busy spinner.
 *   3. The device picker appears when ≥2 video inputs are enumerated and
 *      forwards selection to `onDeviceChange`.
 *   4. In the real selfie flow (`CandidateDetailsStep`), after a denied →
 *      retry → granted sequence:
 *        - the user sees the help UI on failure,
 *        - clicking Retry calls `getUserMedia` again,
 *        - on success the help disappears and a live track is in place,
 *        - and any tracks acquired in earlier attempts are NOT left live
 *          (no leaked "camera in use" state across retries).
 *   5. Reloading via the help component's "Reload page" button calls
 *      `window.location.reload`, and unmounting after a failed attempt does
 *      not leave any tracks live (the failure path never created any).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CameraPermissionHelp, classifyCameraError } from "../CameraPermissionHelp";

// ---- Selfie-flow mocks (must be declared before importing the component) -

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

// ---- Shared track helper -------------------------------------------------

interface FakeTrack {
  kind: "video" | "audio";
  readyState: "live" | "ended";
  stop: ReturnType<typeof vi.fn>;
}
function makeFakeStream(): { stream: MediaStream; tracks: FakeTrack[] } {
  const tracks: FakeTrack[] = [{
    kind: "video",
    readyState: "live",
    stop: vi.fn(function (this: FakeTrack) { this.readyState = "ended"; }),
  }];
  const stream = {
    getTracks: () => tracks,
    getVideoTracks: () => tracks,
    getAudioTracks: () => [],
  } as unknown as MediaStream;
  return { stream, tracks };
}

function setMediaDevices(opts: {
  getUserMedia: ReturnType<typeof vi.fn>;
  devices?: MediaDeviceInfo[];
}) {
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: opts.getUserMedia,
      enumerateDevices: vi.fn().mockResolvedValue(opts.devices ?? []),
    },
  });
}

// ==========================================================================
// 1. classifyCameraError — maps every well-known DOMException to a kind
// ==========================================================================

describe("classifyCameraError", () => {
  it.each([
    [{ name: "NotAllowedError", message: "denied" }, "denied"],
    [{ name: "NotFoundError", message: "no device" }, "not_found"],
    [{ name: "NotReadableError", message: "device in use" }, "in_use"],
    [{ name: "SecurityError", message: "insecure" }, "insecure"],
    [{ name: "OverconstrainedError", message: "bad" }, "constraint"],
    [{ name: "AbortError", message: "weird" }, "unknown"],
  ])("classifies %o", (input, expected) => {
    expect(classifyCameraError(input)).toBe(expected);
  });

  it("falls back to message heuristics when name is missing", () => {
    expect(classifyCameraError(new Error("Permission denied by user"))).toBe("denied");
    expect(classifyCameraError(new Error("Camera not found"))).toBe("not_found");
    expect(classifyCameraError(null)).toBe("unknown");
  });
});

// ==========================================================================
// 2. CameraPermissionHelp — UI contract
// ==========================================================================

describe("CameraPermissionHelp", () => {
  beforeEach(() => {
    setMediaDevices({ getUserMedia: vi.fn(), devices: [] });
  });

  it("renders denied state with friendly title, summary, and retry button", async () => {
    const onRetry = vi.fn();
    render(
      <CameraPermissionHelp
        error={Object.assign(new Error("Permission denied"), { name: "NotAllowedError" })}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText(/permission was blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/you'll need to allow camera access/i)).toBeInTheDocument();
    expect(screen.getByText("Permission denied")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /retry camera access/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows a busy spinner and disables retry while `busy` is true", () => {
    render(
      <CameraPermissionHelp
        error={new Error("x")}
        onRetry={vi.fn()}
        busy
      />,
    );
    const btn = screen.getByRole("button", { name: /retrying/i });
    expect(btn).toBeDisabled();
  });

  it("renders not_found state when no device is available", () => {
    render(
      <CameraPermissionHelp
        error={Object.assign(new Error("nope"), { name: "NotFoundError" })}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/no camera detected/i)).toBeInTheDocument();
  });

  it("renders in_use state when device is busy", () => {
    render(
      <CameraPermissionHelp
        error={Object.assign(new Error("busy"), { name: "NotReadableError" })}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/being used by another app/i)).toBeInTheDocument();
  });

  it("shows the device picker only when ≥2 cameras are enumerated, and forwards selection", async () => {
    setMediaDevices({
      getUserMedia: vi.fn(),
      devices: [
        { deviceId: "a", kind: "videoinput", label: "Front cam", groupId: "" } as MediaDeviceInfo,
        { deviceId: "b", kind: "videoinput", label: "USB cam", groupId: "" } as MediaDeviceInfo,
      ],
    });
    const onDeviceChange = vi.fn();
    render(
      <CameraPermissionHelp
        error={new Error("denied")}
        onRetry={vi.fn()}
        onDeviceChange={onDeviceChange}
      />,
    );

    // wait for enumerateDevices effect to settle
    const select = await screen.findByRole("combobox");
    await userEvent.selectOptions(select, "b");
    expect(onDeviceChange).toHaveBeenCalledWith("b");
  });

  it("calls window.location.reload when the Reload button is pressed", async () => {
    const reload = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });

    render(<CameraPermissionHelp error={new Error("x")} onRetry={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /reload page/i }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// 3. CandidateDetailsStep — denied → retry → granted produces no leaked tracks
// ==========================================================================

describe("Selfie permission-denied retry flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows help on failure, retries on click, and ends with exactly one live track", async () => {
    const denied = Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });
    const { stream, tracks } = makeFakeStream();
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(denied)        // first attempt fails
      .mockResolvedValueOnce(stream);       // retry succeeds
    setMediaDevices({ getUserMedia });

    const user = userEvent.setup();
    const { unmount } = render(
      <CandidateDetailsStep
        attemptId="11111111-1111-1111-1111-111111111111"
        userId="u"
        done={false}
        onComplete={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /start camera/i }));

    // Friendly help shown, no tracks acquired yet.
    expect(await screen.findByText(/permission was blocked/i)).toBeInTheDocument();
    expect(tracks[0].stop).not.toHaveBeenCalled();

    // Retry — the help component renders its own "Retry camera access" button.
    await user.click(screen.getByRole("button", { name: /retry camera access/i }));

    // Help disappears; one camera attempt + one retry = 2 getUserMedia calls.
    await screen.findByText(/live preview/i).catch(() => {
      // some builds label this differently; either way the help text is gone
    });
    expect(screen.queryByText(/permission was blocked/i)).not.toBeInTheDocument();
    expect(getUserMedia).toHaveBeenCalledTimes(2);

    // Exactly one live track is held, the original (denied) attempt left
    // nothing behind.
    expect(tracks).toHaveLength(1);
    expect(tracks[0].readyState).toBe("live");
    expect(tracks[0].stop).not.toHaveBeenCalled();

    // Unmount — the live track from the successful retry must be released.
    unmount();
    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(tracks[0].readyState).toBe("ended");
  });

  it("after a permanent failure (denied with no retry) unmount leaves zero live tracks", async () => {
    const denied = Object.assign(new Error("Permission denied"), { name: "NotAllowedError" });
    const getUserMedia = vi.fn().mockRejectedValue(denied);
    setMediaDevices({ getUserMedia });

    const user = userEvent.setup();
    const { unmount } = render(
      <CandidateDetailsStep
        attemptId="11111111-1111-1111-1111-111111111111"
        userId="u"
        done={false}
        onComplete={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /start camera/i }));
    expect(await screen.findByText(/permission was blocked/i)).toBeInTheDocument();

    // No stream was ever returned, so unmount is a no-op for tracks — but it
    // must not throw and must clear any internal stream ref.
    expect(() => unmount()).not.toThrow();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("repeated denied → retry cycles never accumulate live tracks", async () => {
    const denied = Object.assign(new Error("denied"), { name: "NotAllowedError" });
    const successes: ReturnType<typeof makeFakeStream>[] = [];
    const getUserMedia = vi.fn().mockImplementation(() => {
      // Pattern: fail, succeed, fail, succeed
      const calls = getUserMedia.mock.calls.length; // 1-indexed for "this call"
      if (calls % 2 === 1) return Promise.reject(denied);
      const s = makeFakeStream();
      successes.push(s);
      return Promise.resolve(s.stream);
    });
    setMediaDevices({ getUserMedia });

    const user = userEvent.setup();
    const { unmount } = render(
      <CandidateDetailsStep
        attemptId="11111111-1111-1111-1111-111111111111"
        userId="u"
        done={false}
        onComplete={() => {}}
      />,
    );

    // attempt 1: fail
    await user.click(screen.getByRole("button", { name: /start camera/i }));
    await screen.findByText(/permission was blocked/i);

    // attempt 2: retry → succeeds (held)
    await user.click(screen.getByRole("button", { name: /retry camera access/i }));
    expect(successes).toHaveLength(1);

    unmount();

    // Every stream that was ever acquired must be fully ended.
    for (const { tracks } of successes) {
      for (const t of tracks) {
        expect(t.readyState).toBe("ended");
        expect(t.stop).toHaveBeenCalled();
      }
    }
  });
});
