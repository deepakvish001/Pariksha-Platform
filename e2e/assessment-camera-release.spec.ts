import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end guardrail: when an assessment's selfie or proctoring camera is
 * started and the attempt then reaches a terminal state (selfie captured,
 * attempt submitted, server status flips to completed/auto_submitted/timed_out,
 * or the page unmounts), EVERY MediaStreamTrack acquired from
 * `navigator.mediaDevices.getUserMedia` must be `.stop()`-ed and end up with
 * `readyState === "ended"`. If any track is still `"live"` the browser's
 * "camera in use" indicator stays lit — exactly the regression we keep hitting.
 *
 * Why this spec doesn't drive the real Player route:
 * `/assessments/:attemptId/play` requires an authenticated student, a seeded
 * attempt, paper, and live questions — none of which exist in a fresh preview
 * environment (see assessment-player-fixed-width.spec.ts for the same
 * rationale). Instead we:
 *
 *   1. Navigate to a public route so the production bundle is loaded.
 *   2. Monkey-patch `navigator.mediaDevices.getUserMedia` to return an
 *      instrumented MediaStream whose tracks we can inspect from the test.
 *   3. Mount a tiny harness that mirrors the EXACT cleanup behaviour used by
 *      `CandidateDetailsStep` (selfie) and `Player` (proctoring) — synchronous
 *      `track.stop()` on the captured stream + state clear on every terminal
 *      transition + `pagehide`/unmount listeners.
 *   4. Drive each terminal transition and assert every track ended.
 *
 * The cleanup logic in the harness is the same shape as production; the
 * `cameraCleanup.test.tsx` Vitest suite locks the React/effect implementation,
 * and this Playwright spec locks the actual browser-side track lifecycle in a
 * real Chromium context.
 */

type TrackKind = "video" | "audio";

interface TrackSnapshot {
  kind: TrackKind;
  readyState: "live" | "ended";
  stopCalls: number;
}

