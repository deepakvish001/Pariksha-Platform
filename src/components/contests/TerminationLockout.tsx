import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const FRIENDLY: Record<string, string> = {
  identity_mismatch: "Face on camera did not match the verified candidate.",
  second_person: "A second person was detected in your room.",
  second_monitor: "A second monitor was connected during the test.",
  vm_detected: "A virtual machine was detected on this device.",
  rdp_detected: "Remote-desktop software was detected.",
  devtools_open: "Developer tools were opened during the test.",
  side_eye_disconnected_grace_expired: "Side-camera (phone) stayed disconnected too long.",
};

/**
 * Full-screen, non-dismissable lockout shown when the violation engine
 * issues an auto-terminate. Prevents any further interaction with the
 * paper and points the candidate to the dispute flow.
 */
export default function TerminationLockout({
  reason, severity, contestSlug,
}: { reason: string | null; severity: string | null; contestSlug?: string }) {
  // Hard lock: disable scrolling and global key shortcuts behind us.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const stop = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", stop, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", stop, true);
    };
  }, []);

  const message = (reason && FRIENDLY[reason]) ?? "Critical integrity violation detected.";

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="terminate-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="rounded-full bg-destructive/15 p-3">
            <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden />
          </div>
          <h1 id="terminate-title" className="text-xl font-bold">
            Your attempt has been terminated
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          {severity && (
            <p className="text-xs text-muted-foreground">
              Reason code: <span className="font-mono">{reason ?? "unknown"}</span> · severity {severity}
            </p>
          )}
          <div className="mt-2 flex flex-col gap-2 w-full">
            <Button asChild variant="default" className="w-full">
              <Link to={contestSlug ? `/contests/${contestSlug}` : "/contests"}>
                Return to contest page
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/support">Dispute this decision</Link>
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            All evidence has been recorded and is being reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
