import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Search, Filter, ChevronDown, ChevronRight, CheckCircle, 
  BookOpen, Trophy, Target, Bookmark, ArrowLeft, Timer,
  Puzzle, Shield, FileText, Building2
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
  lldCategories, lldTopics, lldQuestions,
  getTopicsForCategory, getQuestionsForCategory,
  type SystemDesignCategory, type SystemDesignQuestion
} from "@/data/systemDesignData";
import AnswerPanel from "@/components/library/AnswerPanel";
import FundamentalsQuizMode from "@/components/library/FundamentalsQuizMode";
import QuizLeaderboard from "@/components/library/QuizLeaderboard";
import FundamentalsStreakCard from "@/components/FundamentalsStreakCard";

const iconMap: Record<string, React.ReactNode> = {
  Puzzle: <Puzzle className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
};

interface TopicProgress {
  [key: string]: { solved: boolean; revision: boolean };
}

const LowLevelDesign: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<SystemDesignCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
  const [progress, setProgress] = useState<TopicProgress>({});
  const [activeTab, setActiveTab] = useState("all");
  const [showQuizMode, setShowQuizMode] = useState(false);

  // Load progress from Supabase
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !selectedCategory) return;
      
      try {
        const { data } = await supabase
          .from("user_topic_progress")
          .select("topic_id, completed, is_revision")
          .eq("user_id", user.id)
          .eq("sheet_id", `lld-${selectedCategory.id}`);
        
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
  }, [user, selectedCategory]);

  const toggleSolved = async (questionId: number) => {
    if (!user || !selectedCategory) return;
    
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
        .eq("sheet_id", `lld-${selectedCategory.id}`)
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
            sheet_id: `lld-${selectedCategory.id}`,
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
    if (!user || !selectedCategory) return;
    
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
        .eq("sheet_id", `lld-${selectedCategory.id}`)
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
            sheet_id: `lld-${selectedCategory.id}`,
            topic_id: key,
            is_revision: newRevision,
          });
      }
    } catch (error) {
      console.error("Error saving revision:", error);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!selectedCategory) return [];
    
    let questions = getQuestionsForCategory(selectedCategory.id);
    
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
  }, [selectedCategory, searchQuery, difficultyFilter, activeTab, progress]);

  const topics = selectedCategory ? getTopicsForCategory(selectedCategory.id) : [];
  
  const getQuestionsForTopicId = (topicId: string) => {
    return filteredQuestions.filter(q => q.topicId === topicId);
  };

  const getTopicProgress = (topicId: string) => {
    const topicQuestions = lldQuestions.filter(q => q.topicId === topicId);
    const solved = topicQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    return { solved, total: topicQuestions.length };
  };

  const getOverallProgress = () => {
    if (!selectedCategory) return { solved: 0, total: 0, revision: 0 };
    const catQuestions = getQuestionsForCategory(selectedCategory.id);
    const solved = catQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    const revision = catQuestions.filter(q => progress[`q-${q.id}`]?.revision).length;
    return { solved, total: catQuestions.length, revision };
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

  // Category detail view
  if (selectedCategory) {
    const quizQuestions = getQuestionsForCategory(selectedCategory.id).filter(q => q.options && q.options.length > 0);
    
    return (
      <div className="min-h-screen bg-background">
        {/* Quiz Mode */}
        <AnimatePresence>
          {showQuizMode && (
            <FundamentalsQuizMode
              title={selectedCategory.name}
              questions={quizQuestions}
              sheetId={`lld-${selectedCategory.id}`}
              onClose={() => setShowQuizMode(false)}
            />
          )}
        </AnimatePresence>

        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedCategory(null)} aria-label="Back to categories">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", selectedCategory.color)}>
                {iconMap[selectedCategory.icon]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{selectedCategory.name}</h1>
                <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
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
                    <p className="text-2xl font-bold">{overallProgress.solved}/{overallProgress.total}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-amber-500/50" />
                </div>
                <Progress value={overallProgress.total > 0 ? (overallProgress.solved / overallProgress.total) * 100 : 0} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{overallProgress.total > 0 ? Math.round((overallProgress.solved / overallProgress.total) * 100) : 0}%</p>
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
                    <p className="text-2xl font-bold">{overallProgress.revision}</p>
                  </div>
                  <Bookmark className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Topics</p>
                    <p className="text-2xl font-bold">{topics.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <QuizLeaderboard 
            quizType={`lld-${selectedCategory.id}`} 
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
              <TabsTrigger value="all">All ({getQuestionsForCategory(selectedCategory.id).length})</TabsTrigger>
              <TabsTrigger value="solved">Solved ({overallProgress.solved})</TabsTrigger>
              <TabsTrigger value="revision">Revision ({overallProgress.revision})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Topics with Questions */}
          <div className="space-y-4">
            {topics.map((topic) => {
              const topicQuestions = getQuestionsForTopicId(topic.id);
              const topicProgress = getTopicProgress(topic.id);
              const isExpanded = expandedTopics.has(topic.id);
              
              if (topicQuestions.length === 0 && activeTab !== "all") return null;
              
              return (
                <Collapsible
                  key={topic.id}
                  open={isExpanded}
                  onOpenChange={(open) => {
                    setExpandedTopics(prev => {
                      const next = new Set(prev);
                      if (open) next.add(topic.id);
                      else next.delete(topic.id);
                      return next;
                    });
                  }}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-base">{topic.name}</CardTitle>
                              {topic.description && (
                                <CardDescription className="text-xs">{topic.description}</CardDescription>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              {topicProgress.solved}/{topicProgress.total}
                            </Badge>
                            <Progress 
                              value={topicProgress.total > 0 ? (topicProgress.solved / topicProgress.total) * 100 : 0} 
                              className="w-24 h-2" 
                            />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="divide-y divide-border">
                          {topicQuestions.map((question) => {
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
                                  role="button"
                                  tabIndex={0}
                                  aria-expanded={isAnswerOpen}
                                  onClick={() => setExpandedAnswer(isAnswerOpen ? null : question.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setExpandedAnswer(isAnswerOpen ? null : question.id);
                                    }
                                  }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    aria-label={isSolved ? "Mark as unsolved" : "Mark as solved"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSolved(question.id);
                                    }}
                                  >
                                    <CheckCircle className={cn(
                                      "h-5 w-5",
                                      isSolved ? "text-emerald-500 fill-emerald-500" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{question.title}</p>
                                    <p className="text-sm text-muted-foreground truncate">{question.text}</p>
                                  </div>
                                  <Badge variant="outline" className={getDifficultyBadge(question.difficulty)}>
                                    {question.difficulty}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    aria-label={isRevision ? "Remove from revision" : "Add to revision"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRevision(question.id);
                                    }}
                                  >
                                    <Bookmark className={cn(
                                      "h-4 w-4",
                                      isRevision ? "text-blue-500 fill-blue-500" : "text-muted-foreground"
                                    )} />
                                  </Button>
                                </div>
                                <AnimatePresence>
                                  {isAnswerOpen && question.answer && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-12 pb-4">
                                        <AnswerPanel answer={question.answer} />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Category selection view
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Low Level Design</h1>
              <p className="text-sm text-muted-foreground">Object-oriented design and patterns</p>
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
            <Input placeholder="Search LLD topics..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lldCategories.map((category, index) => {
            const categoryQuestions = getQuestionsForCategory(category.id);
            const topics = getTopicsForCategory(category.id);
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCategory(category)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCategory(category);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", category.color)}>
                        {iconMap[category.icon]}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{categoryQuestions.length} questions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{topics.length} topics</Badge>
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

export default LowLevelDesign;
