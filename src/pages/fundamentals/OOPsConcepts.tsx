import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, Search, ChevronDown, ChevronRight, CheckCircle, 
  Circle, BookOpen, Play, Trophy, Target, Bookmark, ArrowLeft,
  Box, GitBranch, Shapes, Lock, Layers, Diamond, Puzzle, Network,
  Sparkles, Timer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  oopsConcepts, oopsQuestions, getQuestionsForConcept,
  type OOPsConcept, type OOPsQuestion 
} from "@/data/oopsConceptsData";
import AnswerPanel from "@/components/library/AnswerPanel";
import FundamentalsQuizMode from "@/components/library/FundamentalsQuizMode";
import QuizLeaderboard from "@/components/library/QuizLeaderboard";
import FundamentalsLeaderboard from "@/components/library/FundamentalsLeaderboard";
import FundamentalsAnalytics from "@/components/library/FundamentalsAnalytics";
import FundamentalsStreakCard from "@/components/FundamentalsStreakCard";

const iconMap: Record<string, React.ReactNode> = {
  Box: <Box className="h-5 w-5" />,
  GitBranch: <GitBranch className="h-5 w-5" />,
  Shapes: <Shapes className="h-5 w-5" />,
  Lock: <Lock className="h-5 w-5" />,
  Layers: <Layers className="h-5 w-5" />,
  Diamond: <Diamond className="h-5 w-5" />,
  Puzzle: <Puzzle className="h-5 w-5" />,
  Network: <Network className="h-5 w-5" />,
};

interface TopicProgress {
  [key: string]: { solved: boolean; revision: boolean };
}

