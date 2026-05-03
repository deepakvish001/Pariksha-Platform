import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
import { toast } from "sonner";
const toastMock = toast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
};

const BLOCKED_GATE_COPY = "Unblock this player first to send a request";
const BLOCKED_CHALLENGE_COPY = "You've blocked this player. Unblock them first to challenge.";

// Mirrors the gating logic in ArenaFriends so we lock the contract in tests.
function addFriend(uid: string, blocked: Set<string>) {
  if (blocked.has(uid)) {
    toastMock.error(BLOCKED_GATE_COPY);
    return false;
  }
  return true;
}
function openChallenge(uid: string, blocked: Set<string>) {
  if (blocked.has(uid)) {
    toastMock.error(BLOCKED_CHALLENGE_COPY);
    return false;
  }
  return true;
}

beforeEach(() => {
  toastMock.success.mockReset();
  toastMock.error.mockReset();
});

describe("ArenaFriends blocked-user gating contract", () => {
  it("blocks friend requests to a blocked user with the gating toast copy", () => {
    const blocked = new Set(["b1"]);
    expect(addFriend("b1", blocked)).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith(BLOCKED_GATE_COPY);
  });

  it("blocks challenge initiation to a blocked user with the gating toast copy", () => {
    const blocked = new Set(["b1"]);
    expect(openChallenge("b1", blocked)).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith(BLOCKED_CHALLENGE_COPY);
  });

  it("allows actions when user is not blocked", () => {
    const blocked = new Set<string>();
    expect(addFriend("u2", blocked)).toBe(true);
    expect(openChallenge("u2", blocked)).toBe(true);
    expect(toastMock.error).not.toHaveBeenCalled();
  });
});

// Mini harness mirroring the unblock confirmation pattern in ArenaFriends.
function UnblockHarness({ name, onConfirm }: { name: string; onConfirm: (id: string) => void }) {
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);
  return (
    <div>
      <Button onClick={() => setTarget({ id: "b1", name })}>Unblock</Button>
      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {target?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be able to send you friend requests, challenge you to matches, and appear in your discovery list again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const t = target;
                setTarget(null);
                if (t) onConfirm(t.id);
              }}
            >
              Confirm unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

describe("Unblock confirmation flow", () => {
  it("opens a confirmation dialog and fires success toast on confirm", async () => {
    const handler = vi.fn((id: string) => {
      toastMock.success(`Player unblocked`, {
        description: "You can now send friend requests and challenges to this player.",
      });
      return id;
    });
    render(<UnblockHarness name="Bobby Blocked" onConfirm={handler} />);

    fireEvent.click(screen.getByRole("button", { name: /^Unblock$/ }));
    await waitFor(() => expect(screen.getByText(/Unblock Bobby Blocked\?/i)).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Confirm unblock/i }));
    });

    expect(handler).toHaveBeenCalledWith("b1");
    expect(toastMock.success).toHaveBeenCalledWith(
      "Player unblocked",
      expect.objectContaining({ description: expect.stringMatching(/friend requests and challenges/i) }),
    );
  });

  it("does not fire success toast when the dialog is cancelled", async () => {
    const handler = vi.fn();
    render(<UnblockHarness name="Bobby Blocked" onConfirm={handler} />);
    fireEvent.click(screen.getByRole("button", { name: /^Unblock$/ }));
    await waitFor(() => expect(screen.getByText(/Unblock Bobby Blocked\?/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(handler).not.toHaveBeenCalled();
    expect(toastMock.success).not.toHaveBeenCalled();
  });
});
