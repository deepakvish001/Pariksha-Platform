// Public student profile resolver (no auth)
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return new Response(JSON.stringify({ error: "missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: link, error: linkErr } = await supa
      .from("student_share_links")
      .select("id, org_id, kind, student_id, student_ids, expires_at, revoked_at, recruiter_name, message, view_count")
      .eq("token", token)
      .maybeSingle();

    if (linkErr || !link) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (link.revoked_at) {
      return new Response(JSON.stringify({ error: "revoked" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(link.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "expired" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids: string[] = (link.student_ids && link.student_ids.length > 0)
      ? link.student_ids
      : link.student_id ? [link.student_id] : [];

    const [{ data: students }, { data: org }, { data: scores }] = await Promise.all([
      supa.from("org_students")
        .select("id, full_name, email, roll_number, branch, batch_year, section")
        .in("id", ids),
      supa.from("organizations").select("name, slug").eq("id", link.org_id).maybeSingle(),
      supa.from("placement_student_scores")
        .select("student_id, score, rank_in_org, rank_in_branch, scores, assessments_taken, avg_assessment_score, avg_integrity, applications_count, shortlisted_count, offers_count, is_placed, is_multi_offer")
        .in("student_id", ids),
    ]);

    const { data: prefs } = await supa
      .from("student_profile_preferences")
      .select("student_id, headline, allow_public_share, show_resume, show_contact")
      .in("student_id", ids);

    const scoreById: Record<string, any> = {};
    (scores || []).forEach((s: any) => { scoreById[s.student_id] = s; });
    const prefById: Record<string, any> = {};
    (prefs || []).forEach((p: any) => { prefById[p.student_id] = p; });

    // Fire-and-forget view log + counter update
    const ipHash = req.headers.get("x-forwarded-for") || "";
    supa.from("student_share_views").insert({
      share_id: link.id,
      ip_hash: ipHash ? await sha256(ipHash) : null,
      user_agent: req.headers.get("user-agent"),
      referrer: req.headers.get("referer"),
    }).then(() => {});
    
    supa.from("student_share_links")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", link.id).then(() => {});
      
    supa.rpc("noop_increment_share_view", { _id: link.id }).then(() => {}).catch(() => {});

    const payload = {
      kind: link.kind,
      org: org ? { name: org.name, slug: org.slug } : null,
      recruiter_name: link.recruiter_name,
      message: link.message,
      expires_at: link.expires_at,
      students: (students || []).map((s: any) => {
        const sc = scoreById[s.id] || {};
        const pr = prefById[s.id] || {};
        return {
          id: s.id,
          name: s.full_name || s.email.split("@")[0],
          roll: s.roll_number,
          branch: s.branch,
          batch_year: s.batch_year,
          headline: pr.headline || null,
          show_contact: pr.show_contact === true,
          email: pr.show_contact === true ? s.email : null,
          score: Number(sc.score || 0),
          rank_in_org: sc.rank_in_org,
          rank_in_branch: sc.rank_in_branch,
          highlights: {
            assessments_taken: sc.assessments_taken || 0,
            avg_assessment_score: sc.avg_assessment_score,
            applications_count: sc.applications_count || 0,
            shortlisted_count: sc.shortlisted_count || 0,
            offers_count: sc.offers_count || 0,
            is_placed: !!sc.is_placed,
            is_multi_offer: !!sc.is_multi_offer,
          },
          scores: sc.scores || {},
        };
      }),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
