// Sends an organization (teacher) invite email via Resend.
// Body: { invite_id: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const FROM = Deno.env.get("ASSESSMENT_INVITE_FROM") ?? "Parikshaa <noreply@parikshaa.org>";
const APP_URL = Deno.env.get("ASSESSMENT_INVITE_APP_URL") ?? "https://parikshaa.org";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return json(500, { error: "missing_resend_key" });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "no_auth" });
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u?.user) return json(401, { error: "invalid_auth" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const inviteId: string | undefined = body?.invite_id;
  if (!inviteId) return json(400, { error: "invite_id_required" });

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: invite, error: iErr } = await admin
    .from("b2b_org_invites")
    .select("id, org_id, email, token, expires_at, revoked, accepted_at, inviter_id, role_preset, capabilities")
    .eq("id", inviteId)
    .maybeSingle();
  if (iErr || !invite) return json(404, { error: "invite_not_found" });
  if (invite.revoked) return json(400, { error: "invite_revoked" });
  if (invite.accepted_at) return json(400, { error: "invite_already_used" });

  // Verify caller is owner/admin of this org
  const { data: member } = await admin
    .from("org_members").select("role").eq("org_id", invite.org_id).eq("user_id", u.user.id).maybeSingle();
  if (!member || !["owner", "admin"].includes(member.role)) return json(403, { error: "forbidden" });

  const { data: org } = await admin.from("organizations").select("name, brand_color").eq("id", invite.org_id).maybeSingle();
  const orgName = org?.name ?? "your team";
  const brand = (org?.brand_color as string | null) ?? "#f97316";
  const joinUrl = `${APP_URL}/b2b/join/${invite.token}`;
  const capsList = (invite.capabilities ?? []).join(", ") || invite.role_preset;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;background:#0a0a0a;color:#fff;padding:32px;border-radius:12px;max-width:560px;margin:0 auto">
      <h2 style="margin:0 0 12px 0;font-size:22px">You're invited to join ${orgName} on Parikshaa</h2>
      <p style="color:#cbd5e1;line-height:1.5">An admin invited you to collaborate as <b>${invite.role_preset}</b>.</p>
      <p style="color:#94a3b8;font-size:13px">Access granted: ${capsList || "—"}</p>
      <p style="margin:24px 0">
        <a href="${joinUrl}" style="background:${brand};color:#0a0a0a;font-weight:700;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Accept invite</a>
      </p>
      <p style="color:#64748b;font-size:12px">This link is unique to <b>${invite.email}</b> and expires on ${new Date(invite.expires_at).toLocaleString()}. If you weren't expecting this, you can ignore this email.</p>
    </div>`;

  const resend = new Resend(resendKey);
  try {
    await resend.emails.send({
      from: FROM,
      to: [invite.email],
      subject: `You're invited to ${orgName} on Parikshaa`,
      html,
    });
  } catch (e: any) {
    return json(502, { error: "send_failed", detail: e?.message ?? String(e) });
  }

  return json(200, { ok: true, sent_to: invite.email, join_url: joinUrl });
});
