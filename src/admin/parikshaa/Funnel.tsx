import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShellHeader } from "./ParikshaaShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MousePointerClick, Send, Building2, ArrowDown, TrendingDown } from "lucide-react";

type Window = "1" | "7" | "30" | "90";

const WINDOWS: { v: Window; l: string }[] = [
  { v: "1", l: "Last 24 hours" },
  { v: "7", l: "Last 7 days" },
  { v: "30", l: "Last 30 days" },
  { v: "90", l: "Last 90 days" },
];

export default function FunnelDashboard() {
  const [days, setDays] = useState<Window>("30");

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(days, 10));
    return d.toISOString();
  }, [days]);

  const { data: events = [] } = useQuery({
    queryKey: ["funnel-events", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("event_type, session_id, created_at")
        .gte("created_at", since)
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["funnel-orgs", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, created_at")
        .gte("created_at", since)
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const sessions: Record<string, Set<string>> = {
      view: new Set(),
      start: new Set(),
      submit: new Set(),
    };
    const counts: Record<string, number> = { view: 0, start: 0, submit: 0 };
    for (const ev of events) {
      const sid = ev.session_id ?? `evt:${ev.created_at}`;
      const t = ev.event_type ?? "";
      if (t === "b2b_landing_view" || t === "landing_page_view") {
        sessions.view.add(sid); counts.view++;
      } else if (t === "b2b_hero_form_start") {
        sessions.start.add(sid); counts.start++;
      } else if (t === "b2b_hero_form_submit" || t === "hero_lead_submitted") {
        sessions.submit.add(sid); counts.submit++;
      }
    }
    return {
      view: sessions.view.size || counts.view,
      start: sessions.start.size || counts.start,
      submit: sessions.submit.size || counts.submit,
      onboarded: orgs.length,
    };
  }, [events, orgs]);

  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

  const steps = [
    { key: "view", label: "Page view", value: stats.view, icon: Eye, color: "from-sky-500 to-sky-400" },
    { key: "start", label: "Form start", value: stats.start, icon: MousePointerClick, color: "from-amber-500 to-amber-400" },
    { key: "submit", label: "Form submit", value: stats.submit, icon: Send, color: "from-orange-500 to-orange-400" },
    { key: "onboarded", label: "Onboarded org", value: stats.onboarded, icon: Building2, color: "from-emerald-500 to-emerald-400" },
  ];

  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <>
      <ShellHeader
        title="Conversion Funnel"
        actions={
          <Select value={days} onValueChange={(v) => setDays(v as Window)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (<SelectItem key={w.v} value={w.v}>{w.l}</SelectItem>))}
            </SelectContent>
          </Select>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((s, i) => {
            const prev = i > 0 ? steps[i - 1].value : null;
            const conv = prev != null ? pct(s.value, prev) : null;
            const Icon = s.icon;
            return (
              <div key={s.key} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {conv != null && (
                    <span className={`text-[11px] font-medium ${conv < 30 ? "text-red-400" : conv < 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {conv}% from prev
                    </span>
                  )}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight">{s.value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Funnel bars */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-sm font-semibold tracking-tight mb-1">Drop-off by step</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Sessions tracked via <code className="text-[10px]">lead_events</code> + organizations created in window.
          </p>
          <div className="space-y-3">
            {steps.map((s, i) => {
              const width = (s.value / max) * 100;
              const prev = i > 0 ? steps[i - 1].value : null;
              const drop = prev != null ? prev - s.value : 0;
              const dropPct = prev != null ? pct(drop, prev) : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.value.toLocaleString()}</span>
                  </div>
                  <div className="h-8 rounded-md bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${s.color} transition-all`}
                      style={{ width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                  {prev != null && drop > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-400/80 mt-1.5 pl-1">
                      <TrendingDown className="h-3 w-3" />
                      <span>
                        {drop.toLocaleString()} dropped ({dropPct}%) between {steps[i - 1].label} → {s.label}
                      </span>
                    </div>
                  )}
                  {i < steps.length - 1 && <div className="flex justify-center my-1"><ArrowDown className="h-3 w-3 text-muted-foreground/40" /></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight */}
        <div className="rounded-lg border bg-card p-5 text-sm">
          <p className="font-medium mb-2">Quick insight</p>
          {stats.view === 0 ? (
            <p className="text-muted-foreground text-xs">No traffic yet in this window — share your landing page to start collecting funnel data.</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              <strong className="text-foreground">{pct(stats.submit, stats.view)}%</strong> of visitors submitted the demo form, and{" "}
              <strong className="text-foreground">{pct(stats.onboarded, stats.submit)}%</strong> of submitters created an organization.
              {stats.view > stats.start * 5 && " Most drop-off is between view → form start — consider clearer hero CTAs."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
