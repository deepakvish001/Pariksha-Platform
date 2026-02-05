 import { useState } from "react";
 import { motion } from "framer-motion";
import { Trophy, Crown, Medal, Award, ChevronDown, ChevronUp, ExternalLink, Sparkles, Hash } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { cn } from "@/lib/utils";
import { useAchievementLeaderboard, SortMode } from "@/hooks/useAchievementLeaderboard";
 import { Link } from "react-router-dom";
 
 const getRankIcon = (rank: number) => {
   if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
   if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
   if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
   return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
 };
 
 const getRankBg = (rank: number) => {
   if (rank === 1) return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
   if (rank === 2) return "bg-gradient-to-r from-slate-400/10 to-slate-500/10 border-slate-400/30";
   if (rank === 3) return "bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30";
   return "bg-card border-border";
 };
 
 const AchievementLeaderboard = () => {
  const [sortMode, setSortMode] = useState<SortMode>("rarity");
  const { leaderboard, currentUserRank, isLoading } = useAchievementLeaderboard(sortMode);
   const [expanded, setExpanded] = useState(false);
 
   const displayedEntries = expanded ? leaderboard : leaderboard.slice(0, 5);
  const isCurrentUserInTop = currentUserRank && currentUserRank.rank <= (expanded ? 50 : 5);
 
   if (isLoading) {
     return (
       <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Achievement Leaderboard
            </CardTitle>
          </div>
         </CardHeader>
         <CardContent className="space-y-3">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center gap-3">
               <Skeleton className="h-8 w-8 rounded-full" />
               <Skeleton className="h-4 flex-1" />
               <Skeleton className="h-4 w-16" />
             </div>
           ))}
         </CardContent>
       </Card>
     );
   }
 
   if (leaderboard.length === 0) {
     return (
       <Card>
        <CardHeader className="pb-2">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Trophy className="h-5 w-5 text-primary" />
             Achievement Leaderboard
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground text-center py-4">
             No achievements earned yet. Be the first!
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Achievement Leaderboard
          </CardTitle>
          <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="rarity" className="text-xs px-3 h-7 gap-1">
                <Sparkles className="h-3 w-3" />
                Most Rare
              </TabsTrigger>
              <TabsTrigger value="total" className="text-xs px-3 h-7 gap-1">
                <Hash className="h-3 w-3" />
                Most Badges
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
       </CardHeader>
       <CardContent className="space-y-2">
         {displayedEntries.map((entry, index) => (
           <motion.div
             key={entry.userId}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: index * 0.05 }}
             className={cn(
               "flex items-center gap-3 p-2 rounded-lg border transition-colors",
               getRankBg(index + 1)
             )}
           >
             {/* Rank */}
             <div className="w-6 flex items-center justify-center">
               {getRankIcon(index + 1)}
             </div>
 
             {/* Avatar */}
             <Avatar className="h-8 w-8">
               <AvatarImage src={entry.avatarUrl || undefined} />
               <AvatarFallback className="text-xs">
                 {entry.fullName?.charAt(0) || "?"}
               </AvatarFallback>
             </Avatar>
 
             {/* Name & Stats */}
             <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2">
                 <span className="font-medium text-sm truncate">
                   {entry.fullName || "Anonymous"}
                 </span>
                 {entry.username && (
                   <Link
                     to={`/u/${entry.username}`}
                     className="text-muted-foreground hover:text-primary transition-colors"
                   >
                     <ExternalLink className="h-3 w-3" />
                   </Link>
                 )}
               </div>
               <div className="flex items-center gap-1.5 mt-0.5">
                 {entry.legendaryCount > 0 && (
                   <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500/50 text-amber-400">
                     {entry.legendaryCount} Legendary
                   </Badge>
                 )}
                 {entry.epicCount > 0 && (
                   <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-purple-500/50 text-purple-400">
                     {entry.epicCount} Epic
                   </Badge>
                 )}
                 {entry.rareCount > 0 && (
                   <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-500/50 text-blue-400">
                     {entry.rareCount} Rare
                   </Badge>
                 )}
               </div>
             </div>
 
             {/* Score */}
             <div className="text-right">
               <div className="flex items-center gap-1">
                {sortMode === "rarity" ? (
                  <Award className="h-4 w-4 text-primary" />
                ) : (
                  <Trophy className="h-4 w-4 text-primary" />
                )}
                <span className="font-bold text-sm">
                  {sortMode === "rarity" ? entry.rarityScore : entry.totalAchievements}
                </span>
               </div>
               <span className="text-[10px] text-muted-foreground">
                {sortMode === "rarity" ? `${entry.totalAchievements} badges` : "badges"}
               </span>
             </div>
           </motion.div>
         ))}
 
        {/* Current user rank (if not in displayed list) */}
        {currentUserRank && !isCurrentUserInTop && (
          <>
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
              <span className="text-xs text-muted-foreground">Your Rank</span>
              <div className="flex-1 border-t border-dashed border-muted-foreground/30" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 rounded-lg border bg-primary/5 border-primary/30"
            >
              {/* Rank */}
              <div className="w-6 flex items-center justify-center">
                <span className="text-sm font-medium text-primary w-5 text-center">
                  {currentUserRank.rank}
                </span>
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8 ring-2 ring-primary/50">
                <AvatarImage src={currentUserRank.entry.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {currentUserRank.entry.fullName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              {/* Name & Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate text-primary">
                    {currentUserRank.entry.fullName || "You"} (You)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {currentUserRank.entry.legendaryCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500/50 text-amber-400">
                      {currentUserRank.entry.legendaryCount} Legendary
                    </Badge>
                  )}
                  {currentUserRank.entry.epicCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-purple-500/50 text-purple-400">
                      {currentUserRank.entry.epicCount} Epic
                    </Badge>
                  )}
                  {currentUserRank.entry.rareCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-500/50 text-blue-400">
                      {currentUserRank.entry.rareCount} Rare
                    </Badge>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {sortMode === "rarity" ? (
                    <Award className="h-4 w-4 text-primary" />
                  ) : (
                    <Trophy className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-bold text-sm">
                    {sortMode === "rarity" ? currentUserRank.entry.rarityScore : currentUserRank.entry.totalAchievements}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {sortMode === "rarity" ? `${currentUserRank.entry.totalAchievements} badges` : "badges"}
                </span>
              </div>
            </motion.div>
          </>
        )}

         {leaderboard.length > 5 && (
           <Button
             variant="ghost"
             size="sm"
             className="w-full mt-2"
             onClick={() => setExpanded(!expanded)}
           >
             {expanded ? (
               <>
                 <ChevronUp className="h-4 w-4 mr-1" />
                 Show Less
               </>
             ) : (
               <>
                 <ChevronDown className="h-4 w-4 mr-1" />
                 Show More ({leaderboard.length - 5} more)
               </>
             )}
           </Button>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default AchievementLeaderboard;