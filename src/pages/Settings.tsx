import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsProfileTab from "@/components/settings/SettingsProfileTab";
import SettingsSecurityTab from "@/components/settings/SettingsSecurityTab";
import SettingsNotificationsTab from "@/components/settings/SettingsNotificationsTab";
import SettingsAccountTab from "@/components/settings/SettingsAccountTab";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptDialog } from "@/components/LoginPromptDialog";

const tabs = [
  { id: "profile", label: "Profile", icon: User, color: "text-primary" },
  { id: "security", label: "Security", icon: Lock, color: "text-blue-500" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "text-purple-500" },
  { id: "account", label: "Account", icon: Shield, color: "text-amber-500" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);

  return (
    <div className="min-h-screen bg-background">
      <SettingsHeader />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {!user && (
          <LoginPromptDialog
            open={showLoginPrompt}
            onOpenChange={setShowLoginPrompt}
            message="Sign in to access and modify your settings."
          />
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <TabsList className="w-full grid grid-cols-4 bg-card/80 backdrop-blur-sm border border-border p-1.5 rounded-xl h-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative flex items-center justify-center gap-2 py-3 px-2 rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-foreground",
                    "data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 transition-colors", activeTab === tab.id ? tab.color : "text-current")} />
                  <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-lg bg-gradient-to-b from-foreground/[0.03] to-transparent pointer-events-none"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
              <SettingsProfileTab />
            </TabsContent>
            <TabsContent value="security" className="mt-0 focus-visible:outline-none">
              <SettingsSecurityTab />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0 focus-visible:outline-none">
              <SettingsNotificationsTab />
            </TabsContent>
            <TabsContent value="account" className="mt-0 focus-visible:outline-none">
              <SettingsAccountTab />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
