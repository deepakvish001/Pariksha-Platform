 import React, { useEffect, useState } from "react";
import { Trophy, Medal, Clock, Target, Crown, Users, Timer, Swords, Flame } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
 import { supabase } from "@/integrations/supabase/client";
 import { cn } from "@/lib/utils";
 
 interface LeaderboardEntry {
   id: string;
   user_id: string;
   quiz_type: string;
   score: number;
   total_questions: number;
   accuracy: number;
   avg_time_seconds: number;
  total_time_seconds: number;
   completed_at: string;
   full_name?: string;
   avatar_url?: string;
 }
 
interface QuizLeaderboardProps {
  quizType: string;
  currentUserId?: string;
  challengeId?: string | null;
}
 
const CHALLENGE_LABELS: Record<string, { name: string; icon: React.ReactNode }> = {
  // Aptitude challenges
  "easy-sprint": { name: "Easy Sprint", icon: <Timer className="h-4 w-4 text-emerald-500" /> },
  "medium-blitz": { name: "Medium Blitz", icon: <Swords className="h-4 w-4 text-amber-500" /> },
  "hard-gauntlet": { name: "Hard Gauntlet", icon: <Flame className="h-4 w-4 text-red-500" /> },
  // DSA challenges
  "dsa-easy-sprint": { name: "DSA Easy Sprint", icon: <Timer className="h-4 w-4 text-emerald-500" /> },
  "dsa-medium-blitz": { name: "DSA Medium Blitz", icon: <Swords className="h-4 w-4 text-amber-500" /> },
  "dsa-hard-gauntlet": { name: "DSA Hard Gauntlet", icon: <Flame className="h-4 w-4 text-red-500" /> },
  // SQL challenges
  "sql-easy-sprint": { name: "SQL Easy Sprint", icon: <Timer className="h-4 w-4 text-emerald-500" /> },
  "sql-medium-blitz": { name: "SQL Medium Blitz", icon: <Swords className="h-4 w-4 text-amber-500" /> },
  "sql-hard-gauntlet": { name: "SQL Hard Gauntlet", icon: <Flame className="h-4 w-4 text-red-500" /> },
  // CS challenges
  "cs-easy-sprint": { name: "CS Easy Sprint", icon: <Timer className="h-4 w-4 text-emerald-500" /> },
  "cs-medium-blitz": { name: "CS Medium Blitz", icon: <Swords className="h-4 w-4 text-amber-500" /> },
  "cs-hard-gauntlet": { name: "CS Hard Gauntlet", icon: <Flame className="h-4 w-4 text-red-500" /> },
};

const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({ quizType, currentUserId, challengeId }) => {
   const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [timeFilter, setTimeFilter] = useState<"all" | "week" | "today">("all");
 
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let difficultyFilter: string | null = null;
        let orderByTotal = false;
        if (challengeId) {
          const difficultyMap: Record<string, string> = {
            "easy-sprint": "Easy",
            "medium-blitz": "Medium",
            "hard-gauntlet": "Hard",
          };
          difficultyFilter = difficultyMap[challengeId] ?? null;
          orderByTotal = true;
        }

        let since: string | null = null;
        if (timeFilter === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          since = today.toISOString();
        } else if (timeFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          since = weekAgo.toISOString();
        }

        const { data: results, error } = await supabase.rpc("get_quiz_leaderboard", {
          p_quiz_type: quizType,
          p_difficulty: difficultyFilter,
          p_since: since,
          p_order_by_total: orderByTotal,
          p_limit: 20,
        });

        if (error) {
          console.error("Error fetching leaderboard:", error);
          setEntries([]);
          return;
        }

        const enrichedEntries: LeaderboardEntry[] = (results ?? []).map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          quiz_type: r.quiz_type,
          score: r.score,
          total_questions: r.total_questions,
          accuracy: Number(r.accuracy),
          avg_time_seconds: r.avg_time_seconds,
          total_time_seconds: r.total_time_seconds,
          completed_at: r.completed_at,
          full_name: r.full_name || "Anonymous",
          avatar_url: r.avatar_url || undefined,
        }));

        setEntries(enrichedEntries);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [quizType, timeFilter, challengeId]);
 
   const getRankIcon = (index: number) => {
     if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />;
     if (index === 1) return <Medal className="h-5 w-5 text-slate-400" />;
     if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
     return <span className="text-sm text-muted-foreground font-medium w-5 text-center">{index + 1}</span>;
   };
 
  const quizTypeLabel: Record<string, string> = {
    aptitude: "Aptitude",
    dsa: "DSA",
    sql: "SQL",
    cs: "CS Core",
  };

  // Get display label for quiz type
  const getQuizTypeLabel = () => {
    // Check if it's a fundamentals quiz type
    if (quizType.startsWith("language-")) {
      const lang = quizType.replace("language-", "");
      return lang.charAt(0).toUpperCase() + lang.slice(1);
    }
    if (quizType.startsWith("oops-")) {
      const concept = quizType.replace("oops-", "").replace(/-/g, " ");
      return concept.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return quizTypeLabel[quizType] || quizType;
  };
 
  const challengeLabel = challengeId ? CHALLENGE_LABELS[challengeId] : null;

   if (isLoading) {
     return (
       <Card className="bg-card/50">
         <CardContent className="p-6 text-center text-muted-foreground">
           
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="bg-card/50 border-primary/20">
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Trophy className="h-5 w-5 text-amber-500" />
            {challengeLabel ? (
              <>
                {challengeLabel.icon}
                {challengeLabel.name} Leaderboard
              </>
            ) : (
              <>{getQuizTypeLabel()} Quiz Leaderboard</>
            )}
           </CardTitle>
           <Badge variant="outline" className="gap-1">
             <Users className="h-3 w-3" />
             {entries.length} players
           </Badge>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
           <TabsList className="w-full">
             <TabsTrigger value="all" className="flex-1">All Time</TabsTrigger>
             <TabsTrigger value="week" className="flex-1">This Week</TabsTrigger>
             <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
           </TabsList>
         </Tabs>
 
         {entries.length === 0 ? (
           <div className="text-center py-8 text-muted-foreground">
             No quiz results yet. Be the first to compete!
           </div>
         ) : (
           <div className="space-y-2 max-h-80 overflow-y-auto">
             {entries.map((entry, index) => (
               <div
                 key={entry.id}
                 className={cn(
                   "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                   entry.user_id === currentUserId
                     ? "bg-primary/10 border-primary/30"
                     : "bg-muted/30 border-border/50",
                   index < 3 && "border-amber-500/30"
                 )}
               >
                 <div className="flex items-center justify-center w-8">
                   {getRankIcon(index)}
                 </div>
                 <Avatar className="h-8 w-8">
                   <AvatarImage src={entry.avatar_url || undefined} />
                   <AvatarFallback className="text-xs">
                     {entry.full_name?.charAt(0) || "?"}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 min-w-0">
                   <div className="font-medium truncate text-sm">
                     {entry.full_name}
                     {entry.user_id === currentUserId && (
                       <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                     )}
                   </div>
                   <div className="text-xs text-muted-foreground">
                     {entry.score}/{entry.total_questions} correct
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="flex items-center gap-1 text-sm font-semibold">
                     <Target className="h-3 w-3 text-primary" />
                     {entry.accuracy}%
                   </div>
                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <Clock className="h-3 w-3" />
                    {challengeId ? `${entry.total_time_seconds}s total` : `${entry.avg_time_seconds}s avg`}
                   </div>
                 </div>
               </div>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default QuizLeaderboard;