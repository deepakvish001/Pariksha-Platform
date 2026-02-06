import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid,
  FileSpreadsheet,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  Layers,
  Building2,
  Users,
  MessageSquare,
  Code2,
  Database,
  FileText,
  HelpCircle,
  Trophy,
  BookOpen,
  Cpu,
  Network,
  Search,
  List,
  Map,
  FileCheck,
  FileSearch,
  Send,
  Activity,
  Sparkles,
  FolderOpen,
  TrendingUp,
  Settings,
  Bell,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/NotificationBell";

// Primary navigation - Core dashboard features
const primaryNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "Sheets", url: "/dashboard/sheets", icon: FileSpreadsheet },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Achievements", url: "/dashboard/achievements", icon: Trophy },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
];

// Learning section groups - ordered by learning progression
const fundamentalsItems = [
  { title: "Overview", url: "/fundamentals", icon: TrendingUp },
  { title: "Language", url: "/fundamentals/language", icon: Code2 },
  { title: "OOPs Concepts", url: "/fundamentals/oops", icon: FolderOpen },
];

const libraryItems = [
  { title: "DSA Questions", url: "/library/dsa", icon: Code2 },
  { title: "SQL Questions", url: "/library/sql", icon: Database },
  { title: "Aptitude Questions", url: "/library/aptitude", icon: HelpCircle },
  { title: "Core CS Subjects", url: "/library/cs", icon: Cpu },
  { title: "Interview Questions", url: "/library/interview", icon: MessageSquare },
  { title: "Handwritten Notes", url: "/library/notes", icon: FileText },
  { title: "Quiz", url: "/library/quiz", icon: Trophy },
  { title: "Quiz History", url: "/library/quiz-history", icon: Activity },
];

const systemDesignItems = [
  { title: "Overview", url: "/system-design", icon: Layers },
  { title: "High Level Design", url: "/system-design/hld", icon: Network },
  { title: "Low Level Design", url: "/system-design/lld", icon: LayoutGrid },
];

// Career section groups - job search & preparation
const companyItems = [
  { title: "Position Wise Resources", url: "/library/positions", icon: Layers },
  { title: "Company Wise Resources", url: "/library/companies", icon: Building2 },
  { title: "Mass Recruitment", url: "/library/recruitment", icon: Users },
];

const researchItems = [
  { title: "Overview", url: "/research", icon: TrendingUp },
  { title: "Job Portals", url: "/research/jobs", icon: List },
  { title: "Roadmap", url: "/research/roadmap", icon: Map },
  { title: "Resume Templates", url: "/research/resume", icon: FileCheck },
  { title: "Resume Analyser", url: "/research/analyser", icon: FileSearch },
  { title: "Cold DMs / Emails", url: "/research/outreach", icon: Send },
  { title: "My Activity", url: "/research/activity", icon: Activity },
];

// Tools & Settings
const platformItems = [
  { title: "Astra AI", url: "/platform/ai", icon: Sparkles },
  { title: "Resources", url: "/platform/resources", icon: BookOpen },
  { title: "Collections", url: "/platform/collections", icon: FolderOpen },
];

const settingsItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

interface CollapsibleGroupProps {
  title: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  defaultOpen?: boolean;
}

