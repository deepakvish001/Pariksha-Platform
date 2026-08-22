import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Megaphone,
  Newspaper,
  Sparkles,
  Check,
  Loader2,
  CheckCheck,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import SettingsCard from "./SettingsCard";

interface NotificationPrefs {
  email_notifications_enabled: boolean;
  marketing_emails_enabled: boolean;
  weekly_digest_enabled: boolean;
  new_feature_alerts_enabled: boolean;
}

const notificationTypes = [
  {
    id: "email_notifications_enabled",
    icon: Mail,
    title: "Email Notifications",
    description: "Receive important updates via email",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "weekly_digest_enabled",
    icon: Newspaper,
    title: "Weekly Quiz Summary",
    description: "Receive a weekly email with your quiz stats, streak, and achievements (sent every Sunday)",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "new_feature_alerts_enabled",
    icon: Sparkles,
    title: "New Feature Alerts",
    description: "Be the first to know about new features",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "marketing_emails_enabled",
    icon: Megaphone,
    title: "Marketing Emails",
    description: "Receive promotional content and offers",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
];

const SettingsNotificationsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email_notifications_enabled: true,
    marketing_emails_enabled: false,
    weekly_digest_enabled: true,
    new_feature_alerts_enabled: true,
  });
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPrefs | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles_extended")
        .select("email_notifications_enabled, marketing_emails_enabled, weekly_digest_enabled, new_feature_alerts_enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        const fetchedPrefs = {
          email_notifications_enabled: data.email_notifications_enabled ?? true,
          marketing_emails_enabled: data.marketing_emails_enabled ?? false,
          weekly_digest_enabled: data.weekly_digest_enabled ?? true,
          new_feature_alerts_enabled: data.new_feature_alerts_enabled ?? true,
        };
        setPrefs(fetchedPrefs);
        setOriginalPrefs(fetchedPrefs);
      }
    };

    fetchPrefs();
  }, [user]);

  useEffect(() => {
    if (originalPrefs) {
      const changed = Object.keys(prefs).some(
        (key) => prefs[key as keyof NotificationPrefs] !== originalPrefs[key as keyof NotificationPrefs]
      );
      setHasChanges(changed);
    }
  }, [prefs, originalPrefs]);

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setPrefs({
      email_notifications_enabled: true,
      marketing_emails_enabled: true,
      weekly_digest_enabled: true,
      new_feature_alerts_enabled: true,
    });
  };

  const deselectAll = () => {
    setPrefs({
      email_notifications_enabled: false,
      marketing_emails_enabled: false,
      weekly_digest_enabled: false,
      new_feature_alerts_enabled: false,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);

    const { error } = await supabase
      .from("user_profiles_extended")
      .update(prefs)
      .eq("user_id", user.id);

    if (error) {
      toast({ variant: "destructive", title: "Failed to save", description: error.message });
    } else {
      setOriginalPrefs(prefs);
      toast({ title: "Notification preferences saved" });
    }

    setIsSaving(false);
  };

  const allSelected = Object.values(prefs).every((v) => v);
  const noneSelected = Object.values(prefs).every((v) => !v);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Email Preferences Card */}
      <SettingsCard delay={0}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Bell className="w-4 h-4 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Email Preferences</h2>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              disabled={allSelected}
              className="text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              disabled={noneSelected}
              className="text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-4 h-4 mr-1" />
              None
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          {notificationTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base text-foreground">{type.title}</Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  checked={prefs[type.id as keyof NotificationPrefs]}
                  onCheckedChange={() => togglePref(type.id as keyof NotificationPrefs)}
                  className="data-[state=checked]:bg-primary"
                  aria-label={type.title}
                />
              </div>
              {index < notificationTypes.length - 1 && (
                <Separator className="bg-border" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex-1"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Save Notification Preferences
          </Button>
          
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            </motion.div>
          )}
        </div>
      </SettingsCard>
    </motion.div>
  );
};

export default SettingsNotificationsTab;
