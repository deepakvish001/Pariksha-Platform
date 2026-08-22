import { motion } from "framer-motion";
import { Settings, Sun, Moon, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import XPLevelBadge from "@/components/XPLevelBadge";

const SettingsHeader = () => {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useThemeSync();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-3xl">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3 md:gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent" />
          
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Settings className="w-5 h-5 text-primary" />
              </div>
            </motion.div>
            
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Settings</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your account</p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* User info badge - hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary/50 border border-border"
          >
            <Avatar className="w-7 h-7 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium text-foreground leading-tight">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
          </motion.div>

          {/* Member since badge - hidden on mobile */}
          {memberSince && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/50 border border-border"
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Since {memberSince}</span>
            </motion.div>
          )}

          {/* XP Badge - compact on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden sm:block"
          >
            <XPLevelBadge compact />
          </motion.div>

          {/* Theme toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
};

export default SettingsHeader;
