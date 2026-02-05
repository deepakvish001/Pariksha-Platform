import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import StreakReminderProvider from "@/components/StreakReminderProvider";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <StreakReminderProvider>
        <DashboardSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </StreakReminderProvider>
    </SidebarProvider>
  );
}
