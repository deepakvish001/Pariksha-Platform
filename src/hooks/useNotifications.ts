 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface Notification {
   id: string;
   type: string;
   title: string;
   message: string;
   data: Record<string, unknown>;
   read: boolean;
   created_at: string;
 }
 
 export function useNotifications() {
   const { user } = useAuth();
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchNotifications = useCallback(async () => {
     if (!user) {
       setNotifications([]);
       setUnreadCount(0);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(50);
 
       if (error) throw error;
 
       const notifs = (data || []) as Notification[];
       setNotifications(notifs);
       setUnreadCount(notifs.filter((n) => !n.read).length);
     } catch (error) {
       console.error("Error fetching notifications:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchNotifications();
   }, [fetchNotifications]);
 
   // Subscribe to realtime notifications
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("notifications")
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "notifications",
           filter: `user_id=eq.${user.id}`,
         },
         (payload) => {
           const newNotif = payload.new as Notification;
           setNotifications((prev) => [newNotif, ...prev]);
           setUnreadCount((prev) => prev + 1);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user]);
 
   const markAsRead = async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ read: true })
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) =>
         prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
       );
       setUnreadCount((prev) => Math.max(0, prev - 1));
     } catch (error) {
       console.error("Error marking notification as read:", error);
     }
   };
 
   const markAllAsRead = async () => {
     if (!user) return;
 
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ read: true })
         .eq("user_id", user.id)
         .eq("read", false);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
       setUnreadCount(0);
     } catch (error) {
       console.error("Error marking all as read:", error);
     }
   };
 
   const deleteNotification = async (notificationId: string) => {
     try {
       const notif = notifications.find((n) => n.id === notificationId);
       const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
       if (notif && !notif.read) {
         setUnreadCount((prev) => Math.max(0, prev - 1));
       }
     } catch (error) {
       console.error("Error deleting notification:", error);
     }
   };
 
   return {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     refresh: fetchNotifications,
   };
 }