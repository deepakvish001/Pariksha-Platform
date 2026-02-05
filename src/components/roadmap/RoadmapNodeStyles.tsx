// Roadmap.sh-inspired node styling system
import { cn } from "@/lib/utils";

// Node type color schemes inspired by roadmap.sh
export const nodeColors = {
  // Yellow/Gold - Main topics and checkpoints (like roadmap.sh)
  primary: {
    bg: "bg-amber-400 dark:bg-amber-500",
    border: "border-amber-500 dark:border-amber-400",
    text: "text-amber-950 dark:text-amber-950",
    hoverBg: "hover:bg-amber-300 dark:hover:bg-amber-400",
    shadow: "shadow-amber-500/20",
  },
  // Purple/Violet - Alternative options
  alternative: {
    bg: "bg-violet-400 dark:bg-violet-500",
    border: "border-violet-500 dark:border-violet-400",
    text: "text-violet-950 dark:text-violet-950",
    hoverBg: "hover:bg-violet-300 dark:hover:bg-violet-400",
    shadow: "shadow-violet-500/20",
  },
  // Light gray - Secondary/regular topics
  secondary: {
    bg: "bg-slate-100 dark:bg-slate-700",
    border: "border-slate-300 dark:border-slate-500",
    text: "text-slate-800 dark:text-slate-100",
    hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-600",
    shadow: "shadow-slate-500/10",
  },
  // Green - Completed nodes
  completed: {
    bg: "bg-emerald-100 dark:bg-emerald-900/50",
    border: "border-emerald-500 dark:border-emerald-400",
    text: "text-emerald-800 dark:text-emerald-200",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-800/50",
    shadow: "shadow-emerald-500/20",
  },
  // Dashed outline - Optional topics
  optional: {
    bg: "bg-slate-50/80 dark:bg-slate-800/50",
    border: "border-dashed border-slate-400 dark:border-slate-500",
    text: "text-slate-600 dark:text-slate-300",
    hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-700/50",
    shadow: "shadow-slate-400/10",
  },
  // Blue - Resource nodes
  resource: {
    bg: "bg-sky-100 dark:bg-sky-900/50",
    border: "border-sky-400 dark:border-sky-500",
    text: "text-sky-800 dark:text-sky-200",
    hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-800/50",
    shadow: "shadow-sky-500/15",
  },
  // Checkpoint - Important milestones (purple variant)
  checkpoint: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-900/50",
    border: "border-fuchsia-400 dark:border-fuchsia-500",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    hoverBg: "hover:bg-fuchsia-50 dark:hover:bg-fuchsia-800/50",
    shadow: "shadow-fuchsia-500/15",
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
    return nodeColors.primary;
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

// Badge styles for different node annotations
export const badgeStyles = {
  recommended: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
  alternative: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700",
  optional: "bg-slate-100 text-slate-600 border-slate-300 border-dashed dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  checkpoint: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300 dark:bg-fuchsia-900/50 dark:text-fuchsia-300 dark:border-fuchsia-700",
  done: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
};

// Connector line colors
export const lineColors = {
  default: "stroke-slate-300 dark:stroke-slate-600",
  active: "stroke-amber-400 dark:stroke-amber-500",
  completed: "stroke-emerald-400 dark:stroke-emerald-500",
  progress: "stroke-primary",
};
