// Binds a contest account to a verified ID document, face embedding,
// and primary device fingerprint. Subsequent contest sessions that
// don't match these values increment the conflict_count and raise
// an admin alert. Used to defeat impersonation and account-sharing.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface Body {
  user_id: string;
  id_document_hash: string;
  face_embedding_hash: string;
  device_fingerprint: string;
  /** When true, treat as a verification probe: do NOT bind, only check. */
  verify_only?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await supabase
      .from("contest_account_bindings")
      .select("*")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (!existing) {
      if (body.verify_only) {
        return new Response(JSON.stringify({ ok: true, status: "unbound" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase
        .from("contest_account_bindings")
        .insert({
          user_id: body.user_id,
          id_document_hash: body.id_document_hash,
          face_embedding_hash: body.face_embedding_hash,
          primary_device_fingerprint: body.device_fingerprint,
          last_seen_device: body.device_fingerprint,
        })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, status: "bound", row: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idMatch = existing.id_document_hash === body.id_document_hash;
    const faceMatch = existing.face_embedding_hash === body.face_embedding_hash;
    const deviceMatch = existing.primary_device_fingerprint === body.device_fingerprint;
    const conflicts: string[] = [];
    if (!idMatch) conflicts.push("id_document");
    if (!faceMatch) conflicts.push("face");
    if (!deviceMatch) conflicts.push("device");

    await supabase
      .from("contest_account_bindings")
      .update({
        last_seen_device: body.device_fingerprint,
        conflict_count: existing.conflict_count + (conflicts.length > 0 ? 1 : 0),
      })
      .eq("user_id", body.user_id);

    if (conflicts.length > 0) {
      await supabase.from("admin_alerts").insert({
        alert_type: "contest_account_binding_conflict",
        severity: idMatch && faceMatch ? "warn" : "critical",
        title: "Account binding mismatch",
        message: `Conflicts: ${conflicts.join(", ")}`,
        metadata: { user_id: body.user_id, conflicts },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, status: conflicts.length === 0 ? "match" : "conflict", conflicts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
