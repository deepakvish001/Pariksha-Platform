import { Crown, Lock, Sparkles, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function PremiumLockedQuestion({
  title,
  onSkip,
  skipped,
}: {
  title?: string;
  onSkip?: () => void;
  skipped?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-background p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 ring-1 ring-amber-500/40">
        <Lock className="h-7 w-7 text-amber-500" />
      </div>
      <Badge variant="outline" className="mb-3 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300">
        <Crown className="mr-1 h-3 w-3" /> Premium question
        {skipped && <span className="ml-2 text-muted-foreground">· Skipped</span>}
      </Badge>
      <h2 className="text-xl font-semibold tracking-tight">{title || "This question requires Premium"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Upgrade your account to unlock Premium questions, advanced coding challenges, and exclusive practice content.
        Your other answers in this assessment are saved.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={() => navigate("/settings?tab=billing")}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Upgrade to Premium
        </Button>
        {onSkip && (
          <Button variant="outline" onClick={onSkip}>
            <SkipForward className="mr-2 h-4 w-4" />
            {skipped ? "Skipped — go to next" : "Skip this question"}
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Skipping marks this question as not attempted; it will not be counted against you.
      </p>
    </div>
  );
}
