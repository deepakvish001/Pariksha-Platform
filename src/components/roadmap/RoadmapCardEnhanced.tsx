import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Map, ArrowRight, Clock, BookOpen, Timer, TrendingUp, 
  Sprout, Flame, Diamond, CheckCircle2, Lock, GitBranch, ChevronRight, Sparkles
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { type RoadmapTree, type RoadmapTreeNode } from "@/data/roadmapTreesData";

// Difficulty configuration
const difficultyConfig = {
  beginner: {
    label: 'Beginner',
    icon: Sprout,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  intermediate: {
    label: 'Intermediate',
    icon: Flame,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  advanced: {
    label: 'Advanced',
    icon: Diamond,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
};

// Prerequisite indicator component
const PrerequisiteIndicator = ({ 
  roadmapId, 
  userProgress,
  roadmapPrerequisites,
  getRoadmapTitle,
}: { 
  roadmapId: string; 
  userProgress: Record<string, number>;
  roadmapPrerequisites: Record<string, { required: string[]; recommended: string[] }>;
  getRoadmapTitle: (id: string) => string;
}) => {
  const prereqs = roadmapPrerequisites[roadmapId];
  if (!prereqs || (prereqs.required.length === 0 && prereqs.recommended.length === 0)) {
    return null;
  }

  const requiredComplete = prereqs.required.every(id => (userProgress[id] || 0) >= 50);
  const recommendedComplete = prereqs.recommended.every(id => (userProgress[id] || 0) >= 30);

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
      {prereqs.required.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors",
              requiredComplete 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}>
              {requiredComplete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              <span>{prereqs.required.length} Required</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium mb-1">Required Prerequisites:</p>
            <ul className="space-y-1">
              {prereqs.required.map(id => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  {(userProgress[id] || 0) >= 50 ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  {getRoadmapTitle(id)}
                  <span className="text-muted-foreground">({userProgress[id] || 0}%)</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
      
      {prereqs.recommended.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors",
              recommendedComplete 
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                : "bg-muted text-muted-foreground"
            )}>
              <GitBranch className="h-3 w-3" />
              <span>{prereqs.recommended.length} Suggested</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium mb-1">Suggested Prerequisites:</p>
            <ul className="space-y-1">
              {prereqs.recommended.map(id => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  {(userProgress[id] || 0) >= 30 ? (
                    <CheckCircle2 className="h-3 w-3 text-blue-500" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                  {getRoadmapTitle(id)}
                  <span className="text-muted-foreground">({userProgress[id] || 0}%)</span>
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

interface RoadmapCardEnhancedProps {
  roadmap: RoadmapTree;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalTopics: number;
  isFeatured?: boolean;
  userProgress?: Record<string, number>;
  cardProgress?: number;
  popularityScore?: number;
  roadmapPrerequisites?: Record<string, { required: string[]; recommended: string[] }>;
  getRoadmapTitle?: (id: string) => string;
  index?: number;
}

const RoadmapCardEnhanced: React.FC<RoadmapCardEnhancedProps> = ({
  roadmap,
  estimatedTime,
  difficulty,
  totalTopics,
  isFeatured = false,
  userProgress = {},
  cardProgress = 0,
  popularityScore,
  roadmapPrerequisites = {},
  getRoadmapTitle = (id) => id,
  index = 0,
}) => {
  const navigate = useNavigate();
  const diffConfig = difficultyConfig[difficulty];
  const DifficultyIcon = diffConfig.icon;
  const hasProgress = cardProgress > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className="h-full"
    >
      <Card 
        className={cn(
          "group cursor-pointer overflow-hidden h-full transition-all duration-300",
          "border-2 hover:border-primary/50",
          "hover:shadow-xl hover:shadow-primary/10",
          isFeatured && "ring-2 ring-primary/20 glow-border"
        )}
        onClick={() => navigate(`/research/roadmap/${roadmap.id}`)}
      >
        {/* Gradient header with shimmer effect */}
        <div className={cn(
          "h-28 sm:h-32 relative bg-gradient-to-br flex items-center justify-center overflow-hidden",
          roadmap.color
        )}>
          {/* Shimmer effect for featured */}
          {isFeatured && (
            <div className="absolute inset-0 shimmer-effect" />
          )}
          
          {/* Floating icon with glow */}
          <motion.div 
            className="relative z-10"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150" />
            <Map className="h-12 w-12 sm:h-14 sm:w-14 text-white/90 relative z-10" />
          </motion.div>
          
          {/* Featured badge */}
          {isFeatured && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2"
            >
              <Badge className="bg-primary text-primary-foreground gap-1.5 shadow-lg border-0">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            </motion.div>
          )}
          
          {/* Metadata chips */}
          <div className={cn(
            "absolute left-3 right-3 flex items-center justify-between gap-2",
            isFeatured ? "top-10" : "top-3"
          )}>
            {/* Estimated time badge */}
            <Badge variant="secondary" className="bg-black/40 text-white border-0 backdrop-blur-sm gap-1 text-xs">
              <Timer className="h-3 w-3" />
              {estimatedTime}
            </Badge>
            
            {/* Difficulty badge */}
            <Badge 
              variant="secondary" 
              className={cn(
                "border backdrop-blur-sm gap-1 text-xs",
                diffConfig.bgColor,
                diffConfig.color,
                diffConfig.borderColor
              )}
            >
              <DifficultyIcon className="h-3 w-3" />
              {diffConfig.label}
            </Badge>
          </div>
          
          {/* Progress badge */}
          {hasProgress && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-3 right-3"
            >
              <Badge 
                variant="secondary" 
                className={cn(
                  "font-semibold text-xs",
                  cardProgress === 100 
                    ? "bg-emerald-500 text-white border-0" 
                    : "bg-white/90 text-foreground"
                )}
              >
                {cardProgress === 100 ? "✓ Complete" : `${cardProgress}% Done`}
              </Badge>
            </motion.div>
          )}
        </div>

        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors flex items-center justify-between gap-2">
            <span className="truncate">{roadmap.title}</span>
            <ArrowRight className="h-5 w-5 flex-shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm">
            {roadmap.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          {/* Inline progress bar for in-progress roadmaps */}
          {hasProgress && cardProgress < 100 && (
            <div className="mb-3">
              <Progress value={cardProgress} className="h-1.5" />
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span>{totalTopics} topics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{roadmap.nodes.length} sections</span>
            </div>
            {popularityScore && (
              <div className="flex items-center gap-1.5 ml-auto">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">{popularityScore}%</span>
              </div>
            )}
          </div>
          
          {/* Prerequisite Indicator */}
          <PrerequisiteIndicator 
            roadmapId={roadmap.id} 
            userProgress={userProgress}
            roadmapPrerequisites={roadmapPrerequisites}
            getRoadmapTitle={getRoadmapTitle}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapCardEnhanced;
