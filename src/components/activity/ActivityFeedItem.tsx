import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Trophy, 
  Zap, 
  FileText, 
  MessageSquare, 
  Clock,
  BookOpen,
  ChevronRight
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
  gradient: string;
  bgColor: string;
  badgeClass: string;
  ringColor: string;
}> = {
  quiz_complete: {
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    ringColor: "ring-emerald-500/50",
  },
  achievement: {
    icon: Trophy,
    gradient: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    ringColor: "ring-amber-500/50",
  },
  xp_earned: {
    icon: Zap,
    gradient: "from-primary to-primary/80",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    badgeClass: "bg-primary/10 text-primary border-primary/30",
    ringColor: "ring-primary/50",
  },
  topic_complete: {
    icon: BookOpen,
    gradient: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    ringColor: "ring-blue-500/50",
  },
  resume_download: {
    icon: FileText,
    gradient: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
    ringColor: "ring-violet-500/50",
  },
  outreach_copy: {
    icon: MessageSquare,
    gradient: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10 dark:bg-cyan-500/20",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    ringColor: "ring-cyan-500/50",
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
    gradient: "from-muted-foreground to-muted-foreground",
    bgColor: "bg-muted",
    badgeClass: "bg-muted text-muted-foreground border-border",
    ringColor: "ring-muted",
  };

  const Icon = config.icon;
  const relativeTime = formatDistanceToNow(new Date(activity.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        delay: index * 0.025, 
        duration: 0.4,
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      whileHover={{ x: 6 }}
      className={`
        relative flex items-start gap-4 p-5 rounded-2xl 
        border border-white/[0.03] bg-black/30 backdrop-blur-xl
        hover:bg-black/40 hover:border-white/[0.06] hover:shadow-2xl hover:shadow-black/50
        transition-all duration-300 ease-out cursor-default group
        ${activity.isNew ? `ring-2 ${config.ringColor} shadow-xl shadow-primary/10` : ""}
      `}
    >
      {/* Timeline connector line */}
      <div className="absolute left-[2.4rem] top-[4.5rem] bottom-0 w-px bg-gradient-to-b from-white/[0.06] to-transparent opacity-60 group-last:hidden" />

      {/* Icon with gradient background */}
      <motion.div 
        className={`
          relative shrink-0 h-13 w-13 rounded-xl 
          bg-gradient-to-br ${config.gradient}
          flex items-center justify-center shadow-xl shadow-black/30
          transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl
        `}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
        style={{ height: '3.25rem', width: '3.25rem' }}
      >
        <Icon className="h-6 w-6 text-white" />
        {activity.isNew && (
          <motion.div
            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary ring-2 ring-black"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white/90 group-hover:text-white transition-colors truncate text-[15px]">
              {activity.title}
            </p>
            {activity.description && (
              <p className="text-sm text-white/40 mt-1.5 line-clamp-2 leading-relaxed">
                {activity.description}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={`shrink-0 ${config.badgeClass} font-medium border text-xs`}
          >
            {getActivityLabel(activity.activity_type)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 mt-3.5">
          <div className="flex items-center gap-1.5 text-xs text-white/35">
            <Clock className="h-3.5 w-3.5" />
            <span>{relativeTime}</span>
          </div>
          
          {/* Show score for quizzes */}
          {activity.activity_type === "quiz_complete" && activity.metadata?.accuracy != null && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 ml-auto bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              {Math.round(Number(activity.metadata.accuracy))}% accuracy
            </div>
          )}
          
          {/* Show XP amount */}
          {activity.activity_type === "xp_earned" && activity.metadata?.amount != null && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary ml-auto bg-primary/15 px-2.5 py-1 rounded-full border border-primary/20">
              <Zap className="h-3 w-3" />
              +{String(activity.metadata.amount)} XP
            </div>
          )}

          {/* Hover indicator */}
          <ChevronRight className="h-4 w-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </div>
      </div>
    </motion.div>
  );
}
