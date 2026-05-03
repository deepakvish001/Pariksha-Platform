import { Outlet, NavLink } from "react-router-dom";
import { ArenaBackground } from "./components/ArenaBackground";
import { Swords, Trophy, Users, Lock, BarChart3, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/arena", label: "Arena", icon: Home, end: true },
  { to: "/arena/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/arena/friends", label: "Friends", icon: Users },
  { to: "/arena/private", label: "Private", icon: Lock },
  { to: "/arena/history", label: "History", icon: BarChart3 },
];

export function ArenaLayout() {
  return (
    <div className="min-h-screen bg-[#030305] text-white relative">
      <ArenaBackground />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="container flex h-14 items-center gap-4">
          <NavLink to="/arena" className="flex items-center gap-2 font-black tracking-wider">
            <Swords className="h-5 w-5 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">BATTLE ARENA</span>
          </NavLink>
          <nav className="flex items-center gap-1 ml-4">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                    isActive ? "bg-cyan-400/10 text-cyan-300 shadow-[0_0_12px_-2px_rgba(34,211,238,0.5)]" : "text-white/60 hover:text-white",
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <NavLink to="/dashboard" className="text-xs text-white/50 hover:text-white">← Back to platform</NavLink>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
