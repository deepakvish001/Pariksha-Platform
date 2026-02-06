// Roadmap.sh-inspired node styling system with refined semantic design tokens

// Enhanced node type color schemes with better visual hierarchy
export const nodeColors = {
  // Primary - Main milestones (warm amber-gold for importance)
  primary: {
    bg: "bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-500/15 dark:to-orange-500/10",
    border: "border-amber-400/60 dark:border-amber-400/50",
    text: "text-amber-900 dark:text-amber-100",
    hoverBg: "hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-500/25 dark:hover:to-orange-500/20",
    shadow: "shadow-amber-400/15 dark:shadow-amber-500/10",
  },
  // Alternative - violet accent for optional/alternative paths
  alternative: {
    bg: "bg-gradient-to-br from-violet-50/80 to-purple-50/60 dark:from-violet-500/15 dark:to-purple-500/10",
    border: "border-violet-400/60 dark:border-violet-400/50",
    text: "text-violet-900 dark:text-violet-100",
    hoverBg: "hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-500/25 dark:hover:to-purple-500/20",
    shadow: "shadow-violet-400/15 dark:shadow-violet-500/10",
  },
  // Secondary - regular topics (subtle, using semantic tokens)
  secondary: {
    bg: "bg-gradient-to-br from-muted/30 to-muted/50 dark:from-muted/20 dark:to-muted/30",
    border: "border-border/70 dark:border-border/50",
    text: "text-foreground dark:text-foreground",
    hoverBg: "hover:from-muted/50 hover:to-muted/70 dark:hover:from-muted/40 dark:hover:to-muted/50",
    shadow: "shadow-muted/10 dark:shadow-muted/5",
  },
  // Completed - success state (fresh green gradient)
  completed: {
    bg: "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-500/15 dark:to-teal-500/10",
    border: "border-emerald-400/60 dark:border-emerald-500/50",
    text: "text-emerald-800 dark:text-emerald-200",
    hoverBg: "hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-500/25 dark:hover:to-teal-500/20",
    shadow: "shadow-emerald-400/20 dark:shadow-emerald-500/15",
  },
  // Optional - subtle dashed outline for skip-able topics
  optional: {
    bg: "bg-secondary/20 dark:bg-secondary/15",
    border: "border-dashed border-muted-foreground/25 dark:border-muted-foreground/20",
    text: "text-muted-foreground dark:text-muted-foreground/90",
    hoverBg: "hover:bg-secondary/40 dark:hover:bg-secondary/30",
    shadow: "shadow-none",
  },
  // Resource - informational/learning nodes (sky blue)
  resource: {
    bg: "bg-gradient-to-br from-sky-50/80 to-cyan-50/60 dark:from-sky-500/15 dark:to-cyan-500/10",
    border: "border-sky-400/60 dark:border-sky-500/50",
    text: "text-sky-800 dark:text-sky-200",
    hoverBg: "hover:from-sky-100 hover:to-cyan-100 dark:hover:from-sky-500/25 dark:hover:to-cyan-500/20",
    shadow: "shadow-sky-400/15 dark:shadow-sky-500/10",
  },
  // Checkpoint - milestone markers (fuchsia/magenta accent)
  checkpoint: {
    bg: "bg-gradient-to-br from-fuchsia-50/80 to-pink-50/60 dark:from-fuchsia-500/15 dark:to-pink-500/10",
    border: "border-fuchsia-400/60 dark:border-fuchsia-500/50",
    text: "text-fuchsia-800 dark:text-fuchsia-200",
    hoverBg: "hover:from-fuchsia-100 hover:to-pink-100 dark:hover:from-fuchsia-500/25 dark:hover:to-pink-500/20",
    shadow: "shadow-fuchsia-400/15 dark:shadow-fuchsia-500/10",
  },
  // Recommended - special highlight with animated glow effect
  recommended: {
    bg: "bg-gradient-to-r from-amber-100/90 via-orange-100/80 to-yellow-100/90 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-yellow-500/15",
    border: "border-amber-500/80 dark:border-amber-400/70",
    text: "text-amber-900 dark:text-amber-100",
    hoverBg: "hover:from-amber-50 hover:via-orange-50 hover:to-yellow-50 dark:hover:from-amber-500/30 dark:hover:via-orange-500/25 dark:hover:to-yellow-500/25",
    shadow: "shadow-amber-400/30 dark:shadow-amber-500/25",
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

// Enhanced badge styles with better contrast and visual distinction
export const badgeStyles = {
  recommended: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-400/50 shadow-sm dark:from-amber-900/50 dark:to-orange-900/40 dark:text-amber-200 dark:border-amber-500/40",
  alternative: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border border-violet-400/50 dark:from-violet-900/40 dark:to-purple-900/30 dark:text-violet-200 dark:border-violet-500/40",
  optional: "bg-muted/50 text-muted-foreground border border-muted-foreground/20 border-dashed",
  checkpoint: "bg-gradient-to-r from-fuchsia-100 to-pink-100 text-fuchsia-700 border border-fuchsia-400/50 dark:from-fuchsia-900/40 dark:to-pink-900/30 dark:text-fuchsia-200 dark:border-fuchsia-500/40",
  done: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-400/50 dark:from-emerald-900/40 dark:to-teal-900/30 dark:text-emerald-200 dark:border-emerald-500/40",
};

// Connector line colors with improved visibility
export const lineColors = {
  default: "stroke-border/60",
  active: "stroke-amber-400 dark:stroke-amber-400",
  completed: "stroke-emerald-400 dark:stroke-emerald-500",
  progress: "stroke-primary/70",
};

// Section accent colors for visual grouping
export const sectionAccents = [
  { name: "amber", border: "border-amber-400/40", bg: "from-amber-500/8 to-transparent", accent: "text-amber-600 dark:text-amber-400" },
  { name: "violet", border: "border-violet-400/40", bg: "from-violet-500/8 to-transparent", accent: "text-violet-600 dark:text-violet-400" },
  { name: "emerald", border: "border-emerald-400/40", bg: "from-emerald-500/8 to-transparent", accent: "text-emerald-600 dark:text-emerald-400" },
  { name: "blue", border: "border-blue-400/40", bg: "from-blue-500/8 to-transparent", accent: "text-blue-600 dark:text-blue-400" },
  { name: "rose", border: "border-rose-400/40", bg: "from-rose-500/8 to-transparent", accent: "text-rose-600 dark:text-rose-400" },
  { name: "cyan", border: "border-cyan-400/40", bg: "from-cyan-500/8 to-transparent", accent: "text-cyan-600 dark:text-cyan-400" },
];
