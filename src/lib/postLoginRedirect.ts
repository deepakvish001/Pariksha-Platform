import { supabase } from "@/integrations/supabase/client";

/**
 * Determines where a user should land after authenticating.
 *
 * Priority (first match wins — checks are sequential, not merged):
 *   1. Platform admin (user_roles.role = 'admin')           -> /admin
 *   2. Owner of any organization (organizations.owner_id)   -> /b2b/dashboard
 *   3. Member of any organization (org_members)             -> /b2b/dashboard
 *   4. Enrolled student of a college (org_students)         -> /my/college
 *   5. Default (regular learner)                            -> /learn
 *
 * Dual-role note:
 *   A user who is BOTH a college admin/member AND an enrolled student
 *   (e.g. a TA, or an admin who self-enrolled with the same email) will
 *   ALWAYS land on /b2b/dashboard because rules 2–3 are evaluated before
 *   rule 4. They can still reach their student view manually via /my/college
 *   — the OrgShell surfaces a banner linking there when this case applies.
 */
export async function getPostLoginPath(userId: string): Promise<string> {
  try {
    // 1. Admin?
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles?.some((r) => r.role === "admin")) {
      return "/admin";
    }

    // 2. Owner of an organization (company / college)?
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id, type")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (ownedOrg) {
      return "/b2b/dashboard";
    }

    // 3. Member of an organization?
    const { data: memberOrg } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memberOrg) {
      return "/b2b/dashboard";
    }

    // 3b. Enrolled student in a college?
    const { data: studentRow } = await supabase
      .from("org_students")
      .select("id")
      .eq("user_id", userId)
      .in("status", ["invited", "active"])
      .limit(1)
      .maybeSingle();
    if (studentRow) {
      return "/my/college";
    }
  } catch (err) {
    console.error("Failed to resolve post-login path:", err);
  }

  // 4. Default: student dashboard
  return "/learn";
}
