import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import StreakReminderProvider from "@/components/StreakReminderProvider";
import { useRoutePersistence } from "@/hooks/useRoutePeristence";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Component to handle route persistence
function RoutePersistenceHandler() {
  useRoutePersistence();
  return null;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <StreakReminderProvider>
        <RoutePersistenceHandler />
        <DashboardSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </StreakReminderProvider>
    </SidebarProvider>
  );
}