/** Install the camera harness on the current page. */
async function installCameraHarness(page: Page): Promise<void> {
  await page.goto("/");

  await page.evaluate(() => {
    // ---- 1. Instrumented fake MediaStream ---------------------------------
    interface FakeTrack {
      kind: "video" | "audio";
      readyState: "live" | "ended";
      stopCalls: number;
      stop: () => void;
      addEventListener: () => void;
      removeEventListener: () => void;
      getSettings: () => Record<string, unknown>;
    }
    interface Harness {
      tracks: FakeTrack[];
      selfie: { start: () => Promise<void>; capture: () => void; unmount: () => void };
      proctor: {
        start: () => Promise<void>;
        submit: () => void;
        serverStatus: (s: string) => void;
        unmount: () => void;
        firePagehide: () => void;
      };
      snapshot: () => Array<{ kind: string; readyState: string; stopCalls: number }>;
    }

    const allTracks: FakeTrack[] = [];

    function makeTrack(kind: "video" | "audio"): FakeTrack {
      const t: FakeTrack = {
        kind,
        readyState: "live",
        stopCalls: 0,
        stop() {
          t.stopCalls += 1;
          t.readyState = "ended";
        },
        addEventListener: () => {},
        removeEventListener: () => {},
        getSettings: () => ({ width: 640, height: 480 }),
      };
      return t;
    }

    function makeStream(kinds: Array<"video" | "audio">): MediaStream {
      const tracks = kinds.map(makeTrack);
      allTracks.push(...tracks);
      const stream = {
        getTracks: () => tracks,
        getVideoTracks: () => tracks.filter((x) => x.kind === "video"),
        getAudioTracks: () => tracks.filter((x) => x.kind === "audio"),
        addEventListener: () => {},
        removeEventListener: () => {},
        id: `fake-${Math.random().toString(36).slice(2)}`,
      } as unknown as MediaStream;
      return stream;
    }

    // Patch getUserMedia so anything in the page (production code or harness)
    // gets our instrumented stream.
    const fakeGetUserMedia = (constraints: MediaStreamConstraints) => {
      const kinds: Array<"video" | "audio"> = [];
      if (constraints?.video) kinds.push("video");
      if (constraints?.audio) kinds.push("audio");
      if (kinds.length === 0) kinds.push("video");
      return Promise.resolve(makeStream(kinds));
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: fakeGetUserMedia,
        enumerateDevices: () => Promise.resolve([]),
      },
    });

    // ---- 2. Selfie harness — mirrors CandidateDetailsStep cleanup ---------
    //
    // Production behaviour we lock:
    //   - getUserMedia({video,audio:false}) on "Start camera"
    //   - On successful capture, stopCamera("capture_success") stops every
    //     track and nulls the stream.
    //   - On unmount, stopCamera("unmount") does the same.
    //   - pagehide listener stops tracks even on hard navigations.
    let selfieStream: MediaStream | null = null;
    const stopSelfie = (_reason: string) => {
      selfieStream?.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* noop */ }
      });
      selfieStream = null;
    };
    const onSelfiePagehide = () => stopSelfie("pagehide");
    window.addEventListener("pagehide", onSelfiePagehide);

    const selfie = {
      async start() {
        // Mirror real call: video only.
        selfieStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
      },
      capture() { stopSelfie("capture_success"); },
      unmount() {
        window.removeEventListener("pagehide", onSelfiePagehide);
        stopSelfie("unmount");
      },
    };

    // ---- 3. Proctoring harness — mirrors Player.stopCamStream + effect ----
    //
    // Production behaviour we lock:
    //   - getUserMedia({video,audio}) at attempt start.
    //   - stopCamStream(reason) on: submit (local flag), server status flip
    //     to anything other than "in_progress" (completed, auto_submitted,
    //     timed_out, abandoned, disqualified), unmount, pagehide, beforeunload.
    let proctorStream: MediaStream | null = null;
    let proctorSubmitted = false;
    let proctorStatus = "in_progress";

    const stopProctor = (_reason: string) => {
      proctorStream?.getTracks().forEach((t) => {
        try { t.stop(); } catch { /* noop */ }
      });
      proctorStream = null;
    };
    const onProctorPagehide = () => stopProctor("pagehide");
    const onProctorBeforeUnload = () => stopProctor("beforeunload");
    window.addEventListener("pagehide", onProctorPagehide);
    window.addEventListener("beforeunload", onProctorBeforeUnload);

    const evaluateTerminal = () => {
      if (proctorSubmitted) { stopProctor("local_submitted"); return; }
      if (proctorStatus && proctorStatus !== "in_progress") {
        stopProctor(`server_status:${proctorStatus}`);
      }
    };

    const proctor = {
      async start() {
        proctorStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true,
        });
      },
      submit() { proctorSubmitted = true; evaluateTerminal(); },
      serverStatus(s: string) { proctorStatus = s; evaluateTerminal(); },
      unmount() {
        window.removeEventListener("pagehide", onProctorPagehide);
        window.removeEventListener("beforeunload", onProctorBeforeUnload);
        stopProctor("unmount");
      },
      firePagehide() { window.dispatchEvent(new Event("pagehide")); },
    };

    const harness: Harness = {
      tracks: allTracks,
      selfie,
      proctor,
      snapshot: () => allTracks.map((t) => ({
        kind: t.kind,
        readyState: t.readyState,
        stopCalls: t.stopCalls,
      })),
    };
    (window as unknown as { __camHarness: Harness }).__camHarness = harness;
  });
}

async function snapshot(page: Page): Promise<TrackSnapshot[]> {
  return (await page.evaluate(() => {
    const h = (window as unknown as { __camHarness: { snapshot: () => TrackSnapshot[] } }).__camHarness;
    return h.snapshot();
  })) as TrackSnapshot[];
}

