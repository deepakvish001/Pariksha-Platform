import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
  { title: "Sheets", url: "/dashboard/sheets", icon: FileSpreadsheet },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Achievements", url: "/dashboard/achievements", icon: Trophy },
];

const libraryItems = [
  { title: "Position Wise Resources", url: "/library/positions", icon: Layers },
  { title: "Company Wise Resources", url: "/library/companies", icon: Building2 },
  { title: "Mass Recruitment", url: "/library/recruitment", icon: Users },
  { title: "Interview Questions", url: "/library/interview", icon: MessageSquare },
  { title: "DSA Questions", url: "/library/dsa", icon: Code2 },
  { title: "SQL Questions", url: "/library/sql", icon: Database },
  { title: "Aptitude Questions", url: "/library/aptitude", icon: HelpCircle },
  { title: "Core CS Subjects", url: "/library/cs", icon: Cpu },
  { title: "Handwritten Notes", url: "/library/notes", icon: FileText },
  { title: "Quiz", url: "/library/quiz", icon: Trophy },
  { title: "Quiz History", url: "/library/quiz-history", icon: Activity },
];

const fundamentalsItems = [
  { title: "Overview", url: "/fundamentals", icon: TrendingUp },
  { title: "Language", url: "/fundamentals/language", icon: Code2 },
  { title: "OOPs Concepts", url: "/fundamentals/oops", icon: FolderOpen },
];

const systemDesignItems = [
  { title: "Overview", url: "/system-design", icon: Layers },
  { title: "High Level Design", url: "/system-design/hld", icon: Network },
  { title: "Low Level Design", url: "/system-design/lld", icon: LayoutGrid },
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

const platformItems = [
  { title: "Astra AI", url: "/platform/ai", icon: Sparkles },
  { title: "Resources", url: "/platform/resources", icon: BookOpen },
  { title: "Collections", url: "/platform/collections", icon: FolderOpen },
  { title: "Affiliate", url: "/platform/affiliate", icon: TrendingUp },
];

const accountItems = [
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
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const isCollapsed = state === "collapsed";

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
        {/* Header with Logo */}
        <SidebarHeader className="border-b border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center justify-center py-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-orange flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <span className="text-primary-foreground font-bold text-lg">U</span>
              </div>
            </Link>
            {!isCollapsed && <NotificationBell />}
          </div>
          {isCollapsed && (
            <div className="flex justify-center mt-2">
              <NotificationBell />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          {/* Main Navigation */}
          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      size="lg"
                      className="transition-all duration-200 hover:translate-x-0.5 group/nav group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
                    >
                      <Link to={item.url} className="group-data-[collapsible=icon]:justify-center">
                        <item.icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/nav:scale-110" />
                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {/* Sign Out Button */}
                <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
                  <SidebarMenuButton
                    onClick={() => setIsSignOutDialogOpen(true)}
                    tooltip="Sign Out"
                    size="lg"
                    className="transition-all duration-200 hover:translate-x-0.5 group/signout hover:text-destructive group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg"
                  >
                    <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover/signout:scale-110" />
                    <span className="font-medium group-data-[collapsible=icon]:hidden">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="my-4 group-data-[collapsible=icon]:my-3" />

          {/* Collapsible Groups */}
          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 group-data-[collapsible=icon]:space-y-2">
                <CollapsibleGroup title="Library" items={libraryItems} />
                <CollapsibleGroup title="Fundamentals" items={fundamentalsItems} />
                <CollapsibleGroup title="System Design" items={systemDesignItems} />
                <CollapsibleGroup title="Research" items={researchItems} />
                <CollapsibleGroup title="Platform" items={platformItems} />
                <CollapsibleGroup title="Account" items={accountItems} defaultOpen />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with User Profile */}
        <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2">
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
