import { useMemo } from "react";
import {
  LayoutGrid,
  BarChart3,
  FolderKanban,
  Users as UsersIcon,
  Sparkles,
  Workflow,
  Settings as SettingsIcon,
  ChevronLeft,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

// Static clone of the reference dashboard. Pure presentation — no backend wiring.

type KpiProps = {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
};

function Kpi({ label, value, delta, direction }: KpiProps) {
  const up = direction === "up";
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d0d12] p-5">
      <p className="text-[13px] text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <div
        className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
          up ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {up ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        <span>{delta}</span>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Analytics", icon: BarChart3 },
  { label: "Projects", icon: FolderKanban },
  { label: "Users", icon: UsersIcon },
  { label: "AI Insights", icon: Sparkles },
  { label: "Automations", icon: Workflow },
  { label: "Settings", icon: SettingsIcon },
];

const CHANNELS = [
  { name: "Organic Search", color: "#34d399" },
  { name: "Direct", color: "#60a5fa" },
  { name: "Paid Search", color: "#fb923c" },
  { name: "Referral", color: "#a78bfa" },
  { name: "Social Media", color: "#c084fc" },
];

const PROJECTS = [
  {
    name: "AI Customer Support Bot",
    updated: "Updated 2h ago",
    users: "2,340",
    status: "Healthy",
  },
  {
    name: "Marketing Automation",
    updated: "Updated 5h ago",
    users: "1,820",
    status: "Healthy",
  },
  {
    name: "Lead Scoring Engine",
    updated: "Updated 1d ago",
    users: "964",
    status: "Degraded",
  },
];

export default function CollegeDashboard() {
  const chartData = useMemo(
    () =>
      [
        { day: "May 1", revenue: 10.2 },
        { day: "May 4", revenue: 11.5 },
        { day: "May 7", revenue: 12.8 },
        { day: "May 10", revenue: 13.1 },
        { day: "May 13", revenue: 15.4 },
        { day: "May 16", revenue: 16.2 },
        { day: "May 19", revenue: 18.0 },
        { day: "May 22", revenue: 19.6 },
        { day: "May 25", revenue: 21.4 },
        { day: "May 28", revenue: 23.1 },
        { day: "May 31", revenue: 24.58 },
      ],
    [],
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white antialiased">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#08080c] min-h-screen p-4">
          <div className="px-2 pb-6">
            <p className="text-lg font-semibold tracking-tight">
              codeconst<span className="text-indigo-400">.</span>
            </p>
          </div>
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    item.active
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center text-sm font-semibold">
              JC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">James Carter</p>
              <p className="text-[11px] text-neutral-500">Admin</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-6 py-6 md:px-10 md:py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/5 bg-white/[0.02] text-neutral-300 hover:text-white"
              aria-label="Back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/5 bg-white/[0.02] text-neutral-300 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
          </div>

          {/* Title row */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Overview
            </h1>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.06]">
              <span>May 1 – May 31, 2025</span>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>
          </div>

          {/* KPI grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Kpi label="Total Revenue" value="₹24,58,300" delta="↑ 18.6%" direction="up" />
            <Kpi label="New Users" value="1,245" delta="↑ 12.5%" direction="up" />
            <Kpi label="Active Subscriptions" value="856" delta="↑ 8.4%" direction="up" />
            <Kpi label="Churn Rate" value="2.4%" delta="↓ 0.6%" direction="down" />
          </div>

          {/* Chart + Channels */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-white/5 bg-[#0d0d12] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Revenue Overview</h2>
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Revenue (₹)
                </div>
              </div>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1f1f29" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#525266"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                    />
                    <YAxis
                      stroke="#525266"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(v) => `${v}L`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0d0d12",
                        border: "1px solid #2a2a36",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#a1a1aa" }}
                      formatter={(v: number) => [`₹${v.toFixed(2)}L`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#revFill)"
                    />
                    <ReferenceDot
                      x="May 31"
                      y={24.58}
                      r={5}
                      fill="#6366f1"
                      stroke="#fff"
                      strokeWidth={2}
                      label={{
                        value: "₹24,58,300",
                        position: "top",
                        fill: "#e4e4e7",
                        fontSize: 11,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0d0d12] p-5">
              <h2 className="text-base font-semibold">Top Channels</h2>
              <ul className="mt-4 space-y-3">
                {CHANNELS.map((c) => (
                  <li key={c.name} className="flex items-center gap-3 text-sm text-neutral-300">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: c.color }}
                    />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent projects + AI Insights */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-white/5 bg-[#0d0d12] p-5">
              <h2 className="text-base font-semibold">Recent Projects</h2>
              <div className="mt-4 divide-y divide-white/5">
                <div className="grid grid-cols-12 gap-3 text-[11px] uppercase tracking-wider text-neutral-500 pb-2">
                  <div className="col-span-6">Project</div>
                  <div className="col-span-3">Users</div>
                  <div className="col-span-3">Status</div>
                </div>
                {PROJECTS.map((p) => (
                  <div key={p.name} className="grid grid-cols-12 gap-3 items-center py-3">
                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-indigo-500/15 grid place-items-center text-indigo-300">
                        <LineChartIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-wider">
                            Live
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">{p.updated}</p>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm tabular-nums">{p.users}</div>
                    <div className="col-span-3 text-sm">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          p.status === "Healthy" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.status === "Healthy" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#0d0d12] p-5">
              <h2 className="text-base font-semibold">AI Insights</h2>
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 grid place-items-center text-indigo-300 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-neutral-200">
                  Website conversion rate increased by{" "}
                  <span className="text-indigo-300 font-medium">20%</span> this week.
                </p>
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 grid place-items-center text-emerald-400 shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-neutral-200">
                  Organic search drove <span className="text-emerald-400 font-medium">38%</span> of
                  new signups this month.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
