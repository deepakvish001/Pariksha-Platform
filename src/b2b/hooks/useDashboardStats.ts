import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DeltaPct = number | null; // % change vs previous period; null = no baseline

export type WindowPair<T = number> = { curr: T; prev: T };

export type DashboardStats = {
  // Totals (all-time) — used for the big KPI numbers.
  assessments: number;
  invites: number;
  submissions: number;
  avgIntegrity: number | null;
  // Deltas: current window vs previous window of equal length.
  deltas: {
    assessments: DeltaPct;
    invites: DeltaPct;
    submissions: DeltaPct;
    avgIntegrity: DeltaPct;
  };
  // Underlying curr/prev numbers that the deltas (and AI insights) are based on.
  windows: {
    windowDays: number;
    assessments: WindowPair;
    invites: WindowPair;
    submissions: WindowPair;
    avgIntegrity: WindowPair<number | null>;
    breakdowns: {
      assessments: { drafts: WindowPair; published: WindowPair };
      invites: { pending: WindowPair; accepted: WindowPair };
      submissions: { started: WindowPair; completed: WindowPair };
      integrity: { flaggedLow: WindowPair };
    };
  };
};

export type StatsRange = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<StatsRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function pctChange(curr: number, prev: number): DeltaPct {
  if (prev === 0) return curr === 0 ? 0 : null; // no baseline to compare
  return Math.round(((curr - prev) / prev) * 1000) / 10; // 1 decimal
}

type Pair = { curr: number; prev: number };
type Bucket = {
  total: number;
  curr: number;
  prev: number;
  breakdown?: Record<string, Pair>;
};
type IntegrityBucket = {
  total: number | null;
  curr: number | null;
  prev: number | null;
  breakdown?: Record<string, Pair>;
};
type RpcShape = {
  window_days: number;
  assessments: Bucket;
  invites: Bucket;
  submissions: Bucket;
  integrity: IntegrityBucket;
};

const ZP: Pair = { curr: 0, prev: 0 };

export function useDashboardStats(orgId?: string, range: StatsRange = "30d") {
  return useQuery({
    queryKey: ["b2b", "dashboard-stats", orgId, range],
    enabled: !!orgId,
    queryFn: async (): Promise<DashboardStats> => {
      const windowDays = RANGE_DAYS[range];

      // Single server-side aggregation — replaces 5 client queries + filtering.
      const { data, error } = await supabase.rpc("get_b2b_dashboard_stats", {
        _org_id: orgId!,
        _window_days: windowDays,
      });
      if (error) throw error;

      const r = (data ?? {}) as Partial<RpcShape>;
      const a = r.assessments ?? { total: 0, curr: 0, prev: 0 };
      const i = r.invites ?? { total: 0, curr: 0, prev: 0 };
      const s = r.submissions ?? { total: 0, curr: 0, prev: 0 };
      const ig = r.integrity ?? { total: null, curr: null, prev: null };

      const integrityDelta: DeltaPct =
        ig.curr != null && ig.prev != null
          ? Math.round((ig.curr - ig.prev) * 10) / 10 // absolute pts diff
          : null;

      return {
        assessments: a.total,
        invites: i.total,
        submissions: s.total,
        avgIntegrity: ig.total,
        deltas: {
          assessments: pctChange(a.curr, a.prev),
          invites: pctChange(i.curr, i.prev),
          submissions: pctChange(s.curr, s.prev),
          avgIntegrity: integrityDelta,
        },
        windows: {
          windowDays,
          assessments: { curr: a.curr, prev: a.prev },
          invites: { curr: i.curr, prev: i.prev },
          submissions: { curr: s.curr, prev: s.prev },
          avgIntegrity: { curr: ig.curr, prev: ig.prev },
        },
      };
    },
  });
}
