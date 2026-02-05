 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { achievements } from "@/components/AchievementBadge";
 import { useAuth } from "@/contexts/AuthContext";
 
 interface ComparisonUser {
   userId: string;
   fullName: string;
   avatarUrl: string | null;
   username: string | null;
   earnedAchievements: string[];
 }
 
 interface ComparisonResult {
   you: ComparisonUser | null;
   them: ComparisonUser | null;
   shared: string[];
   onlyYou: string[];
   onlyThem: string[];
 }
 
 export function useAchievementComparison() {
   const { user } = useAuth();
   const [searchQuery, setSearchQuery] = useState("");
   const [searchResults, setSearchResults] = useState<ComparisonUser[]>([]);
   const [selectedUser, setSelectedUser] = useState<ComparisonUser | null>(null);
   const [comparison, setComparison] = useState<ComparisonResult | null>(null);
   const [isSearching, setIsSearching] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
 
   // Search for users
   const searchUsers = async (query: string) => {
     if (query.length < 2) {
       setSearchResults([]);
       return;
     }
 
     setIsSearching(true);
     try {
       // Search in profiles
       const { data: profiles, error: profilesError } = await supabase
         .from("profiles")
         .select("user_id, full_name, avatar_url")
         .ilike("full_name", `%${query}%`)
         .neq("user_id", user?.id || "")
         .limit(10);
 
       if (profilesError) throw profilesError;
 
       // Get usernames
       const userIds = profiles?.map((p) => p.user_id) || [];
       const { data: extendedProfiles } = await supabase
         .from("user_profiles_extended")
         .select("user_id, username")
         .in("user_id", userIds);
 
       const usernameMap = new Map(extendedProfiles?.map((p) => [p.user_id, p.username]) || []);
 
       // Get achievements for these users
       const { data: userAchievements } = await supabase
         .from("user_achievements")
         .select("user_id, achievement_id")
         .in("user_id", userIds);
 
       const achievementMap = new Map<string, string[]>();
       userAchievements?.forEach((a) => {
         const existing = achievementMap.get(a.user_id) || [];
         existing.push(a.achievement_id);
         achievementMap.set(a.user_id, existing);
       });
 
       const results: ComparisonUser[] = (profiles || []).map((p) => ({
         oderId: p.user_id,
         userId: p.user_id,
         fullName: p.full_name || "Anonymous",
         avatarUrl: p.avatar_url,
         username: usernameMap.get(p.user_id) || null,
         earnedAchievements: achievementMap.get(p.user_id) || [],
       }));
 
       setSearchResults(results);
     } catch (error) {
       console.error("Error searching users:", error);
     } finally {
       setIsSearching(false);
     }
   };
 
   // Compare with selected user
   const compareWith = async (targetUser: ComparisonUser) => {
     if (!user) return;
 
     setIsLoading(true);
     setSelectedUser(targetUser);
     setSearchQuery("");
     setSearchResults([]);
 
     try {
       // Get current user's achievements
       const { data: myAchievements } = await supabase
         .from("user_achievements")
         .select("achievement_id")
         .eq("user_id", user.id);
 
       // Get current user's profile
       const { data: myProfile } = await supabase
         .from("profiles")
         .select("user_id, full_name, avatar_url")
         .eq("user_id", user.id)
         .maybeSingle();
 
       const { data: myExtended } = await supabase
         .from("user_profiles_extended")
         .select("username")
         .eq("user_id", user.id)
         .maybeSingle();
 
       const myEarned = myAchievements?.map((a) => a.achievement_id) || [];
       const theirEarned = targetUser.earnedAchievements;
 
       const shared = myEarned.filter((id) => theirEarned.includes(id));
       const onlyYou = myEarned.filter((id) => !theirEarned.includes(id));
       const onlyThem = theirEarned.filter((id) => !myEarned.includes(id));
 
       setComparison({
         you: {
           userId: user.id,
           fullName: myProfile?.full_name || "You",
           avatarUrl: myProfile?.avatar_url || null,
           username: myExtended?.username || null,
           earnedAchievements: myEarned,
         },
         them: targetUser,
         shared,
         onlyYou,
         onlyThem,
       });
     } catch (error) {
       console.error("Error comparing achievements:", error);
     } finally {
       setIsLoading(false);
     }
   };
 
   const clearComparison = () => {
     setSelectedUser(null);
     setComparison(null);
   };
 
   return {
     searchQuery,
     setSearchQuery,
     searchUsers,
     searchResults,
     isSearching,
     selectedUser,
     compareWith,
     comparison,
     isLoading,
     clearComparison,
   };
 }