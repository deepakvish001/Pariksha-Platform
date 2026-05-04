import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  contestSlug: string;
}

/**
 * Shown when this tab loses the contest tab-lock to another tab/window.
 * The dialog cannot be dismissed — the user must navigate away.
 */
export function MultiTabBlockedDialog({ open, contestSlug }: Props) {
  const navigate = useNavigate();
  return (
    <Dialog open={open}>
      <DialogContent
        className="border-destructive/40"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Contest opened in another tab
          </DialogTitle>
          <DialogDescription>
            Only one window can be active during a contest. This tab has been deactivated because the contest
            was opened in a different tab or device. To continue, use the active tab or close it and reload here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => navigate(`/contests/${contestSlug}`)}>Back to contest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
