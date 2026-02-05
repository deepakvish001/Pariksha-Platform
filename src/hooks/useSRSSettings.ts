 import { useState, useEffect, useCallback } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useToast } from "@/hooks/use-toast";
 
 export const DEFAULT_SRS_INTERVALS = [1, 2, 4, 7, 14, 30, 60];
 export const DEFAULT_MASTERY_THRESHOLD = 3;
 
 export interface SRSSettings {
   intervals: number[];
   masteryThreshold: number;
 }
 
 export function useSRSSettings() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [settings, setSettings] = useState<SRSSettings>({
     intervals: DEFAULT_SRS_INTERVALS,
     masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
   });
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
 
   const fetchSettings = useCallback(async () => {
     if (!user) {
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("user_profiles_extended")
         .select("srs_intervals, srs_mastery_threshold")
         .eq("user_id", user.id)
         .maybeSingle();
 
       if (!error && data) {
         setSettings({
           intervals: data.srs_intervals || DEFAULT_SRS_INTERVALS,
           masteryThreshold: data.srs_mastery_threshold || DEFAULT_MASTERY_THRESHOLD,
         });
       }
     } catch (error) {
       console.error("Error fetching SRS settings:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchSettings();
   }, [fetchSettings]);
 
   const updateSettings = useCallback(async (newSettings: Partial<SRSSettings>) => {
     if (!user) return;
 
     setIsSaving(true);
     try {
       const updates: any = {};
       if (newSettings.intervals !== undefined) {
         updates.srs_intervals = newSettings.intervals;
       }
       if (newSettings.masteryThreshold !== undefined) {
         updates.srs_mastery_threshold = newSettings.masteryThreshold;
       }
 
       const { error } = await supabase
         .from("user_profiles_extended")
         .update(updates)
         .eq("user_id", user.id);
 
       if (error) throw error;
 
       setSettings(prev => ({ ...prev, ...newSettings }));
       toast({
         title: "Settings saved",
         description: "Your spaced repetition settings have been updated",
       });
     } catch (error) {
       console.error("Error saving SRS settings:", error);
       toast({
         variant: "destructive",
         title: "Failed to save settings",
       });
     } finally {
       setIsSaving(false);
     }
   }, [user, toast]);
 
   const resetToDefaults = useCallback(async () => {
     await updateSettings({
       intervals: DEFAULT_SRS_INTERVALS,
       masteryThreshold: DEFAULT_MASTERY_THRESHOLD,
     });
   }, [updateSettings]);
 
   return {
     settings,
     isLoading,
     isSaving,
     updateSettings,
     resetToDefaults,
   };
 }