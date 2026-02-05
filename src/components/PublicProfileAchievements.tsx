 import { useState, useEffect } from "react";
 import { motion } from "framer-motion";
 import { Trophy, Loader2 } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { supabase } from "@/integrations/supabase/client";
 import AchievementBadge, { achievements, type Achievement } from "@/components/AchievementBadge";
 
 interface EarnedAchievement {
   achievement_id: string;
   earned_at: string;
 }
 
 interface PublicProfileAchievementsProps {
   userId: string;
 }
 
 const PublicProfileAchievements = ({ userId }: PublicProfileAchievementsProps) => {
   const [earnedAchievements, setEarnedAchievements] = useState<EarnedAchievement[]>([]);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchAchievements = async () => {
       try {
         const { data, error } = await supabase
           .from("user_achievements")
           .select("achievement_id, earned_at")
           .eq("user_id", userId)
           .order("earned_at", { ascending: false });
 
         if (!error && data) {
           setEarnedAchievements(data);
         }
       } catch (error) {
         console.error("Error fetching achievements:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchAchievements();
   }, [userId]);
 
   // Get earned achievement details
   const earnedDetails = earnedAchievements
     .map((ea) => {
       const achievement = achievements.find((a) => a.id === ea.achievement_id);
       return achievement ? { achievement, earnedAt: ea.earned_at } : null;
     })
     .filter(Boolean) as { achievement: Achievement; earnedAt: string }[];
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="flex items-center justify-center py-8">
           <Loader2 className="h-6 w-6 animate-spin text-primary" />
         </CardContent>
       </Card>
     );
   }
 
   if (earnedDetails.length === 0) {
     return null; // Don't show section if no achievements
   }
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.25 }}
       className="lg:col-span-2"
     >
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Trophy className="w-5 h-5 text-primary" />
             Achievements
             <span className="ml-auto text-sm font-normal text-muted-foreground">
               {earnedDetails.length} earned
             </span>
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
             {earnedDetails.map(({ achievement, earnedAt }, index) => (
               <motion.div
                 key={achievement.id}
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: index * 0.05 }}
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
     </motion.div>
   );
 };
 
 export default PublicProfileAchievements;