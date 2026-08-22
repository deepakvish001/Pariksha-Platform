 import { useState } from "react";
 import { motion } from "framer-motion";
import { Users, Search, X, Trophy, Check, Minus, Loader2, UserPlus, Heart } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
 import { cn } from "@/lib/utils";
import { useAchievementComparison, ComparisonUser } from "@/hooks/useAchievementComparison";
import { useFollows } from "@/hooks/useFollows";
 import { achievements as allAchievements } from "@/components/AchievementBadge";
 import AchievementBadge from "@/components/AchievementBadge";
 
 const AchievementComparison = () => {
   const {
     searchQuery,
     setSearchQuery,
     searchUsers,
     searchResults,
    followedUsers,
    isLoadingFollowed,
     isSearching,
     selectedUser,
     compareWith,
     comparison,
     isLoading,
     clearComparison,
   } = useAchievementComparison();
 
  const { isFollowing, followUser, unfollowUser } = useFollows();
  const [activeTab, setActiveTab] = useState<"following" | "search">("following");

   const handleSearch = (value: string) => {
     setSearchQuery(value);
     searchUsers(value);
   };
 
   const getAchievementById = (id: string) => {
     return allAchievements.find((a) => a.id === id);
   };
 
  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const renderUserCard = (user: ComparisonUser, showFollowButton = false) => (
    <motion.div
      key={user.userId}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      role="button"
      tabIndex={0}
      onClick={() => compareWith(user)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          compareWith(user);
        }
      }}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user.avatarUrl || undefined} />
        <AvatarFallback className="text-xs">
          {user.fullName?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">
          {user.fullName}
        </span>
        {user.username && (
          <span className="text-xs text-muted-foreground">@{user.username}</span>
        )}
      </div>
      <Badge variant="secondary" className="text-xs">
        {user.earnedAchievements.length} badges
      </Badge>
      {showFollowButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={isFollowing(user.userId) ? "Unfollow" : "Follow"}
          onClick={(e) => handleFollow(e, user.userId)}
        >
          {isFollowing(user.userId) ? (
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
        </Button>
      )}
    </motion.div>
  );

   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-lg">
           <Users className="h-5 w-5 text-primary" />
           Compare Achievements
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
         {!comparison ? (
           <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "following" | "search")}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="following" className="text-xs gap-1">
                  <Heart className="h-3 w-3" />
                  Following ({followedUsers.length})
                </TabsTrigger>
                <TabsTrigger value="search" className="text-xs gap-1">
                  <Search className="h-3 w-3" />
                  Search
                </TabsTrigger>
              </TabsList>

              <TabsContent value="following" className="mt-3 space-y-2">
                {isLoadingFollowed ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                ) : followedUsers.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {followedUsers.map((user) => renderUserCard(user))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Heart className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      You're not following anyone yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search for users to follow them
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="search" className="mt-3 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a user..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => renderUserCard(user, true))}
                  </div>
                ) : searchQuery.length >= 2 && !isSearching ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No users found matching "{searchQuery}"
                  </p>
                ) : searchQuery.length < 2 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Type at least 2 characters to search
                  </p>
                ) : null}
              </TabsContent>
            </Tabs>
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Comparison Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* You */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 ring-2 ring-primary">
                    <AvatarImage src={comparison.you?.avatarUrl || undefined} />
                    <AvatarFallback>{comparison.you?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">You</p>
                    <p className="text-xs text-primary">{comparison.you?.earnedAchievements.length} badges</p>
                  </div>
                </div>

                <span className="text-muted-foreground font-bold">VS</span>

                {/* Them */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 ring-2 ring-orange-500">
                    <AvatarImage src={comparison.them?.avatarUrl || undefined} />
                    <AvatarFallback>{comparison.them?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{comparison.them?.fullName}</p>
                    <p className="text-xs text-orange-500">{comparison.them?.earnedAchievements.length} badges</p>
                  </div>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={clearComparison}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-lg font-bold text-green-500">{comparison.shared.length}</p>
                <p className="text-[10px] text-muted-foreground">Shared</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-lg font-bold text-primary">{comparison.onlyYou.length}</p>
                <p className="text-[10px] text-muted-foreground">Only You</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-lg font-bold text-orange-500">{comparison.onlyThem.length}</p>
                <p className="text-[10px] text-muted-foreground">Only Them</p>
              </div>
            </div>

            {/* Achievement Lists */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Shared */}
              {comparison.shared.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" /> Shared Achievements
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.shared.map((id) => {
                      const achievement = getAchievementById(id);
                      if (!achievement) return null;
                      return (
                        <AchievementBadge
                          key={id}
                          achievement={achievement}
                          earned={true}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Only You */}
              {comparison.onlyYou.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-primary" /> Your Exclusive Badges
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.onlyYou.map((id) => {
                      const achievement = getAchievementById(id);
                      if (!achievement) return null;
                      return (
                        <AchievementBadge
                          key={id}
                          achievement={achievement}
                          earned={true}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Only Them */}
              {comparison.onlyThem.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Minus className="h-3 w-3 text-orange-500" /> Badges You're Missing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.onlyThem.map((id) => {
                      const achievement = getAchievementById(id);
                      if (!achievement) return null;
                      return (
                        <AchievementBadge
                          key={id}
                          achievement={achievement}
                          earned={false}
                          size="sm"
                        />
                      );
                    })}
                     </div>
                </div>
              )}
               </div>
           </>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default AchievementComparison;