 import { Code, Cpu, Database, Calculator } from "lucide-react";
 
 export interface QuizQuestion {
   id: number;
   category: "dsa" | "cs" | "sql" | "aptitude";
   title: string;
   text: string;
   options: { text: string; isCorrect: boolean }[];
   difficulty: string;
   answer?: string;
 }
 
 export type QuizState = "setup" | "playing" | "paused" | "summary" | "results" | "review";
 
 export type ReviewFilter = "all" | "incorrect" | "unanswered" | "flagged";
 
 export interface ReviewItem {
   question: QuizQuestion;
   userAnswer: number | null;
   index: number;
   isCorrect: boolean;
   isUnanswered: boolean;
   isMarked: boolean;
 }
 
 export interface SummaryData {
   answered: number[];
   skipped: number[];
   flagged: number[];
   unanswered: number[];
 }
 
 export const categoryConfig = {
   dsa: { 
     label: "DSA", 
     icon: Code, 
     color: "text-blue-500", 
     bgColor: "bg-blue-500/10",
     borderColor: "border-blue-500/30"
   },
   cs: { 
     label: "CS Core", 
     icon: Cpu, 
     color: "text-purple-500", 
     bgColor: "bg-purple-500/10",
     borderColor: "border-purple-500/30"
   },
   sql: { 
     label: "SQL", 
     icon: Database, 
     color: "text-emerald-500", 
     bgColor: "bg-emerald-500/10",
     borderColor: "border-emerald-500/30"
   },
   aptitude: { 
     label: "Aptitude", 
     icon: Calculator, 
     color: "text-amber-500", 
     bgColor: "bg-amber-500/10",
     borderColor: "border-amber-500/30"
   },
 } as const;
 
 export const formatTime = (seconds: number) => {
   const mins = Math.floor(seconds / 60);
   const secs = seconds % 60;
   return `${mins}:${secs.toString().padStart(2, '0')}`;
 };