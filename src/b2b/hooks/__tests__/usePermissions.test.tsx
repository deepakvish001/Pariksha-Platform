/**
 * Role-gating contract for proctoring evidence + "Run AI review".
 *
 * `useCanProctor(orgId)` is the single hook that gates the entire proctoring
 * surface in the college workspace:
 *   - AttemptInspector evidence panels
 *   - Proctoring page (timeline, snapshots, findings)
 *   - "Run AI review" action that invokes the assessment-snapshot-review
 *     edge function
 *
 * Only `owner`, `admin`, and `proctor` may pass. Recruiters and viewers must
 * be blocked client-side as a UX layer; the database RLS + edge function
 * 403 (covered in separate tests) is the source of truth.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Mock supabase client ──────────────────────────────────────────────
const maybeSingleMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: maybeSingleMock }),
        }),
      }),
    }),
  },
}));

// ── Mock auth context ─────────────────────────────────────────────────
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { useCanProctor } from "@/b2b/hooks/usePermissions";

const wrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const renderWithRole = async (role: string | null) => {
  maybeSingleMock.mockResolvedValueOnce({
    data: role ? { role } : null,
    error: null,
  });
  const { result } = renderHook(() => useCanProctor("org-1"), {
    wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return result.current;
};

describe("useCanProctor – role gating", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  it.each(["owner", "admin", "proctor"] as const)(
    "allows %s to view evidence and run AI review",
    async (role) => {
      const r = await renderWithRole(role);
      expect(r.canProctor).toBe(true);
      expect(r.role).toBe(role);
    },
  );

  it.each(["recruiter", "viewer"] as const)(
    "blocks %s from viewing evidence",
    async (role) => {
      const r = await renderWithRole(role);
      expect(r.canProctor).toBe(false);
      expect(r.role).toBe(role);
    },
  );

  it("blocks users with no membership row", async () => {
    const r = await renderWithRole(null);
    expect(r.canProctor).toBe(false);
    expect(r.role).toBeNull();
  });

  it("does not query before an orgId is known", () => {
    const { result } = renderHook(() => useCanProctor(null), {
      wrapper: wrapper(),
    });
    // Query is disabled → never fires the supabase mock.
    expect(maybeSingleMock).not.toHaveBeenCalled();
    expect(result.current.canProctor).toBe(false);
  });
});
