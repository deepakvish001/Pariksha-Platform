 import { useState, useMemo, useCallback } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   HelpCircle,
   Search,
   CheckCircle2,
   BookmarkCheck,
   ChevronDown,
   Bookmark,
   TrendingUp,
   Folder,
   FolderPlus,
   Zap,
 } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
 import { cn } from "@/lib/utils";
 import { useAuth } from "@/contexts/AuthContext";
 import { useAptitudeProgress } from "@/hooks/useAptitudeProgress";
 import { useFolders } from "@/hooks/useFolders";
 import {
   aptitudeQuestions,
   aptitudeCategories,
   getQuestionsByCategory,
   getQuestionsByDifficulty,
   getQuestionsByType,
   searchQuestions,
   getCategoryName,
   getDifficultyStats,
   type AptitudeQuestion,
 } from "@/data/aptitudeQuestionsData";
 import AnswerPanel from "@/components/library/AnswerPanel";
 import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";
 import FolderManager from "@/components/library/FolderManager";
 import AddToFolderButton from "@/components/library/AddToFolderButton";
 import AptitudeQuizMode from "@/components/library/AptitudeQuizMode";
 
 type ViewMode = "all" | "solved" | "revision" | "folders";
 type PageMode = "browse" | "quiz";

const AptitudeQuestions = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const {
     isLoading,
     isSolved,
     isRevision,
     toggleSolved,
     toggleRevision,
     markReviewed,
     dueQuestions,
     spacedRepetitionStats,
   } = useAptitudeProgress();
 
   const {
     folders,
     folderItems,
     isLoading: foldersLoading,
     createFolder,
     updateFolder,
     deleteFolder,
     addToFolder,
     removeFromFolder,
     isInFolder,
   } = useFolders("aptitude");
 
   const [viewMode, setViewMode] = useState<ViewMode>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<string>("all");
   const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
   const [typeFilter, setTypeFilter] = useState<string>("all");
   const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
   const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
   const [pageMode, setPageMode] = useState<PageMode>("browse");
 
   const difficultyStats = getDifficultyStats();
 
   const solvedCounts = useMemo(() => {
     let easy = 0, medium = 0, hard = 0;
     aptitudeQuestions.forEach((q) => {
       if (isSolved(q.id)) {
         if (q.difficulty === "Easy") easy++;
         else if (q.difficulty === "Medium") medium++;
         else hard++;
       }
     });
     return { easy, medium, hard, total: easy + medium + hard };
   }, [isSolved]);
 
   const folderQuestions = useMemo(() => {
     if (!selectedFolderId) return [];
     const items = folderItems[selectedFolderId] || [];
     return items
       .filter((item) => item.question_source === "aptitude")
       .map((item) => aptitudeQuestions.find((q) => q.id === item.question_id))
       .filter(Boolean) as AptitudeQuestion[];
   }, [selectedFolderId, folderItems]);
 
   const filteredQuestions = useMemo(() => {
     if (viewMode === "folders" && selectedFolderId) {
       let questions = folderQuestions;
       questions = getQuestionsByDifficulty(questions, difficultyFilter);
       questions = getQuestionsByType(questions, typeFilter);
       questions = searchQuestions(questions, searchQuery);
       if (categoryFilter !== "all") {
         questions = questions.filter((q) => q.categoryId === categoryFilter);
       }
       return questions;
     }
 
     let questions = getQuestionsByCategory(categoryFilter);
     questions = getQuestionsByDifficulty(questions, difficultyFilter);
     questions = getQuestionsByType(questions, typeFilter);
     questions = searchQuestions(questions, searchQuery);
 
     if (viewMode === "solved") {
       questions = questions.filter((q) => isSolved(q.id));
     } else if (viewMode === "revision") {
       questions = questions.filter((q) => isRevision(q.id));
     }
 
     return questions;
   }, [categoryFilter, difficultyFilter, typeFilter, searchQuery, viewMode, isSolved, isRevision, selectedFolderId, folderQuestions]);
 
   const getQuestionDetails = useCallback((questionId: number) => {
     const question = aptitudeQuestions.find((q) => q.id === questionId);
     if (!question) return undefined;
     const category = aptitudeCategories.find((c) => c.id === question.categoryId);
     return {
       id: question.id,
       text: question.title,
       difficulty: question.difficulty as "Easy" | "Medium" | "Hard",
       categoryId: "aptitude",
       categoryName: category?.name || "General",
     };
   }, []);
 
   const handleReviewQuestion = useCallback(async (questionId: number) => {
     if (!user) { navigate("/login"); return; }
     await markReviewed(questionId);
   }, [markReviewed, user, navigate]);
 
   const handleScrollToQuestion = useCallback((questionId: number) => {
     setExpandedQuestionId(questionId);
     setTimeout(() => {
       const element = document.querySelector(`[data-question-id="${questionId}"]`);
       if (element) {
         element.scrollIntoView({ behavior: "smooth", block: "center" });
         element.classList.add("ring-2", "ring-primary", "ring-offset-2");
         setTimeout(() => { element.classList.remove("ring-2", "ring-primary", "ring-offset-2"); }, 2000);
       }
     }, 100);
   }, []);
 
   const getDifficultyStyles = (difficulty: string) => {
     switch (difficulty) {
       case "Easy": return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
       case "Medium": return "bg-amber-500/20 text-amber-500 border-amber-500/30";
       case "Hard": return "bg-red-500/20 text-red-500 border-red-500/30";
       default: return "";
     }
   };
 
   // Quiz mode view
   if (pageMode === "quiz") {
     return (
       <TooltipProvider>
         <div className="min-h-screen bg-background p-4 md:p-6">
           <AptitudeQuizMode
             questions={aptitudeQuestions}
             onClose={() => setPageMode("browse")}
           />
         </div>
       </TooltipProvider>
     );
   }
 
  return (
     <TooltipProvider>
       <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                   <HelpCircle className="h-5 w-5 text-primary-foreground" />
                 </div>
                 <div>
                   <h1 className="text-lg md:text-xl font-bold">Aptitude Questions</h1>
                   <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                     Quantitative, logical, and verbal reasoning practice
                   </p>
                 </div>
               </div>
            </div>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" className="gap-2" aria-label="My progress">
                 <TrendingUp className="h-4 w-4" />
                 <span className="hidden sm:inline">My progress</span>
               </Button>
               <Button
                 variant="default"
                 size="sm"
                 className="gap-2"
                 aria-label="Quiz Mode"
                 onClick={() => setPageMode("quiz")}
               >
                 <Zap className="h-4 w-4" />
                 <span className="hidden sm:inline">Quiz Mode</span>
               </Button>
               {user && (
                 <Button variant="outline" size="sm" className="gap-2" aria-label="Create folder" onClick={() => setViewMode("folders")}>
                   <FolderPlus className="h-4 w-4" />
                   <span className="hidden sm:inline">Create Folder</span>
                 </Button>
               )}
            </div>
          </div>
         </header>

         <main className="p-4 md:p-6 space-y-6">
           <Tabs value={viewMode} onValueChange={(v) => { setViewMode(v as ViewMode); if (v !== "folders") setSelectedFolderId(null); }}>
             <TabsList>
               <TabsTrigger value="all">All Questions</TabsTrigger>
               <TabsTrigger value="solved">Solved</TabsTrigger>
               <TabsTrigger value="revision" className="gap-1.5"><BookmarkCheck className="h-3.5 w-3.5" />Revision</TabsTrigger>
               <TabsTrigger value="folders" className="gap-1.5"><Folder className="h-3.5 w-3.5" />Folders</TabsTrigger>
             </TabsList>
           </Tabs>

           <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
             <Card className="bg-card/50"><CardContent className="p-4">
               <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Total Progress</span><span className="text-xs text-muted-foreground">{Math.round((solvedCounts.total / difficultyStats.total) * 100)}%</span></div>
               <div className="text-2xl md:text-3xl font-bold">{solvedCounts.total}<span className="text-lg text-muted-foreground">/ {difficultyStats.total}</span></div>
               <Progress value={(solvedCounts.total / difficultyStats.total) * 100} className="h-1.5 mt-2" />
             </CardContent></Card>
             <Card className="bg-card/50"><CardContent className="p-4">
               <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Easy</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div>
               <div className="text-2xl font-bold">{solvedCounts.easy}<span className="text-lg text-muted-foreground">/ {difficultyStats.easy}</span></div>
               <Progress value={(solvedCounts.easy / difficultyStats.easy) * 100} className="h-1.5 mt-2 [&>div]:bg-emerald-500" />
             </CardContent></Card>
             <Card className="bg-card/50"><CardContent className="p-4">
               <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Medium</span><span className="h-2 w-2 rounded-full bg-amber-500" /></div>
               <div className="text-2xl font-bold">{solvedCounts.medium}<span className="text-lg text-muted-foreground">/ {difficultyStats.medium}</span></div>
               <Progress value={(solvedCounts.medium / difficultyStats.medium) * 100} className="h-1.5 mt-2 [&>div]:bg-amber-500" />
             </CardContent></Card>
             <Card className="bg-card/50"><CardContent className="p-4">
               <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Hard</span><span className="h-2 w-2 rounded-full bg-red-500" /></div>
               <div className="text-2xl font-bold">{solvedCounts.hard}<span className="text-lg text-muted-foreground">/ {difficultyStats.hard}</span></div>
               <Progress value={(solvedCounts.hard / difficultyStats.hard) * 100} className="h-1.5 mt-2 [&>div]:bg-red-500" />
             </CardContent></Card>
           </div>
 
           {viewMode === "folders" && user && (
             <FolderManager folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onCreateFolder={createFolder} onUpdateFolder={updateFolder} onDeleteFolder={deleteFolder} isLoading={foldersLoading} />
           )}
 
           {user && spacedRepetitionStats.total > 0 && viewMode !== "folders" && (
             <SpacedRepetitionPanel dueQuestions={dueQuestions} stats={spacedRepetitionStats} getQuestionDetails={getQuestionDetails} onReviewQuestion={handleReviewQuestion} onScrollToQuestion={handleScrollToQuestion} />
           )}
 
           <div className="space-y-4">
             <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search aptitude questions..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
             <div className="flex flex-wrap gap-3">
               <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{aptitudeCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select>
               <Select value={difficultyFilter} onValueChange={setDifficultyFilter}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger><SelectContent><SelectItem value="all">All Levels</SelectItem><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent></Select>
               <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="conceptual">Conceptual</SelectItem><SelectItem value="calculation">Calculation</SelectItem><SelectItem value="logical">Logical</SelectItem></SelectContent></Select>
             </div>
           </div>
 
           <div className="rounded-lg border bg-card">
             <Table>
               <TableHeader><TableRow><TableHead className="w-12">Status</TableHead><TableHead>Question</TableHead><TableHead className="w-32 hidden md:table-cell">Category</TableHead><TableHead className="w-24">Difficulty</TableHead><TableHead className="w-20 hidden sm:table-cell">Type</TableHead><TableHead className="w-12">Rev</TableHead></TableRow></TableHeader>
               <TableBody>
                 {filteredQuestions.map((question) => (
                   <React.Fragment key={question.id}>
                     <TableRow
                       data-question-id={question.id}
                       className={cn("cursor-pointer transition-colors", expandedQuestionId === question.id && "bg-muted/50")}
                       tabIndex={0}
                       onClick={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
                       onKeyDown={(e) => {
                         if (e.key === "Enter" || e.key === " ") {
                           e.preventDefault();
                           setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id);
                         }
                       }}
                     >
                       <TableCell><Checkbox checked={isSolved(question.id)} aria-label={isSolved(question.id) ? "Mark as unsolved" : "Mark as solved"} onCheckedChange={() => { if (!user) navigate("/login"); else toggleSolved(question.id); }} onClick={(e) => e.stopPropagation()} /></TableCell>
                       <TableCell><div className="flex items-center gap-2"><span className={cn("font-medium", isSolved(question.id) && "line-through text-muted-foreground")}>{question.title}</span><ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedQuestionId === question.id && "rotate-180")} /></div></TableCell>
                       <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{getCategoryName(question.categoryId)}</Badge></TableCell>
                       <TableCell><Badge variant="outline" className={getDifficultyStyles(question.difficulty)}>{question.difficulty}</Badge></TableCell>
                       <TableCell className="hidden sm:table-cell capitalize text-xs text-muted-foreground">{question.type}</TableCell>
                       <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={isRevision(question.id) ? "Remove from revision" : "Add to revision"} onClick={(e) => { e.stopPropagation(); if (!user) navigate("/login"); else toggleRevision(question.id); }}>{isRevision(question.id) ? <Bookmark className="h-4 w-4 fill-primary text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}</Button></TableCell>
                     </TableRow>
                     <AnimatePresence>{expandedQuestionId === question.id && (<motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><td colSpan={6} className="p-0"><AnswerPanel answer={question.answer} /></td></motion.tr>)}</AnimatePresence>
                   </React.Fragment>
                 ))}
                 {filteredQuestions.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No questions found matching your filters.</TableCell></TableRow>)}
               </TableBody>
             </Table>
           </div>
         </main>
       </div>
     </TooltipProvider>
  );
};

 import React from "react";
 
export default AptitudeQuestions;
