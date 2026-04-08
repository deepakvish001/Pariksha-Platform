import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import StreakReminderProvider from "@/components/StreakReminderProvider";
import { useRoutePersistence } from "@/hooks/useRoutePeristence";
import { GuestSignupBanner } from "@/components/GuestSignupBanner";

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
          <GuestSignupBanner />
          {children}
        </SidebarInset>
      </StreakReminderProvider>
    </SidebarProvider>
  );
}
