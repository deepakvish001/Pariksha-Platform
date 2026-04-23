import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerdictBadgeProps {
  verdict: string;
  className?: string;
}

export const VerdictBadge = ({ verdict, className }: VerdictBadgeProps) => {
  const config = (() => {
    switch (verdict) {
      case "Accepted":
        return {
          icon: CheckCircle2,
          classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
        };
      case "Wrong Answer":
        return {
          icon: XCircle,
          classes: "bg-destructive/10 text-destructive border-destructive/30",
        };
      case "Time Limit Exceeded":
        return {
          icon: Clock,
          classes: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        };
      case "Compile Error":
        return {
          icon: AlertTriangle,
          classes: "bg-orange-500/10 text-orange-500 border-orange-500/30",
        };
      case "Runtime Error":
        return {
          icon: Bug,
          classes: "bg-rose-500/10 text-rose-500 border-rose-500/30",
        };
      default:
        return {
          icon: AlertTriangle,
          classes: "bg-muted text-muted-foreground border-border",
        };
    }
  })();

  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", config.classes, className)}>
      <Icon className="h-3.5 w-3.5" />
      {verdict}
    </Badge>
  );
};
