 import { motion } from "framer-motion";
 import { Trophy, Medal, Crown, Star, TrendingUp, User } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
 import { useXPLeaderboard, type LeaderboardEntry } from "@/hooks/useXPLeaderboard";
 import { LEVEL_TITLES } from "@/hooks/useXPSystem";
 import { useAuth } from "@/contexts/AuthContext";
 import { Link } from "react-router-dom";
 import { useState } from "react";
 
 interface XPLeaderboardProps {
   compact?: boolean;
   className?: string;
 }
 
 const getRankIcon = (rank: number) => {
   switch (rank) {
     case 1:
       return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
     case 2:
       return <Medal className="h-5 w-5 text-slate-400" />;
     case 3:
       return <Medal className="h-5 w-5 text-amber-600" />;
     default:
       return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
   }
 };
 
 const getRankBg = (rank: number) => {
   switch (rank) {
     case 1:
       return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
     case 2:
       return "bg-gradient-to-r from-slate-500/10 to-slate-400/10 border-slate-400/30";
     case 3:
       return "bg-gradient-to-r from-amber-600/10 to-orange-500/10 border-amber-600/30";
     default:
       return "";
   }
 };
 
 const LeaderboardRow = ({ 
   entry, 
   isCurrentUser,
   timeFrame 
 }: { 
   entry: LeaderboardEntry; 
   isCurrentUser: boolean;
   timeFrame: "all_time" | "weekly";
 }) => {
   const displayXP = timeFrame === "weekly" ? entry.xp_this_week : entry.total_xp;
   const title = LEVEL_TITLES[entry.current_level - 1] || "Novice";
   
   return (
     <motion.div
       initial={{ opacity: 0, x: -10 }}
       animate={{ opacity: 1, x: 0 }}
       transition={{ delay: entry.rank * 0.05 }}
     >
       <Link 
         to={entry.username ? `/u/${entry.username}` : "#"}
         className={cn(
           "flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-accent/50",
           getRankBg(entry.rank),
           isCurrentUser && "ring-2 ring-primary"
         )}
       >
         <div className="w-8 flex justify-center">
           {getRankIcon(entry.rank)}
         </div>
         
         <Avatar className="h-10 w-10">
           <AvatarImage src={entry.avatar_url || undefined} />
           <AvatarFallback>
             <User className="h-5 w-5" />
           </AvatarFallback>
         </Avatar>
         
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2">
             <p className="font-medium truncate">
               {entry.full_name || entry.username || "Anonymous"}
             </p>
             {isCurrentUser && (
               <Badge variant="secondary" className="text-xs">You</Badge>
             )}
           </div>
           <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <Badge variant="outline" className="text-xs gap-1">
               <Star className="h-3 w-3" />
               Lv.{entry.current_level}
             </Badge>
             <span>{title}</span>
           </div>
         </div>
         
         <div className="text-right">
           <p className="font-bold text-lg">{displayXP.toLocaleString()}</p>
           <p className="text-xs text-muted-foreground">XP</p>
         </div>
       </Link>
     </motion.div>
   );
 };
 
 const XPLeaderboard = ({ compact = false, className }: XPLeaderboardProps) => {
   const { user } = useAuth();
   const [timeFrame, setTimeFrame] = useState<"all_time" | "weekly">("all_time");
   const { leaderboard, userRank, isLoading } = useXPLeaderboard(timeFrame, compact ? 5 : 20);
 
   if (isLoading) {
     return (
       <Card className={className}>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Trophy className="h-5 w-5 text-yellow-500" />
             XP Leaderboard
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {[1, 2, 3, 4, 5].map((i) => (
             <div key={i} className="flex items-center gap-3">
               <Skeleton className="h-10 w-10 rounded-full" />
               <div className="flex-1 space-y-2">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-3 w-20" />
               </div>
               <Skeleton className="h-6 w-16" />
             </div>
           ))}
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className={className}>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2">
             <Trophy className="h-5 w-5 text-yellow-500" />
             XP Leaderboard
           </CardTitle>
           <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as typeof timeFrame)}>
             <TabsList className="h-8">
               <TabsTrigger value="all_time" className="text-xs px-2">All Time</TabsTrigger>
               <TabsTrigger value="weekly" className="text-xs px-2">
                 <TrendingUp className="h-3 w-3 mr-1" />
                 This Week
               </TabsTrigger>
             </TabsList>
           </Tabs>
         </div>
       </CardHeader>
       <CardContent>
         {leaderboard.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
             <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
             <p>No leaderboard data yet</p>
             <p className="text-sm">Complete quizzes to earn XP and appear here!</p>
           </div>
         ) : (
           <ScrollArea className={cn(compact ? "h-auto" : "h-[400px]")}>
             <div className="space-y-2 pr-4">
               {leaderboard.map((entry) => (
                 <LeaderboardRow
                   key={entry.user_id}
                   entry={entry}
                   isCurrentUser={user?.id === entry.user_id}
                   timeFrame={timeFrame}
                 />
               ))}
               
               {/* Show current user if not in top list */}
               {userRank && !leaderboard.find(e => e.user_id === user?.id) && (
                 <>
                   <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                     <div className="flex-1 border-t" />
                     <span>Your Position</span>
                     <div className="flex-1 border-t" />
                   </div>
                   <LeaderboardRow
                     entry={userRank}
                     isCurrentUser={true}
                     timeFrame={timeFrame}
                   />
                 </>
               )}
             </div>
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default XPLeaderboard;