/**
 * Component tests for the B2B college Dashboard.
 *
 * We mock the data hooks, OrgShell, and the supabase client so the page can be
 * rendered in isolation. The goal is to verify:
 *  - KPI tiles render with the values returned by the stats hook
 *  - The Recent Assessments list renders rows and clicking one navigates
 *  - Header action buttons (Home, New assessment) navigate to the right routes
 *  - The new widgets (Upcoming, Integrity alerts, Top performers, QB health)
 *    mount with their section headings
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ───────── Navigation spy ─────────
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Navigate: ({ to }: { to: string }) => <div data-testid="redirect">{to}</div>,
  };
});

// ───────── OrgShell passthrough ─────────
vi.mock("../../layouts/OrgShell", () => ({
  OrgShell: ({
    title,
    actions,
    children,
  }: {
    title?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <header>
        <h1>{title}</h1>
        <div>{actions}</div>
      </header>
      <main>{children}</main>
    </div>
  ),
}));

// ───────── Org context ─────────
const fakeOrg = {
  id: "org-1",
  name: "Test College",
  slug: "test-college",
  type: "college" as const,
};
vi.mock("../../context/OrgContext", () => ({
  useCurrentOrg: () => ({ org: fakeOrg, isLoading: false }),
  useOrgBasePath: () => `/colleges/${fakeOrg.slug}`,
}));

// ───────── Stats / assessments hooks ─────────
vi.mock("../../hooks/useDashboardStats", () => ({
  useDashboardStats: () => ({
    data: {
      assessments: 12,
      invites: 340,
      submissions: 210,
      avgIntegrity: 87,
      deltas: {
        assessments: 25,
        invites: -10,
        submissions: 5,
        avgIntegrity: 2,
      },
    },
  }),
}));

vi.mock("../../hooks/useAssessments", () => ({
  useAssessments: () => ({
    data: [
      {
        id: "a1",
        title: "Frontend Screening",
        status: "published",
        duration_min: 45,
        created_at: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: "a2",
        title: "DSA Round",
        status: "draft",
        duration_min: 60,
        created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
    ],
  }),
}));

// ───────── Supabase client mock ─────────
// Builder that resolves any await chain to the supplied rows.
function makeBuilder(rows: any[]) {
  const api: any = {
    select: () => api,
    eq: () => api,
    in: () => api,
    gte: () => api,
    lt: () => api,
    not: () => api,
    or: () => api,
    order: () => api,
    limit: () => api,
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: rows, error: null }),
  };
  return api;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "assessments") {
        return makeBuilder([{ id: "a1", title: "Frontend Screening" }]);
      }
      if (table === "assessment_attempts") return makeBuilder([]);
      if (table === "questions") return makeBuilder([]);
      return makeBuilder([]);
    },
    rpc: vi.fn(),
  },
}));

// ───────── System under test ─────────
import B2BDashboard from "../Dashboard";

function renderDashboard() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/colleges/test-college"]}>
        <B2BDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("B2BDashboard (college view)", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders KPI tile values from useDashboardStats", async () => {
    renderDashboard();
    expect(await screen.findByText("12")).toBeInTheDocument(); // assessments
    expect(screen.getByText("340")).toBeInTheDocument(); // invites
    expect(screen.getByText("210")).toBeInTheDocument(); // submissions
    expect(screen.getByText("87%")).toBeInTheDocument(); // avg integrity
    expect(screen.getAllByText(/vs prev 30d/i).length).toBeGreaterThanOrEqual(4);
  });

  it("renders the new dashboard widgets", async () => {
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: /upcoming assessments/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /integrity alerts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /top performers/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /question bank health/i }),
    ).toBeInTheDocument();
  });

  it("renders recent assessments and navigates on click", async () => {
    renderDashboard();
    const item = await screen.findByText("Frontend Screening");
    expect(item).toBeInTheDocument();
    expect(screen.getByText("DSA Round")).toBeInTheDocument();

    fireEvent.click(item);
    expect(navigateMock).toHaveBeenCalledWith(
      "/colleges/test-college/assessments/a1",
    );
  });

  it("header action buttons navigate to Home and New assessment", async () => {
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /home/i }));
    expect(navigateMock).toHaveBeenCalledWith("/");

    fireEvent.click(screen.getByRole("button", { name: /new assessment/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/colleges/test-college/assessments/new",
    );
  });
});
