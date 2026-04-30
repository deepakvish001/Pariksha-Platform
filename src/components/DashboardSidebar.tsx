import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid,
  FileSpreadsheet,
  User,
  LogOut,
  LogIn,
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
  Home,
  TrendingUp as ProgressIcon,
  GraduationCap,
  Briefcase,
  Wrench,
  PanelLeftClose,
  PanelLeft,
  Brain,
  Target,
  Compass,
  ClipboardList,
  Star,
  UsersRound,
  MessageCircle,
  Route,
  Lock,
  Terminal,
  History as HistoryIcon,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
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
import BrandLogo from "@/components/BrandLogo";
import { GuestSidebarTooltip } from "@/components/GuestSidebarTooltip";

// Home section - Main entry points
// NOTE: Profile uses a sentinel "__profile__" url that gets resolved at render time
// to `/u/<username>` for the logged-in user.
const PROFILE_SENTINEL = "__profile__";
const homeNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "My Plan", url: "/dashboard/my-plan", icon: Sparkles },
  { title: "Sheets", url: "/dashboard/sheets", icon: FileSpreadsheet },
  { title: "Roadmap", url: "/dashboard/roadmaps", icon: Route },
  { title: "Coding Problems", url: "/library/problems", icon: Terminal },
  { title: "Leaderboard", url: "/dashboard/leaderboard", icon: Trophy },
  { title: "Profile", url: PROFILE_SENTINEL, icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}



