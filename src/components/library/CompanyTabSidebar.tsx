import { motion } from "framer-motion";
import {
  Database,
  MessageSquare,
  Code2,
  Brain,
  Globe,
  FolderKanban,
  FileText,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  name: string;
}

interface CompanyTabSidebarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabCounts: Record<string, number>;
}

const tabIcons: Record<string, React.ElementType> = {
  "sql-questions": Database,
  "interview-questions": MessageSquare,
  "dsa-questions": Code2,
  "aptitude-questions": Brain,
  "job-portals": Globe,
  "projects": FolderKanban,
  "resume-templates": FileText,
  "cold-dms": Mail,
};

const CompanyTabSidebar = ({
  tabs,
  activeTab,
  onTabChange,
  tabCounts,
}: CompanyTabSidebarProps) => {
  return (
    <nav className="hidden lg:flex flex-col w-[200px] shrink-0 border-r border-border/40 bg-muted/20">
      <div className="p-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left truncate">{tab.name}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "h-5 min-w-[20px] px-1.5 text-xs shrink-0",
                  isActive ? "bg-primary/20 text-primary" : ""
                )}
              >
                {count}
              </Badge>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

// Horizontal tabs for tablet/mobile
export const CompanyTabsHorizontal = ({
  tabs,
  activeTab,
  onTabChange,
  tabCounts,
}: CompanyTabSidebarProps) => {
  return (
    <div className="lg:hidden flex gap-1 border-b border-border/40 overflow-x-auto pb-px scrollbar-hide">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab.id];
        const count = tabCounts[tab.id];
        const isActive = activeTab === tab.id;

        return (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                  isActive
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{tab.name}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-4 px-1 text-[10px]",
                    isActive ? "bg-primary/20 text-primary" : ""
                  )}
                >
                  {count}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="sm:hidden">
              {tab.name}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default CompanyTabSidebar;
