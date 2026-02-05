// Roadmap.sh-inspired node styling system with semantic design tokens
import { cn } from "@/lib/utils";

// Node type color schemes using semantic tokens where possible
export const nodeColors = {
  // Primary - Main topics and checkpoints (amber theme)
  primary: {
    bg: "bg-amber-100 dark:bg-amber-500/20",
    border: "border-amber-400 dark:border-amber-400/60",
    text: "text-amber-900 dark:text-amber-100",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-500/30",
    shadow: "shadow-amber-500/15 dark:shadow-amber-400/20",
  },
  // Alternative - violet accent for optional paths
  alternative: {
    bg: "bg-violet-100 dark:bg-violet-500/20",
    border: "border-violet-400 dark:border-violet-400/60",
    text: "text-violet-900 dark:text-violet-100",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-500/30",
    shadow: "shadow-violet-500/15 dark:shadow-violet-400/20",
  },
  // Secondary - regular topics using semantic tokens
  secondary: {
    bg: "bg-muted/60 dark:bg-muted/40",
    border: "border-border dark:border-border",
    text: "text-foreground dark:text-foreground",
    hoverBg: "hover:bg-muted dark:hover:bg-muted/60",
    shadow: "shadow-muted/20 dark:shadow-muted/10",
  },
  // Completed - success state
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    border: "border-emerald-400 dark:border-emerald-500/60",
    text: "text-emerald-800 dark:text-emerald-200",
    hoverBg: "hover:bg-emerald-100/80 dark:hover:bg-emerald-500/25",
    shadow: "shadow-emerald-500/20 dark:shadow-emerald-400/25",
  },
  // Optional - dashed outline for skip-able topics
  optional: {
    bg: "bg-secondary/50 dark:bg-secondary/30",
    border: "border-dashed border-muted-foreground/40 dark:border-muted-foreground/30",
    text: "text-muted-foreground dark:text-muted-foreground",
    hoverBg: "hover:bg-secondary dark:hover:bg-secondary/50",
    shadow: "shadow-none",
  },
  // Resource - informational nodes
  resource: {
    bg: "bg-sky-50 dark:bg-sky-500/15",
    border: "border-sky-400 dark:border-sky-500/60",
    text: "text-sky-800 dark:text-sky-200",
    hoverBg: "hover:bg-sky-100/80 dark:hover:bg-sky-500/25",
    shadow: "shadow-sky-500/15 dark:shadow-sky-400/20",
  },
  // Checkpoint - milestone markers
  checkpoint: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-500/15",
    border: "border-fuchsia-400 dark:border-fuchsia-500/60",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    hoverBg: "hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-500/25",
    shadow: "shadow-fuchsia-500/15 dark:shadow-fuchsia-400/20",
  },
  // Recommended - special highlight with primary accent
  recommended: {
    bg: "bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 dark:from-amber-500/25 dark:via-orange-500/25 dark:to-amber-500/25",
    border: "border-amber-500 dark:border-amber-400",
    text: "text-amber-900 dark:text-amber-100",
    hoverBg: "hover:from-amber-50 hover:via-orange-50 hover:to-amber-50 dark:hover:from-amber-500/35 dark:hover:via-orange-500/35 dark:hover:to-amber-500/35",
    shadow: "shadow-amber-500/25 dark:shadow-amber-400/35",
  },
};

// Get node style based on type and state
export const getNodeStyle = (
  type: 'primary' | 'secondary' | 'checkpoint' | 'resource' | 'optional',
  isCompleted: boolean,
  isRecommended?: boolean
) => {
  if (isCompleted) {
    return nodeColors.completed;
  }
  
  if (isRecommended && type === 'primary') {
    return nodeColors.recommended;
  }
  
  switch (type) {
    case 'primary':
      return nodeColors.primary;
    case 'checkpoint':
      return nodeColors.checkpoint;
    case 'resource':
      return nodeColors.resource;
    case 'optional':
      return nodeColors.optional;
    default:
      return nodeColors.secondary;
  }
};

// Badge styles with semantic tokens
export const badgeStyles = {
  recommended: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-400 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-200 dark:border-amber-500/60",
  alternative: "bg-violet-100 text-violet-700 border-violet-400 dark:bg-violet-900/50 dark:text-violet-200 dark:border-violet-500/60",
  optional: "bg-muted text-muted-foreground border-muted-foreground/30 border-dashed",
  checkpoint: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-400 dark:bg-fuchsia-900/50 dark:text-fuchsia-200 dark:border-fuchsia-500/60",
  done: "bg-emerald-100 text-emerald-700 border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-500/60",
};

// Connector line colors with semantic tokens
export const lineColors = {
  default: "stroke-border",
  active: "stroke-amber-400 dark:stroke-amber-500",
  completed: "stroke-emerald-400 dark:stroke-emerald-500",
  progress: "stroke-primary",
};
