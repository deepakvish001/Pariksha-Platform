import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Flame, 
  Target, 
  Star, 
  Zap, 
  Crown,
  Medal,
  Rocket,
  BookOpen,
  GraduationCap,
  Timer,
  CheckCircle,
  Swords,
  Brain,
  Sparkles,
   Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
 import { Badge } from "@/components/ui/badge";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof iconMap;
  color: string;
  requirement: {
    type: 'topics_completed' | 'streak_days' | 'sheets_started' | 'revision_topics' | 'quiz_perfect_score' | 'quiz_speed_demon' | 'quiz_challenge_complete' | 'quiz_accuracy' | 'quiz_streak';
    value: number;
  };
}

const iconMap = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  star: Star,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  rocket: Rocket,
  book: BookOpen,
  graduation: GraduationCap,
  timer: Timer,
  check: CheckCircle,
  swords: Swords,
  brain: Brain,
  sparkles: Sparkles,
};

export const achievements: Achievement[] = [
  {
    id: 'first_topic',
    name: 'First Steps',
    description: 'Complete your first topic',
    icon: 'rocket',
    color: 'from-blue-500 to-cyan-500',
    requirement: { type: 'topics_completed', value: 1 }
  },
  {
    id: 'topics_10',
    name: 'Getting Started',
    description: 'Complete 10 topics',
    icon: 'book',
    color: 'from-green-500 to-emerald-500',
    requirement: { type: 'topics_completed', value: 10 }
  },
  {
    id: 'topics_50',
    name: 'Dedicated Learner',
    description: 'Complete 50 topics',
    icon: 'star',
    color: 'from-yellow-500 to-orange-500',
    requirement: { type: 'topics_completed', value: 50 }
  },
  {
    id: 'topics_100',
    name: 'Century Club',
    description: 'Complete 100 topics',
    icon: 'trophy',
    color: 'from-orange-500 to-red-500',
    requirement: { type: 'topics_completed', value: 100 }
  },
  {
    id: 'topics_250',
    name: 'Knowledge Seeker',
    description: 'Complete 250 topics',
    icon: 'graduation',
    color: 'from-purple-500 to-pink-500',
    requirement: { type: 'topics_completed', value: 250 }
  },
  {
    id: 'topics_500',
    name: 'Master Scholar',
    description: 'Complete 500 topics',
    icon: 'crown',
    color: 'from-yellow-400 to-yellow-600',
    requirement: { type: 'topics_completed', value: 500 }
  },
  {
    id: 'streak_3',
    name: 'Warming Up',
    description: 'Maintain a 3-day streak',
    icon: 'flame',
    color: 'from-orange-400 to-red-400',
    requirement: { type: 'streak_days', value: 3 }
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: 'flame',
    color: 'from-orange-500 to-red-500',
    requirement: { type: 'streak_days', value: 7 }
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    icon: 'flame',
    color: 'from-orange-600 to-red-600',
    requirement: { type: 'streak_days', value: 14 }
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: 'zap',
    color: 'from-purple-500 to-indigo-500',
    requirement: { type: 'streak_days', value: 30 }
  },
  {
    id: 'revision_10',
    name: 'Reviewer',
    description: 'Mark 10 topics for revision',
    icon: 'target',
    color: 'from-cyan-500 to-blue-500',
    requirement: { type: 'revision_topics', value: 10 }
  },
  {
    id: 'revision_50',
    name: 'Strategic Learner',
    description: 'Mark 50 topics for revision',
    icon: 'medal',
    color: 'from-teal-500 to-cyan-500',
    requirement: { type: 'revision_topics', value: 50 }
  },
  // Quiz Achievements
  {
    id: 'quiz_perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% accuracy in a quiz',
    icon: 'check',
    color: 'from-emerald-500 to-green-500',
    requirement: { type: 'quiz_perfect_score', value: 1 }
  },
  {
    id: 'quiz_speed_demon',
    name: 'Speed Demon',
    description: 'Complete a quiz with avg time under 15 seconds',
    icon: 'timer',
    color: 'from-orange-500 to-red-500',
    requirement: { type: 'quiz_speed_demon', value: 1 }
  },
  {
    id: 'quiz_brain_master',
    name: 'Brain Master',
    description: 'Complete 5 hard difficulty quizzes',
    icon: 'brain',
    color: 'from-purple-500 to-indigo-500',
    requirement: { type: 'quiz_challenge_complete', value: 5 }
  },
  {
    id: 'quiz_challenger',
    name: 'Challenger',
    description: 'Complete your first timed challenge',
    icon: 'swords',
    color: 'from-blue-500 to-cyan-500',
    requirement: { type: 'quiz_challenge_complete', value: 1 }
  },
  {
    id: 'quiz_accuracy_80',
    name: 'Sharp Mind',
    description: 'Achieve 80%+ accuracy in 10 quizzes',
    icon: 'target',
    color: 'from-amber-500 to-yellow-500',
    requirement: { type: 'quiz_accuracy', value: 10 }
  },
  {
    id: 'quiz_streak_5',
    name: 'Quiz Streak',
    description: 'Complete quizzes 5 days in a row',
    icon: 'sparkles',
    color: 'from-pink-500 to-rose-500',
    requirement: { type: 'quiz_streak', value: 5 }
  },
  {
    id: 'quiz_triple_crown',
    name: 'Triple Crown',
    description: 'Get perfect scores in Aptitude, DSA, and SQL quizzes',
    icon: 'crown',
    color: 'from-yellow-400 to-amber-500',
    requirement: { type: 'quiz_perfect_score', value: 3 }
  },
];


 export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "legendary";
 
 export interface RarityInfo {
   earnedCount: number;
   percentage: number;
   rarity: RarityTier;
 }
 
 const rarityColors: Record<RarityTier, string> = {
   common: "bg-slate-500/20 text-slate-400 border-slate-500/30",
   uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
   rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
   epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
   legendary: "bg-amber-500/20 text-amber-400 border-amber-500/30",
 };
 
 const rarityLabels: Record<RarityTier, string> = {
   common: "Common",
   uncommon: "Uncommon",
   rare: "Rare",
   epic: "Epic",
   legendary: "Legendary",
 };
 
