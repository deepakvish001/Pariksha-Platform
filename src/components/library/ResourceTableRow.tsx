import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  FolderKanban,
  FileText,
  Mail,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  JobPortal,
  Project,
  ResumeTemplate,
  ColdDM,
} from "@/data/companyDetailData";

// Job Portal Row
interface JobPortalRowProps {
  portal: JobPortal;
  index: number;
  isSolved: boolean;
  isLoggedIn: boolean;
  onToggleSolved: () => void;
}

export const JobPortalRow = ({
  portal,
  index,
  isSolved,
  isLoggedIn,
  onToggleSolved,
}: JobPortalRowProps) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group border-b border-border/50 transition-colors hover:bg-muted/30",
        isSolved && "bg-emerald-500/5"
      )}
    >
      <TableCell className="w-10 text-center text-muted-foreground text-sm font-medium">
        {index + 1}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1">{portal.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 sm:hidden">{portal.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p className="text-sm text-muted-foreground line-clamp-2">{portal.description}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="secondary" className="text-xs">
          {portal.location}
        </Badge>
      </TableCell>
      <TableCell className="w-20 text-center">
        {portal.url && (
          <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Visit">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visit</span>
            </Button>
          </a>
        )}
      </TableCell>
      <TableCell className="w-14 text-center">
        <button
          onClick={onToggleSolved}
          disabled={!isLoggedIn}
          className={cn(
            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all mx-auto",
            isSolved
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
              : "border-border hover:border-emerald-500/50",
            !isLoggedIn && "opacity-50 cursor-not-allowed"
          )}
          title={isLoggedIn ? (isSolved ? "Mark as not applied" : "Mark as applied") : "Sign in to track"}
        >
          {isSolved && <Check className="h-3.5 w-3.5" />}
        </button>
      </TableCell>
    </motion.tr>
  );
};

// Project Row
interface ProjectRowProps {
  project: Project;
  index: number;
}

export const ProjectRow = ({ project, index }: ProjectRowProps) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group border-b border-border/50 transition-colors hover:bg-muted/30"
    >
      <TableCell className="w-10 text-center text-muted-foreground text-sm font-medium">
        {index + 1}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1">{project.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 sm:hidden">{project.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {project.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{project.technologies.length - 3}
            </Badge>
          )}
        </div>
      </TableCell>
    </motion.tr>
  );
};

// Resume Template Row
interface ResumeTemplateRowProps {
  template: ResumeTemplate;
  index: number;
}

export const ResumeTemplateRow = ({ template, index }: ResumeTemplateRowProps) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group border-b border-border/50 transition-colors hover:bg-muted/30"
    >
      <TableCell className="w-10 text-center text-muted-foreground text-sm font-medium">
        {index + 1}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1">{template.name}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {template.style}
        </Badge>
      </TableCell>
      <TableCell className="w-24 text-center">
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" aria-label="Preview">
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
      </TableCell>
    </motion.tr>
  );
};

// Cold DM Row
interface ColdDMRowProps {
  dm: ColdDM;
  index: number;
  isSolved: boolean;
  isLoggedIn: boolean;
  onToggleSolved: () => void;
}

export const ColdDMRow = ({
  dm,
  index,
  isSolved,
  isLoggedIn,
  onToggleSolved,
}: ColdDMRowProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(dm.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group border-b border-border/50 transition-colors hover:bg-muted/30",
        isSolved && "bg-emerald-500/5"
      )}
    >
      <TableCell className="w-10 text-center text-muted-foreground text-sm font-medium">
        {index + 1}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground line-clamp-1">{dm.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 sm:hidden">{dm.message}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <p className="text-sm text-muted-foreground line-clamp-2">{dm.message}</p>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="secondary" className="text-xs">
          {dm.category}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell w-20 text-center">
        <span className="text-xs text-muted-foreground">{dm.message.length} chars</span>
      </TableCell>
      <TableCell className="w-20 text-center">
        <Button
          variant={copied ? "default" : "outline"}
          size="sm"
          onClick={handleCopy}
          aria-label={copied ? "Copied!" : "Copy"}
          className={cn(
            "h-8 gap-1.5 text-xs transition-all",
            copied && "bg-emerald-500 hover:bg-emerald-600"
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </Button>
      </TableCell>
      <TableCell className="w-14 text-center">
        <button
          onClick={onToggleSolved}
          disabled={!isLoggedIn}
          className={cn(
            "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all mx-auto",
            isSolved
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
              : "border-border hover:border-emerald-500/50",
            !isLoggedIn && "opacity-50 cursor-not-allowed"
          )}
          title={isLoggedIn ? (isSolved ? "Mark as unused" : "Mark as used") : "Sign in to track"}
        >
          {isSolved && <Check className="h-3.5 w-3.5" />}
        </button>
      </TableCell>
    </motion.tr>
  );
};