const CollapsibleGroup = ({ title, items, defaultOpen = false }: CollapsibleGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActiveGroup = items.some(item => location.pathname === item.url);

  // Get the first item's icon to show as group icon when collapsed
  const GroupIcon = items[0]?.icon;

  if (isCollapsed) {
    // When collapsed, show a dropdown with group items
    return (
      <SidebarMenuItem className="flex justify-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              tooltip={title}
              className={cn(
                "transition-all duration-200 hover:scale-105 justify-center h-10 w-10 mx-auto rounded-lg",
                isActiveGroup && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              {GroupIcon && (
                <div className="relative flex items-center justify-center">
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  {isActiveGroup && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              )}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" align="start" className="p-0 w-48">
            <div className="py-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
              {items.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                    location.pathname === item.url && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={isOpen || isActiveGroup} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 rounded-md transition-all duration-200 group"
        >
          <span className="group-hover:translate-x-0.5 transition-transform duration-200">{title}</span>
          <span className="transition-transform duration-200">
            {isOpen || isActiveGroup ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5" />
            )}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === item.url}
              tooltip={item.title}
              className="transition-all duration-200 hover:translate-x-0.5 group/item"
            >
              <Link to={item.url} className="pl-4">
                <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/item:scale-110" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export function DashboardSidebar() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, resolvedTheme, setTheme } = useThemeSync();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [shouldShakeBell, setShouldShakeBell] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);
  const isCollapsed = state === "collapsed";

  const getNextTheme = () => {
    if (theme === "light") return "dark";
    if (theme === "dark") return "system";
    return "light";
  };

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (resolvedTheme === "dark") return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === "system") return "System";
    if (theme === "dark") return "Dark";
    return "Light";
  };

  const toggleTheme = () => {
    setTheme(getNextTheme());
  };

  // Detect new notifications and trigger shake
  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setShouldShakeBell(true);
      const timer = setTimeout(() => setShouldShakeBell(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  const handleSignOut = async () => {
    await signOut();
    setIsSignOutDialogOpen(false);
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="overflow-hidden">
        {/* Header with Logo and Theme Toggle */}
        <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-orange flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <span className="text-primary-foreground font-bold text-lg">U</span>
              </div>
            </Link>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTheme}
                      className="h-9 px-2.5 rounded-lg hover:bg-sidebar-accent transition-all duration-200 gap-2 overflow-hidden"
                    >
                      <motion.div
                        key={theme}
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {getThemeIcon()}
                      </motion.div>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={theme}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="text-xs font-medium text-sidebar-foreground/70"
                        >
                          {getThemeLabel()}
                        </motion.span>
                      </AnimatePresence>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Click to switch theme
                  </TooltipContent>
                </Tooltip>
                <NotificationBell />
              </div>
            )}
          </div>
          {isCollapsed && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-10 w-10 rounded-lg hover:bg-sidebar-accent transition-all duration-200"
                  >
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getThemeIcon()}
                    </motion.div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {getThemeLabel()} mode (click to switch)
                </TooltipContent>
              </Tooltip>
              <NotificationBell />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          {/* Primary Navigation */}
          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                {primaryNavItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      size="lg"
                      className="transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
                    >
                      <Link to={item.url} className="group-data-[collapsible=icon]:justify-center">
                        <div className="relative">
                          <motion.div
                            animate={item.title === "Notifications" && shouldShakeBell ? {
                              rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                            } : {}}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                          </motion.div>
                          <AnimatePresence>
                            {item.title === "Notifications" && unreadCount > 0 && (
                              <motion.span
                                key={unreadCount}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground"
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Learning Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                Learning
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Fundamentals" items={fundamentalsItems} />
                <CollapsibleGroup title="Practice" items={libraryItems} />
                <CollapsibleGroup title="System Design" items={systemDesignItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Career Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                Career
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Companies" items={companyItems} />
                <CollapsibleGroup title="Research" items={researchItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Tools & Settings */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 py-1 text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest">
                Tools
              </p>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Platform" items={platformItems} />
                <CollapsibleGroup title="Settings" items={settingsItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with User Profile and Sign Out */}
        <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2 space-y-2">
          {/* User Profile */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center cursor-pointer">
                  <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform duration-200 hover:scale-105">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                <div>
                  <p className="font-medium">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">Free plan</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/30 transition-all duration-200 cursor-pointer group/profile">
              <Avatar className="h-10 w-10 border-2 border-primary/20 transition-transform duration-200 group-hover/profile:scale-105">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 transition-transform duration-200 group-hover/profile:translate-x-0.5">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-primary truncate">Free plan</p>
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSignOutDialogOpen(true)}
                  className="h-10 w-10 mx-auto rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsSignOutDialogOpen(true)}
              className="w-full justify-start gap-2 h-10 px-3 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group/signout"
            >
              <LogOut className="h-4 w-4 transition-transform duration-200 group-hover/signout:scale-110" />
              <span className="text-sm font-medium">Sign Out</span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account? You'll need to sign in again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
