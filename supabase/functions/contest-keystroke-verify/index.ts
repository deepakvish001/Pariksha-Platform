import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Keystroke biometric: enroll a baseline (first 60s of typing) OR
 * verify a fresh sample against it. Returns a similarity score 0..1.
 *
 * Body: { session_id, mode: "enroll" | "verify", sample: { dwell:number[], flight:number[] } }
 */
interface Sample { dwell: number[]; flight: number[] }
interface Profile { dwell_mean: number; dwell_std: number; flight_mean: number; flight_std: number; n: number }

function profileOf(s: Sample): Profile {
  const mean = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
  const std = (a: number[], m: number) => a.length ? Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) : 1
  const dm = mean(s.dwell), fm = mean(s.flight)
  return { dwell_mean: dm, dwell_std: std(s.dwell, dm) || 1, flight_mean: fm, flight_std: std(s.flight, fm) || 1, n: s.dwell.length + s.flight.length }
}

function similarity(a: Profile, b: Profile): number {
  // Cosine-like on normalized (mean, std) vectors; bounded to [0,1]
  const va = [a.dwell_mean, a.dwell_std, a.flight_mean, a.flight_std]
  const vb = [b.dwell_mean, b.dwell_std, b.flight_mean, b.flight_std]
  const dot = va.reduce((s, x, i) => s + x * vb[i], 0)
  const na = Math.sqrt(va.reduce((s, x) => s + x * x, 0)) || 1
  const nb = Math.sqrt(vb.reduce((s, x) => s + x * x, 0)) || 1
  return Math.max(0, Math.min(1, dot / (na * nb)))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const userRes = await supabase.auth.getUser(auth.replace('Bearer ', ''))
    const user = userRes.data.user
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { session_id, mode, sample } = await req.json() as { session_id: string; mode: 'enroll' | 'verify'; sample: Sample }
    if (!session_id || !mode || !sample?.dwell || !sample?.flight) {
      return new Response(JSON.stringify({ error: 'invalid_body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Ownership check
    const { data: sess } = await supabase.from('contest_sessions').select('id,user_id').eq('id', session_id).maybeSingle()
    if (!sess || sess.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const profile = profileOf(sample)

    if (mode === 'enroll') {
      await supabase.from('contest_keystroke_baselines').upsert({
        session_id, user_id: user.id, profile, samples: profile.n,
      }, { onConflict: 'session_id' })
      return new Response(JSON.stringify({ ok: true, enrolled: true, profile }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // verify
    const { data: base } = await supabase.from('contest_keystroke_baselines').select('profile').eq('session_id', session_id).maybeSingle()
    if (!base) return new Response(JSON.stringify({ ok: true, score: null, enrolled: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const score = similarity(base.profile as Profile, profile)
    const drift = score < 0.78
    if (drift) {
      await supabase.functions.invoke('contest-violation-engine', {
        body: { session_id, category: 'keystroke_drift', severity: score < 0.6 ? 'critical' : 'high', meta: { score } },
      })
    }
    return new Response(JSON.stringify({ ok: true, score, drift }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