export function DashboardSidebar() {
  const { user, profile, extendedProfile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, resolvedTheme, setTheme } = useThemeSync();
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [shouldShakeBell, setShouldShakeBell] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount);
  const isCollapsed = state === "collapsed";
  const isGuest = !user;
  const { isAdmin } = useUserRole();
  const visibleHomeNavItems = isAdmin
    ? [...homeNavItems, { title: "Admin Panel", url: "/admin", icon: Shield }]
    : homeNavItems;

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
        {/* Header with Logo, Theme Toggle, and Sidebar Toggle */}
        <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
          {/* Expanded state header */}
          <div className={cn(
            "flex items-center justify-between",
            isCollapsed && "hidden"
          )}>
            <BrandLogo size="md" showText={false} />
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-9 px-2.5 rounded-lg hover:bg-sidebar-accent transition-all duration-200 gap-2 overflow-hidden"
                  >
                    <motion.div
                      key={`theme-expanded-${theme}`}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getThemeIcon()}
                    </motion.div>
                    <span className="text-xs font-medium text-sidebar-foreground/70">
                      {getThemeLabel()}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Click to switch theme
                </TooltipContent>
              </Tooltip>
              <NotificationBell />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleSidebar()}
                    className="h-9 w-9 rounded-lg hover:bg-sidebar-accent transition-all duration-200"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Collapse sidebar
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Collapsed state header */}
          <div className={cn(
            "flex flex-col items-center gap-2",
            !isCollapsed && "hidden"
          )}>
            <BrandLogo size="sm" showText={false} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleSidebar()}
                  className="h-10 w-10 rounded-lg hover:bg-sidebar-accent transition-all duration-200"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expand sidebar
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-10 w-10 rounded-lg hover:bg-sidebar-accent transition-all duration-200"
                >
                  <motion.div
                    key={`theme-collapsed-${theme}`}
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
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          {/* Home Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10">
                  <Home className="h-3 w-3 text-primary" />
                </div>
                <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest">
                  Home
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <Home className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Home</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                {visibleHomeNavItems.map((item) => {
                  const isProfile = item.url === PROFILE_SENTINEL;
                  const username = (extendedProfile as { username?: string } | null)?.username ?? null;
                  const resolvedUrl = isProfile
                    ? username
                      ? `/u/${username}`
                      : user
                        ? "/onboarding"
                        : "/login"
                    : item.url;
                  const isRoadmap = item.url === "/dashboard/roadmaps";
                  const handleClick = isRoadmap
                    ? (e: React.MouseEvent) => {
                        // Restore last opened roadmap if available
                        try {
                          const lastId = localStorage.getItem("last-opened-roadmap-id");
                          if (lastId) {
                            e.preventDefault();
                            const target =
                              lastId === "fullstack"
                                ? "/dashboard/roadmap/fullstack"
                                : `/dashboard/roadmaps/${lastId}`;
                            navigate(target);
                          }
                        } catch {
                          /* ignore */
                        }
                      }
                    : undefined;
                  const isActive = isProfile
                    ? location.pathname.startsWith("/u/") &&
                      !!username &&
                      location.pathname === `/u/${username}`
                    : location.pathname === resolvedUrl;
                  return (
                    <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        size="lg"
                        className="transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
                      >
                        <Link to={resolvedUrl} onClick={handleClick} className="group-data-[collapsible=icon]:justify-center">
                          <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                          <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>


          {/* Byteskill AI Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-primary/10">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest">
                  Byteskill AI
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Byteskill AI</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Create with AI" items={createWithAIItems} groupIcon={Sparkles} iconColor="text-primary" />
                <CollapsibleGroup title="My Learning" items={myAILearningItems} groupIcon={GraduationCap} iconColor="text-primary" />
                {aiChatItems.map((item) => {
                  const locked = isRouteLocked(item.url);
                  return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      className={cn("transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg", locked && "opacity-50")}
                    >
                      <Link to={locked ? "/under-construction" : item.url} className="group-data-[collapsible=icon]:justify-center pl-4">
                        <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                        <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  );
                })}
                {aiCommunityItems.map((item) => {
                  const locked = isRouteLocked(item.url);
                  return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      className={cn("transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg", locked && "opacity-50")}
                    >
                      <Link to={locked ? "/under-construction" : item.url} className="group-data-[collapsible=icon]:justify-center pl-4">
                        <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                        <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* My Learning Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/10">
                  <GraduationCap className="h-3 w-3 text-blue-500" />
                </div>
                <p className="text-[10px] font-semibold text-blue-500/80 uppercase tracking-widest">
                  My Learning
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <GraduationCap className="h-3 w-3 text-blue-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">My Learning</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Fundamentals" items={fundamentalsItems} groupIcon={BookOpen} iconColor="text-blue-500" />
                <CollapsibleGroup title="Practice" items={practiceItems} groupIcon={Target} iconColor="text-blue-400" />
                <CollapsibleGroup title="Quizzes" items={quizItems} groupIcon={Brain} iconColor="text-blue-300" />
                <CollapsibleGroup title="System Design" items={systemDesignItems} groupIcon={Network} iconColor="text-blue-500" />
                <CollapsibleGroup title="Roadmaps" items={roadmapItems} groupIcon={Compass} iconColor="text-blue-400" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Career Section */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-purple-500/10">
                  <Briefcase className="h-3 w-3 text-purple-500" />
                </div>
                <p className="text-[10px] font-semibold text-purple-500/80 uppercase tracking-widest">
                  Career
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                      <Briefcase className="h-3 w-3 text-purple-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Career</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Companies" items={companyItems} groupIcon={Building2} iconColor="text-purple-500" />
                <CollapsibleGroup title="Resume" items={resumeItems} groupIcon={FileCheck} iconColor="text-purple-400" />
                <CollapsibleGroup title="Job Search" items={jobSearchItems} groupIcon={Search} iconColor="text-purple-300" />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Resources & Tools */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-amber-500/10">
                  <Wrench className="h-3 w-3 text-amber-500" />
                </div>
                <p className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-widest">
                  Resources
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <Wrench className="h-3 w-3 text-amber-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Resources</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                {resourceItems.map((item) => {
                  const locked = isRouteLocked(item.url);
                  return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      className={cn("transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg", locked && "opacity-50")}
                    >
                      <Link to={locked ? "/under-construction" : item.url} className="group-data-[collapsible=icon]:justify-center pl-4">
                        <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                        <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {!isGuest && (
          <>
          <SidebarSeparator className="my-3 group-data-[collapsible=icon]:my-2" />

          {/* Progress & Profile Section - only for logged-in users */}
          <SidebarGroup className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10">
                  <ProgressIcon className="h-3 w-3 text-emerald-500" />
                </div>
                <p className="text-[10px] font-semibold text-emerald-500/80 uppercase tracking-widest">
                  Account
                </p>
              </div>
            )}
            {isCollapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center py-1">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <ProgressIcon className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Account</TooltipContent>
              </Tooltip>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                {progressNavItems.map((item) => {
                  const locked = isRouteLocked(item.url);
                  return (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      className={cn("transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg", locked && "opacity-50")}
                    >
                      <Link to={locked ? "/under-construction" : item.url} className="group-data-[collapsible=icon]:justify-center pl-4">
                        <div className="relative">
                          <motion.div
                            animate={item.title === "Notifications" && shouldShakeBell ? {
                              rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                            } : {}}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
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
                        <span className="group-data-[collapsible=icon]:hidden flex-1">{item.title}</span>
                        {locked && <Lock className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          </>
          )}
        </SidebarContent>

        {/* Footer with User Profile and Sign Out / Guest Sign In */}
        <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2 space-y-2">
          {isGuest ? (
            /* Guest user - show sign in buttons */
            isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => navigate("/login")}
                    className="h-10 w-10 mx-auto rounded-lg"
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign In</TooltipContent>
              </Tooltip>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/signup")}
                  className="w-full gap-2"
                >
                  <User className="h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            )
          ) : (
            /* Logged-in user */
            <>
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
            </>
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
