import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, BookOpen, Sparkles, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import StreakBadge from "./StreakBadge";

interface Sheet {
  id: string;
  title: string;
  description: string;
  category: string;
  problems: number;
  difficulty: string;
  starred: boolean;
}

interface SheetCardProps {
  sheet: Sheet;
  index: number;
  progress?: number;
  completedCount?: number;
  lastActivityAt?: string | null;
  streak?: number;
  isLoading?: boolean;
}

const getCategoryStyles = (category: string) => {
  switch (category.toLowerCase()) {
    case "dsa":
      return { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" };
    case "cp":
      return { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" };
    case "sql":
      return { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" };
    case "dbms":
      return { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/20" };
    case "cn":
      return { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/20" };
    case "os":
      return { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" };
    case "system design":
      return { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" };
    default:
      return { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" };
  }
};

const getDifficultyStyles = (difficulty: string) => {
  if (difficulty.includes("Easy")) return "text-emerald-500 bg-emerald-500/10";
  if (difficulty.includes("Hard")) return "text-red-500 bg-red-500/10";
  return "text-amber-500 bg-amber-500/10";
};

const SheetCard = ({ sheet, index, progress = 0, completedCount = 0, lastActivityAt, streak = 0, isLoading = false }: SheetCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const categoryStyles = getCategoryStyles(sheet.category);

  const formattedLastActivity = lastActivityAt 
    ? formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden cursor-pointer group",
          "border-border/50 hover:border-primary/30",
          "bg-gradient-to-br from-card to-card/80",
          "transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
        )}
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/learn/sheets/${sheet.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/learn/sheets/${sheet.id}`);
          }
        }}
      >
        {/* Category Color Strip */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", categoryStyles.bg)} />

        {/* Starred Badge & Streak */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          {streak > 0 && <StreakBadge streak={streak} />}
          {sheet.starred && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
            >
              <Star className="h-5 w-5 text-amber-500 fill-amber-500 drop-shadow-sm" />
            </motion.div>
          )}
        </div>

        <CardContent className="p-5 pt-6 flex flex-col h-full">
          {/* Icon & Category */}
          <div className="flex items-start gap-3 mb-4">
            <div className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              "group-hover:from-primary/30 group-hover:to-primary/20",
              "transition-all duration-300"
            )}>
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium", categoryStyles.text, categoryStyles.border)}
              >
                {sheet.category}
              </Badge>
            </div>
          </div>

          {/* Title & Description */}
          <div className="flex-1 space-y-2 mb-4">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {sheet.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {sheet.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              {isLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <span className="font-medium">{progress}%</span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-1.5 w-full" />
            ) : (
              <Progress 
                value={progress} 
                className={cn(
                  "h-1.5",
                  progress === 100 && "[&>div]:bg-emerald-500"
                )} 
              />
            )}
          </div>

          {/* Last Activity */}
          {formattedLastActivity && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>Active {formattedLastActivity}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {completedCount > 0 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm font-medium">
                    {completedCount}/{sheet.problems}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{sheet.problems} problems</span>
                </>
              )}
            </div>
            <Badge 
              variant="secondary" 
              className={cn("text-xs", getDifficultyStyles(sheet.difficulty))}
            >
              {sheet.difficulty}
            </Badge>
          </div>
        </CardContent>

        {/* Hover Preview Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-card via-card/95 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Click to start practicing</p>
                  <div className="flex items-center gap-2">
                    {progress > 0 && progress < 100 && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Continue Learning
                      </Badge>
                    )}
                    {progress === 100 && (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        Completed!
                      </Badge>
                    )}
                    {progress === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Start Fresh
                      </Badge>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronRight className="h-5 w-5 text-primary" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default SheetCard;