const OOPsConcepts: React.FC = () => {
  const { user } = useAuth();
  const [selectedConcept, setSelectedConcept] = useState<OOPsConcept | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
  const [progress, setProgress] = useState<TopicProgress>({});
  const [activeTab, setActiveTab] = useState("all");
  const [showQuizMode, setShowQuizMode] = useState(false);

  // Load progress from Supabase
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from("user_topic_progress")
          .select("topic_id, completed, is_revision")
          .eq("user_id", user.id)
          .eq("sheet_id", "oops-concepts");
        
        if (data) {
          const progressMap: TopicProgress = {};
          data.forEach((item) => {
            progressMap[item.topic_id] = { 
              solved: item.completed, 
              revision: item.is_revision 
            };
          });
          setProgress(progressMap);
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    };
    
    loadProgress();
  }, [user]);

  const toggleSolved = async (questionId: number) => {
    if (!user) return;
    
    const key = `q-${questionId}`;
    const currentProgress = progress[key] || { solved: false, revision: false };
    const newSolved = !currentProgress.solved;
    
    setProgress(prev => ({
      ...prev,
      [key]: { ...currentProgress, solved: newSolved }
    }));
    
    try {
      const { data: existing } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("sheet_id", "oops-concepts")
        .eq("topic_id", key)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from("user_topic_progress")
          .update({ completed: newSolved, completed_at: newSolved ? new Date().toISOString() : null })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_topic_progress")
          .insert({
            user_id: user.id,
            sheet_id: "oops-concepts",
            topic_id: key,
            completed: newSolved,
            completed_at: newSolved ? new Date().toISOString() : null,
          });
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    }
  };

  const toggleRevision = async (questionId: number) => {
    if (!user) return;
    
    const key = `q-${questionId}`;
    const currentProgress = progress[key] || { solved: false, revision: false };
    const newRevision = !currentProgress.revision;
    
    setProgress(prev => ({
      ...prev,
      [key]: { ...currentProgress, revision: newRevision }
    }));
    
    try {
      const { data: existing } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("sheet_id", "oops-concepts")
        .eq("topic_id", key)
        .maybeSingle();
      
      if (existing) {
        await supabase
          .from("user_topic_progress")
          .update({ is_revision: newRevision })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("user_topic_progress")
          .insert({
            user_id: user.id,
            sheet_id: "oops-concepts",
            topic_id: key,
            is_revision: newRevision,
          });
      }
    } catch (error) {
      console.error("Error saving revision:", error);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!selectedConcept) return [];
    
    let questions = getQuestionsForConcept(selectedConcept.id);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      questions = questions.filter(q => 
        q.title.toLowerCase().includes(query) || 
        q.text.toLowerCase().includes(query)
      );
    }
    
    if (difficultyFilter !== "all") {
      questions = questions.filter(q => q.difficulty === difficultyFilter);
    }
    
    if (activeTab === "solved") {
      questions = questions.filter(q => progress[`q-${q.id}`]?.solved);
    } else if (activeTab === "revision") {
      questions = questions.filter(q => progress[`q-${q.id}`]?.revision);
    }
    
    return questions;
  }, [selectedConcept, searchQuery, difficultyFilter, activeTab, progress]);

  const getConceptProgress = (conceptId: string) => {
    const conceptQuestions = getQuestionsForConcept(conceptId);
    const solved = conceptQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    const revision = conceptQuestions.filter(q => progress[`q-${q.id}`]?.revision).length;
    return { solved, total: conceptQuestions.length, revision };
  };

  const getOverallProgress = () => {
    const solved = oopsQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    const revision = oopsQuestions.filter(q => progress[`q-${q.id}`]?.revision).length;
    return { solved, total: oopsQuestions.length, revision };
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
      Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
      Hard: "bg-red-500/20 text-red-500 border-red-500/30",
    };
    return styles[difficulty as keyof typeof styles] || "";
  };

  const overallProgress = getOverallProgress();

  if (selectedConcept) {
    const conceptProgress = getConceptProgress(selectedConcept.id);
    const quizQuestions = getQuestionsForConcept(selectedConcept.id).filter(q => q.options && q.options.length > 0);
    
    return (
      <div className="min-h-screen bg-background">
        {/* Quiz Mode */}
        <AnimatePresence>
          {showQuizMode && (
            <FundamentalsQuizMode
              title={selectedConcept.name}
              questions={quizQuestions}
              sheetId={`oops-${selectedConcept.id}`}
              onClose={() => setShowQuizMode(false)}
            />
          )}
        </AnimatePresence>

        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button variant="ghost" size="icon" aria-label="Back to concepts" onClick={() => setSelectedConcept(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", selectedConcept.color)}>
                {iconMap[selectedConcept.icon]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{selectedConcept.name}</h1>
                <p className="text-sm text-muted-foreground">{selectedConcept.description}</p>
              </div>
            </div>
            <Button onClick={() => setShowQuizMode(true)} className="gap-2">
              <Timer className="h-4 w-4" />
              Start Quiz
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-6 space-y-6">
          {/* Streak Card */}
          <FundamentalsStreakCard compact />

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{conceptProgress.solved}/{conceptProgress.total}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-amber-500/50" />
                </div>
                <Progress value={(conceptProgress.solved / conceptProgress.total) * 100 || 0} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{Math.round((conceptProgress.solved / conceptProgress.total) * 100 || 0)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">For Revision</p>
                    <p className="text-2xl font-bold">{conceptProgress.revision}</p>
                  </div>
                  <Bookmark className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lessons</p>
                    <p className="text-2xl font-bold">{selectedConcept.lessons}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <QuizLeaderboard 
            quizType={`oops-${selectedConcept.id}`} 
            currentUserId={user?.id} 
          />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions..." 
                className="pl-10" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[150px]">
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({getQuestionsForConcept(selectedConcept.id).length})</TabsTrigger>
              <TabsTrigger value="solved">Solved ({conceptProgress.solved})</TabsTrigger>
              <TabsTrigger value="revision">Revision ({conceptProgress.revision})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Questions List */}
          <Card>
            <CardContent className="p-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions match your filters.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredQuestions.map((question) => {
                    const isSolved = progress[`q-${question.id}`]?.solved;
                    const isRevision = progress[`q-${question.id}`]?.revision;
                    const isAnswerOpen = expandedAnswer === question.id;
                    
                    return (
                      <div key={question.id}>
                        <div 
                          className={cn(
                            "flex items-center gap-4 py-3 px-2 hover:bg-muted/30 rounded-lg cursor-pointer transition-colors",
                            isSolved && "bg-emerald-500/5"
                          )}
                          onClick={() => setExpandedAnswer(isAnswerOpen ? null : question.id)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSolved(question.id);
                            }}
                          >
                            {isSolved ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-medium", isSolved && "text-muted-foreground line-through")}>
                              {question.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{question.text}</p>
                          </div>
                          <Badge variant="outline" className={getDifficultyBadge(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={isRevision ? "Remove from revision" : "Add to revision"}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRevision(question.id);
                            }}
                          >
                            <Bookmark className={cn("h-4 w-4", isRevision ? "fill-primary text-primary" : "text-muted-foreground")} />
                          </Button>
                        </div>
                        <AnimatePresence>
                          {isAnswerOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <AnswerPanel answer={question.answer} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Concept selection view
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">OOPs Concepts</h1>
              <p className="text-sm text-muted-foreground">Master Object-Oriented Programming fundamentals</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search concepts..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concepts</p>
                <p className="text-2xl font-bold">{oopsConcepts.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-2xl font-bold">{oopsQuestions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solved</p>
                <p className="text-2xl font-bold">{overallProgress.solved}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{Math.round((overallProgress.solved / overallProgress.total) * 100) || 0}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Leaderboard */}
        <FundamentalsLeaderboard currentUserId={user?.id} type="oops" />

        {/* Analytics */}
        <FundamentalsAnalytics type="oops" />

        {/* Concept Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {oopsConcepts
            .filter(concept => 
              concept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              concept.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((concept, index) => {
              const conceptProgress = getConceptProgress(concept.id);
              const completionPercent = Math.round((conceptProgress.solved / conceptProgress.total) * 100) || 0;
              
              return (
                <motion.div
                  key={concept.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden h-full"
                    onClick={() => setSelectedConcept(concept)}
                  >
                    <div className={cn("h-2 bg-gradient-to-r", concept.color)} />
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", concept.color)}>
                          {iconMap[concept.icon]}
                        </div>
                        <Badge variant={concept.importance === "Critical" ? "destructive" : concept.importance === "High" ? "default" : "secondary"}>
                          {concept.importance}
                        </Badge>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors mt-2">
                        {concept.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{concept.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{concept.lessons} lessons</span>
                        <span>{conceptProgress.solved}/{conceptProgress.total}</span>
                      </div>
                      <Progress value={completionPercent} className="h-1.5" />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-medium">{completionPercent}% complete</span>
                        {conceptProgress.solved === conceptProgress.total && conceptProgress.total > 0 && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </main>
    </div>
  );
};

export default OOPsConcepts;
