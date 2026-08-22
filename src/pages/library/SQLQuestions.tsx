import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Database,
   Search,
   CheckCircle2,
   BookmarkCheck,
   ChevronDown,
   Bookmark,
   Menu,
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
 import { Skeleton } from "@/components/ui/skeleton";
 import { cn } from "@/lib/utils";
 import { useAuth } from "@/contexts/AuthContext";
 import { useSQLProgress } from "@/hooks/useSQLProgress";
 import { useFolders } from "@/hooks/useFolders";
 import {
   sqlQuestions,
   sqlCategories,
   getQuestionsByCategory,
   getQuestionsByDifficulty,
   getQuestionsByType,
   searchQuestions,
   getCategoryName,
   getDifficultyStats,
   type SQLQuestion,
 } from "@/data/sqlQuestionsData";
 import AnswerPanel from "@/components/library/AnswerPanel";
import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";
 import FolderManager from "@/components/library/FolderManager";
 import AddToFolderButton from "@/components/library/AddToFolderButton";
 import SQLQuizMode from "@/components/library/SQLQuizMode";
 
 type ViewMode = "all" | "solved" | "revision" | "folders";
 type PageMode = "browse" | "quiz";

const SQLQuestions = () => {
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
   } = useSQLProgress();
 
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
   } = useFolders("sql");
 
   const [pageMode, setPageMode] = useState<PageMode>("browse");
   const [viewMode, setViewMode] = useState<ViewMode>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [categoryFilter, setCategoryFilter] = useState<string>("all");
   const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
   const [typeFilter, setTypeFilter] = useState<string>("all");
   const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
   const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
 
   // Get difficulty stats
   const difficultyStats = getDifficultyStats();
 
   // Calculate solved counts
   const solvedCounts = useMemo(() => {
     let easy = 0, medium = 0, hard = 0;
     sqlQuestions.forEach((q) => {
       if (isSolved(q.id)) {
         if (q.difficulty === "Easy") easy++;
         else if (q.difficulty === "Medium") medium++;
         else hard++;
       }
     });
     return { easy, medium, hard, total: easy + medium + hard };
  }, [isSolved]);
 
   // Get questions in selected folder
   const folderQuestions = useMemo(() => {
     if (!selectedFolderId) return [];
     const items = folderItems[selectedFolderId] || [];
     return items
       .filter((item) => item.question_source === "sql")
       .map((item) => sqlQuestions.find((q) => q.id === item.question_id))
       .filter(Boolean) as SQLQuestion[];
   }, [selectedFolderId, folderItems]);
 
   // Filter questions based on current view and filters
   const filteredQuestions = useMemo(() => {
     // If viewing folders and a folder is selected, show folder questions
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
 
     // Apply view mode filter
     if (viewMode === "solved") {
       questions = questions.filter((q) => isSolved(q.id));
     } else if (viewMode === "revision") {
       questions = questions.filter((q) => isRevision(q.id));
     }
 
     return questions;
   }, [categoryFilter, difficultyFilter, typeFilter, searchQuery, viewMode, isSolved, isRevision, selectedFolderId, folderQuestions]);

  // Get question details for spaced repetition panel
  const getQuestionDetails = useCallback((questionId: number) => {
    const question = sqlQuestions.find((q) => q.id === questionId);
    if (!question) return undefined;

    const category = sqlCategories.find((c) => c.id === question.categoryId);
    return {
      id: question.id,
      text: question.title,
      difficulty: question.difficulty as "Easy" | "Medium" | "Hard",
      categoryId: "sql",
      categoryName: category?.name || "General",
    };
  }, []);

  const handleReviewQuestion = useCallback(
    async (questionId: number) => {
      if (!user) {
        navigate("/login");
        return;
      }
      await markReviewed(questionId);
    },
    [markReviewed, user, navigate]
  );

  const handleScrollToQuestion = useCallback((questionId: number) => {
    setExpandedQuestionId(questionId);
    setTimeout(() => {
      const element = document.querySelector(`[data-question-id="${questionId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 2000);
      }
    }, 100);
  }, []);
 
   const getDifficultyStyles = (difficulty: string) => {
     switch (difficulty) {
       case "Easy":
         return "bg-emerald-500/20 text-emerald-500 border-emerald-500/30";
       case "Medium":
         return "bg-amber-500/20 text-amber-500 border-amber-500/30";
       case "Hard":
         return "bg-red-500/20 text-red-500 border-red-500/30";
       default:
         return "";
     }
   };
 
   // Quiz mode view
   if (pageMode === "quiz") {
     return (
       <TooltipProvider>
         <div className="min-h-screen bg-background p-4 md:p-6">
           <SQLQuizMode
             questions={sqlQuestions}
             onClose={() => setPageMode("browse")}
           />
         </div>
       </TooltipProvider>
     );
   }
 
  return (
     <TooltipProvider>
       <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                   <Database className="h-5 w-5 text-primary-foreground" />
                 </div>
                 <div>
                   <h1 className="text-lg md:text-xl font-bold">SQL Interview Questions</h1>
                   <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                     Practice SQL problems and prepare for technical interviews
                   </p>
                 </div>
               </div>
            </div>
             <div className="flex items-center gap-2">
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
               <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                 <TrendingUp className="h-4 w-4" />
                 <span className="hidden sm:inline">My progress</span>
               </Button>
               {user && (
                 <Button
                   variant="outline"
                   size="sm"
                   className="gap-2"
                   aria-label="Create folder"
                   onClick={() => setViewMode("folders")}
                 >
                   <FolderPlus className="h-4 w-4" />
                   <span className="hidden sm:inline">Create Folder</span>
                 </Button>
               )}
            </div>
          </div>
         </header>

         <main className="p-4 md:p-6 space-y-6">
           {/* Tabs */}
           <Tabs
             value={viewMode}
             onValueChange={(v) => {
               setViewMode(v as ViewMode);
               if (v !== "folders") {
                 setSelectedFolderId(null);
               }
             }}
           >
             <TabsList>
               <TabsTrigger value="all">All SQL Questions</TabsTrigger>
               <TabsTrigger value="solved">Solved</TabsTrigger>
               <TabsTrigger value="revision" className="gap-1.5">
                 <BookmarkCheck className="h-3.5 w-3.5" />
                 Revision
               </TabsTrigger>
               <TabsTrigger value="folders" className="gap-1.5">
                 <Folder className="h-3.5 w-3.5" />
                 Folders
               </TabsTrigger>
             </TabsList>
           </Tabs>

           {/* Progress Cards */}
           <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
               <Card className="bg-card/50">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       Total Progress
                       <Tooltip>
                         <TooltipTrigger>
                           <span className="text-muted-foreground/50">ⓘ</span>
                         </TooltipTrigger>
                         <TooltipContent>Overall completion rate</TooltipContent>
                       </Tooltip>
                     </span>
                     <span className="text-xs text-muted-foreground">
                       {Math.round((solvedCounts.total / difficultyStats.total) * 100)}%
                     </span>
                   </div>
                   <div className="text-2xl md:text-3xl font-bold">
                     {solvedCounts.total}
                     <span className="text-lg text-muted-foreground">/ {difficultyStats.total}</span>
                   </div>
                   <Progress
                     value={(solvedCounts.total / difficultyStats.total) * 100}
                     className="h-1.5 mt-2"
                   />
                </CardContent>
              </Card>
            </motion.div>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
             >
               <Card className="bg-card/50">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       Easy Questions
                       <Tooltip>
                         <TooltipTrigger>
                           <span className="text-muted-foreground/50">ⓘ</span>
                         </TooltipTrigger>
                         <TooltipContent>Foundational concepts</TooltipContent>
                       </Tooltip>
                     </span>
                     <span className="h-2 w-2 rounded-full bg-emerald-500" />
                   </div>
                   <div className="text-2xl md:text-3xl font-bold">
                     {solvedCounts.easy}
                     <span className="text-lg text-muted-foreground">/ {difficultyStats.easy}</span>
                   </div>
                   <Progress
                     value={(solvedCounts.easy / difficultyStats.easy) * 100}
                     className="h-1.5 mt-2 [&>div]:bg-emerald-500"
                   />
                 </CardContent>
               </Card>
             </motion.div>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
             >
               <Card className="bg-card/50">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       Medium Questions
                       <Tooltip>
                         <TooltipTrigger>
                           <span className="text-muted-foreground/50">ⓘ</span>
                         </TooltipTrigger>
                         <TooltipContent>Intermediate challenges</TooltipContent>
                       </Tooltip>
                     </span>
                     <span className="h-2 w-2 rounded-full bg-amber-500" />
                   </div>
                   <div className="text-2xl md:text-3xl font-bold">
                     {solvedCounts.medium}
                     <span className="text-lg text-muted-foreground">/ {difficultyStats.medium}</span>
                   </div>
                   <Progress
                     value={(solvedCounts.medium / difficultyStats.medium) * 100}
                     className="h-1.5 mt-2 [&>div]:bg-amber-500"
                   />
                 </CardContent>
               </Card>
             </motion.div>
 
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
             >
               <Card className="bg-card/50">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm text-muted-foreground flex items-center gap-1">
                       Hard Questions
                       <Tooltip>
                         <TooltipTrigger>
                           <span className="text-muted-foreground/50">ⓘ</span>
                         </TooltipTrigger>
                         <TooltipContent>Advanced problems</TooltipContent>
                       </Tooltip>
                     </span>
                     <span className="h-2 w-2 rounded-full bg-red-500" />
                   </div>
                   <div className="text-2xl md:text-3xl font-bold">
                     {solvedCounts.hard}
                     <span className="text-lg text-muted-foreground">/ {difficultyStats.hard}</span>
                   </div>
                   <Progress
                     value={(solvedCounts.hard / difficultyStats.hard) * 100}
                     className="h-1.5 mt-2 [&>div]:bg-red-500"
                   />
                 </CardContent>
               </Card>
             </motion.div>
           </div>
 
           {/* Folders View */}
           {viewMode === "folders" && user && (
             <FolderManager
               folders={folders}
               selectedFolderId={selectedFolderId}
               onSelectFolder={setSelectedFolderId}
               onCreateFolder={createFolder}
               onUpdateFolder={updateFolder}
               onDeleteFolder={deleteFolder}
               isLoading={foldersLoading}
             />
           )}
 
          {/* Spaced Repetition Panel */}
          {user && spacedRepetitionStats.total > 0 && viewMode !== "folders" && (
            <SpacedRepetitionPanel
              dueQuestions={dueQuestions}
              stats={spacedRepetitionStats}
              getQuestionDetails={getQuestionDetails}
              onReviewQuestion={handleReviewQuestion}
              onScrollToQuestion={handleScrollToQuestion}
            />
          )}

           {/* Search and Filters */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="space-y-4"
           >
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Search SQL questions..."
                 className="pl-10"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
 
             <div className="flex flex-wrap gap-3">
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Question category" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Categories</SelectItem>
                   {sqlCategories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       {cat.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
 
               <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Difficulty" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Levels</SelectItem>
                   <SelectItem value="Easy">Easy</SelectItem>
                   <SelectItem value="Medium">Medium</SelectItem>
                   <SelectItem value="Hard">Hard</SelectItem>
                 </SelectContent>
               </Select>
 
               <Select value={typeFilter} onValueChange={setTypeFilter}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Types</SelectItem>
                   <SelectItem value="conceptual">Conceptual</SelectItem>
                   <SelectItem value="query">Query</SelectItem>
                   <SelectItem value="scenario">Scenario</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </motion.div>
 
           {/* Questions Table */}
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
           >
             {isLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <Skeleton key={i} className="h-20 w-full" />
                 ))}
               </div>
             ) : (
               <div className="rounded-lg border border-border overflow-hidden">
                 <Table>
                   <TableHeader>
                     <TableRow className="hover:bg-transparent">
                       <TableHead className="w-12">#</TableHead>
                       <TableHead>Question</TableHead>
                       <TableHead className="w-32 hidden md:table-cell">Category</TableHead>
                       <TableHead className="w-24">Difficulty</TableHead>
                       <TableHead className="w-16 text-center">Solved</TableHead>
                       <TableHead className="w-16 text-center">Revision</TableHead>
                       <TableHead className="w-12 text-center">Folder</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredQuestions.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                           No questions found matching your filters.
                         </TableCell>
                       </TableRow>
                     ) : (
                       filteredQuestions.map((question, index) => (
                         <SQLQuestionRow
                           key={question.id}
                           question={question}
                           index={index}
                           isSolved={isSolved(question.id)}
                           isRevision={isRevision(question.id)}
                           isExpanded={expandedQuestionId === question.id}
                           onToggleSolved={() => toggleSolved(question.id)}
                           onToggleRevision={() => toggleRevision(question.id)}
                           onToggleAnswer={() =>
                             setExpandedQuestionId(
                               expandedQuestionId === question.id ? null : question.id
                             )
                           }
                           getDifficultyStyles={getDifficultyStyles}
                           folders={folders}
                           isInFolder={isInFolder}
                           onAddToFolder={addToFolder}
                           onRemoveFromFolder={removeFromFolder}
                         />
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
             )}
           </motion.div>
 
           {/* Login prompt for non-authenticated users */}
           {!user && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-center p-6 border border-dashed rounded-lg"
             >
               <p className="text-muted-foreground mb-4">
                 Sign in to track your progress and save questions for revision.
               </p>
               <Button variant="default" asChild>
                 <a href="/login">Sign In</a>
               </Button>
             </motion.div>
           )}
         </main>
       </div>
     </TooltipProvider>
  );
};

 // Question Row Component
 interface SQLQuestionRowProps {
   question: {
     id: number;
     title: string;
     text: string;
     difficulty: string;
     categoryId: string;
     answer: string;
   };
   index: number;
   isSolved: boolean;
   isRevision: boolean;
   isExpanded: boolean;
   onToggleSolved: () => void;
   onToggleRevision: () => void;
   onToggleAnswer: () => void;
   getDifficultyStyles: (difficulty: string) => string;
   folders: import("@/hooks/useFolders").Folder[];
   isInFolder: (folderId: string, questionId: number, questionSource: string) => boolean;
   onAddToFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
   onRemoveFromFolder: (folderId: string, questionId: number, questionSource: string) => Promise<boolean>;
 }
 
 const SQLQuestionRow = ({
   question,
   index,
   isSolved,
   isRevision,
   isExpanded,
   onToggleSolved,
   onToggleRevision,
   onToggleAnswer,
   getDifficultyStyles,
   folders,
   isInFolder,
   onAddToFolder,
   onRemoveFromFolder,
 }: SQLQuestionRowProps) => {
   return (
     <>
       <motion.tr
          data-question-id={question.id}
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: index * 0.02, duration: 0.2 }}
         whileHover={{
           backgroundColor: "hsl(var(--muted) / 0.5)",
           transition: { duration: 0.15 },
         }}
         className={cn(
           "border-b transition-colors group cursor-pointer",
           isSolved && "bg-muted/30",
           isExpanded && "bg-muted/40"
         )}
       >
         <TableCell className="font-medium text-muted-foreground text-sm">
           {index + 1}
         </TableCell>
 
         <TableCell onClick={onToggleAnswer}>
           <div className="flex items-start gap-2 group/question">
             <motion.div
               animate={{ rotate: isExpanded ? 180 : 0 }}
               transition={{ duration: 0.2 }}
               className="flex-shrink-0 mt-0.5"
             >
               <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/question:text-primary transition-colors" />
             </motion.div>
             <div className="flex-1 min-w-0">
               <p
                 className={cn(
                   "font-medium text-sm transition-colors group-hover/question:text-primary",
                   isSolved && "line-through text-muted-foreground"
                 )}
               >
                 {question.title}
               </p>
               <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                 {question.text}
               </p>
               <Badge
                 variant="secondary"
                 className="font-normal mt-2 md:hidden text-xs"
               >
                 {getCategoryName(question.categoryId)}
               </Badge>
             </div>
           </div>
         </TableCell>
 
         <TableCell className="hidden md:table-cell">
           <Badge variant="secondary" className="font-normal text-xs">
             {getCategoryName(question.categoryId)}
           </Badge>
         </TableCell>
 
         <TableCell>
           <Badge
             variant="outline"
             className={cn("font-medium text-xs", getDifficultyStyles(question.difficulty))}
           >
             {question.difficulty}
           </Badge>
         </TableCell>
 
         <TableCell className="text-center">
           <Tooltip>
             <TooltipTrigger asChild>
               <motion.div whileTap={{ scale: 0.9 }} className="inline-flex">
                 <Checkbox
                   checked={isSolved}
                   onCheckedChange={onToggleSolved}
                   aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                   className={cn(
                     "transition-all duration-200",
                     "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                     "hover:border-emerald-400"
                   )}
                 />
               </motion.div>
             </TooltipTrigger>
             <TooltipContent side="top" className="text-xs">
               {isSolved ? "Mark as unsolved" : "Mark as solved"}
             </TooltipContent>
           </Tooltip>
         </TableCell>
 
         <TableCell className="text-center">
           <Tooltip>
             <TooltipTrigger asChild>
               <motion.div
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.9 }}
                 className="inline-flex"
               >
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={(e) => {
                     e.stopPropagation();
                     onToggleRevision();
                   }}
                   aria-label={isRevision ? "Remove from revision" : "Add to revision"}
                   className={cn(
                     "h-8 w-8 transition-colors",
                     isRevision
                       ? "text-amber-500 hover:text-amber-600"
                       : "text-muted-foreground hover:text-foreground"
                   )}
                 >
                   {isRevision ? (
                     <BookmarkCheck className="h-4 w-4 fill-current" />
                   ) : (
                     <Bookmark className="h-4 w-4" />
                   )}
                 </Button>
               </motion.div>
             </TooltipTrigger>
             <TooltipContent side="top" className="text-xs">
               {isRevision ? "Remove from revision" : "Add to revision list"}
             </TooltipContent>
           </Tooltip>
         </TableCell>

         <TableCell className="text-center">
           <AddToFolderButton
             folders={folders}
             questionId={question.id}
             questionSource="sql"
             isInFolder={isInFolder}
             onAddToFolder={onAddToFolder}
             onRemoveFromFolder={onRemoveFromFolder}
           />
         </TableCell>
       </motion.tr>
 
       {/* Expandable Answer Row */}
       <AnimatePresence>
         {isExpanded && (
           <motion.tr
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.15 }}
           >
             <TableCell colSpan={7} className="p-0 bg-muted/20">
               <AnswerPanel answer={question.answer} />
             </TableCell>
           </motion.tr>
         )}
       </AnimatePresence>
     </>
   );
 };
 
export default SQLQuestions;