interface AchievementBadgeProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
   rarity?: RarityInfo;
   showRarity?: boolean;
}

const AchievementBadge = ({ 
  achievement, 
  earned, 
  earnedAt,
  size = 'md',
   showName = true,
   rarity,
   showRarity = false,
}: AchievementBadgeProps) => {
  const Icon = iconMap[achievement.icon];
  
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
  };
  
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div 
          className="flex flex-col items-center gap-1 cursor-pointer"
          whileHover={{ scale: earned ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div
            className={cn(
              "rounded-full flex items-center justify-center transition-all",
              sizeClasses[size],
              earned 
                ? `bg-gradient-to-br ${achievement.color} shadow-lg` 
                : "bg-muted/50 border-2 border-dashed border-muted-foreground/30"
            )}
          >
            <Icon 
              className={cn(
                iconSizes[size],
                earned ? "text-white" : "text-muted-foreground/50"
              )} 
            />
          </div>
          {showName && (
            <span className={cn(
              "text-xs text-center max-w-16 leading-tight",
              earned ? "text-foreground" : "text-muted-foreground"
            )}>
              {achievement.name}
            </span>
          )}
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-48">
        <p className="font-semibold">{achievement.name}</p>
        <p className="text-muted-foreground text-xs">{achievement.description}</p>
         {rarity && (
           <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
             <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", rarityColors[rarity.rarity])}>
               {rarityLabels[rarity.rarity]}
             </Badge>
             <span className="text-[10px] text-muted-foreground flex items-center gap-1">
               <Users className="h-3 w-3" />
               {rarity.earnedCount} ({rarity.percentage.toFixed(1)}%)
             </span>
           </div>
         )}
        {earned && earnedAt && (
          <p className="text-xs text-primary mt-1">
            Earned {new Date(earnedAt).toLocaleDateString()}
          </p>
        )}
        {!earned && (
          <p className="text-xs text-muted-foreground mt-1">Not yet earned</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default AchievementBadge;
