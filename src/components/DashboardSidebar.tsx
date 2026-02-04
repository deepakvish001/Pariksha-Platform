import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home,
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

const mainNavItems = [
  { title: "Progress", url: "/dashboard", icon: Home },
  { title: "Matrix", url: "/dashboard/matrix", icon: LayoutGrid },
  { title: "Sheets", url: "/dashboard/sheets", icon: FileSpreadsheet },
  { title: "Profile", url: "/dashboard/profile", icon: User },
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
];

const fundamentalsItems = [
  { title: "Language", url: "/fundamentals/language", icon: Code2 },
  { title: "OOPs Concepts", url: "/fundamentals/oops", icon: FolderOpen },
];

const systemDesignItems = [
  { title: "High Level Design", url: "/system-design/hld", icon: Network },
  { title: "Low Level Design", url: "/system-design/lld", icon: LayoutGrid },
];

const researchItems = [
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

  return (
    <Collapsible open={isOpen || isActiveGroup} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors",
            isCollapsed && "justify-center px-2"
          )}
        >
          {!isCollapsed && <span>{title}</span>}
          {!isCollapsed && (
            isOpen || isActiveGroup ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === item.url}
              tooltip={item.title}
            >
              <Link to={item.url} className="pl-4">
                <item.icon className="h-4 w-4" />
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
      <Sidebar collapsible="icon">
        {/* Header with Logo */}
        <SidebarHeader className="border-b border-sidebar-border">
          <Link to="/" className="flex items-center justify-center py-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">U</span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                      size="lg"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                {/* Sign Out Button */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsSignOutDialogOpen(true)}
                    tooltip="Sign Out"
                    size="lg"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* Collapsible Groups */}
          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu>
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
        <SidebarFooter className="border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 p-2",
            isCollapsed && "justify-center"
          )}>
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-primary truncate">Free plan</p>
              </div>
            )}
          </div>
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
