import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, Search, ChevronDown, Play, Trophy, CheckCircle, RotateCcw, GitBranch } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  roadmapCategories, 
  roadmapQuestions, 
  roadmapTopics,
  getRoadmapQuestionsByCategory,
  type RoadmapQuestion,
  type RoadmapCategory,
} from "@/data/roadmapsData";
import { roadmapTrees, getRoadmapTreeById } from "@/data/roadmapTreesData";
import AnswerPanel from "@/components/library/AnswerPanel";
import FundamentalsStreakCard from "@/components/FundamentalsStreakCard";
import QuizLeaderboard from "@/components/library/QuizLeaderboard";
import FundamentalsQuizMode from "@/components/library/FundamentalsQuizMode";
import RoadmapTree from "@/components/roadmap/RoadmapTree";
import RoadmapFAQ from "@/components/roadmap/RoadmapFAQ";
import { useRoadmapTreeProgress } from "@/hooks/useRoadmapTreeProgress";

const difficultyColors = {
  Easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  Hard: "bg-red-500/10 text-red-500 border-red-500/30",
};

const Roadmap: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"questions" | "visual" | "quiz" | "leaderboard">("questions");
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<Record<string, { solved: boolean; revision: boolean }>>({});
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["frontend"]));
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [selectedTreeId, setSelectedTreeId] = useState<string>("frontend");
  const [userName, setUserName] = useState<string>("Learner");

  // Get the selected tree for visual roadmap
  const selectedTree = getRoadmapTreeById(selectedTreeId);
  
  // Tree progress hook
  const { 
    progress: treeProgress, 
    toggleNodeComplete,
    stats: treeStats,
  } = useRoadmapTreeProgress(selectedTreeId, selectedTree?.nodes || []);

  // Fetch user profile name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.full_name) {
        setUserName(data.full_name);
      }
    };
    
    fetchUserName();
  }, [user]);

  // Fetch progress from database
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_topic_progress")
        .select("topic_id, completed, is_revision")
        .eq("user_id", user.id)
        .like("sheet_id", "roadmap-%");

      if (data) {
        const progressMap: Record<string, { solved: boolean; revision: boolean }> = {};
        data.forEach((item) => {
          progressMap[item.topic_id] = { 
            solved: item.completed, 
            revision: item.is_revision 
          };
        });
        setProgress(progressMap);
      }
    };

    fetchProgress();
  }, [user]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return roadmapQuestions.filter((q) => {
      const categoryMatch = selectedCategory === "all" || q.categoryId === selectedCategory;
      const searchMatch = searchQuery === "" || 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.text.toLowerCase().includes(searchQuery.toLowerCase());
      const difficultyMatch = difficultyFilter === "all" || q.difficulty === difficultyFilter;
      return categoryMatch && searchMatch && difficultyMatch;
    });
  }, [selectedCategory, searchQuery, difficultyFilter]);

  // Get questions by category for display
  const questionsByCategory = useMemo(() => {
    const result: Record<string, RoadmapQuestion[]> = {};
    roadmapCategories.forEach((cat) => {
      result[cat.id] = filteredQuestions.filter((q) => q.categoryId === cat.id);
    });
    return result;
  }, [filteredQuestions]);

  // Calculate progress stats
  const stats = useMemo(() => {
    const total = roadmapQuestions.length;
    const solved = Object.values(progress).filter((p) => p.solved).length;
    const revision = Object.values(progress).filter((p) => p.revision).length;
    return { total, solved, revision };
  }, [progress]);

  const toggleQuestion = (id: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleProgressUpdate = async (questionId: number, type: "solved" | "revision") => {
    if (!user) return;

    const question = roadmapQuestions.find((q) => q.id === questionId);
    if (!question) return;

    const currentProgress = progress[String(questionId)] || { solved: false, revision: false };
    const newValue = !currentProgress[type];

    const sheetId = `roadmap-${question.categoryId}`;
    const topicId = String(questionId);

    try {
      const { data: existing } = await supabase
        .from("user_topic_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("sheet_id", sheetId)
        .eq("topic_id", topicId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_topic_progress")
          .update({
            [type === "solved" ? "completed" : "is_revision"]: newValue,
            [type === "solved" ? "completed_at" : "updated_at"]: newValue ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_topic_progress").insert({
          user_id: user.id,
          sheet_id: sheetId,
          topic_id: topicId,
          completed: type === "solved" ? newValue : false,
          is_revision: type === "revision" ? newValue : false,
          completed_at: type === "solved" && newValue ? new Date().toISOString() : null,
        });
      }

      setProgress((prev) => ({
        ...prev,
        [topicId]: {
          ...currentProgress,
          [type]: newValue,
        },
      }));
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Map className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Career Roadmaps</h1>
              <p className="text-sm text-muted-foreground">Navigate your tech career path</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-6">
        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold">{stats.solved}/{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">For Revision</p>
                  <p className="text-xl font-bold">{stats.revision}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-4 md:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-sm font-medium">{Math.round((stats.solved / stats.total) * 100)}%</span>
              </div>
              <Progress value={(stats.solved / stats.total) * 100} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Card */}
        <FundamentalsStreakCard compact />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="questions" className="gap-2">
                <Map className="h-4 w-4" />
                Roadmaps
              </TabsTrigger>
              <TabsTrigger value="visual" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Visual Map
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <Play className="h-4 w-4" />
                Quiz Mode
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {activeTab === "questions" && (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roadmaps..."
                    className="pl-10 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="questions" className="space-y-4 mt-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All Paths
              </Button>
              {roadmapCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Questions by Category */}
            <div className="space-y-4">
              {roadmapCategories.map((category) => {
                const categoryQuestions = questionsByCategory[category.id] || [];
                if (categoryQuestions.length === 0) return null;

                const categoryProgress = categoryQuestions.filter(
                  (q) => progress[String(q.id)]?.solved
                ).length;

                return (
                  <Collapsible
                    key={category.id}
                    open={openCategories.has(category.id)}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                                category.color
                              )}>
                                <Map className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{category.name}</CardTitle>
                                <CardDescription>{category.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium">{categoryProgress}/{categoryQuestions.length}</p>
                                <p className="text-xs text-muted-foreground">completed</p>
                              </div>
                              <ChevronDown className={cn(
                                "h-5 w-5 transition-transform",
                                openCategories.has(category.id) && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          {categoryQuestions.map((question) => {
                            const questionProgress = progress[String(question.id)] || { solved: false, revision: false };
                            
                            return (
                              <div key={question.id} className="border rounded-lg">
                                <div
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => toggleQuestion(question.id)}
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleProgressUpdate(question.id, "solved");
                                      }}
                                      className={cn(
                                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                        questionProgress.solved
                                          ? "bg-primary border-primary"
                                          : "border-muted-foreground/30 hover:border-primary"
                                      )}
                                    >
                                      {questionProgress.solved && <CheckCircle className="h-3 w-3 text-white" />}
                                    </button>
                                    <span className={cn(
                                      "text-sm truncate",
                                      questionProgress.solved && "line-through text-muted-foreground"
                                    )}>
                                      {question.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                                      {question.difficulty}
                                    </Badge>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleProgressUpdate(question.id, "revision");
                                      }}
                                      className={cn(
                                        "p-1 rounded hover:bg-muted transition-colors",
                                        questionProgress.revision && "text-amber-500"
                                      )}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </button>
                                    <ChevronDown className={cn(
                                      "h-4 w-4 transition-transform",
                                      expandedQuestions.has(question.id) && "rotate-180"
                                    )} />
                                  </div>
                                </div>
                                {expandedQuestions.has(question.id) && (
                                  <div className="px-3 pb-3 border-t bg-muted/30">
                                    <div className="pt-3">
                                      <p className="text-sm text-muted-foreground mb-3">{question.text}</p>
                                      <AnswerPanel answer={question.answer} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </TabsContent>

          {/* Visual Roadmap Tab */}
          <TabsContent value="visual" className="space-y-6 mt-4">
            {/* Enhanced Tree Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {roadmapTrees.map((tree) => {
                const isSelected = selectedTreeId === tree.id;
                return (
                  <motion.button
                    key={tree.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTreeId(tree.id)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all duration-200 text-left",
                      "hover:shadow-md",
                      isSelected 
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    {/* Gradient Background */}
                    <div className={cn(
                      "absolute inset-0 rounded-xl opacity-10 bg-gradient-to-br",
                      tree.color,
                      isSelected && "opacity-20"
                    )} />
                    
                    <div className="relative flex flex-col gap-2">
                      {/* Icon */}
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm",
                        tree.color
                      )}>
                        <Map className="h-5 w-5 text-white" />
                      </div>
                      
                      {/* Title */}
                      <div>
                        <p className={cn(
                          "font-semibold text-sm line-clamp-1",
                          isSelected && "text-primary"
                        )}>
                          {tree.title.replace(" Development", "").replace(" & ", "/")}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {tree.nodes.length} topics
                        </p>
                      </div>
                    </div>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <motion.div
                        layoutId="selected-tree"
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center"
                      >
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Visual Tree */}
            {selectedTree && (
              <>
                <RoadmapTree
                  tree={selectedTree}
                  progress={treeProgress}
                  onNodeComplete={toggleNodeComplete}
                  userName={userName}
                />
                
                {/* FAQ Section */}
                {selectedTree.faqs && selectedTree.faqs.length > 0 && (
                  <Card className="mt-8">
                    <CardContent className="pt-6">
                      <RoadmapFAQ 
                        faqs={selectedTree.faqs} 
                        title={`${selectedTree.title} FAQs`}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="mt-4">
            {isQuizMode ? (
              <FundamentalsQuizMode
                title="Career Roadmaps Quiz"
                questions={filteredQuestions.map((q) => ({
                  id: q.id,
                  title: q.title,
                  text: q.text,
                  options: q.options || [],
                  difficulty: q.difficulty,
                  answer: q.answer,
                }))}
                sheetId={`roadmap-${selectedCategory === "all" ? "all" : selectedCategory}`}
                onClose={() => setIsQuizMode(false)}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Start Quiz Mode
                  </CardTitle>
                  <CardDescription>
                    Test your knowledge on career roadmaps with {filteredQuestions.filter(q => q.options && q.options.length > 0).length} available questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsQuizMode(true)} className="gap-2">
                    <Play className="h-4 w-4" />
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <QuizLeaderboard quizType="roadmap" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Roadmap;
