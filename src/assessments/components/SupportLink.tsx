import { useState } from "react";
import { Copy, Check, LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@parikshaa.app";

interface Props {
  attempt: {
    id: string;
    submitted_at?: string | null;
  };
  assessment: {
    id: string;
    title: string;
  };
}

export function SupportLink({ attempt, assessment }: Props) {
  const [copied, setCopied] = useState(false);

  const shortId = attempt.id.slice(0, 8);
  const subject = `Help with attempt ${shortId} — ${assessment.title}`;
  const body = [
    "Hi Parikshaa support,",
    "",
    "I need help with my recent submission. Details below:",
    "",
    `• Assessment: ${assessment.title}`,
    `• Assessment ID: ${assessment.id}`,
    `• Attempt ID: ${attempt.id}`,
    attempt.submitted_at ? `• Submitted at: ${attempt.submitted_at}` : null,
    "",
    "Issue:",
    "<describe what went wrong>",
    "",
    "Thanks!",
  ]
    .filter(Boolean)
    .join("\n");

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  const copyAttemptId = async () => {
    try {
      await navigator.clipboard.writeText(attempt.id);
      setCopied(true);
      toast.success("Attempt ID copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Please copy manually.");
    }
  };

  return (
    <div className="rounded-md border border-border bg-card/60 p-3 space-y-2.5">
      <div className="flex items-start gap-2.5">
        <div className="h-8 w-8 rounded-md bg-muted/60 grid place-items-center text-muted-foreground shrink-0">
          <LifeBuoy className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Need help with this submission?</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Our team can troubleshoot faster when you include your attempt ID. It's
            pre-filled in the email below.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded border border-border bg-background/60 px-2.5 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Attempt ID
        </span>
        <code className="text-xs font-mono truncate flex-1 min-w-0">{attempt.id}</code>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5"
          onClick={copyAttemptId}
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="default">
          <a href={mailtoHref}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Email support
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href="/support" target="_blank" rel="noopener noreferrer">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Open a support ticket
          </a>
        </Button>
      </div>
    </div>
  );
}
