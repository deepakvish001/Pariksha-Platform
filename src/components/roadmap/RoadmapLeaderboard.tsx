import React from "react";
import { Trophy, Medal, Crown, Map, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRoadmapLeaderboard, type RoadmapLeaderboardEntry } from "@/hooks/useRoadmapLeaderboard";
import { formatDistanceToNow } from "date-fns";

interface RoadmapLeaderboardProps {
  currentUserId?: string;
  limit?: number;
}

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
        <Crown className="h-4 w-4 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-lg shadow-slate-400/30">
        <Medal className="h-4 w-4 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-lg shadow-amber-600/30">
        <Medal className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-semibold text-sm">
      {rank}
    </div>
  );
};

const LeaderboardRow: React.FC<{ 
  entry: RoadmapLeaderboardEntry; 
  isCurrentUser: boolean;
}> = ({ entry, isCurrentUser }) => {
  const displayName = entry.full_name || entry.username || "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        isCurrentUser 
          ? "bg-primary/10 border border-primary/20" 
          : "hover:bg-muted/50"
      )}
    >
      <RankBadge rank={entry.rank} />
      
      <Avatar className="h-10 w-10 border-2 border-background">
        <AvatarImage src={entry.avatar_url || undefined} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{displayName}</p>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-xs">You</Badge>
          )}
        </div>
        {entry.username && (
          <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
        )}
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>{entry.completed_topics}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Map className="h-3 w-3" />
          <span>{entry.roadmaps_started} paths</span>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-8 w-12" />
      </div>
    ))}
  </div>
);

const RoadmapLeaderboard: React.FC<RoadmapLeaderboardProps> = ({ 
  currentUserId,
  limit = 20,
}) => {
  const { leaderboard, userRank, isLoading } = useRoadmapLeaderboard(limit);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-amber-500" />
            Roadmap Champions
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Top {limit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No completions yet</p>
            <p className="text-sm">Be the first to complete a roadmap topic!</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.user_id}
                    entry={entry}
                    isCurrentUser={entry.user_id === currentUserId}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Current user's rank if not in top N */}
            {userRank && !leaderboard.find(e => e.user_id === currentUserId) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Your Position</p>
                <LeaderboardRow entry={userRank} isCurrentUser />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RoadmapLeaderboard;
