 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Trophy, ChevronRight, Sparkles } from "lucide-react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import AchievementBadge, { achievements, type Achievement } from "@/components/AchievementBadge";
 
 interface RecentAchievementsProps {
   earnedAchievements: Map<string, string>;
   maxDisplay?: number;
 }
 
 const RecentAchievements = ({ earnedAchievements, maxDisplay = 4 }: RecentAchievementsProps) => {
   const navigate = useNavigate();
   
   // Get recently earned achievements, sorted by earned date (most recent first)
   const recentEarned = achievements
     .filter((a) => earnedAchievements.has(a.id))
     .map((a) => ({
       achievement: a,
       earnedAt: earnedAchievements.get(a.id)!,
     }))
     .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
     .slice(0, maxDisplay);
 
   const earnedCount = earnedAchievements.size;
   const totalCount = achievements.length;
 
   if (earnedCount === 0) {
     return (
       <Card className="w-full">
         <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-3">
               <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                 <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
               </div>
               <div className="min-w-0">
                 <CardTitle className="text-base sm:text-lg">Recent Achievements</CardTitle>
                 <CardDescription className="text-xs sm:text-sm">Start learning to earn badges!</CardDescription>
               </div>
             </div>
           </div>
         </CardHeader>
         <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
           <div className="text-center py-6">
             <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
             <p className="text-sm text-muted-foreground">Complete topics and quizzes to unlock achievements!</p>
             <Button 
               variant="link" 
               className="mt-2"
               onClick={() => navigate("/dashboard/achievements")}
             >
               View all badges <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="w-full">
       <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 sm:gap-3">
             <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
               <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
             </div>
             <div className="min-w-0">
               <CardTitle className="text-base sm:text-lg">Recent Achievements</CardTitle>
               <CardDescription className="text-xs sm:text-sm">
                 {earnedCount} of {totalCount} unlocked
               </CardDescription>
             </div>
           </div>
           <Button 
             variant="ghost" 
             size="sm"
             onClick={() => navigate("/dashboard/achievements")}
             className="flex-shrink-0"
           >
             View all <ChevronRight className="h-4 w-4 ml-1" />
           </Button>
         </div>
       </CardHeader>
       <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
         <div className="flex flex-wrap gap-3 sm:gap-4 justify-center sm:justify-start">
           {recentEarned.map(({ achievement, earnedAt }, index) => (
             <motion.div
               key={achievement.id}
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: index * 0.1 }}
             >
               <AchievementBadge
                 achievement={achievement}
                 earned={true}
                 earnedAt={earnedAt}
                 size="md"
                 showName={true}
               />
             </motion.div>
           ))}
         </div>
       </CardContent>
     </Card>
   );
 };
 
 export default RecentAchievements;