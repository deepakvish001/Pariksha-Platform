import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export const LoginPromptDialog = ({
  open,
  onOpenChange,
  message = "Sign in to track your progress, save your work, and unlock all features.",
}: LoginPromptDialogProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign in to continue</DialogTitle>
          <DialogDescription className="text-base pt-1">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => {
              onOpenChange(false);
              navigate("/login");
            }}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              navigate("/signup");
            }}
            className="w-full gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
