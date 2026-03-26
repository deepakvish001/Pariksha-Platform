import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";

export const useRequireAuth = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback();
      } else {
        setPendingAction(() => callback);
        setIsOpen(true);
      }
    },
    [user]
  );

  const dialog = (
    <LoginPromptDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  );

  return { requireAuth, user, LoginPromptDialog: dialog };
};
