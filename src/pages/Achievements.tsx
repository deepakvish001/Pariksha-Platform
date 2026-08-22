import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock, Star, Flame, Target, Zap, Medal, CheckCircle, Loader2, Filter, Network } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AchievementBadge, { achievements, type Achievement, type RarityTier } from "@/components/AchievementBadge";
import { useUserAchievements } from "@/hooks/useUserAchievements";
import { useAchievementRarity } from "@/hooks/useAchievementRarity";
import ShareableAchievementCard from "@/components/ShareableAchievementCard";
import AchievementLeaderboard from "@/components/AchievementLeaderboard";
import StreakLeaderboard from "@/components/StreakLeaderboard";
import AchievementComparison from "@/components/AchievementComparison";

const categories = [
  { id: "all", label: "All", icon: Trophy },
  { id: "topics", label: "Learning", icon: Star },
  { id: "streak", label: "Streaks", icon: Flame },
  { id: "quiz", label: "Quizzes", icon: Target },
  { id: "fundamentals", label: "Fundamentals", icon: Zap },
  { id: "system_design", label: "System Design", icon: Network },
  { id: "research", label: "Research", icon: Medal },
  
];


const rarityFilters = [
  { id: "all", label: "All Rarities" },
  { id: "legendary", label: "Legendary" },
  { id: "epic", label: "Epic" },
  { id: "rare", label: "Rare" },
  { id: "uncommon", label: "Uncommon" },
  { id: "common", label: "Common" },
];

