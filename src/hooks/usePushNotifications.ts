import { useState, useEffect, useCallback } from "react";
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

  // Show a local notification (for testing/immediate feedback)
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
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
    showNotification,
    isSupported: "Notification" in window,
  };
}
