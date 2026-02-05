// Roadmap.sh-inspired node styling system with enhanced dark mode contrast
import { cn } from "@/lib/utils";

// Node type color schemes with improved dark mode contrast
export const nodeColors = {
  // Yellow/Gold - Main topics and checkpoints
  primary: {
    bg: "bg-amber-400 dark:bg-amber-500/90",
    border: "border-amber-500 dark:border-amber-300",
    text: "text-amber-950 dark:text-amber-950",
    hoverBg: "hover:bg-amber-300 dark:hover:bg-amber-400",
    shadow: "shadow-amber-500/20 dark:shadow-amber-400/30",
  },
  // Purple/Violet - Alternative options
  alternative: {
    bg: "bg-violet-400 dark:bg-violet-400/90",
    border: "border-violet-500 dark:border-violet-300",
    text: "text-violet-950 dark:text-violet-950",
    hoverBg: "hover:bg-violet-300 dark:hover:bg-violet-300",
    shadow: "shadow-violet-500/20 dark:shadow-violet-400/30",
  },
  // Light gray - Secondary/regular topics (enhanced dark mode)
  secondary: {
    bg: "bg-slate-100 dark:bg-slate-700/90",
    border: "border-slate-300 dark:border-slate-400",
    text: "text-slate-800 dark:text-slate-50",
    hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-600",
    shadow: "shadow-slate-500/10 dark:shadow-slate-400/20",
  },
  // Green - Completed nodes (brighter in dark mode)
  completed: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    border: "border-emerald-500 dark:border-emerald-400",
    text: "text-emerald-800 dark:text-emerald-100",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-500/30",
    shadow: "shadow-emerald-500/20 dark:shadow-emerald-400/40",
  },
  // Dashed outline - Optional topics
  optional: {
    bg: "bg-slate-50/80 dark:bg-slate-800/70",
    border: "border-dashed border-slate-400 dark:border-slate-400",
    text: "text-slate-600 dark:text-slate-200",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-700",
    shadow: "shadow-slate-400/10 dark:shadow-slate-500/20",
  },
  // Blue - Resource nodes
  resource: {
    bg: "bg-sky-100 dark:bg-sky-500/20",
    border: "border-sky-400 dark:border-sky-400",
    text: "text-sky-800 dark:text-sky-100",
    hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-500/30",
    shadow: "shadow-sky-500/15 dark:shadow-sky-400/30",
  },
  // Checkpoint - Important milestones
  checkpoint: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-500/20",
    border: "border-fuchsia-400 dark:border-fuchsia-400",
    text: "text-fuchsia-800 dark:text-fuchsia-100",
    hoverBg: "hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/30",
    shadow: "shadow-fuchsia-500/15 dark:shadow-fuchsia-400/30",
  },
  // Recommended - Special styling with shimmer effect support
  recommended: {
    bg: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 dark:from-amber-500 dark:via-orange-500 dark:to-amber-500",
    border: "border-amber-500 dark:border-amber-300",
    text: "text-amber-950 dark:text-amber-950",
    hoverBg: "hover:from-amber-300 hover:via-orange-300 hover:to-amber-300 dark:hover:from-amber-400 dark:hover:via-orange-400 dark:hover:to-amber-400",
    shadow: "shadow-amber-500/30 dark:shadow-amber-400/50",
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

// Badge styles with enhanced dark mode contrast
export const badgeStyles = {
  recommended: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-400 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-200 dark:border-amber-500",
  alternative: "bg-violet-100 text-violet-700 border-violet-400 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-400",
  optional: "bg-slate-100 text-slate-700 border-slate-400 border-dashed dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-400",
  checkpoint: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-400 dark:bg-fuchsia-900/60 dark:text-fuchsia-200 dark:border-fuchsia-400",
  done: "bg-emerald-100 text-emerald-700 border-emerald-400 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-400",
};

// Connector line colors with better dark mode visibility
export const lineColors = {
  default: "stroke-slate-300 dark:stroke-slate-500",
  active: "stroke-amber-400 dark:stroke-amber-400",
  completed: "stroke-emerald-400 dark:stroke-emerald-400",
  progress: "stroke-primary dark:stroke-primary",
};
