/**
 * Role-based access control contract for the college / company workspace.
 *
 * `useCan(orgId, capability)` is the single source of truth for "can this
 * member do X?". Every capability is asserted against every role here so
 * regressions in the matrix fail loudly.
 *
 * Server-side RLS enforces the same matrix in the database; this test
 * only locks in the client-side gating used to hide buttons and routes.
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

import {
  useCanProctor,
  useCan,
  CAPABILITY_MATRIX,
  type Capability,
} from "@/b2b/hooks/usePermissions";
import type { OrgMemberRole } from "@/b2b/hooks/useMembers";

const wrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const renderProctorWithRole = async (role: string | null) => {
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

const renderCanWithRole = async (role: string | null, cap: Capability) => {
  maybeSingleMock.mockResolvedValueOnce({
    data: role ? { role } : null,
    error: null,
  });
  const { result } = renderHook(() => useCan("org-1", cap), {
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
      const r = await renderProctorWithRole(role);
      expect(r.canProctor).toBe(true);
      expect(r.role).toBe(role);
    },
  );

  it.each(["recruiter", "viewer"] as const)(
    "blocks %s from viewing evidence",
    async (role) => {
      const r = await renderProctorWithRole(role);
      expect(r.canProctor).toBe(false);
      expect(r.role).toBe(role);
    },
  );

  it("blocks users with no membership row", async () => {
    const r = await renderProctorWithRole(null);
    expect(r.canProctor).toBe(false);
    expect(r.role).toBeNull();
  });

  it("does not query before an orgId is known", () => {
    const { result } = renderHook(() => useCanProctor(null), {
      wrapper: wrapper(),
    });
    expect(maybeSingleMock).not.toHaveBeenCalled();
    expect(result.current.canProctor).toBe(false);
  });
});

describe("useCan – capability matrix", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset();
  });

  const ROLES: OrgMemberRole[] = ["owner", "admin", "proctor", "recruiter", "viewer"];
  const CAPS = Object.keys(CAPABILITY_MATRIX) as Capability[];

  it.each(
    CAPS.flatMap((cap) =>
      ROLES.map((role) => ({ cap, role, expected: CAPABILITY_MATRIX[cap].includes(role) })),
    ),
  )("$role → $cap = $expected", async ({ cap, role, expected }) => {
    const r = await renderCanWithRole(role, cap);
    expect(r.allowed).toBe(expected);
  });

  it("denies every capability when there is no membership row", async () => {
    for (const cap of CAPS) {
      const r = await renderCanWithRole(null, cap);
      expect(r.allowed).toBe(false);
    }
  });
});
