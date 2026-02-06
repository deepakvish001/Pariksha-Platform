import { useFaviconNotification } from "@/hooks/useFaviconNotification";

/**
 * Provider component that enables favicon notification badges.
 * This should be placed inside AuthProvider since it depends on useNotifications.
 */
export const FaviconNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useFaviconNotification();
  return <>{children}</>;
};
