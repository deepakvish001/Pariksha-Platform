import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { ParticipantRow } from "../Manage";
import type { LiveParticipant } from "../../../hooks/useAssessmentLive";

const baseParticipant: LiveParticipant = {
  invite_id: "inv-1",
  email: "john@example.com",
  name: "John Doe",
  external_id: "STU-001",
  status: "in_progress",
  attempt_id: "attempt-uuid-1",
  attempt_slug: "john-doe-attempt",
  score: null,
  integrity_score: 92,
  started_at: new Date().toISOString(),
  submitted_at: null,
} as unknown as LiveParticipant;

const DETAIL_HREF =
  "/b2b/assessments/my-assessment/candidates/john-doe--john-doe-attempt";

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderRow(overrides: Partial<React.ComponentProps<typeof ParticipantRow>> = {}) {
  const onOpen = vi.fn();
  const onForceSubmit = vi.fn();
  const utils = render(
    <MemoryRouter initialEntries={["/start"]}>
      <Routes>
        <Route
          path="/start"
          element={
            <table>
              <tbody>
                <ParticipantRow
                  p={baseParticipant}
                  assessmentId="a1"
                  onOpen={onOpen}
                  onForceSubmit={onForceSubmit}
                  detailHref={DETAIL_HREF}
                  canProctor={false}
                  {...overrides}
                />
              </tbody>
            </table>
          }
        />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  return { ...utils, onOpen, onForceSubmit };
}

describe("ParticipantRow navigation", () => {
  let windowOpen: typeof window.open;
  beforeEach(() => {
    windowOpen = window.open;
    window.open = vi.fn() as unknown as typeof window.open;
  });
  afterEach(() => {
    window.open = windowOpen;
    vi.restoreAllMocks();
  });

  it("navigates to the candidate detail page on row click", () => {
    renderRow();
    fireEvent.click(screen.getByRole("row"));
    expect(screen.getByTestId("location").textContent).toBe(DETAIL_HREF);
  });

  it("navigates on candidate name click without triggering the drawer", () => {
    const { onOpen } = renderRow();
    fireEvent.click(screen.getByRole("link", { name: /john doe/i }));
    expect(screen.getByTestId("location").textContent).toBe(DETAIL_HREF);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("opens the candidate detail in a new tab on cmd/ctrl-click of the row", () => {
    renderRow();
    fireEvent.click(screen.getByRole("row"), { metaKey: true });
    expect(window.open).toHaveBeenCalledWith(
      DETAIL_HREF,
      "_blank",
      "noopener,noreferrer",
    );
    // No SPA navigation occurred
    expect(screen.queryByTestId("location")).toBeNull();
  });

  it("opens the candidate detail in a new tab on ctrl-click of the name link", () => {
    renderRow();
    // ctrlKey on an <a> lets the browser handle new-tab; our handler skips preventDefault.
    // jsdom's default <a> click doesn't actually navigate, but we assert no SPA route change.
    fireEvent.click(screen.getByRole("link", { name: /john doe/i }), { ctrlKey: true });
    expect(screen.queryByTestId("location")).toBeNull();
  });

  it("falls back to the drawer when no detail href is available", () => {
    const { onOpen } = renderRow({ detailHref: null });
    fireEvent.click(screen.getByRole("row"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("location")).toBeNull();
  });

  it("the eye button always opens the drawer and does not navigate", () => {
    const { onOpen } = renderRow();
    fireEvent.click(screen.getByTitle(/quick view/i));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("location")).toBeNull();
  });
});
