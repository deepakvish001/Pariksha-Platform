/**
 * End-to-end test for the /join/student token flow.
 *
 * Verifies that when a signed-in student lands on /join/student?token=…,
 * the page calls the accept-student-enrollment edge function, shows the
 * success state ("You're in!"), and navigates to /my/college.
 *
 * Auth, supabase, and router navigation are mocked so the test runs in
 * isolation under jsdom — but the flow exercised is the exact one the
 * production app uses.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ───────── Mocks ─────────
const invokeMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => invokeMock(...args) },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "stu-1", email: "alice@example.edu" }, loading: false }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

// Import AFTER mocks so the component picks them up.
import JoinStudent from "@/pages/JoinStudent";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/join/student" element={<JoinStudent />} />
        <Route path="/my/college" element={<div>My College Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JoinStudent token acceptance E2E", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    navigateMock.mockReset();
  });

  it("accepts the token, shows success, and redirects to /my/college", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, org_id: "org-1", slug: "demo-college", org_name: "Demo College" },
      error: null,
    });

    renderAt("/join/student?token=valid-token-123");

    // Edge function invoked with the token from the URL
    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("accept-student-enrollment", {
        body: { token: "valid-token-123" },
      });
    });

    // Success UI rendered
    expect(await screen.findByText("You're in!")).toBeInTheDocument();

    // Redirect fires after the 1200ms delay in the component
    await waitFor(
      () => expect(navigateMock).toHaveBeenCalledWith("/my/college"),
      { timeout: 3000 },
    );
  });

  it("shows an error state when the edge function rejects the token", async () => {
    invokeMock.mockResolvedValue({ data: { error: "Invite expired" }, error: null });

    renderAt("/join/student?token=expired-token");

    expect(await screen.findByText("Couldn't link enrollment")).toBeInTheDocument();
    expect(screen.getByText("Invite expired")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith("/my/college");
  });
});
