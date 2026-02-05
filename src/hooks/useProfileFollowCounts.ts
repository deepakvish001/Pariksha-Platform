 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 interface FollowCounts {
   followersCount: number;
   followingCount: number;
 }
 
 export function useProfileFollowCounts(userId: string | undefined) {
   const [counts, setCounts] = useState<FollowCounts>({ followersCount: 0, followingCount: 0 });
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     const fetchCounts = async () => {
       if (!userId) {
         setCounts({ followersCount: 0, followingCount: 0 });
         setIsLoading(false);
         return;
       }
 
       try {
         // Get followers count
         const { count: followersCount, error: followersError } = await supabase
           .from("user_follows")
           .select("*", { count: "exact", head: true })
           .eq("following_id", userId);
 
         if (followersError) throw followersError;
 
         // Get following count
         const { count: followingCount, error: followingError } = await supabase
           .from("user_follows")
           .select("*", { count: "exact", head: true })
           .eq("follower_id", userId);
 
         if (followingError) throw followingError;
 
         setCounts({
           followersCount: followersCount || 0,
           followingCount: followingCount || 0,
         });
       } catch (error) {
         console.error("Error fetching follow counts:", error);
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchCounts();
   }, [userId]);
 
   return { ...counts, isLoading };
 }