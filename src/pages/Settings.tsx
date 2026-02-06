import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Bell, Brain, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AstraBackground from "@/components/astra/AstraBackground";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsProfileTab from "@/components/settings/SettingsProfileTab";
import SettingsSecurityTab from "@/components/settings/SettingsSecurityTab";
import SettingsNotificationsTab from "@/components/settings/SettingsNotificationsTab";
import SettingsLearningTab from "@/components/settings/SettingsLearningTab";
import SettingsAccountTab from "@/components/settings/SettingsAccountTab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User, color: "text-primary" },
  { id: "security", label: "Security", icon: Lock, color: "text-blue-400" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "text-purple-400" },
  { id: "learning", label: "Learning", icon: Brain, color: "text-emerald-400" },
  { id: "account", label: "Account", icon: Shield, color: "text-amber-400" },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen relative">
      {/* Immersive background */}
      <AstraBackground />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Glassmorphism Header */}
        <SettingsHeader />

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Enhanced Tab Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TabsList className="w-full grid grid-cols-5 bg-black/40 backdrop-blur-2xl border border-white/[0.05] p-1.5 rounded-xl h-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "relative flex items-center justify-center gap-2 py-3 px-2 rounded-lg transition-all duration-200",
                      "text-white/50 hover:text-white/80",
                      "data-[state=active]:bg-white/[0.08] data-[state=active]:text-white data-[state=active]:shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    )}
                  >
                    <tab.icon className={cn(
                      "w-4 h-4 transition-colors",
                      activeTab === tab.id ? tab.color : "text-current"
                    )} />
                    <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                    
                    {/* Active indicator glow */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabGlow"
                        className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Tab Content with Animations */}
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

              <TabsContent value="learning" className="mt-0 focus-visible:outline-none">
                <SettingsLearningTab />
              </TabsContent>

              <TabsContent value="account" className="mt-0 focus-visible:outline-none">
                <SettingsAccountTab />
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Settings;
