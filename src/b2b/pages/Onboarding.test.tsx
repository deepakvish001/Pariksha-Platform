/**
 * End-to-end behavioral tests for the B2B onboarding step-2 panel:
 * send invites, resend (regenerate), copy a per-email invite link, and skip.
 *
 * The supabase client + auth + B2B chrome are mocked so we can exercise the
 * UI and the analytics + edge-function call surface in isolation.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ── Mocks ────────────────────────────────────────────────────────────────

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "owner@test.com" } }),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => toastMock(...args) }));

vi.mock("../components/B2BBackdrop", () => ({ B2BBackdrop: () => null }));
vi.mock("../components/B2BSiteHeader", () => ({ B2BSiteHeader: () => null }));
vi.mock("../components/B2BSiteFooter", () => ({ B2BSiteFooter: () => null }));

const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ insert: insertMock }),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

import B2BOnboarding from "./Onboarding";

const ORG = {
  id: "org-1",
  slug: "acme-xyz1",
  name: "Acme",
  type: "company" as const,
};

function seedStep2(overrides: Partial<{ links: any[] }> = {}) {
  localStorage.setItem(
    "b2b:onboarding:step2",
    JSON.stringify({
      org: ORG,
      emails: ["alice@acme.com", "", ""],
      links: overrides.links ?? [],
      savedAt: Date.now(),
    }),
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/b2b/onboarding"]}>
      <B2BOnboarding />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  navigateMock.mockReset();
  toastMock.mockReset();
  insertMock.mockClear();
  invokeMock.mockReset();
  // jsdom doesn't implement clipboard
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
afterEach(() => localStorage.clear());

// ── Tests ────────────────────────────────────────────────────────────────

describe("B2B Onboarding · step 2", () => {
  it("sends invites, displays a per-email link with expiry, and tracks the event", async () => {
    seedStep2();
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    invokeMock.mockResolvedValueOnce({
      data: {
        links: [{ email: "alice@acme.com", url: "https://app/invite?token=abc", expires_at: expires }],
        expires_at: expires,
      },
      error: null,
    });

    renderPage();
    // Hydrated to step 2
    await screen.findByRole("button", { name: /send invites/i });
    fireEvent.click(screen.getByRole("button", { name: /send invites/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock.mock.calls[0][0]).toBe("b2b-onboarding-invites");
    expect(invokeMock.mock.calls[0][1]).toMatchObject({
      body: { org_id: ORG.id, emails: ["alice@acme.com"], ttl_hours: 72 },
    });

    // Link rendered with expiry chip
    await screen.findByText(/Latest invite links/i);
    expect(screen.getByText(/2d|71h|72h/)).toBeInTheDocument();

    // Analytics row recorded
    await waitFor(() => {
      const events = insertMock.mock.calls.map((c) => c[0][0].event);
      expect(events).toContain("invite_send");
    });
  });

  it("resend regenerates links via a fresh edge call and tracks invite_resend", async () => {
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    seedStep2({
      links: [{ email: "alice@acme.com", url: "https://app/invite?token=old", expires_at: expires }],
    });
    invokeMock.mockResolvedValueOnce({
      data: {
        links: [{ email: "alice@acme.com", url: "https://app/invite?token=NEW", expires_at: expires }],
        expires_at: expires,
      },
      error: null,
    });

    renderPage();
    await screen.findByText(/Latest invite links/i);
    fireEvent.click(screen.getByRole("button", { name: /resend & regenerate/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    await screen.findByText(/token=NEW/);
    await waitFor(() => {
      const events = insertMock.mock.calls.map((c) => c[0][0].event);
      expect(events).toContain("invite_resend");
    });
  });

  it("copying an invite link writes to clipboard, shows status, and records copy_invite_link", async () => {
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    seedStep2({
      links: [{ email: "alice@acme.com", url: "https://app/invite?token=abc", expires_at: expires }],
    });
    renderPage();

    const item = (await screen.findByText("alice@acme.com")).closest("li")!;
    const copyBtn = within(item).getByRole("button", { name: /copy invite link for alice@acme\.com/i });
    fireEvent.click(copyBtn);

    await waitFor(() =>
      expect((navigator.clipboard.writeText as any)).toHaveBeenCalledWith(
        "https://app/invite?token=abc",
      ),
    );
    await within(item).findByText(/Copied to clipboard/i);
    await waitFor(() => {
      const events = insertMock.mock.calls.map((c) => c[0][0].event);
      expect(events).toContain("copy_invite_link");
    });
  });

  it("skip navigates to the org dashboard, clears localStorage, and records skip_invites", async () => {
    seedStep2();
    renderPage();
    await screen.findByRole("button", { name: /skip for now/i });
    fireEvent.click(screen.getByRole("button", { name: /skip for now/i }));

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith(`/companies/${ORG.slug}`),
    );
    expect(localStorage.getItem("b2b:onboarding:step2")).toBeNull();
    await waitFor(() => {
      const events = insertMock.mock.calls.map((c) => c[0][0].event);
      expect(events).toContain("skip_invites");
    });
  });

  it("shows a rate-limit toast when the edge function returns 429-style payload", async () => {
    seedStep2();
    invokeMock.mockResolvedValueOnce({
      data: { error: "rate_limited", message: "Slow down" },
      error: null,
    });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /send invites/i }));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/slow down/i) }),
      ),
    );
  });

  it("auto-purges expired invite links on hydration", async () => {
    seedStep2({
      links: [
        {
          email: "stale@acme.com",
          url: "https://app/invite?token=old",
          expires_at: new Date(Date.now() - 60_000).toISOString(),
        },
      ],
    });
    renderPage();
    await screen.findByRole("button", { name: /send invites/i });
    expect(screen.queryByText(/Latest invite links/i)).not.toBeInTheDocument();
  });
});