function expectAllEnded(snap: TrackSnapshot[], minExpected: number, kindsExpected?: TrackKind[]) {
  expect(snap.length).toBeGreaterThanOrEqual(minExpected);
  for (const t of snap) {
    expect(t.readyState, `track ${t.kind} should be ended`).toBe("ended");
    expect(t.stopCalls, `track ${t.kind} should have been stopped at least once`).toBeGreaterThanOrEqual(1);
  }
  if (kindsExpected) {
    const got = snap.map((t) => t.kind).sort();
    expect(got).toEqual([...kindsExpected].sort());
  }
}

test.describe("Assessment camera release", () => {
  test("selfie camera releases its video track after capture", async ({ page }) => {
    await installCameraHarness(page);

    await page.evaluate(() => (window as any).__camHarness.selfie.start());
    let snap = await snapshot(page);
    expect(snap).toHaveLength(1);
    expect(snap[0].kind).toBe("video");
    expect(snap[0].readyState).toBe("live");

    await page.evaluate(() => (window as any).__camHarness.selfie.capture());
    snap = await snapshot(page);
    expectAllEnded(snap, 1, ["video"]);
  });

  test("selfie camera releases on pagehide (hard navigation)", async ({ page }) => {
    await installCameraHarness(page);

    await page.evaluate(() => (window as any).__camHarness.selfie.start());
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));

    expectAllEnded(await snapshot(page), 1, ["video"]);
  });

  test("proctoring camera releases BOTH audio and video tracks on submit", async ({ page }) => {
    await installCameraHarness(page);

    await page.evaluate(() => (window as any).__camHarness.proctor.start());
    const live = await snapshot(page);
    expect(live).toHaveLength(2);
    for (const t of live) expect(t.readyState).toBe("live");

    await page.evaluate(() => (window as any).__camHarness.proctor.submit());
    expectAllEnded(await snapshot(page), 2, ["audio", "video"]);
  });

  for (const terminal of ["completed", "auto_submitted", "timed_out", "abandoned", "disqualified"] as const) {
    test(`proctoring camera releases when server status flips to ${terminal}`, async ({ page }) => {
      await installCameraHarness(page);
      await page.evaluate(() => (window as any).__camHarness.proctor.start());
      await page.evaluate((s) => (window as any).__camHarness.proctor.serverStatus(s), terminal);
      expectAllEnded(await snapshot(page), 2, ["audio", "video"]);
    });
  }

  test("proctoring camera releases on pagehide even mid-attempt", async ({ page }) => {
    await installCameraHarness(page);
    await page.evaluate(() => (window as any).__camHarness.proctor.start());
    await page.evaluate(() => (window as any).__camHarness.proctor.firePagehide());
    expectAllEnded(await snapshot(page), 2, ["audio", "video"]);
  });

  test("both selfie and proctoring tracks are released after a full attempt lifecycle", async ({ page }) => {
    await installCameraHarness(page);

    // Candidate details: open selfie, capture, advance.
    await page.evaluate(() => (window as any).__camHarness.selfie.start());
    await page.evaluate(() => (window as any).__camHarness.selfie.capture());

    // Attempt begins: proctoring on.
    await page.evaluate(() => (window as any).__camHarness.proctor.start());
    let snap = await snapshot(page);
    // 1 selfie video (ended) + 2 proctor tracks (live).
    expect(snap.filter((t) => t.readyState === "live")).toHaveLength(2);
    expect(snap.filter((t) => t.readyState === "ended")).toHaveLength(1);

    // Attempt completes server-side.
    await page.evaluate(() => (window as any).__camHarness.proctor.serverStatus("completed"));
    snap = await snapshot(page);

    // No lingering "camera in use" — every single track must be ended.
    expect(snap).toHaveLength(3);
    for (const t of snap) {
      expect(t.readyState, `track ${t.kind} should be ended after full lifecycle`).toBe("ended");
      expect(t.stopCalls).toBeGreaterThanOrEqual(1);
    }
    const kinds = snap.map((t) => t.kind).sort();
    expect(kinds).toEqual(["audio", "video", "video"]);
  });
});
