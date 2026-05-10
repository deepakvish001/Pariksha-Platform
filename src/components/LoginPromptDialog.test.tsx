import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/lib/leadTracking", () => ({
  trackLeadEvent: vi.fn(() => Promise.resolve()),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return { ...actual, useNavigate: () => navigateMock };
});

import { LoginPromptDialog } from "./LoginPromptDialog";

function renderDialog(props: Partial<React.ComponentProps<typeof LoginPromptDialog>> = {}) {
  return render(
    <MemoryRouter>
      <button>outside-before</button>
      <LoginPromptDialog
        open
        onOpenChange={() => {}}
        attemptedAction="save this resource"
        {...props}
      />
      <button>outside-after</button>
    </MemoryRouter>,
  );
}

describe("LoginPromptDialog — accessibility", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    localStorage.clear();
  });

  it("exposes a labelled, described modal dialog", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "login-prompt-title");
    expect(dialog).toHaveAttribute("aria-describedby", "login-prompt-description");
    expect(document.getElementById("login-prompt-title")).toHaveTextContent(
      /sign in to continue/i,
    );
    expect(document.getElementById("login-prompt-description")).toBeInTheDocument();
  });

  it("announces the attempted action via a live region", () => {
    renderDialog({ attemptedAction: "like this content" });
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveAttribute("aria-label", "You tried to like this content");
  });

  it("groups auth actions and labels each button", () => {
    renderDialog();
    const group = screen.getByRole("group", { name: /authentication options/i });
    const signIn = within(group).getByRole("button", {
      name: /sign in to your existing account/i,
    });
    const signUp = within(group).getByRole("button", {
      name: /create a new account/i,
    });
    expect(signIn).toBeInTheDocument();
    expect(signUp).toBeInTheDocument();
  });

  it("traps focus inside the dialog and closes on Escape", async () => {
    const onOpenChange = vi.fn();
    render(
      <MemoryRouter>
        <button>outside-before</button>
        <LoginPromptDialog
          open
          onOpenChange={onOpenChange}
          attemptedAction="track progress"
        />
        <button>outside-after</button>
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    // Focus should be inside the dialog (Radix moves it on open).
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Tab cycles only through dialog focusables — never escapes to outside buttons.
    const outsideBefore = screen.getByText("outside-before");
    const outsideAfter = screen.getByText("outside-after");
    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(document.activeElement).not.toBe(outsideBefore);
      expect(document.activeElement).not.toBe(outsideAfter);
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    // Escape closes the dialog.
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
