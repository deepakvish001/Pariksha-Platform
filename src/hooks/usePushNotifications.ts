import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  is_active: boolean;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isDocumentVisible = useRef(true);

  // Track document visibility for background notifications
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisible.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Check current permission status
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if user has an active subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        setIsSubscribed(true);
      }
      setIsLoading(false);
    };

    checkSubscription();
  }, [user]);

  // Listen for new notifications and show browser notifications
  useEffect(() => {
    if (!user || !isSubscribed || permission !== "granted") return;

    const channel = supabase
      .channel("push-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            title: string;
            message: string;
            type: string;
          };

          // Show browser notification (especially useful when tab is in background)
          showBrowserNotification(notification.title, {
            body: notification.message,
            tag: notification.type,
            requireInteraction: false,
            silent: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSubscribed, permission]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("This browser doesn't support notifications");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notifications enabled!");
        return true;
      } else if (result === "denied") {
        toast.error("Notification permission denied. You can enable it in browser settings.");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error("Failed to request notification permission");
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to enable notifications");
      return false;
    }

    // First request permission
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // For browser notifications without service worker, we just store the preference
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: `browser-${user.id}`,
          p256dh: "browser-notification",
          auth: "browser-notification",
          is_active: true,
        }, {
          onConflict: "user_id,endpoint"
        });

      if (error) throw error;
      
      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
      return true;
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast.error("Failed to enable notifications");
      return false;
    }
  }, [user, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;
      
      setIsSubscribed(false);
      toast.success("Push notifications disabled");
      return true;
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      toast.error("Failed to disable notifications");
      return false;
    }
  }, [user]);

  // Show a browser notification
  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus the window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [permission]);

  return {
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification: showBrowserNotification,
    isSupported: "Notification" in window,
  };
}
