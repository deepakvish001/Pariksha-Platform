import { useMemo, useState } from "react";
import { ShellHeader } from "./ParikshaaShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, ExternalLink, Copy, Check } from "lucide-react";
import {
  buildDemoFollowupHtml,
  DEMO_FOLLOWUP_SUBJECT,
} from "./emailTemplates/demoFollowup";

const DEFAULT_CALENDAR = "https://cal.com/deepakvish001/30min";

export default function EmailPreview() {
  const [name, setName] = useState("Aarav Mehta");
  const [org, setOrg] = useState("Acme Tech Pvt Ltd");
  const [useCase, setUseCase] = useState("hiring");
  const [candidates, setCandidates] = useState("100-500");
  const [calendarUrl, setCalendarUrl] = useState(DEFAULT_CALENDAR);
  const [copied, setCopied] = useState<"subject" | "html" | null>(null);

  const html = useMemo(
    () => buildDemoFollowupHtml({ name, org, useCase, candidates, calendarUrl }),
    [name, org, useCase, candidates, calendarUrl],
  );

  const copy = async (kind: "subject" | "html", text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <ShellHeader
        title="Email Preview"
        actions={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Demo follow-up
          </div>
        }
      />

      <div className="p-6 grid gap-6 lg:grid-cols-[340px,1fr]">
        {/* Controls */}
        <Card className="p-4 space-y-4 h-fit">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Preview inputs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Confirm subject, body and CTA before any send.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="email-preview-recipient" className="text-xs">Recipient name</Label>
              <Input id="email-preview-recipient" value={name} onChange={(e) => setName(e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label htmlFor="email-preview-org" className="text-xs">Organization</Label>
              <Input id="email-preview-org" value={org} onChange={(e) => setOrg(e.target.value)} className="h-9 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="email-preview-usecase" className="text-xs">Use case</Label>
                <Input id="email-preview-usecase" value={useCase} onChange={(e) => setUseCase(e.target.value)} className="h-9 mt-1" />
              </div>
              <div>
                <Label htmlFor="email-preview-candidates" className="text-xs">Candidates</Label>
                <Input id="email-preview-candidates" value={candidates} onChange={(e) => setCandidates(e.target.value)} className="h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="email-preview-calendar-url" className="text-xs">Calendar URL (CTA)</Label>
              <Input id="email-preview-calendar-url" value={calendarUrl} onChange={(e) => setCalendarUrl(e.target.value)} className="h-9 mt-1 font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Live value comes from the <code>DEMO_CALENDAR_URL</code> secret.
              </p>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Test CTA link
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => copy("html", html)}
            >
              {copied === "html" ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied === "html" ? "Copied" : "Copy HTML"}
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <div className="space-y-4 min-w-0">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</div>
                <div className="text-sm font-medium truncate mt-0.5">{DEMO_FOLLOWUP_SUBJECT}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy("subject", DEMO_FOLLOWUP_SUBJECT)}>
                {copied === "subject" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">From</div>
                <div className="font-mono mt-0.5">Parikshaa &lt;onboarding@…&gt;</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">CTA target</div>
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="font-mono mt-0.5 block truncate text-amber-500 hover:underline">
                  {calendarUrl}
                </a>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-2 border-b text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30">
              Rendered email
            </div>
            <iframe
              title="Email preview"
              srcDoc={html}
              sandbox=""
              className="w-full h-[640px] bg-white"
            />
          </Card>
        </div>
      </div>
    </>
  );
}
