// Mirrors the follow-up email built in
// supabase/functions/submit-demo-request/index.ts
// Keep the subject / HTML in sync when editing either file.

export type DemoFollowupInput = {
  name: string;
  org?: string | null;
  useCase?: string | null;
  candidates?: string | null;
  calendarUrl: string;
};

export const DEMO_FOLLOWUP_SUBJECT = "Your Parikshaa demo — book your 15-min slot";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildDemoFollowupHtml(input: DemoFollowupInput): string {
  const firstName = (input.name.split(" ")[0] ?? "there").trim() || "there";
  const orgValue = input.org ?? "—";
  const useCase = input.useCase ?? "demo";
  const candidates = input.candidates ?? "—";
  const calendarUrl = input.calendarUrl;

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;background:#ffffff;">
      <h1 style="font-size:22px;margin:0 0 8px;">Thanks, ${escapeHtml(firstName)} — your demo is reserved 🎯</h1>
      <p style="color:#475569;line-height:1.55;margin:0 0 18px;">
        We received your request from <strong>${escapeHtml(orgValue)}</strong> and a Parikshaa specialist will reach out within
        <strong>1 business day</strong>. To make it faster, pick a 15-minute slot that works for you:
      </p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#f59e0b;color:#0b0b0b;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;">
          Book your 15-min slot →
        </a>
      </p>
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:24px 0 8px;">What happens next</h3>
      <ol style="color:#0f172a;line-height:1.6;padding-left:20px;margin:0 0 18px;">
        <li>You'll receive a calendar invite once you book a slot.</li>
        <li>We'll tailor the demo to your ${escapeHtml(useCase)} use case (${escapeHtml(candidates)} candidates).</li>
        <li>You'll leave with a free trial workspace + sample assessment.</li>
      </ol>
      <p style="color:#475569;line-height:1.55;margin:18px 0 0;">
        In the meantime, you can <a href="https://parikshaa.org/b2b/onboarding" style="color:#b45309;">start a free workspace</a> — no card needed.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0 14px;"/>
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Reply directly to this email to reach our team.<br/>
        Parikshaa · Hire & place developers 10× faster
      </p>
    </div>
  `;
}
