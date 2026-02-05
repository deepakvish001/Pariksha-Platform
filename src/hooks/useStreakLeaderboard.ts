 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 interface StreakLeaderboardEntry {
   userId: string;
   fullName: string;
   avatarUrl: string | null;
   username: string | null;
   currentStreak: number;
   longestStreak: number;
   lastActiveDate: string | null;
   isActive: boolean;
 }
 
 export function useStreakLeaderboard() {
   const [leaderboard, setLeaderboard] = useState<StreakLeaderboardEntry[]>([]);
   const [currentUserRank, setCurrentUserRank] = useState<{ rank: number; entry: StreakLeaderboardEntry } | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const { user } = useAuth();
 
   useEffect(() => {
     const fetchLeaderboard = async () => {
       try {
         // Get all completed topic progress
         const { data: progressData, error: progressError } = await supabase
           .from("user_topic_progress")
           .select("user_id, updated_at")
           .eq("completed", true)
           .order("updated_at", { ascending: false });
 
         if (progressError) throw progressError;
 
         if (!progressData || progressData.length === 0) {
           setLeaderboard([]);
           setIsLoading(false);
           return;
         }
 
         // Group by user and get unique dates
         const userDates = new Map<string, string[]>();
         progressData.forEach((row) => {
           const date = new Date(row.updated_at).toLocaleDateString("en-CA");
           const existing = userDates.get(row.user_id) || [];
           if (!existing.includes(date)) {
             existing.push(date);
           }
           userDates.set(row.user_id, existing);
         });
 
         const today = new Date().toLocaleDateString("en-CA");
         const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
 
         // Calculate streaks for each user
         const userStreaks = new Map<string, { current: number; longest: number; lastActive: string | null; isActive: boolean }>();
         
         userDates.forEach((dates, odId) => {
           const sortedDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
           
           const lastActiveDate = sortedDates[0];
           const isActive = lastActiveDate === today || lastActiveDate === yesterday;
           
           // Calculate current streak
           let currentStreak = 0;
           if (isActive) {
             let checkDate = lastActiveDate === today ? today : yesterday;
             for (let i = 0; i < sortedDates.length; i++) {
               if (sortedDates[i] === checkDate) {
                 currentStreak++;
                 const prevDate = new Date(checkDate);
                 prevDate.setDate(prevDate.getDate() - 1);
                 checkDate = prevDate.toLocaleDateString("en-CA");
               } else if (sortedDates[i] < checkDate) {
                 break;
               }
             }
           }
 
           // Calculate longest streak
           let longestStreak = 0;
           let tempStreak = 1;
           for (let i = 1; i < sortedDates.length; i++) {
             const currentDate = new Date(sortedDates[i - 1]);
             const prevDate = new Date(sortedDates[i]);
             const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);
             if (diffDays === 1) {
               tempStreak++;
             } else {
               longestStreak = Math.max(longestStreak, tempStreak);
               tempStreak = 1;
             }
           }
           longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
 
           userStreaks.set(odId, {
             current: currentStreak,
             longest: longestStreak,
             lastActive: lastActiveDate,
             isActive,
           });
         });
 
         // Get user profiles
         const userIds = Array.from(userStreaks.keys());
         const { data: profiles, error: profilesError } = await supabase
           .from("profiles")
           .select("user_id, full_name, avatar_url")
           .in("user_id", userIds);
 
         if (profilesError) throw profilesError;
 
         const { data: extendedProfiles, error: extendedError } = await supabase
           .from("user_profiles_extended")
           .select("user_id, username")
           .in("user_id", userIds);
 
         if (extendedError) throw extendedError;
 
         const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
         const usernameMap = new Map(extendedProfiles?.map((p) => [p.user_id, p.username]) || []);
 
         // Build entries
         const entries: StreakLeaderboardEntry[] = [];
         userStreaks.forEach((streak, odId) => {
           const profile = profileMap.get(odId);
           entries.push({
             userId: odId,
             fullName: profile?.full_name || "Anonymous",
             avatarUrl: profile?.avatar_url || null,
             username: usernameMap.get(odId) || null,
             currentStreak: streak.current,
             longestStreak: streak.longest,
             lastActiveDate: streak.lastActive,
             isActive: streak.isActive,
           });
         });
 
         // Sort by current streak (active users first), then longest streak
         entries.sort((a, b) => {
           if (a.isActive && !b.isActive) return -1;
           if (!a.isActive && b.isActive) return 1;
           if (a.currentStreak !== b.currentStreak) return b.currentStreak - a.currentStreak;
           return b.longestStreak - a.longestStreak;
         });
 
         // Find current user's rank
         if (user) {
           const userIndex = entries.findIndex((e) => e.userId === user.id);
           if (userIndex !== -1) {
             setCurrentUserRank({ rank: userIndex + 1, entry: entries[userIndex] });
           } else {
             setCurrentUserRank(null);
           }
         }
 
         setLeaderboard(entries.slice(0, 50));
       } catch (error) {
         console.error("Error fetching streak leaderboard:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchLeaderboard();
   }, [user]);
 
   return { leaderboard, currentUserRank, isLoading };
 }