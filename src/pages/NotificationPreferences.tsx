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
  RotateCcw,
  CheckSquare,
  Square,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotificationSettings {
  email_notifications_enabled: boolean;
  weekly_digest_enabled: boolean;
  new_feature_alerts_enabled: boolean;
  marketing_emails_enabled: boolean;
  // Per-type preferences
  notify_velocity_reminder: boolean;
  notify_achievement_unlock: boolean;
  notify_new_follower: boolean;
  notify_goal_milestone: boolean;
  notify_streak_reminder: boolean;
  notify_rare_achievement: boolean;
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
    notify_velocity_reminder: true,
    notify_achievement_unlock: true,
    notify_new_follower: true,
    notify_goal_milestone: true,
    notify_streak_reminder: true,
    notify_rare_achievement: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles_extended")
        .select(`
          email_notifications_enabled, 
          weekly_digest_enabled, 
          new_feature_alerts_enabled, 
          marketing_emails_enabled,
          notify_velocity_reminder,
          notify_achievement_unlock,
          notify_new_follower,
          notify_goal_milestone,
          notify_streak_reminder,
          notify_rare_achievement
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSettings({
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          weekly_digest_enabled: data.weekly_digest_enabled ?? true,
          new_feature_alerts_enabled: data.new_feature_alerts_enabled ?? true,
          marketing_emails_enabled: data.marketing_emails_enabled ?? false,
          notify_velocity_reminder: data.notify_velocity_reminder ?? true,
          notify_achievement_unlock: data.notify_achievement_unlock ?? true,
          notify_new_follower: data.notify_new_follower ?? true,
          notify_goal_milestone: data.notify_goal_milestone ?? true,
          notify_streak_reminder: data.notify_streak_reminder ?? true,
          notify_rare_achievement: data.notify_rare_achievement ?? true,
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

  const handleResetToDefaults = () => {
    setSettings({
      email_notifications_enabled: true,
      weekly_digest_enabled: true,
      new_feature_alerts_enabled: true,
      marketing_emails_enabled: false,
      notify_velocity_reminder: true,
      notify_achievement_unlock: true,
      notify_new_follower: true,
      notify_goal_milestone: true,
      notify_streak_reminder: true,
      notify_rare_achievement: true,
    });
    toast({ title: "Reset to defaults", description: "Click 'Save Preferences' to apply changes." });
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const notificationTypeKeys = [
    "notify_velocity_reminder",
    "notify_achievement_unlock",
    "notify_new_follower",
    "notify_goal_milestone",
    "notify_streak_reminder",
    "notify_rare_achievement",
  ] as const;

  const allNotificationTypesEnabled = notificationTypeKeys.every(
    (key) => settings[key]
  );

  const handleSelectAllNotificationTypes = () => {
    setSettings((prev) => ({
      ...prev,
      notify_velocity_reminder: true,
      notify_achievement_unlock: true,
      notify_new_follower: true,
      notify_goal_milestone: true,
      notify_streak_reminder: true,
      notify_rare_achievement: true,
    }));
  };

  const handleDeselectAllNotificationTypes = () => {
    setSettings((prev) => ({
      ...prev,
      notify_velocity_reminder: false,
      notify_achievement_unlock: false,
      notify_new_follower: false,
      notify_goal_milestone: false,
      notify_streak_reminder: false,
      notify_rare_achievement: false,
    }));
  };

  const notificationTypes = [
    {
      id: "notify_velocity_reminder",
      title: "Learning Velocity Reminders",
      description: "Get notified when you're falling behind on your weekly learning goals",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      id: "notify_achievement_unlock",
      title: "Achievement Unlocks",
      description: "Celebrate when you earn new badges and achievements",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "notify_rare_achievement",
      title: "Rare Achievement Alerts",
      description: "Get notified when people you follow earn rare achievements",
      icon: Sparkles,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      id: "notify_new_follower",
      title: "New Followers",
      description: "Know when someone starts following your progress",
      icon: UserPlus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "notify_goal_milestone",
      title: "Goal Milestones",
      description: "Celebrate hitting your learning milestones",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "notify_streak_reminder",
      title: "Streak Reminders",
      description: "Don't lose your learning streak - get reminded to practice",
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ] as const;

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
            <div>
              <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
              <p className="text-sm text-muted-foreground">Manage how you receive notifications</p>
            </div>
          </div>
          <Link to="/learn/notifications">
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
                    <Label htmlFor="push-notifications" className="text-base">Browser Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed
                        ? "You're receiving push notifications"
                        : "Enable to get instant updates even when the app is closed"}
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
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
                  <Label htmlFor="email-notifications-enabled" className="text-base">All Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Master toggle for all email communications</p>
                </div>
                <Switch
                  id="email-notifications-enabled"
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
                      <Label htmlFor="weekly-digest-enabled" className="text-sm">Weekly Quiz Summary</Label>
                      <p className="text-xs text-muted-foreground">Get a weekly report of your quiz performance</p>
                    </div>
                  </div>
                  <Switch
                    id="weekly-digest-enabled"
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
                      <Label htmlFor="new-feature-alerts-enabled" className="text-sm">New Feature Alerts</Label>
                      <p className="text-xs text-muted-foreground">Be the first to know about new features</p>
                    </div>
                  </div>
                  <Switch
                    id="new-feature-alerts-enabled"
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
                      <Label htmlFor="marketing-emails-enabled" className="text-sm">Marketing Emails</Label>
                      <p className="text-xs text-muted-foreground">Promotional offers and partner content</p>
                    </div>
                  </div>
                  <Switch
                    id="marketing-emails-enabled"
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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Notification Types</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllNotificationTypes}
                    disabled={allNotificationTypesEnabled}
                  >
                    <CheckSquare className="h-4 w-4 mr-1.5" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllNotificationTypes}
                    disabled={!notificationTypeKeys.some((key) => settings[key])}
                  >
                    <Square className="h-4 w-4 mr-1.5" />
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {notificationTypes.map((type) => {
                  const settingKey = type.id as keyof NotificationSettings;
                  const isEnabled = settings[settingKey] as boolean;
                  
                  return (
                    <div
                      key={type.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        isEnabled ? "bg-card hover:bg-muted/30" : "bg-muted/20 opacity-60"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-lg", type.bgColor)}>
                        <type.icon className={cn("h-5 w-5", type.color)} />
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-medium", !isEnabled && "text-muted-foreground")}>{type.title}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(v) => setSettings((prev) => ({ ...prev, [type.id]: v }))}
                        aria-label={type.title}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Toggle each notification type to customize your experience
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Notification Preferences?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all your notification preferences to their default values. 
                  Email notifications, weekly digest, and new feature alerts will be enabled. 
                  Marketing emails will be disabled. You'll still need to save after resetting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetToDefaults}>
                  Reset to Defaults
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={isSaving} className="flex-[2]" size="lg">
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