const getCategoryFromAchievement = (achievement: Achievement): string => {
  
  if (achievement.requirement.type.startsWith("research")) return "research";
  if (achievement.requirement.type.startsWith("system_design")) return "system_design";
  if (achievement.requirement.type.startsWith("fundamentals")) return "fundamentals";
  if (achievement.requirement.type.startsWith("quiz")) return "quiz";
  if (achievement.requirement.type === "streak_days") return "streak";
  return "topics";
};
 
 const AchievementCard = ({
   achievement,
   earned,
   earnedAt,
   progress,
   rarity,
   showShare = false,
 }: {
   achievement: Achievement;
   earned: boolean;
   earnedAt?: string;
   progress: { current: number; target: number };
   rarity?: { earnedCount: number; percentage: number; rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" };
   showShare?: boolean;
 }) => {
   const progressPercent = Math.round((progress.current / progress.target) * 100);
 
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       whileHover={{ scale: 1.02 }}
       transition={{ type: "spring", stiffness: 300 }}
     >
       <Card
         className={cn(
           "relative overflow-hidden transition-all",
           earned
             ? "border-primary/50 bg-gradient-to-br from-primary/5 to-transparent"
             : "border-border bg-card"
         )}
       >
         {/* Earned indicator */}
         {earned && (
           <div className="absolute top-2 right-2 flex items-center gap-1">
             {showShare && earnedAt && rarity && (
               <ShareableAchievementCard
                 achievement={achievement}
                 earnedAt={earnedAt}
                 rarity={rarity}
               />
             )}
             <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
               <CheckCircle className="w-3 h-3 mr-1" />
               Earned
             </Badge>
           </div>
         )}
         {/* Rarity indicator */}
         {rarity && (
           <div className="absolute bottom-2 right-2">
             <Badge 
               variant="outline" 
               className={cn(
                 "text-[10px]",
                 rarity.rarity === "legendary" && "border-amber-500/50 text-amber-400",
                 rarity.rarity === "epic" && "border-purple-500/50 text-purple-400",
                 rarity.rarity === "rare" && "border-blue-500/50 text-blue-400",
                 rarity.rarity === "uncommon" && "border-green-500/50 text-green-400",
                 rarity.rarity === "common" && "border-slate-500/50 text-slate-400"
               )}
             >
               {rarity.rarity.charAt(0).toUpperCase() + rarity.rarity.slice(1)}
             </Badge>
           </div>
         )}
 
         <CardContent className="p-4">
           <div className="flex items-start gap-4">
             {/* Badge */}
             <AchievementBadge
               achievement={achievement}
               earned={earned}
               earnedAt={earnedAt}
               size="lg"
               showName={false}
                 rarity={rarity}
             />
 
             {/* Details */}
             <div className="flex-1 min-w-0">
               <h3
                 className={cn(
                   "font-semibold text-base",
                   earned ? "text-foreground" : "text-muted-foreground"
                 )}
               >
                 {achievement.name}
               </h3>
               <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
 
               {/* Progress */}
               {!earned && (
                 <div className="mt-3 space-y-1.5">
                   <div className="flex items-center justify-between text-xs">
                     <span className="text-muted-foreground">Progress</span>
                     <span className="font-medium text-foreground">
                       {progress.current}/{progress.target}
                     </span>
                   </div>
                   <Progress value={progressPercent} className="h-2" />
                 </div>
               )}
 
               {/* Earned date */}
               {earned && earnedAt && (
                 <p className="text-xs text-primary mt-2">
                   Earned on {new Date(earnedAt).toLocaleDateString()}
                 </p>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 };
 
 const Achievements = () => {
   const [selectedCategory, setSelectedCategory] = useState("all");
   const [selectedRarity, setSelectedRarity] = useState("all");
   const { loading, isEarned, getEarnedAt, getAchievementProgress } = useUserAchievements();
   const { getRarity, isLoading: rarityLoading } = useAchievementRarity();
 
   const filteredAchievements = achievements.filter((achievement) => {
     // Category filter
     const categoryMatch = selectedCategory === "all" || getCategoryFromAchievement(achievement) === selectedCategory;
     
     // Rarity filter
     const rarityInfo = getRarity(achievement.id);
     const rarityMatch = selectedRarity === "all" || rarityInfo?.rarity === selectedRarity;
     
     return categoryMatch && rarityMatch;
   });
 
   const earnedCount = achievements.filter((a) => isEarned(a.id)).length;
   const totalCount = achievements.length;
   const completionPercent = Math.round((earnedCount / totalCount) * 100);
 
   if (loading || rarityLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-2">
             <Trophy className="h-5 w-5 text-primary" />
             <h1 className="text-lg font-semibold">Achievements</h1>
           </div>
         </div>
       </header>
 
       <main className="container max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
         {/* Summary Card */}
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
           <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
             <CardContent className="p-6">
               <div className="flex flex-col md:flex-row md:items-center gap-6">
                 {/* Trophy display */}
                 <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                   <Trophy className="w-12 h-12 text-white" />
                 </div>
 
                 {/* Stats */}
                 <div className="flex-1 space-y-4">
                   <div>
                     <h2 className="text-2xl font-bold">
                       {earnedCount} of {totalCount} Achievements
                     </h2>
                     <p className="text-muted-foreground">
                       You've unlocked {completionPercent}% of all achievements
                     </p>
                   </div>
 
                   <div className="space-y-2">
                     <Progress value={completionPercent} className="h-3" />
                     <div className="flex items-center justify-between text-sm">
                       <span className="text-muted-foreground">Overall Progress</span>
                       <span className="font-semibold text-primary">{completionPercent}%</span>
                     </div>
                   </div>
                 </div>
 
                 {/* Quick stats */}
                 <div className="grid grid-cols-3 gap-4 md:gap-6">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-foreground">
                       {achievements.filter((a) => getCategoryFromAchievement(a) === "topics" && isEarned(a.id)).length}
                     </div>
                     <div className="text-xs text-muted-foreground">Learning</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-foreground">
                       {achievements.filter((a) => getCategoryFromAchievement(a) === "streak" && isEarned(a.id)).length}
                     </div>
                     <div className="text-xs text-muted-foreground">Streaks</div>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-foreground">
                       {achievements.filter((a) => getCategoryFromAchievement(a) === "quiz" && isEarned(a.id)).length}
                     </div>
                     <div className="text-xs text-muted-foreground">Quizzes</div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </motion.div>
 
          {/* Leaderboard */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AchievementLeaderboard />
            <StreakLeaderboard />
          </div>

          {/* Comparison */}
          <AchievementComparison />

         {/* Category Tabs */}
         <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
           <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <TabsList className="grid w-full grid-cols-7 max-w-3xl">
                {categories.map((cat) => (
                 <TabsTrigger key={cat.id} value={cat.id} aria-label={cat.label} className="flex items-center gap-1.5">
                   <cat.icon className="w-4 h-4" />
                   <span className="hidden sm:inline">{cat.label}</span>
                 </TabsTrigger>
               ))}
             </TabsList>
             
             {/* Rarity Filter */}
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground" />
               <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                 <SelectTrigger className="w-[150px]">
                   <SelectValue placeholder="Filter by rarity" />
                 </SelectTrigger>
                 <SelectContent>
                   {rarityFilters.map((filter) => (
                     <SelectItem key={filter.id} value={filter.id}>
                       {filter.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <TabsContent value={selectedCategory} className="mt-6">
             {/* Earned Achievements */}
             <div className="space-y-4 mb-8">
               <div className="flex items-center gap-2">
                 <CheckCircle className="w-5 h-5 text-primary" />
                 <h3 className="font-semibold">Earned</h3>
                 <Badge variant="secondary">
                   {filteredAchievements.filter((a) => isEarned(a.id)).length}
                 </Badge>
               </div>
 
               {filteredAchievements.filter((a) => isEarned(a.id)).length > 0 ? (
                 <div className="grid gap-4 sm:grid-cols-2">
                   {filteredAchievements
                     .filter((a) => isEarned(a.id))
                     .map((achievement) => (
                       <AchievementCard
                         key={achievement.id}
                         achievement={achievement}
                         earned={true}
                         earnedAt={getEarnedAt(achievement.id)}
                         progress={getAchievementProgress(achievement)}
                         rarity={getRarity(achievement.id)}
                         showShare={true}
                       />
                     ))}
                 </div>
               ) : (
                 <Card className="border-dashed">
                   <CardContent className="p-8 text-center">
                     <Lock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                     <p className="text-muted-foreground">
                       No achievements earned in this category yet.
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       Keep learning to unlock your first badge!
                     </p>
                   </CardContent>
                 </Card>
               )}
             </div>
 
             {/* In Progress Achievements */}
             <div className="space-y-4">
               <div className="flex items-center gap-2">
                 <Target className="w-5 h-5 text-muted-foreground" />
                 <h3 className="font-semibold">In Progress</h3>
                 <Badge variant="outline">
                   {filteredAchievements.filter((a) => !isEarned(a.id)).length}
                 </Badge>
               </div>
 
               {filteredAchievements.filter((a) => !isEarned(a.id)).length > 0 ? (
                 <div className="grid gap-4 sm:grid-cols-2">
                   {filteredAchievements
                     .filter((a) => !isEarned(a.id))
                     .sort((a, b) => {
                       // Sort by progress percentage (closest to completion first)
                       const progressA = getAchievementProgress(a);
                       const progressB = getAchievementProgress(b);
                       const percentA = progressA.current / progressA.target;
                       const percentB = progressB.current / progressB.target;
                       return percentB - percentA;
                     })
                     .map((achievement) => (
                       <AchievementCard
                         key={achievement.id}
                         achievement={achievement}
                         earned={false}
                         progress={getAchievementProgress(achievement)}
                         rarity={getRarity(achievement.id)}
                       />
                     ))}
                 </div>
               ) : (
                 <Card className="border-dashed bg-primary/5">
                   <CardContent className="p-8 text-center">
                     <Trophy className="w-12 h-12 mx-auto text-primary mb-3" />
                     <p className="text-foreground font-medium">
                       All achievements in this category earned! 🎉
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       You're a true champion!
                     </p>
                   </CardContent>
                 </Card>
               )}
             </div>
           </TabsContent>
         </Tabs>
       </main>
     </div>
   );
 };
 
 export default Achievements;