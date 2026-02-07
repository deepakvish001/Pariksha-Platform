import {
  Shield,
  Sword,
  Crown,
  Rocket,
  Brain,
  Network,
  Calculator,
  Database,
  Type,
  Code,
  Layers,
  Binary,
  Sparkles,
  Target,
  Trophy,
  Zap,
  GitBranch,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Puzzle,
  Lightbulb,
  BookOpen,
  GraduationCap,
  LucideIcon
} from "lucide-react";

// Track difficulty icons based on track type
export const trackDifficultyIcons: Record<string, LucideIcon> = {
  // Foundational tracks - shield (protective, learning)
  "preliminaries": Shield,
  "basics": BookOpen,
  
  // Intermediate - sword (skill building)
  "intermediate": Sword,
  
  // Advanced tracks - crown (mastery)
  "advanced-ds": Database,
  "advanced-algo": Brain,
  "advanced-math": Calculator,
  
  // Contest tracks - trophy/rocket (competition)
  "atcoder-4p": Rocket,
  "atcoder-6p": Zap,
  "atcoder-regular": Trophy,
  "codeforces-edu": GraduationCap,
  "icpc": Crown,
};

// Topic icons for categorization
export const topicIcons: Record<string, LucideIcon> = {
  "algorithmic-techniques": Lightbulb,
  "data-structures": Database,
  "dynamic-programming": Brain,
  "geometry": Hexagon,
  "graphs": Network,
  "implementation": Code,
  "math": Calculator,
  "strings": Type,
  "contest": Trophy,
};

// Track color mappings with full Tailwind classes
export const trackColors: Record<string, {
  bg: string;
  text: string;
  border: string;
  accent: string;
  gradient: string;
}> = {
  "preliminaries": {
    bg: "bg-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    accent: "bg-teal-500",
    gradient: "from-teal-500 to-teal-600",
  },
  "basics": {
    bg: "bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    accent: "bg-emerald-500",
    gradient: "from-emerald-500 to-emerald-600",
  },
  "intermediate": {
    bg: "bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    accent: "bg-cyan-500",
    gradient: "from-cyan-500 to-cyan-600",
  },
  "advanced-ds": {
    bg: "bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    accent: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
  "advanced-algo": {
    bg: "bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    accent: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600",
  },
  "advanced-math": {
    bg: "bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/30",
    accent: "bg-violet-500",
    gradient: "from-violet-500 to-violet-600",
  },
  "atcoder-4p": {
    bg: "bg-green-500/20",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/30",
    accent: "bg-green-500",
    gradient: "from-green-500 to-green-600",
  },
  "atcoder-6p": {
    bg: "bg-lime-500/20",
    text: "text-lime-600 dark:text-lime-400",
    border: "border-lime-500/30",
    accent: "bg-lime-500",
    gradient: "from-lime-500 to-lime-600",
  },
  "atcoder-regular": {
    bg: "bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    accent: "bg-amber-500",
    gradient: "from-amber-500 to-amber-600",
  },
  "codeforces-edu": {
    bg: "bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    accent: "bg-orange-500",
    gradient: "from-orange-500 to-orange-600",
  },
  "icpc": {
    bg: "bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    accent: "bg-red-500",
    gradient: "from-red-500 to-red-600",
  },
};

// Platform-specific colors for problem badges
export const platformColors: Record<string, string> = {
  "Codeforces": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "AtCoder": "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  "SPOJ": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "UVa": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "LeetCode": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "HackerRank": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  "CodeChef": "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
};

// Difficulty icons and colors
export const difficultyConfig: Record<string, {
  icon: LucideIcon;
  color: string;
  bg: string;
}> = {
  "Easy": {
    icon: Circle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  "Medium": {
    icon: Square,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
  },
  "Hard": {
    icon: Hexagon,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
};

// Helper function to get track icon
export function getTrackIcon(trackId: string): LucideIcon {
  return trackDifficultyIcons[trackId] || Layers;
}

// Helper function to get topic icon
export function getTopicIcon(topicId: string): LucideIcon {
  return topicIcons[topicId] || Code;
}

// Helper function to get track colors
export function getTrackColors(trackId: string) {
  return trackColors[trackId] || {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-muted",
    accent: "bg-muted-foreground",
    gradient: "from-muted-foreground to-muted-foreground",
  };
}

// Helper function to get platform color
export function getPlatformColor(platform: string): string {
  return platformColors[platform] || "bg-muted text-muted-foreground border-muted";
}
