import { Link, useLocation } from "react-router-dom";
import { Shield, FileCode2, Upload, ScrollText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/problems", label: "Problems", icon: FileCode2 },
  { to: "/admin/problems/import", label: "Bulk Import", icon: Upload },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <aside className="lg:w-56 shrink-0">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Admin</h2>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.end
                ? pathname === item.to
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
};
