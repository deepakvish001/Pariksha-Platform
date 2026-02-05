 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface LeaderboardEntry {
   user_id: string;
   username: string | null;
   full_name: string | null;
   avatar_url: string | null;
   total_xp: number;
   current_level: number;
   xp_this_week: number;
   rank: number;
 }
 
 type TimeFrame = "all_time" | "weekly";
 
 export function useXPLeaderboard(timeFrame: TimeFrame = "all_time", limit: number = 20) {
   const { user } = useAuth();
   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
   const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchLeaderboard = useCallback(async () => {
     setIsLoading(true);
     try {
       // Query profiles with XP data - using the RLS-compliant approach
       const orderColumn = timeFrame === "weekly" ? "xp_this_week" : "total_xp";
       
       const { data, error } = await supabase
         .from("user_profiles_extended")
         .select(`
           user_id,
           username,
           total_xp,
           current_level,
           xp_this_week
         `)
         .not("username", "is", null)
         .neq("username", "")
         .gt(orderColumn, 0)
         .order(orderColumn, { ascending: false })
         .limit(limit);
 
       if (error) {
         console.error("Error fetching leaderboard:", error);
         return;
       }
 
       // Fetch avatar and full_name from profiles table
       const userIds = data?.map(d => d.user_id) || [];
       const { data: profiles } = await supabase
         .from("profiles")
         .select("user_id, full_name, avatar_url")
         .in("user_id", userIds);
 
       const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
 
       const entries: LeaderboardEntry[] = (data || []).map((entry, idx) => {
         const profile = profileMap.get(entry.user_id);
         return {
           user_id: entry.user_id,
           username: entry.username,
           full_name: profile?.full_name || null,
           avatar_url: profile?.avatar_url || null,
           total_xp: entry.total_xp || 0,
           current_level: entry.current_level || 1,
           xp_this_week: entry.xp_this_week || 0,
           rank: idx + 1,
         };
       });
 
       setLeaderboard(entries);
 
       // Find current user's rank
       if (user) {
         const currentUserEntry = entries.find(e => e.user_id === user.id);
         if (currentUserEntry) {
           setUserRank(currentUserEntry);
         } else {
           // User not in top N, fetch their data separately
           const { data: userProfile } = await supabase
             .from("user_profiles_extended")
             .select("user_id, username, total_xp, current_level, xp_this_week")
             .eq("user_id", user.id)
             .maybeSingle();
 
           if (userProfile && userProfile.total_xp && userProfile.total_xp > 0) {
             const { data: userAvatar } = await supabase
               .from("profiles")
               .select("full_name, avatar_url")
               .eq("user_id", user.id)
               .maybeSingle();
 
             // Count users with more XP to determine rank
             const { count } = await supabase
               .from("user_profiles_extended")
               .select("*", { count: "exact", head: true })
               .gt(orderColumn, timeFrame === "weekly" ? userProfile.xp_this_week : userProfile.total_xp);
 
             setUserRank({
               user_id: userProfile.user_id,
               username: userProfile.username,
               full_name: userAvatar?.full_name || null,
               avatar_url: userAvatar?.avatar_url || null,
               total_xp: userProfile.total_xp || 0,
               current_level: userProfile.current_level || 1,
               xp_this_week: userProfile.xp_this_week || 0,
               rank: (count || 0) + 1,
             });
           }
         }
       }
     } catch (error) {
       console.error("Error fetching leaderboard:", error);
     } finally {
       setIsLoading(false);
     }
   }, [timeFrame, limit, user]);
 
   useEffect(() => {
     fetchLeaderboard();
   }, [fetchLeaderboard]);
 
   return {
     leaderboard,
     userRank,
     isLoading,
     refetch: fetchLeaderboard,
   };
 }