 import { useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 interface QuizResultData {
  quizType: "aptitude" | "dsa" | "sql" | "cs";
   category: string;
   difficulty: string;
   score: number;
   totalQuestions: number;
   accuracy: number;
   avgTimeSeconds: number;
   totalTimeSeconds: number;
 }
 
 export function useQuizResults() {
   const { user } = useAuth();
 
   const saveQuizResult = useCallback(
     async (data: QuizResultData) => {
       if (!user) return null;
 
       try {
         const { data: result, error } = await supabase
           .from("quiz_results")
           .insert({
             user_id: user.id,
             quiz_type: data.quizType,
             category: data.category,
             difficulty: data.difficulty,
             score: data.score,
             total_questions: data.totalQuestions,
             accuracy: data.accuracy,
             avg_time_seconds: data.avgTimeSeconds,
             total_time_seconds: data.totalTimeSeconds,
           })
           .select()
           .single();
 
         if (error) {
           console.error("Error saving quiz result:", error);
           return null;
         }
 
         return result;
       } catch (err) {
         console.error("Error saving quiz result:", err);
         return null;
       }
     },
     [user]
   );
 
   return { saveQuizResult };
 }