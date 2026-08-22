import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Search,
  CheckCircle2,
  BookmarkCheck,
  ChevronDown,
  Bookmark,
  TrendingUp,
  Folder,
  FolderPlus,
  Zap,
  Database,
  Network,
  Monitor,
  Boxes,
  Binary,
  Code,
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
import { useCSProgress } from "@/hooks/useCSProgress";
import { useFolders } from "@/hooks/useFolders";
import {
  csQuestions,
  csSubjects,
  csTopics,
  getQuestionsBySubject,
  getQuestionsByTopic,
  getQuestionsByDifficulty,
  searchQuestions,
  getSubjectName,
  getTopicName,
  getTopicsBySubject,
  getDifficultyStats,
  type CSQuestion,
} from "@/data/csSubjectsData";
import AnswerPanel from "@/components/library/AnswerPanel";
import FolderManager from "@/components/library/FolderManager";
import AddToFolderButton from "@/components/library/AddToFolderButton";
import SpacedRepetitionPanel from "@/components/library/SpacedRepetitionPanel";

type ViewMode = "all" | "solved" | "revision" | "folders";

const subjectIcons: Record<string, React.ReactNode> = {
  os: <Monitor className="h-4 w-4" />,
  dbms: <Database className="h-4 w-4" />,
  cn: <Network className="h-4 w-4" />,
  oops: <Boxes className="h-4 w-4" />,
  toc: <Binary className="h-4 w-4" />,
  compiler: <Code className="h-4 w-4" />,
};

const CoreCSSubjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, isSolved, isRevision, toggleSolved, toggleRevision, markReviewed, spacedRepetition } = useCSProgress();

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
  } = useFolders("cs");

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Handle scroll to question from URL params
  React.useEffect(() => {
    const questionId = searchParams.get("question");
    const subjectId = searchParams.get("subject");
    if (questionId) {
      const id = parseInt(questionId);
      setExpandedQuestionId(id);
      if (subjectId) {
        setSubjectFilter(subjectId);
      }
      setTimeout(() => {
        const element = document.querySelector(`[data-question-id="${id}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams]);

  // Get difficulty stats
  const difficultyStats = getDifficultyStats();

  // Get topics for selected subject
  const availableTopics = useMemo(() => {
    if (subjectFilter === "all") return [];
    return getTopicsBySubject(subjectFilter);
  }, [subjectFilter]);

  // Calculate solved counts
  const solvedCounts = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    csQuestions.forEach((q) => {
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
      .filter((item) => item.question_source === "cs")
      .map((item) => csQuestions.find((q) => q.id === item.question_id))
      .filter(Boolean) as CSQuestion[];
  }, [selectedFolderId, folderItems]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    if (viewMode === "folders" && selectedFolderId) {
      let questions = folderQuestions;
      questions = getQuestionsByDifficulty(questions, difficultyFilter);
      questions = searchQuestions(questions, searchQuery);
      return questions;
    }

    let questions = getQuestionsBySubject(subjectFilter);
    questions = getQuestionsByTopic(questions, topicFilter);
    questions = getQuestionsByDifficulty(questions, difficultyFilter);
    questions = searchQuestions(questions, searchQuery);

    if (viewMode === "solved") {
      questions = questions.filter((q) => isSolved(q.id));
    } else if (viewMode === "revision") {
      questions = questions.filter((q) => isRevision(q.id));
    }

    return questions;
  }, [subjectFilter, topicFilter, difficultyFilter, searchQuery, viewMode, isSolved, isRevision, selectedFolderId, folderQuestions]);

  // Get question details for spaced repetition panel
  const getQuestionDetails = useCallback(
    (questionId: number, categoryId: string) => {
      const question = csQuestions.find((q) => q.id === questionId);
      if (!question) return undefined;
      return {
        id: question.id,
        text: question.title,
        difficulty: question.difficulty,
        categoryId: question.subjectId,
        categoryName: getSubjectName(question.subjectId),
      };
    },
    []
  );

  // Handle review question
  const handleReviewQuestion = useCallback(
    (questionId: number, categoryId: string) => {
      markReviewed(questionId);
    },
    [markReviewed]
  );

  // Handle scroll to question
  const handleScrollToQuestion = useCallback(
    (questionId: number, categoryId: string) => {
      const question = csQuestions.find((q) => q.id === questionId);
      if (question) {
        setSubjectFilter(question.subjectId);
        setExpandedQuestionId(questionId);
        setTimeout(() => {
          const element = document.querySelector(`[data-question-id="${questionId}"]`);
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    },
    []
  );

  // Map spaced repetition questions to expected format
  const mappedDueQuestions = useMemo(() => {
    return spacedRepetition.dueQuestions.map((q) => {
      const question = csQuestions.find((cq) => cq.id === q.questionId);
      return {
        ...q,
        categoryId: question?.subjectId || "",
      };
    });
  }, [spacedRepetition.dueQuestions]);

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

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold">Core CS Subjects</h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    Master fundamental computer science concepts
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">My Progress</span>
              </Button>
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setViewMode("folders")}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Folders</span>
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
              <TabsTrigger value="all">All Questions</TabsTrigger>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Total Progress</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((solvedCounts.total / difficultyStats.total) * 100)}%
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">
                    {solvedCounts.total}
                    <span className="text-lg text-muted-foreground">/ {difficultyStats.total}</span>
                  </div>
                  <Progress value={(solvedCounts.total / difficultyStats.total) * 100} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Easy</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">
                    {solvedCounts.easy}
                    <span className="text-lg text-muted-foreground">/ {difficultyStats.easy}</span>
                  </div>
                  <Progress
                    value={(solvedCounts.easy / Math.max(difficultyStats.easy, 1)) * 100}
                    className="h-1.5 mt-2 [&>div]:bg-emerald-500"
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Medium</span>
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">
                    {solvedCounts.medium}
                    <span className="text-lg text-muted-foreground">/ {difficultyStats.medium}</span>
                  </div>
                  <Progress
                    value={(solvedCounts.medium / Math.max(difficultyStats.medium, 1)) * 100}
                    className="h-1.5 mt-2 [&>div]:bg-amber-500"
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Hard</span>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">
                    {solvedCounts.hard}
                    <span className="text-lg text-muted-foreground">/ {difficultyStats.hard}</span>
                  </div>
                  <Progress
                    value={(solvedCounts.hard / Math.max(difficultyStats.hard, 1)) * 100}
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
          {user && spacedRepetition.stats.total > 0 && (
            <SpacedRepetitionPanel
              dueQuestions={mappedDueQuestions}
              stats={spacedRepetition.stats}
              getQuestionDetails={getQuestionDetails}
              onReviewQuestion={handleReviewQuestion}
              onScrollToQuestion={handleScrollToQuestion}
            />
          )}

          {/* Subject Cards */}
          {viewMode === "all" && subjectFilter === "all" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
            >
              {csSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => {
                    setSubjectFilter(subject.id);
                    setTopicFilter("all");
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-10 w-10 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      {subjectIcons[subject.id]}
                    </div>
                    <h3 className="font-medium text-sm mb-1">{subject.name}</h3>
                    <p className="text-xs text-muted-foreground">{subject.questionCount} questions</p>
                    <Badge
                      variant={
                        subject.importance === "Critical"
                          ? "destructive"
                          : subject.importance === "High"
                          ? "default"
                          : "secondary"
                      }
                      className="mt-2 text-xs"
                    >
                      {subject.importance}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
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
                placeholder="Search CS questions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v); setTopicFilter("all"); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {csSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableTopics.length > 0 && (
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {availableTopics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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
            </div>
          </motion.div>

          {/* Questions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead className="w-32 hidden md:table-cell">Subject</TableHead>
                    <TableHead className="w-24 hidden sm:table-cell">Difficulty</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No questions found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuestions.map((question) => (
                      <React.Fragment key={question.id}>
                        <TableRow
                          data-question-id={question.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors",
                            expandedQuestionId === question.id && "bg-muted/30"
                          )}
                          tabIndex={0}
                          onClick={() =>
                            setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id);
                            }
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSolved(question.id)}
                              onCheckedChange={() => toggleSolved(question.id)}
                              aria-label={isSolved(question.id) ? "Mark as unsolved" : "Mark as solved"}
                              className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{question.title}</span>
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  expandedQuestionId === question.id && "rotate-180"
                                )}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {getSubjectName(question.subjectId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className={cn("text-xs", getDifficultyStyles(question.difficulty))}>
                              {question.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    aria-label={isRevision(question.id) ? "Remove from revision" : "Add to revision"}
                                    onClick={() => toggleRevision(question.id)}
                                  >
                                    <Bookmark
                                      className={cn(
                                        "h-4 w-4",
                                        isRevision(question.id)
                                          ? "fill-amber-500 text-amber-500"
                                          : "text-muted-foreground"
                                      )}
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isRevision(question.id) ? "Remove from revision" : "Add to revision"}
                                </TooltipContent>
                              </Tooltip>
                              {user && (
                                <AddToFolderButton
                                  questionId={question.id}
                                  questionSource="cs"
                                  folders={folders}
                                  isInFolder={isInFolder}
                                  onAddToFolder={addToFolder}
                                  onRemoveFromFolder={removeFromFolder}
                                />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        <AnimatePresence>
                          {expandedQuestionId === question.id && (
                            <TableRow>
                              <TableCell colSpan={5} className="p-0 border-0">
                                <AnswerPanel answer={question.answer} />
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </motion.div>
        </main>
      </div>
    </TooltipProvider>
  );
};

export default CoreCSSubjects;
