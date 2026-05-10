import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// --- Mocks ---------------------------------------------------------------

type AuthCb = (event: string, session: unknown) => void;
const authListeners: AuthCb[] = [];
let mockSession: { user: { id: string } } | null = { user: { id: "u1" } };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: AuthCb) => {
        authListeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const i = authListeners.indexOf(cb);
                if (i >= 0) authListeners.splice(i, 1);
              },
            },
          },
        };
      },
      getSession: () =>
        Promise.resolve({ data: { session: mockSession }, error: null }),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockSession?.user ?? null }),
}));

import { CrossTabAuthSync } from "./CrossTabAuthSync";

// Probe to read the current location inside the router.
function LocationProbe({ onChange }: { onChange: (p: string) => void }) {
  const loc = useLocation();
  onChange(loc.pathname);
  return null;
}

function renderAt(initialPath: string, onPath: (p: string) => void) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <CrossTabAuthSync />
      <LocationProbe onChange={onPath} />
      <Routes>
        <Route path="*" element={<div>page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// --- Tests ---------------------------------------------------------------

describe("CrossTabAuthSync — cross-tab sign-out", () => {
  beforeEach(() => {
    authListeners.length = 0;
    mockSession = { user: { id: "u1" } };
    localStorage.clear();
    sessionStorage.clear();
  });

  const gatedPaths = ["/library/problems", "/arena/daily", "/settings"];

  it.each(gatedPaths)(
    "redirects %s to /learn when SIGNED_OUT fires from another tab",
    async (gated) => {
      let path = gated;
      renderAt(gated, (p) => (path = p));

      // Seed artifacts that should be wiped.
      localStorage.setItem("lastVisitedRoute", gated);
      localStorage.setItem(
        "pendingAuthAction",
        JSON.stringify({ path: gated, action: "x", ts: Date.now() })
      );
      sessionStorage.setItem("skippedOnboarding", "1");

      // Simulate the sibling tab broadcasting SIGNED_OUT.
      await act(async () => {
        mockSession = null;
        authListeners.forEach((cb) => cb("SIGNED_OUT", null));
      });

      await waitFor(() => expect(path).toBe("/learn"));
      expect(localStorage.getItem("lastVisitedRoute")).toBeNull();
      expect(localStorage.getItem("pendingAuthAction")).toBeNull();
      expect(sessionStorage.getItem("skippedOnboarding")).toBeNull();
    }
  );

  it("redirects via raw `storage` event when sibling tab clears the auth token", async () => {
    let path = "/library/problems";
    renderAt("/library/problems", (p) => (path = p));

    await act(async () => {
      mockSession = null;
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "sb-projectref-auth-token",
          oldValue: "old",
          newValue: null,
        })
      );
    });

    await waitFor(() => expect(path).toBe("/learn"));
  });

  it("does not redirect public landing routes on sign-out", async () => {
    let path = "/";
    renderAt("/", (p) => (path = p));

    await act(async () => {
      mockSession = null;
      authListeners.forEach((cb) => cb("SIGNED_OUT", null));
    });

    // Still on landing — no forced navigation away from public pages.
    await waitFor(() => expect(path).toBe("/"));
  });
});
