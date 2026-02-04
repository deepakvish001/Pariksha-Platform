import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Globe, FolderKanban, FileText, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import SectionProgressBar from "./SectionProgressBar";
import {
  JobPortalRow,
  ProjectRow,
  ResumeTemplateRow,
  ColdDMRow,
} from "./ResourceTableRow";
import type {
  JobPortal,
  Project,
  ResumeTemplate,
  ColdDM,
} from "@/data/companyDetailData";

// Icon mapping for resource types
const resourceIcons: Record<string, React.ElementType> = {
  "job-portals": Globe,
  "projects": FolderKanban,
  "resume-templates": FileText,
  "cold-dms": Mail,
};

type ResourceType = "job-portals" | "projects" | "resume-templates" | "cold-dms";

interface ResourceCategorySectionProps {
  resourceType: ResourceType;
  resourceName: string;
  items: JobPortal[] | Project[] | ResumeTemplate[] | ColdDM[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isSolved?: (id: number) => boolean;
  onToggleSolved?: (id: number) => void;
  isLoggedIn: boolean;
}

const ResourceCategorySection = ({
  resourceType,
  resourceName,
  items,
  isOpen,
  onOpenChange,
  isSolved = () => false,
  onToggleSolved = () => {},
  isLoggedIn,
}: ResourceCategorySectionProps) => {
  const Icon = resourceIcons[resourceType] || Globe;

  const stats = useMemo(() => {
    const total = items.length;
    // Only track solved for trackable resources (job portals and cold DMs)
    const trackable = resourceType === "job-portals" || resourceType === "cold-dms";
    const solved = trackable ? items.filter((item) => isSolved(item.id)).length : 0;
    const percentage = trackable && total > 0 ? Math.round((solved / total) * 100) : 0;
    return { total, solved, percentage, trackable };
  }, [items, isSolved, resourceType]);

  const isComplete = stats.percentage === 100 && stats.total > 0 && stats.trackable;

  // Render the appropriate table content based on resource type
  const renderTable = () => {
    switch (resourceType) {
      case "job-portals":
        return (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-10 text-xs font-semibold">#</TableHead>
                <TableHead className="min-w-[150px] text-xs font-semibold">Portal</TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold">Description</TableHead>
                <TableHead className="hidden md:table-cell w-28 text-xs font-semibold">Location</TableHead>
                <TableHead className="w-20 text-center text-xs font-semibold">Link</TableHead>
                <TableHead className="w-14 text-center text-xs font-semibold">
                  <span className="hidden sm:inline">Applied</span>
                  <span className="sm:hidden">✓</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as JobPortal[]).map((portal, index) => (
                <JobPortalRow
                  key={portal.id}
                  portal={portal}
                  index={index}
                  isSolved={isSolved(portal.id)}
                  isLoggedIn={isLoggedIn}
                  onToggleSolved={() => onToggleSolved(portal.id)}
                />
              ))}
            </TableBody>
          </Table>
        );

      case "projects":
        return (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-10 text-xs font-semibold">#</TableHead>
                <TableHead className="min-w-[150px] text-xs font-semibold">Project</TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold">Description</TableHead>
                <TableHead className="text-xs font-semibold">Technologies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Project[]).map((project, index) => (
                <ProjectRow key={project.id} project={project} index={index} />
              ))}
            </TableBody>
          </Table>
        );

      case "resume-templates":
        return (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-10 text-xs font-semibold">#</TableHead>
                <TableHead className="min-w-[150px] text-xs font-semibold">Template</TableHead>
                <TableHead className="text-xs font-semibold">Style</TableHead>
                <TableHead className="w-24 text-center text-xs font-semibold">Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as ResumeTemplate[]).map((template, index) => (
                <ResumeTemplateRow key={template.id} template={template} index={index} />
              ))}
            </TableBody>
          </Table>
        );

      case "cold-dms":
        return (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-10 text-xs font-semibold">#</TableHead>
                <TableHead className="min-w-[150px] text-xs font-semibold">Title</TableHead>
                <TableHead className="hidden sm:table-cell text-xs font-semibold">Message</TableHead>
                <TableHead className="hidden md:table-cell w-24 text-xs font-semibold">Category</TableHead>
                <TableHead className="hidden md:table-cell w-20 text-center text-xs font-semibold">Length</TableHead>
                <TableHead className="w-20 text-center text-xs font-semibold">Copy</TableHead>
                <TableHead className="w-14 text-center text-xs font-semibold">
                  <span className="hidden sm:inline">Used</span>
                  <span className="sm:hidden">✓</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as ColdDM[]).map((dm, index) => (
                <ColdDMRow
                  key={dm.id}
                  dm={dm}
                  index={index}
                  isSolved={isSolved(dm.id)}
                  isLoggedIn={isLoggedIn}
                  onToggleSolved={() => onToggleSolved(dm.id)}
                />
              ))}
            </TableBody>
          </Table>
        );

      default:
        return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border last:border-b-0"
      >
        {/* Section Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 md:p-4 hover:bg-muted/50 transition-colors group text-left">
            {/* Chevron */}
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </motion.div>

            {/* Icon */}
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium text-sm md:text-base truncate">
                {resourceName}
              </span>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </motion.div>
              )}
            </div>

            {/* Progress Bar (only for trackable resources) */}
            {stats.trackable ? (
              <SectionProgressBar
                value={stats.solved}
                total={stats.total}
                className="hidden sm:flex"
              />
            ) : (
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                {stats.total} items
              </Badge>
            )}

            {/* Mobile count */}
            <span className="sm:hidden text-xs font-medium text-muted-foreground">
              {stats.trackable ? `${stats.solved}/${stats.total}` : stats.total}
            </span>
          </button>
        </CollapsibleTrigger>

        {/* Section Content */}
        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                {/* Section toolbar */}
                <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {stats.trackable
                      ? `${stats.solved} of ${stats.total} completed${stats.percentage > 0 ? ` (${stats.percentage}%)` : ""}`
                      : `${stats.total} ${resourceType.replace("-", " ")} available`}
                  </span>
                </div>

                {/* Table Content */}
                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    {renderTable()}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No {resourceType.replace("-", " ")} available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </motion.div>
    </Collapsible>
  );
};

export default ResourceCategorySection;
