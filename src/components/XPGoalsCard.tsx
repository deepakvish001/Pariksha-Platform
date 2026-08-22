 import { motion } from "framer-motion";
 import { Target, Zap, TrendingUp, Settings, Check } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Label } from "@/components/ui/label";
 import { Slider } from "@/components/ui/slider";
 import { Skeleton } from "@/components/ui/skeleton";
 import { cn } from "@/lib/utils";
 import { useXPGoals } from "@/hooks/useXPGoals";
import { useXPGoalNotifications } from "@/hooks/useXPGoalNotifications";
 import { useState } from "react";
 
 interface XPGoalsCardProps {
   compact?: boolean;
   className?: string;
 }
 
 const XPGoalsCard = ({ compact = false, className }: XPGoalsCardProps) => {
   const { goals, todayXP, weekXP, dailyProgress, weeklyProgress, isLoading, updateGoals } = useXPGoals();
   const [editDaily, setEditDaily] = useState(goals.dailyXpTarget);
   const [editWeekly, setEditWeekly] = useState(goals.weeklyXpTarget);
   const [isOpen, setIsOpen] = useState(false);

  // Enable XP goal notifications
  useXPGoalNotifications({
    todayXP,
    weekXP,
    dailyTarget: goals.dailyXpTarget,
    weeklyTarget: goals.weeklyXpTarget,
  });
 
   const handleSave = () => {
     updateGoals({ dailyXpTarget: editDaily, weeklyXpTarget: editWeekly });
     setIsOpen(false);
   };
 
   if (isLoading) {
     return (
       <Card className={className}>
         <CardContent className="p-4 space-y-4">
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-2 w-full" />
           <Skeleton className="h-4 w-24" />
           <Skeleton className="h-2 w-full" />
         </CardContent>
       </Card>
     );
   }
 
   const dailyComplete = dailyProgress >= 100;
   const weeklyComplete = weeklyProgress >= 100;
 
   if (compact) {
     return (
       <Card className={className}>
         <CardContent className="p-4">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <Target className="h-4 w-4 text-primary" />
               <span className="font-medium text-sm">XP Goals</span>
             </div>
             <Popover open={isOpen} onOpenChange={setIsOpen}>
               <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" aria-label="Set XP goals" className="h-7 w-7">
                   <Settings className="h-3.5 w-3.5" />
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-72">
                 <div className="space-y-4">
                   <h4 className="font-medium">Set XP Goals</h4>
                   <div>
                     <Label className="text-sm">Daily Goal: {editDaily} XP</Label>
                     <Slider
                       value={[editDaily]}
                       onValueChange={([v]) => setEditDaily(v)}
                       min={10}
                       max={500}
                       step={10}
                       aria-label="Daily goal"
                       className="mt-2"
                     />
                   </div>
                   <div>
                     <Label className="text-sm">Weekly Goal: {editWeekly} XP</Label>
                     <Slider
                       value={[editWeekly]}
                       onValueChange={([v]) => setEditWeekly(v)}
                       min={50}
                       max={2000}
                       step={50}
                       aria-label="Weekly goal"
                       className="mt-2"
                     />
                   </div>
                   <Button onClick={handleSave} className="w-full" size="sm">
                     Save Goals
                   </Button>
                 </div>
               </PopoverContent>
             </Popover>
           </div>
           
           <div className="space-y-3">
             <div>
               <div className="flex items-center justify-between text-xs mb-1">
                 <span className="flex items-center gap-1">
                   <Zap className="h-3 w-3 text-amber-500" />
                   Today
                 </span>
                 <span className={cn(dailyComplete && "text-green-500 font-medium")}>
                   {todayXP}/{goals.dailyXpTarget}
                   {dailyComplete && <Check className="h-3 w-3 inline ml-1" />}
                 </span>
               </div>
               <Progress 
                 value={dailyProgress} 
                 className={cn("h-2", dailyComplete && "[&>div]:bg-green-500")} 
               />
             </div>
             
             <div>
               <div className="flex items-center justify-between text-xs mb-1">
                 <span className="flex items-center gap-1">
                   <TrendingUp className="h-3 w-3 text-blue-500" />
                   This Week
                 </span>
                 <span className={cn(weeklyComplete && "text-green-500 font-medium")}>
                   {weekXP}/{goals.weeklyXpTarget}
                   {weeklyComplete && <Check className="h-3 w-3 inline ml-1" />}
                 </span>
               </div>
               <Progress 
                 value={weeklyProgress} 
                 className={cn("h-2", weeklyComplete && "[&>div]:bg-green-500")} 
               />
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className={className}>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Target className="h-5 w-5 text-primary" />
             XP Goals
           </CardTitle>
           <Popover open={isOpen} onOpenChange={setIsOpen}>
             <PopoverTrigger asChild>
               <Button variant="outline" size="sm" className="gap-1">
                 <Settings className="h-3.5 w-3.5" />
                 Edit
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-72">
               <div className="space-y-4">
                 <h4 className="font-medium">Set XP Goals</h4>
                 <div>
                   <Label className="text-sm">Daily Goal: {editDaily} XP</Label>
                   <Slider
                     value={[editDaily]}
                     onValueChange={([v]) => setEditDaily(v)}
                     min={10}
                     max={500}
                     step={10}
                     className="mt-2"
                   />
                 </div>
                 <div>
                   <Label className="text-sm">Weekly Goal: {editWeekly} XP</Label>
                   <Slider
                     value={[editWeekly]}
                     onValueChange={([v]) => setEditWeekly(v)}
                     min={50}
                     max={2000}
                     step={50}
                     className="mt-2"
                   />
                 </div>
                 <Button onClick={handleSave} className="w-full" size="sm">
                   Save Goals
                 </Button>
               </div>
             </PopoverContent>
           </Popover>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className={cn(
             "p-4 rounded-lg border",
             dailyComplete ? "bg-green-500/10 border-green-500/30" : "bg-amber-500/5 border-amber-500/20"
           )}
         >
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <Zap className={cn("h-5 w-5", dailyComplete ? "text-green-500" : "text-amber-500")} />
               <span className="font-medium">Daily Goal</span>
             </div>
             {dailyComplete ? (
               <Badge className="bg-green-500/20 text-green-600 border-0">
                 <Check className="h-3 w-3 mr-1" />
                 Complete!
               </Badge>
             ) : (
               <Badge variant="outline">{Math.round(dailyProgress)}%</Badge>
             )}
           </div>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-2xl font-bold">{todayXP}</span>
             <span className="text-muted-foreground">/ {goals.dailyXpTarget} XP</span>
           </div>
           <Progress 
             value={dailyProgress} 
             className={cn("h-2", dailyComplete && "[&>div]:bg-green-500")} 
           />
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className={cn(
             "p-4 rounded-lg border",
             weeklyComplete ? "bg-green-500/10 border-green-500/30" : "bg-blue-500/5 border-blue-500/20"
           )}
         >
           <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
               <TrendingUp className={cn("h-5 w-5", weeklyComplete ? "text-green-500" : "text-blue-500")} />
               <span className="font-medium">Weekly Goal</span>
             </div>
             {weeklyComplete ? (
               <Badge className="bg-green-500/20 text-green-600 border-0">
                 <Check className="h-3 w-3 mr-1" />
                 Complete!
               </Badge>
             ) : (
               <Badge variant="outline">{Math.round(weeklyProgress)}%</Badge>
             )}
           </div>
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-2xl font-bold">{weekXP}</span>
             <span className="text-muted-foreground">/ {goals.weeklyXpTarget} XP</span>
           </div>
           <Progress 
             value={weeklyProgress} 
             className={cn("h-2", weeklyComplete && "[&>div]:bg-green-500")} 
           />
         </motion.div>
       </CardContent>
     </Card>
   );
 };
 
 export default XPGoalsCard;