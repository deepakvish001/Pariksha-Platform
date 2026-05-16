/**
 * Component tests for the B2B college Dashboard.
 *
 * We mock the data hooks, OrgShell, and the supabase client so the page can be
 * rendered in isolation. The goal is to verify:
 *  - KPI tiles render with the values returned by the stats hook
 *  - The submissions chart container is mounted (ResponsiveContainer is stubbed)
 *  - The Recent Assessments list renders rows and clicking one navigates
 *  - The header action buttons (Home, New assessment) navigate to the right
 *    routes
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
function makeBuilder(rows: any[]) {
  const api: any = {
    select: () => api,
    eq: () => api,
    in: () => api,
    gte: () => api,
    not: () => api,
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
        return makeBuilder([{ id: "a1" }, { id: "a2" }]);
      }
      if (table === "assessment_invites") {
        return makeBuilder([
          { source: "email" },
          { source: "email" },
          { source: "link" },
          { source: "bulk_upload" },
        ]);
      }
      if (table === "assessment_attempts") {
        return makeBuilder([]);
      }
      return makeBuilder([]);
    },
    functions: {
      invoke: vi.fn(async () => ({
        data: {
          insights: [
            {
              title: "Submissions trending up",
              body: "You had more submissions than the prior period.",
              severity: "positive",
              action: "Invite more candidates",
            },
          ],
        },
        error: null,
      })),
    },
    rpc: vi.fn(),
  },
}));

// ───────── Recharts stub ─────────
// ResponsiveContainer needs measurable dimensions in jsdom — stub the tree so we
// can simply assert the chart is mounted.
vi.mock("recharts", () => {
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-passthrough">{children}</div>
  );
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-container">{children}</div>
    ),
    AreaChart: Passthrough,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

// ───────── System under test ─────────
import B2BDashboard from "../Dashboard";

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/colleges/test-college"]}>
      <B2BDashboard />
    </MemoryRouter>,
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

  it("mounts the submission activity chart", async () => {
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: /submission activity/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("chart-container")).toBeInTheDocument();
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

  it("View all jumps to the assessments index", async () => {
    renderDashboard();
    fireEvent.click(await screen.findByRole("button", { name: /view all/i }));
    expect(navigateMock).toHaveBeenCalledWith(
      "/colleges/test-college/assessments",
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

  it("renders the Top Invite Channels card with aggregated counts", async () => {
    renderDashboard();
    expect(
      await screen.findByRole("heading", { name: /top invite channels/i }),
    ).toBeInTheDocument();
    // 4 invites total were returned by the supabase mock.
    await waitFor(() =>
      expect(screen.getByText(/4 invites/i)).toBeInTheDocument(),
    );
  });
});
