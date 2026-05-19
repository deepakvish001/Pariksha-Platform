import { supabase } from "@/integrations/supabase/client";

/**
 * Determines where a user should land after authenticating, based on their role:
 * - Admin role        -> /admin (admin panel)
 * - Owns a company org -> /b2b/dashboard (company dashboard)
 * - Owns a college org -> /b2b/dashboard (college dashboard)
 * - Member of an org   -> /b2b/dashboard
 * - Otherwise (student) -> /learn
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
