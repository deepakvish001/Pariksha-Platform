import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Eye, Trash2, Clock } from "lucide-react";

const CONSENT_VERSION = "2026-01-v1";
const CONSENT_TEXT = `Second Eye Proctoring — Consent

By starting this contest you agree that the platform may:
• Use your device webcam and microphone, your screen contents, and a paired side-camera (your phone).
• Capture short audio/video samples and screen frames for the duration of the contest.
• Run AI analysis on those samples to detect prohibited behaviour (extra people in the room, secondary devices, screen-sharing apps, etc.).
• Retain raw recordings for the institution-defined retention period (default 365 days).
• Share findings with the contest organiser and authorised reviewers from your institution.

Your rights:
• You may withdraw at any time by abandoning the contest (your submission will not count).
• You may request erasure of your personal data after the retention period via your institution.
• Tamper-evident hash chains protect the evidence — you can later request the integrity report.`;

async function sha256Hex(text: string) {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Props {
  contestId: string;
  onAccepted: () => void;
}

/**
 * Candidate consent screen — shown before any SideEye capture starts.
 * Records the exact text version + SHA-256 + UA + (server-side) IP into the consent ledger.
 */
export function SideEyeConsentScreen({ contestId, onAccepted }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyConsented, setAlreadyConsented] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAlreadyConsented(false); return; }
      const { data } = await supabase
        .from("contest_sideeye_consents" as never)
        .select("id" as never)
        .eq("contest_id", contestId)
        .eq("user_id", user.id)
        .eq("consent_version", CONSENT_VERSION)
        .maybeSingle();
      if (cancelled) return;
      const has = !!data;
      setAlreadyConsented(has);
      if (has) onAccepted();
    })();
    return () => { cancelled = true; };
  }, [contestId, onAccepted]);

  const submit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const hash = await sha256Hex(CONSENT_TEXT);
      const { error } = await supabase.from("contest_sideeye_consents" as never).insert({
        contest_id: contestId,
        user_id: user.id,
        consent_version: CONSENT_VERSION,
        consent_text_sha256: hash,
        user_agent: navigator.userAgent,
      } as never);
      if (error) throw error;
      onAccepted();
    } catch (e) {
      console.error("[sideeye consent] failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (alreadyConsented === null || alreadyConsented === true) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-primary mt-1" />
          <div>
            <h2 className="text-xl font-semibold">Second Eye Proctoring — Consent</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please read this in full before starting. Recorded for compliance.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {CONSENT_TEXT}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
            <Eye className="h-4 w-4 text-primary" /><span>Camera + screen + side-cam</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
            <Clock className="h-4 w-4 text-primary" /><span>Retained per institution policy</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
            <Trash2 className="h-4 w-4 text-primary" /><span>Erasure on request</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          I have read and agree to the proctoring terms above (version {CONSENT_VERSION}).
        </label>

        <div className="flex justify-end">
          <Button disabled={!agreed || loading} onClick={submit}>
            {loading ? "Recording consent…" : "Agree and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
