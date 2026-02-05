 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";
 
 interface FollowedUser {
   userId: string;
   fullName: string;
   avatarUrl: string | null;
   username: string | null;
   followedAt: string;
 }
 
 export function useFollows() {
   const { user } = useAuth();
   const [following, setFollowing] = useState<FollowedUser[]>([]);
   const [followers, setFollowers] = useState<FollowedUser[]>([]);
   const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchFollows = useCallback(async () => {
     if (!user) {
       setFollowing([]);
       setFollowers([]);
       setFollowingIds(new Set());
       setIsLoading(false);
       return;
     }
 
     try {
       // Get users I'm following
       const { data: followingData, error: followingError } = await supabase
         .from("user_follows")
         .select("following_id, created_at")
         .eq("follower_id", user.id);
 
       if (followingError) throw followingError;
 
       // Get users following me
       const { data: followersData, error: followersError } = await supabase
         .from("user_follows")
         .select("follower_id, created_at")
         .eq("following_id", user.id);
 
       if (followersError) throw followersError;
 
       const followingUserIds = followingData?.map((f) => f.following_id) || [];
       const followerUserIds = followersData?.map((f) => f.follower_id) || [];
       const allUserIds = [...new Set([...followingUserIds, ...followerUserIds])];
 
       if (allUserIds.length === 0) {
         setFollowing([]);
         setFollowers([]);
         setFollowingIds(new Set());
         setIsLoading(false);
         return;
       }
 
       // Get profiles
       const { data: profiles } = await supabase
         .from("profiles")
         .select("user_id, full_name, avatar_url")
         .in("user_id", allUserIds);
 
       const { data: extendedProfiles } = await supabase
         .from("user_profiles_extended")
         .select("user_id, username")
         .in("user_id", allUserIds);
 
       const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
       const usernameMap = new Map(extendedProfiles?.map((p) => [p.user_id, p.username]) || []);
 
       // Build following list
       const followingList: FollowedUser[] = (followingData || []).map((f) => {
         const profile = profileMap.get(f.following_id);
         return {
           oderId: f.following_id,
           userId: f.following_id,
           fullName: profile?.full_name || "Anonymous",
           avatarUrl: profile?.avatar_url || null,
           username: usernameMap.get(f.following_id) || null,
           followedAt: f.created_at,
         };
       });
 
       // Build followers list
       const followersList: FollowedUser[] = (followersData || []).map((f) => {
         const profile = profileMap.get(f.follower_id);
         return {
           oderId: f.follower_id,
           userId: f.follower_id,
           fullName: profile?.full_name || "Anonymous",
           avatarUrl: profile?.avatar_url || null,
           username: usernameMap.get(f.follower_id) || null,
           followedAt: f.created_at,
         };
       });
 
       setFollowing(followingList);
       setFollowers(followersList);
       setFollowingIds(new Set(followingUserIds));
     } catch (error) {
       console.error("Error fetching follows:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchFollows();
   }, [fetchFollows]);
 
   const followUser = async (targetUserId: string) => {
     if (!user) {
       toast.error("Please sign in to follow users");
       return false;
     }
 
     if (targetUserId === user.id) {
       toast.error("You cannot follow yourself");
       return false;
     }
 
     try {
       const { error } = await supabase
         .from("user_follows")
         .insert({ follower_id: user.id, following_id: targetUserId });
 
       if (error) {
         if (error.code === "23505") {
           toast.error("You're already following this user");
         } else {
           throw error;
         }
         return false;
       }
 
       toast.success("Now following!");
       await fetchFollows();
       return true;
     } catch (error) {
       console.error("Error following user:", error);
       toast.error("Failed to follow user");
       return false;
     }
   };
 
   const unfollowUser = async (targetUserId: string) => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from("user_follows")
         .delete()
         .eq("follower_id", user.id)
         .eq("following_id", targetUserId);
 
       if (error) throw error;
 
       toast.success("Unfollowed");
       await fetchFollows();
       return true;
     } catch (error) {
       console.error("Error unfollowing user:", error);
       toast.error("Failed to unfollow");
       return false;
     }
   };
 
   const isFollowing = (targetUserId: string) => {
     return followingIds.has(targetUserId);
   };
 
   return {
     following,
     followers,
     followingCount: following.length,
     followersCount: followers.length,
     isLoading,
     followUser,
     unfollowUser,
     isFollowing,
     refreshFollows: fetchFollows,
   };
 }