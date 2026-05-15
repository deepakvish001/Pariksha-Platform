// Process due scheduled broadcasts: fan out into notifications, mark sent.
// Triggered by pg_cron every minute via net.http_post.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only endpoint: require shared secret or service role key.
  const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const provided = req.headers.get("X-Cron-Secret")
    || req.headers.get("Authorization")?.replace("Bearer ", "");
  const authorized = (cronSecret && provided === cronSecret) || provided === serviceKey;
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const nowIso = new Date().toISOString();
    const { data: due, error } = await sb
      .from("scheduled_broadcasts")
      .select("id,title,message,type,target_filter,scheduled_for")
      .is("sent_at", null)
      .is("cancelled_at", null)
      .lte("scheduled_for", nowIso)
      .limit(20);
    if (error) throw error;

    let totalSent = 0;
    const processed: { id: string; recipients: number }[] = [];

    for (const b of due ?? []) {
      const f = (b.target_filter ?? {}) as Record<string, unknown>;
      let q = sb.from("profiles").select("user_id", { head: false });

      if (typeof f.min_xp === "number") q = q.gte("total_xp", f.min_xp);
      if (typeof f.max_xp === "number") q = q.lte("total_xp", f.max_xp);
      if (f.role === "admin") {
        const { data: roles } = await sb.from("user_roles").select("user_id").eq("role", "admin");
        const ids = (roles ?? []).map((r: any) => r.user_id);
        if (ids.length === 0) {
          await sb.from("scheduled_broadcasts").update({ sent_at: nowIso, recipients_count: 0 }).eq("id", b.id);
          processed.push({ id: b.id, recipients: 0 });
          continue;
        }
        q = q.in("user_id", ids);
      }

      const { data: targets } = await q.limit(50000);
      const rows = (targets ?? []).map((t: any) => ({
        user_id: t.user_id,
        title: b.title,
        message: b.message,
        type: b.type ?? "announcement",
        data: { broadcast_id: b.id, scheduled: true },
      }));

      if (rows.length) {
        // chunk to avoid payload limits
        for (let i = 0; i < rows.length; i += 1000) {
          await sb.from("notifications").insert(rows.slice(i, i + 1000));
        }
      }

      await sb
        .from("scheduled_broadcasts")
        .update({ sent_at: new Date().toISOString(), recipients_count: rows.length })
        .eq("id", b.id);

      totalSent += rows.length;
      processed.push({ id: b.id, recipients: rows.length });
    }

    return new Response(JSON.stringify({ ok: true, processed, totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-scheduled-broadcasts error", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
