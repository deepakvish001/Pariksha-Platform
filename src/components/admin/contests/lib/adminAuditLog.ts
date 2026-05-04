import { supabase } from "@/integrations/supabase/client";

/**
 * Write a SideEye admin action into the shared admin_audit_log table.
 * Best-effort: failures are swallowed so the primary action still succeeds,
 * but they are logged to the console for diagnostics.
 */
export async function logSideEyeAction(
  action: string,
  entitySlug: string,
  diff: Record<string, unknown> = {},
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      action,
      entity_type: "sideeye_session",
      entity_slug: entitySlug,
      diff,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[sideeye] admin audit log failed", e);
  }
}
