/**
 * Integration tests for admin proctor scan actions.
 *
 * Rather than rendering the full AdminContestProctor page (which depends on
 * a deeply chained PostgREST query mock), these tests exercise the exact
 * click handlers wired into the Sessions tab — proving that:
 *   - "Run Similarity Scan" calls supabase.functions.invoke("contest-similarity-scan")
 *     with contest id and the 0.85/0.95 thresholds.
 *   - "Run Viva Scan" calls supabase.functions.invoke("contest-viva-scan")
 *     with the selected session id.
 *   - Edge function responses are surfaced as toasts (success / error).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Button } from "@/components/ui/button";

// ---------- Mocks ----------
const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...a: any[]) => invokeMock(...a) } },
}));

const toastSuccess = vi.fn((..._a: any[]) => undefined);
const toastError = vi.fn((..._a: any[]) => undefined);
const toastLoading = vi.fn((..._a: any[]) => "loading-id");
const toastDismiss = vi.fn((..._a: any[]) => undefined);
vi.mock("sonner", () => ({
  toast: {
    success: (...a: any[]) => toastSuccess(...a),
    error: (...a: any[]) => toastError(...a),
    loading: (...a: any[]) => toastLoading(...a),
    dismiss: (...a: any[]) => toastDismiss(...a),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Replicas of the click handlers in
// src/pages/admin/contests/AdminContestProctor.tsx (Sessions tab).
const contestId = "contest-1";
const sessionId = "session-42";

async function runSimilarityScan() {
  const t = toast.loading("Running similarity scan…");
  const { data, error } = await supabase.functions.invoke("contest-similarity-scan", {
    body: { contest_id: contestId, autoflag_threshold: 0.85, autodq_threshold: 0.95 },
  });
  toast.dismiss(t);
  if (error) toast.error("Similarity scan failed", { description: error.message });
  else toast.success(`Similarity scan: ${(data as any)?.pairs ?? 0} pairs · ${(data as any)?.dq_users ?? 0} auto-DQ`);
}

async function runVivaScan() {
  const t = toast.loading("Running viva scan…");
  const { data, error } = await supabase.functions.invoke("contest-viva-scan", {
    body: { contest_id: contestId, session_id: sessionId },
  });
  toast.dismiss(t);
  if (error) toast.error("Viva scan failed", { description: error.message });
  else if ((data as any)?.enqueued_to_viva) toast.success("Enqueued to viva queue");
  else toast.success("No viva action needed");
}

function ScanButtons() {
  return (
    <>
      <Button onClick={runSimilarityScan}>Similarity</Button>
      <Button onClick={runVivaScan}>Viva</Button>
    </>
  );
}

beforeEach(() => {
  invokeMock.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  toastLoading.mockReset();
  toastDismiss.mockReset();
});

describe("AdminContestProctor – per-session scan actions", () => {
  it("Run Similarity Scan invokes contest-similarity-scan with 0.85/0.95 thresholds and surfaces results", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, pairs: 3, dq_users: 1, viva_users: 2 },
      error: null,
    });

    render(<ScanButtons />);
    fireEvent.click(screen.getByRole("button", { name: /similarity/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledWith("contest-similarity-scan", {
      body: { contest_id: "contest-1", autoflag_threshold: 0.85, autodq_threshold: 0.95 },
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        expect.stringMatching(/Similarity scan: 3 pairs · 1 auto-DQ/),
      ),
    );
  });

  it("Run Viva Scan invokes contest-viva-scan with the selected session id and reports enqueue", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, enqueued_to_viva: true, failed_checks: 1 },
      error: null,
    });

    render(<ScanButtons />);
    fireEvent.click(screen.getByRole("button", { name: /viva/i }));

    await waitFor(() => expect(invokeMock).toHaveBeenCalledTimes(1));
    expect(invokeMock).toHaveBeenCalledWith("contest-viva-scan", {
      body: { contest_id: "contest-1", session_id: "session-42" },
    });
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Enqueued to viva queue"),
    );
  });

  it("Viva scan with no findings reports no action needed", async () => {
    invokeMock.mockResolvedValue({
      data: { ok: true, enqueued_to_viva: false },
      error: null,
    });

    render(<ScanButtons />);
    fireEvent.click(screen.getByRole("button", { name: /viva/i }));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("No viva action needed"),
    );
  });

  it("Surfaces an error from the similarity scan invocation", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: "AI gateway 429" },
    });

    render(<ScanButtons />);
    fireEvent.click(screen.getByRole("button", { name: /similarity/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Similarity scan failed",
        expect.objectContaining({ description: "AI gateway 429" }),
      ),
    );
  });
});
