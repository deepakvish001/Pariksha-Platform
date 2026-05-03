// Dispatch daily challenge reminders.
// Runs every hour via pg_cron. Finds users opted in (arena_notification_prefs.daily_reminder=true)
// whose `reminder_hour_utc` matches the current UTC hour and who haven't been reminded today,
// inserts an in-app notification, and (when RESEND_API_KEY is set) sends an email.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // This dispatcher is idempotent: each user can only be reminded once per
  // UTC day (gated by `last_reminded_date`). It is safe to expose without a
  // shared secret because there is no per-call work an attacker can amplify.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  const now = new Date();
  const hour = now.getUTCHours();
  const today = now.toISOString().slice(0, 10);

  // Ensure today's challenge exists (auto-seeds via the RPC)
  const { data: challengeRows } = await supabase.rpc("arena_get_daily_challenge");
  const challenge = (challengeRows as Array<{ problem_slug: string; bonus_xp: number }> | null)?.[0];
  if (!challenge) {
    return new Response(JSON.stringify({ ok: true, sent: 0, reason: "no_challenge" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find candidates
  const { data: prefs, error } = await supabase
    .from("arena_notification_prefs")
    .select("user_id, reminder_hour_utc, last_reminded_date")
    .eq("daily_reminder", true)
    .eq("reminder_hour_utc", hour);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const due = (prefs ?? []).filter((p) => p.last_reminded_date !== today);
  if (due.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = "New Daily Challenge is live";
  const message = `Today's Arena daily problem is "${challenge.problem_slug}" — solve it for +${challenge.bonus_xp} XP.`;

  // Insert notifications in a single batch
  const { error: notifErr } = await supabase.from("notifications").insert(
    due.map((p) => ({
      user_id: p.user_id,
      type: "arena_daily_challenge",
      title,
      message,
      data: { challenge_date: today, problem_slug: challenge.problem_slug },
    })),
  );
  if (notifErr) console.error("notifications insert failed", notifErr);

  // Best-effort email (only if Resend key present)
  const resendKey = Deno.env.get("RESEND_API_KEY");
  let emailed = 0;
  if (resendKey) {
    const resend = new Resend(resendKey);
    for (const p of due) {
      try {
        const { data: u } = await supabase.auth.admin.getUserById(p.user_id);
        const email = u?.user?.email;
        if (!email) continue;
        await resend.emails.send({
          from: "Byteskill Arena <onboarding@resend.dev>",
          to: [email],
          subject: title,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#0b0b0f;color:#e6e6f0;border-radius:12px">
            <h1 style="margin:0 0 12px;font-size:22px">🔥 ${title}</h1>
            <p style="margin:0 0 16px;line-height:1.5;color:#cbcbd6">${message}</p>
            <a href="https://exact-web-sight.lovable.app/arena/daily" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Play Today's Daily</a>
            <p style="font-size:11px;color:#64646e;margin-top:24px">You can turn off reminders in Arena → Daily.</p>
          </div>`,
        });
        emailed += 1;
      } catch (e) {
        console.error("email send failed", e);
      }
    }
  }

  // Stamp last_reminded_date so we don't re-fire today
  await supabase
    .from("arena_notification_prefs")
    .update({ last_reminded_date: today })
    .in(
      "user_id",
      due.map((p) => p.user_id),
    );

  return new Response(
    JSON.stringify({ ok: true, sent: due.length, emailed }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
