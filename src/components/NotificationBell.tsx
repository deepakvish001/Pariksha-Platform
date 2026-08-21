 import { useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Bell, Check, Trash2, UserPlus, Trophy, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Badge } from "@/components/ui/badge";
 import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
 
 const getNotificationIcon = (type: string) => {
   switch (type) {
     case "new_follower":
       return <UserPlus className="h-4 w-4 text-blue-500" />;
     case "rare_achievement":
       return <Trophy className="h-4 w-4 text-amber-500" />;
     default:
       return <Bell className="h-4 w-4 text-muted-foreground" />;
   }
 };
 
 const NotificationItem = ({
   notification,
   onMarkRead,
   onDelete,
 }: {
   notification: Notification;
   onMarkRead: () => void;
   onDelete: () => void;
 }) => {
  const data = notification.data as Record<string, string>;
  const { extendedProfile } = useAuth();
  const profileUsername = (extendedProfile as { username?: string } | null)?.username ?? null;
 
   return (
     <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       exit={{ opacity: 0, x: 10 }}
       className={cn(
         "p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
         !notification.read && "bg-primary/5"
       )}
     >
       <div className="flex items-start gap-3">
         <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
         <div className="flex-1 min-w-0">
           <p className={cn("text-sm", !notification.read && "font-medium")}>
             {notification.message}
           </p>
           <p className="text-xs text-muted-foreground mt-1">
             {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
           </p>
          {notification.type === "new_follower" && data.follower_id && profileUsername && (
            <Link
              to={`/u/${profileUsername}`}
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View profile
            </Link>
          )}
         </div>
         <div className="flex items-center gap-1">
           {!notification.read && (
             <Button
               variant="ghost"
               size="icon"
               aria-label="Mark as read"
               className="h-6 w-6"
               onClick={onMarkRead}
             >
               <Check className="h-3 w-3" />
             </Button>
           )}
           <Button
             variant="ghost"
             size="icon"
             aria-label="Delete notification"
             className="h-6 w-6 text-muted-foreground hover:text-destructive"
             onClick={onDelete}
           >
             <Trash2 className="h-3 w-3" />
           </Button>
         </div>
       </div>
     </motion.div>
   );
 };
 
 const NotificationBell = () => {
   const [open, setOpen] = useState(false);
   const {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
   } = useNotifications();
 
   return (
     <Popover open={open} onOpenChange={setOpen}>
       <PopoverTrigger asChild>
         <Button variant="ghost" size="icon" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative">
           <Bell className="h-5 w-5" />
           {unreadCount > 0 && (
             <Badge
               variant="destructive"
               className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
             >
               {unreadCount > 9 ? "9+" : unreadCount}
             </Badge>
           )}
         </Button>
       </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b">
            <Link to="/learn/notifications" className="font-semibold hover:text-primary transition-colors">
              Notifications
            </Link>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </div>
         <ScrollArea className="h-[300px]">
           {isLoading ? (
             <div className="p-4 text-center text-sm text-muted-foreground">
               
             </div>
           ) : notifications.length === 0 ? (
             <div className="p-8 text-center">
               <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
               <p className="text-sm text-muted-foreground">No notifications yet</p>
             </div>
           ) : (
             <AnimatePresence>
               {notifications.map((notif) => (
                 <NotificationItem
                   key={notif.id}
                   notification={notif}
                   onMarkRead={() => markAsRead(notif.id)}
                   onDelete={() => deleteNotification(notif.id)}
                 />
               ))}
             </AnimatePresence>
           )}
         </ScrollArea>
       </PopoverContent>
     </Popover>
   );
 };
 
 export default NotificationBell;