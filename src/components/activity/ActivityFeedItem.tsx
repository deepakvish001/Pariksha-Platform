import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Trophy, 
  Zap, 
  FileText, 
  MessageSquare, 
  Clock,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/hooks/useActivityFeed";

interface ActivityFeedItemProps {
  activity: ActivityItem;
  index: number;
}

const activityConfig: Record<string, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}> = {
  quiz_complete: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeVariant: "default",
  },
  achievement: {
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeVariant: "secondary",
  },
  xp_earned: {
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    badgeVariant: "default",
  },
  topic_complete: {
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeVariant: "outline",
  },
  resume_download: {
    icon: FileText,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeVariant: "secondary",
  },
  outreach_copy: {
    icon: MessageSquare,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    badgeVariant: "outline",
  },
};

const getActivityLabel = (type: string): string => {
  const labels: Record<string, string> = {
    quiz_complete: "Quiz",
    achievement: "Achievement",
    xp_earned: "XP",
    topic_complete: "Topic",
    resume_download: "Template",
    outreach_copy: "Outreach",
  };
  return labels[type] || "Activity";
};

export function ActivityFeedItem({ activity, index }: ActivityFeedItemProps) {
  const config = activityConfig[activity.activity_type] || {
    icon: Clock,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    badgeVariant: "outline" as const,
  };

  const Icon = config.icon;
  const relativeTime = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        flex items-start gap-4 p-4 rounded-xl border 
        bg-card/50 backdrop-blur-sm
        hover:bg-card/80 transition-all duration-200
        ${activity.isNew ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" : ""}
      `}
    >
      {/* Icon */}
      <div className={`shrink-0 h-10 w-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          <Badge variant={config.badgeVariant} className="shrink-0">
            {getActivityLabel(activity.activity_type)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
          
          {/* Show score for quizzes */}
          {activity.activity_type === "quiz_complete" && activity.metadata?.accuracy != null && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 ml-auto">
              {Math.round(Number(activity.metadata.accuracy))}% accuracy
            </span>
          )}
          
          {/* Show XP amount */}
          {activity.activity_type === "xp_earned" && activity.metadata?.amount != null && (
            <span className="text-xs font-medium text-primary ml-auto">
              +{String(activity.metadata.amount)} XP
            </span>
          )}
        </div>
      </div>

      {/* New indicator pulse */}
      {activity.isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"
        >
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
        </motion.div>
      )}
    </motion.div>
  );
}
