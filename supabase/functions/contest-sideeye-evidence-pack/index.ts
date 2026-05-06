// Edge function: contest-sideeye-evidence-pack
// Builds a self-contained "dispute pack" for a single SideEye session that HR /
// placement teams can hand to recruiters or candidates' representatives:
//   - audit.csv             — full filtered audit log
//   - chain.json            — tamper-evident hash chain
//   - findings.json         — every AI finding with confidence
//   - evidence_urls.json    — 7-day signed URLs to each side-camera frame
//   - manifest.json         — generator metadata + counts
// Returns a ZIP (store-only, no compression) so it works in the browser without
// any extra dependency. Logs the action to admin_audit_log.
//
// Body: { sessionId: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ----- Tiny store-only ZIP writer (no compression, ZIP64-free) -----
// Acceptable: total uncompressed pack size is small (<50 MB typical).
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
function dosTime(d = new Date()) {
  const t = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() / 2) & 0x1f);
  const dt = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0x0f) << 5) | (d.getDate() & 0x1f);
  return { t, dt };
}
function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const { t, dt } = dosTime();
  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;
    const lh = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(lh.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true); // version
    dv.setUint16(6, 0, true); // flags
    dv.setUint16(8, 0, true); // method (store)
    dv.setUint16(10, t, true);
    dv.setUint16(12, dt, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    lh.set(nameBytes, 30);
    local.push(lh, f.data);

    const ch = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(ch.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 20, true);
    cdv.setUint16(6, 20, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, t, true);
    cdv.setUint16(14, dt, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true);
    ch.set(nameBytes, 46);
    central.push(ch);

    offset += lh.length + size;
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, centralStart, true);

  let total = 0;
  for (const p of [...local, ...central, eocd]) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of [...local, ...central, eocd]) { out.set(p, pos); pos += p.length; }
  return out;
}
// -------------------------------------------------------------------

function csvEscape(v: any) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { sessionId } = await req.json();
    if (!sessionId) return new Response("sessionId required", { status: 400, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Authorize: must be platform admin.
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "proctor_admin", "proctor_reviewer", "institution_admin"])
      .maybeSingle();
    if (!roleRow) return new Response("Forbidden", { status: 403, headers: corsHeaders });

    // 1. Audit log → CSV
    const { data: audit } = await admin
      .from("contest_side_camera_audit_logs")
      .select("id,created_at,event_type,severity,detail,reviewed_at,reviewer_id,reviewer_note")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const auditHeader = ["id","created_at","event_type","severity","detail","reviewed_at","reviewer_id","reviewer_note"];
    const auditCsv = [auditHeader.join(",")]
      .concat((audit ?? []).map((r: any) => auditHeader.map((k) => csvEscape(typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k])).join(",")))
      .join("\n");

    // 2. Chain
    const { data: chain } = await admin
      .from("sideeye_evidence_chain")
      .select("seq,kind,storage_path,sha256,prev_hash,payload,created_at")
      .eq("session_id", sessionId)
      .order("seq", { ascending: true });

    // 3. Findings
    const { data: findings } = await admin
      .from("contest_proctor_findings")
      .select("id,created_at,severity,confidence,phone_detected,second_person_detected,earbuds_detected,ai_summary,raw")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    // 4. Signed URLs (7 days) for each frame in the chain
    const evidenceUrls: { storage_path: string; signed_url: string | null }[] = [];
    for (const row of chain ?? []) {
      if (!row.storage_path) continue;
      const { data: signed } = await admin.storage
        .from("contest-sideeye")
        .createSignedUrl(row.storage_path, 7 * 24 * 60 * 60);
      evidenceUrls.push({ storage_path: row.storage_path, signed_url: signed?.signedUrl ?? null });
    }

    const manifest = {
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      session_id: sessionId,
      counts: {
        audit_logs: audit?.length ?? 0,
        chain_entries: chain?.length ?? 0,
        findings: findings?.length ?? 0,
        evidence_urls: evidenceUrls.length,
      },
      url_validity: "7d",
      version: "1.0",
    };

    const enc = new TextEncoder();
    const zip = buildZip([
      { name: "manifest.json", data: enc.encode(JSON.stringify(manifest, null, 2)) },
      { name: "audit.csv", data: enc.encode(auditCsv) },
      { name: "chain.json", data: enc.encode(JSON.stringify(chain ?? [], null, 2)) },
      { name: "findings.json", data: enc.encode(JSON.stringify(findings ?? [], null, 2)) },
      { name: "evidence_urls.json", data: enc.encode(JSON.stringify(evidenceUrls, null, 2)) },
    ]);

    // Audit
    await admin.from("admin_audit_log").insert({
      actor_id: user.id,
      action: "sideeye_evidence_pack_generated",
      entity_type: "contest_session",
      entity_slug: sessionId,
      diff: manifest.counts,
    });

    return new Response(zip, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="sideeye-evidence-${sessionId}.zip"`,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
