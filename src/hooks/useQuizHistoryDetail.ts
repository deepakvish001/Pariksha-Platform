 import { useState, useEffect, useMemo } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { dsaQuestions } from "@/data/dsaQuestionsData";
 import { csQuestions } from "@/data/csSubjectsData";
 import { sqlQuestions } from "@/data/sqlQuestionsData";
 import { aptitudeQuestions } from "@/data/aptitudeQuestionsData";
 import type { QuizQuestion } from "@/components/library/quiz/types";
 
 interface QuizQuestionResponse {
   id: string;
   quiz_result_id: string;
   question_id: number;
   question_category: string;
   question_index: number;
   selected_answer_index: number | null;
   is_correct: boolean;
   time_taken_seconds: number;
   was_flagged: boolean;
   created_at: string;
 }
 
 interface QuizResultData {
   id: string;
   quiz_type: string;
   category: string | null;
   difficulty: string | null;
   score: number;
   total_questions: number;
   accuracy: number;
   avg_time_seconds: number;
   total_time_seconds: number;
   completed_at: string;
 }
 
 export interface ReconstructedQuestion {
   question: QuizQuestion | null;
   questionIndex: number;
   selectedAnswerIndex: number | null;
   isCorrect: boolean;
   timeTakenSeconds: number;
   wasFlagged: boolean;
   isUnavailable: boolean;
 }
 
 interface UseQuizHistoryDetailReturn {
   quizResult: QuizResultData | null;
   questions: ReconstructedQuestion[];
   isLoading: boolean;
   error: string | null;
   hasResponses: boolean;
 }
 
 // Helper to find question by ID and category from static data
 const findQuestion = (questionId: number, category: string): QuizQuestion | null => {
   let sourceQuestion = null;
 
   switch (category) {
     case "dsa":
       sourceQuestion = dsaQuestions.find(q => q.id === questionId);
       break;
     case "cs":
       sourceQuestion = csQuestions.find(q => q.id === questionId);
       break;
     case "sql":
       sourceQuestion = sqlQuestions.find(q => q.id === questionId);
       break;
     case "aptitude":
       sourceQuestion = aptitudeQuestions.find(q => q.id === questionId);
       break;
   }
 
   if (!sourceQuestion || !sourceQuestion.options?.length) {
     return null;
   }
 
   return {
     id: sourceQuestion.id,
     category: category as "dsa" | "cs" | "sql" | "aptitude",
     title: sourceQuestion.title,
     text: sourceQuestion.text,
     options: sourceQuestion.options,
     difficulty: sourceQuestion.difficulty,
     answer: sourceQuestion.answer,
   };
 };
 
 export const useQuizHistoryDetail = (quizResultId: string | null): UseQuizHistoryDetailReturn => {
   const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);
   const [responses, setResponses] = useState<QuizQuestionResponse[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     if (!quizResultId) {
       setQuizResult(null);
       setResponses([]);
       return;
     }
 
     const fetchData = async () => {
       setIsLoading(true);
       setError(null);
 
       try {
         // Fetch quiz result metadata
         const { data: resultData, error: resultError } = await supabase
           .from("quiz_results")
           .select("*")
           .eq("id", quizResultId)
           .single();
 
         if (resultError) throw resultError;
         setQuizResult(resultData);
 
         // Fetch question responses
         const { data: responsesData, error: responsesError } = await supabase
           .from("quiz_question_responses")
           .select("*")
           .eq("quiz_result_id", quizResultId)
           .order("question_index", { ascending: true });
 
         if (responsesError) throw responsesError;
         setResponses(responsesData || []);
       } catch (err: any) {
         console.error("Error fetching quiz details:", err);
         setError(err.message || "Failed to load quiz details");
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchData();
   }, [quizResultId]);
 
   // Reconstruct full question data from responses
   const questions: ReconstructedQuestion[] = useMemo(() => {
     return responses.map(response => {
       const question = findQuestion(response.question_id, response.question_category);
       
       return {
         question,
         questionIndex: response.question_index,
         selectedAnswerIndex: response.selected_answer_index,
         isCorrect: response.is_correct,
         timeTakenSeconds: response.time_taken_seconds,
         wasFlagged: response.was_flagged,
         isUnavailable: question === null,
       };
     });
   }, [responses]);
 
   return {
     quizResult,
     questions,
     isLoading,
     error,
     hasResponses: responses.length > 0,
   };
 };