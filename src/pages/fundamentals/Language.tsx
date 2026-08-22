import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, Search, Filter, ChevronDown, ChevronRight, CheckCircle, 
  Circle, BookOpen, Play, Trophy, Target, Clock, BarChart3, 
  Bookmark, ArrowLeft, Coffee, FileCode, Cpu, Braces, Rabbit, Shield,
  TrendingUp, Sparkles, Timer
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  languages, languageTopics, languageQuestions, 
  getTopicsForLanguage, getQuestionsForLanguage,
  type Language as LanguageType, type LanguageQuestion 
} from "@/data/languagesData";
import AnswerPanel from "@/components/library/AnswerPanel";
import FundamentalsQuizMode from "@/components/library/FundamentalsQuizMode";
import QuizLeaderboard from "@/components/library/QuizLeaderboard";
import FundamentalsLeaderboard from "@/components/library/FundamentalsLeaderboard";
import FundamentalsAnalytics from "@/components/library/FundamentalsAnalytics";
import FundamentalsStreakCard from "@/components/FundamentalsStreakCard";

const iconMap: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="h-5 w-5" />,
  FileCode: <FileCode className="h-5 w-5" />,
  Cpu: <Cpu className="h-5 w-5" />,
  Braces: <Braces className="h-5 w-5" />,
  Rabbit: <Rabbit className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
};

interface TopicProgress {
  [key: string]: { solved: boolean; revision: boolean };
}

const Language: React.FC = () => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType | null>(null);
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
      if (!user || !selectedLanguage) return;
      
      try {
        const { data } = await supabase
          .from("user_topic_progress")
          .select("topic_id, completed, is_revision")
          .eq("user_id", user.id)
          .eq("sheet_id", `language-${selectedLanguage.id}`);
        
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
  }, [user, selectedLanguage]);

  const toggleSolved = async (questionId: number) => {
    if (!user || !selectedLanguage) return;
    
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
        .eq("sheet_id", `language-${selectedLanguage.id}`)
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
            sheet_id: `language-${selectedLanguage.id}`,
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
    if (!user || !selectedLanguage) return;
    
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
        .eq("sheet_id", `language-${selectedLanguage.id}`)
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
            sheet_id: `language-${selectedLanguage.id}`,
            topic_id: key,
            is_revision: newRevision,
          });
      }
    } catch (error) {
      console.error("Error saving revision:", error);
    }
  };

  const filteredQuestions = useMemo(() => {
    if (!selectedLanguage) return [];
    
    let questions = getQuestionsForLanguage(selectedLanguage.id);
    
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
  }, [selectedLanguage, searchQuery, difficultyFilter, activeTab, progress]);

  const topics = selectedLanguage ? getTopicsForLanguage(selectedLanguage.id) : [];
  
  const getQuestionsForTopicId = (topicId: string) => {
    return filteredQuestions.filter(q => q.topicId === topicId);
  };

  const getTopicProgress = (topicId: string) => {
    const topicQuestions = languageQuestions.filter(q => q.topicId === topicId);
    const solved = topicQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    return { solved, total: topicQuestions.length };
  };

  const getOverallProgress = () => {
    if (!selectedLanguage) return { solved: 0, total: 0, revision: 0 };
    const langQuestions = getQuestionsForLanguage(selectedLanguage.id);
    const solved = langQuestions.filter(q => progress[`q-${q.id}`]?.solved).length;
    const revision = langQuestions.filter(q => progress[`q-${q.id}`]?.revision).length;
    return { solved, total: langQuestions.length, revision };
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

  if (selectedLanguage) {
    const quizQuestions = getQuestionsForLanguage(selectedLanguage.id).filter(q => q.options && q.options.length > 0);
    
    return (
      <div className="min-h-screen bg-background">
        {/* Quiz Mode */}
        <AnimatePresence>
          {showQuizMode && (
            <FundamentalsQuizMode
              title={selectedLanguage.name}
              questions={quizQuestions}
              sheetId={`language-${selectedLanguage.id}`}
              onClose={() => setShowQuizMode(false)}
            />
          )}
        </AnimatePresence>

        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6">
            <Button variant="ghost" size="icon" aria-label="Back to languages" onClick={() => setSelectedLanguage(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", selectedLanguage.color)}>
                {iconMap[selectedLanguage.icon]}
              </div>
              <div>
                <h1 className="text-xl font-bold">{selectedLanguage.name}</h1>
                <p className="text-sm text-muted-foreground">{selectedLanguage.description}</p>
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
                <Progress value={(overallProgress.solved / overallProgress.total) * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold">{Math.round((overallProgress.solved / overallProgress.total) * 100)}%</p>
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
            quizType={`language-${selectedLanguage.id}`} 
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
              <TabsTrigger value="all">All ({getQuestionsForLanguage(selectedLanguage.id).length})</TabsTrigger>
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
                              value={(topicProgress.solved / topicProgress.total) * 100} 
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
                                    <p className={cn("font-medium truncate", isSolved && "text-muted-foreground line-through")}>
                                      {question.title}
                                    </p>
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

  // Language selection view
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Programming Languages</h1>
              <p className="text-sm text-muted-foreground">Master programming fundamentals with structured learning</p>
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
              placeholder="Search languages..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Languages</p>
                <p className="text-2xl font-bold">{languages.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{languageTopics.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">{languageQuestions.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Leaderboard */}
        <FundamentalsLeaderboard currentUserId={user?.id} type="languages" />

        {/* Analytics */}
        <FundamentalsAnalytics type="languages" />

        {/* Language Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {languages
            .filter(lang => 
              lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              lang.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((lang, index) => {
              const langTopics = getTopicsForLanguage(lang.id);
              const langQuestions = getQuestionsForLanguage(lang.id);
              
              return (
                <motion.div
                  key={lang.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    <div className={cn("h-2 bg-gradient-to-r", lang.color)} />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", lang.color)}>
                            {iconMap[lang.icon]}
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {lang.name}
                            </CardTitle>
                            <CardDescription className="text-xs">{lang.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={lang.importance === "Critical" ? "destructive" : lang.importance === "High" ? "default" : "secondary"}>
                          {lang.importance}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>{langTopics.length} Topics</span>
                        <span>{langQuestions.length} Questions</span>
                      </div>
                      <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                        <Play className="h-4 w-4" />
                        Start Learning
                      </Button>
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

export default Language;
