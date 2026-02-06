import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Smartphone,
  TrendingUp,
  Trophy,
  UserPlus,
  Target,
  Calendar,
  Sparkles,
  Check,
  Info,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface NotificationSettings {
  email_notifications_enabled: boolean;
  weekly_digest_enabled: boolean;
  new_feature_alerts_enabled: boolean;
  marketing_emails_enabled: boolean;
}

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading: pushLoading } = usePushNotifications();
  
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications_enabled: true,
    weekly_digest_enabled: true,
    new_feature_alerts_enabled: true,
    marketing_emails_enabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles_extended")
        .select("email_notifications_enabled, weekly_digest_enabled, new_feature_alerts_enabled, marketing_emails_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          weekly_digest_enabled: data.weekly_digest_enabled ?? true,
          new_feature_alerts_enabled: data.new_feature_alerts_enabled ?? true,
          marketing_emails_enabled: data.marketing_emails_enabled ?? false,
        });
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("user_profiles_extended")
      .update(settings)
      .eq("user_id", user.id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to save preferences", description: error.message });
    } else {
      toast({ title: "Preferences saved!", description: "Your notification settings have been updated." });
    }

    setIsSaving(false);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const notificationTypes = [
    {
      id: "velocity_reminder",
      title: "Learning Velocity Reminders",
      description: "Get notified when you're falling behind on your weekly learning goals",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      id: "achievement",
      title: "Achievement Unlocks",
      description: "Celebrate when you earn new badges and achievements",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "follower",
      title: "New Followers",
      description: "Know when someone starts following your progress",
      icon: UserPlus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "goal_milestone",
      title: "Goal Milestones",
      description: "Celebrate hitting roadmap completion milestones",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "streak",
      title: "Streak Reminders",
      description: "Don't lose your learning streak - get reminded to practice",
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
              <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
            </div>
          </div>
          <Link to="/dashboard/notifications">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              View Notifications
            </Button>
          </Link>
        </div>
      </header>

      <div className="container max-w-4xl py-8 space-y-8">
        {/* Push Notifications Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Push Notifications</CardTitle>
                  <CardDescription>Receive real-time notifications in your browser</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isSupported ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Browser Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed 
                        ? "You're receiving push notifications" 
                        : "Enable to get instant updates even when the app is closed"}
                    </p>
                  </div>
                  <Switch
                    checked={isSubscribed}
                    onCheckedChange={handlePushToggle}
                    disabled={pushLoading}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Push notifications are not supported in your browser. Try using Chrome, Firefox, or Edge.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Notifications Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Control what emails you receive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">All Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Master toggle for all email communications</p>
                </div>
                <Switch
                  checked={settings.email_notifications_enabled}
                  onCheckedChange={(v) => setSettings((prev) => ({ ...prev, email_notifications_enabled: v }))}
                />
              </div>

              <Separator />

              <div className={cn("space-y-4", !settings.email_notifications_enabled && "opacity-50 pointer-events-none")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Calendar className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm">Weekly Quiz Summary</Label>
                      <p className="text-xs text-muted-foreground">Get a weekly report of your quiz performance</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.weekly_digest_enabled}
                    onCheckedChange={(v) => setSettings((prev) => ({ ...prev, weekly_digest_enabled: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Sparkles className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm">New Feature Alerts</Label>
                      <p className="text-xs text-muted-foreground">Be the first to know about new features</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.new_feature_alerts_enabled}
                    onCheckedChange={(v) => setSettings((prev) => ({ ...prev, new_feature_alerts_enabled: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-sm">Marketing Emails</Label>
                      <p className="text-xs text-muted-foreground">Promotional offers and partner content</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.marketing_emails_enabled}
                    onCheckedChange={(v) => setSettings((prev) => ({ ...prev, marketing_emails_enabled: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Types Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>These are the types of notifications you'll receive</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {notificationTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn("p-2.5 rounded-lg", type.bgColor)}>
                      <type.icon className={cn("h-5 w-5", type.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{type.title}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                All notification types are enabled. Individual type controls coming soon.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button onClick={handleSave} disabled={isSaving} className="w-full" size="lg">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Preferences
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
