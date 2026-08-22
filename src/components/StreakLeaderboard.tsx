 import { useState } from "react";
 import { motion } from "framer-motion";
import { Flame, Crown, Medal, ChevronDown, ChevronUp, ExternalLink, UserPlus, Heart } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Skeleton } from "@/components/ui/skeleton";
 import { cn } from "@/lib/utils";
 import { useStreakLeaderboard } from "@/hooks/useStreakLeaderboard";
import { useFollows } from "@/hooks/useFollows";
import { useAuth } from "@/contexts/AuthContext";
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
 
 const StreakLeaderboard = () => {
   const { leaderboard, currentUserRank, isLoading } = useStreakLeaderboard();
  const { isFollowing, followUser, unfollowUser } = useFollows();
  const { user } = useAuth();
   const [expanded, setExpanded] = useState(false);
 
   const displayedEntries = expanded ? leaderboard : leaderboard.slice(0, 5);
   const isCurrentUserInTop = currentUserRank && currentUserRank.rank <= (expanded ? 50 : 5);
 
  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

   if (isLoading) {
     return (
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Flame className="h-5 w-5 text-orange-500" />
             Streak Leaderboard
           </CardTitle>
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
         <CardHeader className="pb-3">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Flame className="h-5 w-5 text-orange-500" />
             Streak Leaderboard
           </CardTitle>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground text-center py-4">
             No active streaks yet. Start learning to begin your streak!
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-lg">
           <Flame className="h-5 w-5 text-orange-500" />
           Streak Leaderboard
         </CardTitle>
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
                    aria-label={`View ${entry.username}'s profile`}
                     className="text-muted-foreground hover:text-primary transition-colors"
                   >
                     <ExternalLink className="h-3 w-3" />
                   </Link>
                 )}
              {user && entry.userId !== user.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1"
                  aria-label={isFollowing(entry.userId) ? "Unfollow" : "Follow"}
                  onClick={(e) => handleFollow(e, entry.userId)}
                >
                  {isFollowing(entry.userId) ? (
                    <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  ) : (
                    <UserPlus className="h-3 w-3" />
                  )}
                </Button>
              )}
               </div>
               <div className="flex items-center gap-1.5 mt-0.5">
                 {entry.isActive ? (
                   <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-green-500/50 text-green-400">
                     🔥 Active
                   </Badge>
                 ) : (
                   <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                     Inactive
                   </Badge>
                 )}
                 <span className="text-[10px] text-muted-foreground">
                   Best: {entry.longestStreak} days
                 </span>
               </div>
             </div>
 
             {/* Current Streak */}
             <div className="text-right">
               <div className="flex items-center gap-1">
                 <Flame className={cn("h-4 w-4", entry.isActive ? "text-orange-500" : "text-muted-foreground")} />
                 <span className="font-bold text-sm">{entry.currentStreak}</span>
               </div>
               <span className="text-[10px] text-muted-foreground">days</span>
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
               <div className="w-6 flex items-center justify-center">
                 <span className="text-sm font-medium text-primary w-5 text-center">
                   {currentUserRank.rank}
                 </span>
               </div>
               <Avatar className="h-8 w-8 ring-2 ring-primary/50">
                 <AvatarImage src={currentUserRank.entry.avatarUrl || undefined} />
                 <AvatarFallback className="text-xs">
                   {currentUserRank.entry.fullName?.charAt(0) || "?"}
                 </AvatarFallback>
               </Avatar>
               <div className="flex-1 min-w-0">
                 <span className="font-medium text-sm truncate text-primary">
                   {currentUserRank.entry.fullName || "You"} (You)
                 </span>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   {currentUserRank.entry.isActive ? (
                     <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-green-500/50 text-green-400">
                       🔥 Active
                     </Badge>
                   ) : (
                     <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
                       Inactive
                     </Badge>
                   )}
                   <span className="text-[10px] text-muted-foreground">
                     Best: {currentUserRank.entry.longestStreak} days
                   </span>
                 </div>
               </div>
               <div className="text-right">
                 <div className="flex items-center gap-1">
                   <Flame className={cn("h-4 w-4", currentUserRank.entry.isActive ? "text-orange-500" : "text-muted-foreground")} />
                   <span className="font-bold text-sm">{currentUserRank.entry.currentStreak}</span>
                 </div>
                 <span className="text-[10px] text-muted-foreground">days</span>
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
 
 export default StreakLeaderboard;