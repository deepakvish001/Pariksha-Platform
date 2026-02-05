 import { useStreakReminder } from "@/hooks/useStreakReminder";
 
 // This component just activates the streak reminder hook
 // It doesn't render anything but enables the reminder functionality
 const StreakReminderProvider = ({ children }: { children: React.ReactNode }) => {
   useStreakReminder();
   return <>{children}</>;
 };
 
 export default StreakReminderProvider;