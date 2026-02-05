 import { motion } from "framer-motion";
 import { Star, Zap, TrendingUp } from "lucide-react";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { cn } from "@/lib/utils";
 import { useXPSystem, LEVEL_TITLES, getXPForNextLevel } from "@/hooks/useXPSystem";
 
 interface XPLevelBadgeProps {
   compact?: boolean;
   showProgress?: boolean;
   className?: string;
 }
 
 const XPLevelBadge = ({ compact = false, showProgress = true, className }: XPLevelBadgeProps) => {
   const { totalXP, currentLevel, title, progress, isLoading } = useXPSystem();
 
   if (isLoading) {
     return (
       <div className={cn("animate-pulse bg-muted rounded-lg h-10 w-24", className)} />
     );
   }
 
   if (compact) {
     return (
       <TooltipProvider>
         <Tooltip>
           <TooltipTrigger asChild>
             <Badge 
               variant="outline" 
               className={cn(
                 "gap-1 cursor-default",
                 currentLevel >= 10 && "border-amber-500/50 bg-amber-500/10 text-amber-600",
                 currentLevel >= 15 && "border-purple-500/50 bg-purple-500/10 text-purple-600",
                 className
               )}
             >
               <Star className="h-3 w-3 fill-current" />
               Lv.{currentLevel}
             </Badge>
           </TooltipTrigger>
           <TooltipContent>
             <div className="text-center">
               <p className="font-bold">{title}</p>
               <p className="text-xs text-muted-foreground">{totalXP.toLocaleString()} XP</p>
               <Progress value={progress.percentage} className="h-1 w-24 mt-1" />
               <p className="text-xs text-muted-foreground mt-1">
                 {progress.current}/{progress.required} to next level
               </p>
             </div>
           </TooltipContent>
         </Tooltip>
       </TooltipProvider>
     );
   }
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className={cn("p-4 rounded-xl border bg-card", className)}
     >
       <div className="flex items-center gap-4">
         <div className={cn(
           "h-14 w-14 rounded-xl flex items-center justify-center font-bold text-xl",
           currentLevel < 5 && "bg-slate-500/10 text-slate-500",
           currentLevel >= 5 && currentLevel < 10 && "bg-blue-500/10 text-blue-500",
           currentLevel >= 10 && currentLevel < 15 && "bg-amber-500/10 text-amber-500",
           currentLevel >= 15 && "bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-500"
         )}>
           {currentLevel}
         </div>
         <div className="flex-1">
           <div className="flex items-center gap-2">
             <h3 className="font-bold text-lg">{title}</h3>
             <Badge variant="secondary" className="gap-1">
               <Zap className="h-3 w-3" />
               {totalXP.toLocaleString()} XP
             </Badge>
           </div>
           {showProgress && (
             <div className="mt-2">
               <div className="flex justify-between text-xs text-muted-foreground mb-1">
                 <span>Level {currentLevel}</span>
                 <span>{progress.current}/{progress.required} XP</span>
               </div>
               <Progress value={progress.percentage} className="h-2" />
             </div>
           )}
         </div>
       </div>
     </motion.div>
   );
 };
 
 export default XPLevelBadge;