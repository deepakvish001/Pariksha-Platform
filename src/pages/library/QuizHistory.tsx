 import React, { useEffect, useState } from "react";
 import { format } from "date-fns";
import { Link } from "react-router-dom";
 import {
   History,
   Trophy,
   Target,
   Clock,
   TrendingUp,
   TrendingDown,
   Minus,
   Calendar,
   Award,
    BarChart3,
    ArrowUpDown,
    Trash2,
    CheckSquare,
    Square,
    X,
  Flame,
  Star,
  Zap,
  Medal,
  Crown,
  Sparkles,
  Mail,
  Loader2,
   Eye,
   EyeOff,
   FileText,
 } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from "@/components/ui/alert-dialog";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { cn } from "@/lib/utils";
 import { toast } from "sonner";
import StreakMilestoneToast from "@/components/StreakMilestoneToast";
import { useStreakMilestone } from "@/hooks/useStreakMilestone";
import QuizHistoryDetail from "@/components/library/QuizHistoryDetail";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   ResponsiveContainer,
   AreaChart,
   Area,
  } from "recharts";
import WeakAreasAnalysis from "@/components/library/WeakAreasAnalysis";
import QuizResultExport from "@/components/library/QuizResultExport";
import StudyPlanRecommendations from "@/components/library/StudyPlanRecommendations";
 interface QuizResult {
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
 
 interface Stats {
   totalQuizzes: number;
   avgAccuracy: number;
   bestAccuracy: number;
   totalQuestions: number;
   avgTimePerQuestion: number;
   trend: "up" | "down" | "stable";
 }
 
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  condition: (stats: Stats, results: QuizResult[]) => boolean;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_quiz",
    name: "First Steps",
    description: "Complete your first quiz",
    icon: <Star className="h-5 w-5" />,
    condition: (stats) => stats.totalQuizzes >= 1,
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-500",
  },
  {
    id: "quiz_enthusiast",
    name: "Quiz Enthusiast",
    description: "Complete 10 quizzes",
    icon: <Zap className="h-5 w-5" />,
    condition: (stats) => stats.totalQuizzes >= 10,
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/50 text-purple-500",
  },
  {
    id: "quiz_master",
    name: "Quiz Master",
    description: "Complete 50 quizzes",
    icon: <Crown className="h-5 w-5" />,
    condition: (stats) => stats.totalQuizzes >= 50,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-500",
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Score 100% on any quiz",
    icon: <Trophy className="h-5 w-5" />,
    condition: (_, results) => results.some((r) => Number(r.accuracy) === 100),
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/50 text-emerald-500",
  },
  {
    id: "consistent",
    name: "Consistent Performer",
    description: "Maintain 80%+ average accuracy",
    icon: <Medal className="h-5 w-5" />,
    condition: (stats) => stats.avgAccuracy >= 80 && stats.totalQuizzes >= 5,
    color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/50 text-indigo-500",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Average under 30s per question",
    icon: <Flame className="h-5 w-5" />,
    condition: (stats) => stats.avgTimePerQuestion > 0 && stats.avgTimePerQuestion < 30 && stats.totalQuizzes >= 3,
    color: "from-red-500/20 to-rose-500/20 border-red-500/50 text-red-500",
  },
  {
    id: "improving",
    name: "On The Rise",
    description: "Show upward trend in performance",
    icon: <TrendingUp className="h-5 w-5" />,
    condition: (stats) => stats.trend === "up",
    color: "from-teal-500/20 to-cyan-500/20 border-teal-500/50 text-teal-500",
  },
  {
    id: "century",
    name: "Century Club",
    description: "Answer 100 questions correctly",
    icon: <Sparkles className="h-5 w-5" />,
    condition: (_, results) => results.reduce((sum, r) => sum + r.score, 0) >= 100,
    color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-500",
  },
];

const QuizHistory: React.FC = () => {
   const { user } = useAuth();
   const [results, setResults] = useState<QuizResult[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [quizTypeFilter, setQuizTypeFilter] = useState<string>("all");
   const [timeFilter, setTimeFilter] = useState<string>("all");
   const [stats, setStats] = useState<Stats>({
     totalQuizzes: 0,
     avgAccuracy: 0,
     bestAccuracy: 0,
     totalQuestions: 0,
     avgTimePerQuestion: 0,
     trend: "stable",
   });
  const [quizStreak, setQuizStreak] = useState({ current: 0, longest: 0 });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { showMilestone, milestoneStreak, closeMilestone } = useStreakMilestone();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [quizzesWithDetails, setQuizzesWithDetails] = useState<Set<string>>(new Set());
  const [detailFilter, setDetailFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [isDeletingOld, setIsDeletingOld] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
 
   const fetchResults = async () => {
     if (!user) return;
 
     setIsLoading(true);
     try {
       let query = supabase
         .from("quiz_results")
         .select("*")
         .eq("user_id", user.id)
         .order("completed_at", { ascending: false });
 
       if (quizTypeFilter !== "all") {
         query = query.eq("quiz_type", quizTypeFilter);
       }
 
       if (timeFilter === "today") {
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         query = query.gte("completed_at", today.toISOString());
       } else if (timeFilter === "week") {
         const weekAgo = new Date();
         weekAgo.setDate(weekAgo.getDate() - 7);
         query = query.gte("completed_at", weekAgo.toISOString());
       } else if (timeFilter === "month") {
         const monthAgo = new Date();
         monthAgo.setMonth(monthAgo.getMonth() - 1);
         query = query.gte("completed_at", monthAgo.toISOString());
       }
 
       const { data, error } = await query;

       if (error) throw error;

       setResults(data || []);

       // Fetch which quizzes have detailed responses
       if (data && data.length > 0) {
         const quizIds = data.map((r) => r.id);
         const { data: responseCounts } = await supabase
           .from("quiz_question_responses")
           .select("quiz_result_id")
           .in("quiz_result_id", quizIds);

         if (responseCounts) {
           const idsWithDetails = new Set(responseCounts.map((r) => r.quiz_result_id));
           setQuizzesWithDetails(idsWithDetails);
         }
       }
 
       // Calculate stats
       if (data && data.length > 0) {
         const totalQuizzes = data.length;
         const avgAccuracy = Math.round(
           data.reduce((sum, r) => sum + Number(r.accuracy), 0) / totalQuizzes
         );
         const bestAccuracy = Math.max(...data.map((r) => Number(r.accuracy)));
         const totalQuestions = data.reduce((sum, r) => sum + r.total_questions, 0);
         const totalTime = data.reduce((sum, r) => sum + r.total_time_seconds, 0);
         const avgTimePerQuestion = Math.round(totalTime / totalQuestions) || 0;
 
         // Calculate trend (compare recent 5 vs previous 5)
         let trend: "up" | "down" | "stable" = "stable";
         if (data.length >= 10) {
           const recent = data.slice(0, 5);
           const previous = data.slice(5, 10);
           const recentAvg = recent.reduce((s, r) => s + Number(r.accuracy), 0) / 5;
           const prevAvg = previous.reduce((s, r) => s + Number(r.accuracy), 0) / 5;
           if (recentAvg > prevAvg + 5) trend = "up";
           else if (recentAvg < prevAvg - 5) trend = "down";
         }
 
         setStats({
           totalQuizzes,
           avgAccuracy,
           bestAccuracy,
           totalQuestions,
           avgTimePerQuestion,
           trend,
         });
       } else {
         setStats({
           totalQuizzes: 0,
           avgAccuracy: 0,
           bestAccuracy: 0,
           totalQuestions: 0,
           avgTimePerQuestion: 0,
           trend: "stable",
         });
       }
     } catch (err) {
       console.error("Error fetching quiz history:", err);
     } finally {
       setIsLoading(false);
     }
   };
 
  // Calculate quiz streak based on consecutive days with quizzes
  const calculateQuizStreak = (data: QuizResult[]) => {
    if (!data || data.length === 0) {
      setQuizStreak({ current: 0, longest: 0 });
      return;
    }

    const uniqueDates = [
      ...new Set(
        data.map((item) => {
          const date = new Date(item.completed_at);
          return date.toLocaleDateString("en-CA");
        })
      ),
    ].sort((a, b) => b.localeCompare(a));

    const today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");

    let currentStreak = 0;
    let checkDate = uniqueDates[0] === today ? today : yesterday;

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      currentStreak = 0;
    } else {
      for (let i = 0; i < uniqueDates.length; i++) {
        if (uniqueDates[i] === checkDate) {
          currentStreak++;
          const prevDate = new Date(checkDate);
          prevDate.setDate(prevDate.getDate() - 1);
          checkDate = prevDate.toLocaleDateString("en-CA");
        } else if (uniqueDates[i] < checkDate) {
          break;
        }
      }
    }

    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i - 1]);
      const prevDate = new Date(uniqueDates[i]);
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / 86400000
      );
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    setQuizStreak({ current: currentStreak, longest: longestStreak });
  };

   useEffect(() => {
     fetchResults();
   }, [user, quizTypeFilter, timeFilter]);

  useEffect(() => {
    if (results.length > 0) {
      calculateQuizStreak(results);
    }
  }, [results]);

  const handleViewDetails = (quizId: string) => {
    setSelectedQuizId(quizId);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedQuizId(null);
  };

  const earnedAchievements = ACHIEVEMENTS.filter((a) =>
    a.condition(stats, results)
  );
  const lockedAchievements = ACHIEVEMENTS.filter(
    (a) => !a.condition(stats, results)
  );
 
  const handleSendWeeklySummary = async () => {
    if (!user?.email) {
      toast.error("No email address found for your account");
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const response = await supabase.functions.invoke("send-quiz-summary", {
        body: {
          userId: user.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success("Weekly summary sent to your email!");
    } catch (error: any) {
      console.error("Error sending weekly summary:", error);
      toast.error(error.message || "Failed to send weekly summary");
    } finally {
      setIsSendingEmail(false);
    }
  };

   const handleDeleteResult = async (id: string) => {
     try {
       const { error } = await supabase.from("quiz_results").delete().eq("id", id);
       if (error) throw error;
       toast.success("Quiz result deleted");
       fetchResults();
     } catch (err) {
       toast.error("Failed to delete result");
     }
   };
 
   const handleClearAll = async () => {
     if (!user) return;
     try {
       const { error } = await supabase
         .from("quiz_results")
         .delete()
         .eq("user_id", user.id);
       if (error) throw error;
       toast.success("All quiz history cleared");
       fetchResults();
     } catch (err) {
       toast.error("Failed to clear history");
     }
   };

   const handleDeleteOldQuizzes = async () => {
     if (!user) return;
     
     // Get IDs of quizzes WITHOUT detailed responses
     const quizzesWithoutDetails = results
       .filter((r) => !quizzesWithDetails.has(r.id))
       .map((r) => r.id);
     
     if (quizzesWithoutDetails.length === 0) {
       toast.info("No old quizzes without details to delete");
       return;
     }

     setIsDeletingOld(true);
     try {
       const { error } = await supabase
         .from("quiz_results")
         .delete()
         .in("id", quizzesWithoutDetails);
       
       if (error) throw error;
       toast.success(`Deleted ${quizzesWithoutDetails.length} old quiz${quizzesWithoutDetails.length > 1 ? "zes" : ""} without detailed tracking`);
       fetchResults();
     } catch (err) {
       console.error("Error deleting old quizzes:", err);
       toast.error("Failed to delete old quizzes");
     } finally {
       setIsDeletingOld(false);
     }
   };

   // Filter results based on detail availability
   const filteredByDetail = results.filter((r) => {
     if (detailFilter === "all") return true;
     if (detailFilter === "detailed") return quizzesWithDetails.has(r.id);
     if (detailFilter === "summary") return !quizzesWithDetails.has(r.id);
     return true;
   });

   // Sort results
   const filteredResults = [...filteredByDetail].sort((a, b) => {
     switch (sortBy) {
       case "date-desc":
         return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
       case "date-asc":
         return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
       case "accuracy-desc":
         return Number(b.accuracy) - Number(a.accuracy);
       case "accuracy-asc":
         return Number(a.accuracy) - Number(b.accuracy);
       case "score-desc":
         return (b.score / b.total_questions) - (a.score / a.total_questions);
       case "score-asc":
         return (a.score / a.total_questions) - (b.score / b.total_questions);
       default:
         return 0;
     }
   });

   const quizzesWithoutDetailsCount = results.filter((r) => !quizzesWithDetails.has(r.id)).length;
   const quizzesWithDetailsCount = results.length - quizzesWithoutDetailsCount;
 
   const getQuizTypeBadge = (type: string) => {
     const styles = {
       aptitude: "bg-purple-500/20 text-purple-500 border-purple-500/30",
       dsa: "bg-blue-500/20 text-blue-500 border-blue-500/30",
       sql: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
     };
     return styles[type as keyof typeof styles] || "";
   };
 
   const getDifficultyBadge = (difficulty: string | null) => {
     if (!difficulty || difficulty === "all") return "bg-muted text-muted-foreground";
     const styles = {
       Easy: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
       Medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
       Hard: "bg-red-500/20 text-red-500 border-red-500/30",
     };
     return styles[difficulty as keyof typeof styles] || "";
   };
 
   const getTrendIcon = () => {
     if (stats.trend === "up") return <TrendingUp className="h-5 w-5 text-emerald-500" />;
     if (stats.trend === "down") return <TrendingDown className="h-5 w-5 text-red-500" />;
     return <Minus className="h-5 w-5 text-muted-foreground" />;
   };
 
   // Prepare chart data (last 20 quizzes, reversed for chronological order)
   const chartData = results
     .slice(0, 20)
     .reverse()
     .map((r, index) => ({
       index: index + 1,
       accuracy: Number(r.accuracy),
       avgTime: r.avg_time_seconds,
       date: format(new Date(r.completed_at), "MMM d"),
     }));
 
   if (!user) {
     return (
       <div className="p-6 text-center text-muted-foreground">
         Please log in to view your quiz history.
       </div>
     );
   }
 
   return (
    <>
      <StreakMilestoneToast
        streak={milestoneStreak}
        isVisible={showMilestone}
        onClose={closeMilestone}
      />
      <QuizHistoryDetail
        quizResultId={selectedQuizId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
      <div className="space-y-6 p-4 md:p-6">
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <History className="h-6 w-6 text-primary" />
             Quiz History
           </h1>
           <p className="text-muted-foreground">
             Track your quiz performance and progress over time
           </p>
         </div>
         <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSendWeeklySummary}
              disabled={isSendingEmail || results.length === 0}
              className="gap-2"
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Email Summary
            </Button>
           <Select value={quizTypeFilter} onValueChange={setQuizTypeFilter}>
             <SelectTrigger className="w-[130px]">
               <SelectValue placeholder="Quiz Type" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Types</SelectItem>
               <SelectItem value="aptitude">Aptitude</SelectItem>
               <SelectItem value="dsa">DSA</SelectItem>
               <SelectItem value="sql">SQL</SelectItem>
             </SelectContent>
           </Select>
           <Select value={timeFilter} onValueChange={setTimeFilter}>
             <SelectTrigger className="w-[130px]">
               <SelectValue placeholder="Time" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">All Time</SelectItem>
               <SelectItem value="today">Today</SelectItem>
               <SelectItem value="week">This Week</SelectItem>
               <SelectItem value="month">This Month</SelectItem>
             </SelectContent>
           </Select>
            <Select value={detailFilter} onValueChange={setDetailFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Detail Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quizzes</SelectItem>
                <SelectItem value="detailed">With Details</SelectItem>
                <SelectItem value="summary">Summary Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={cn(
                "w-[150px]",
                sortBy !== "date-desc" && "border-primary/50 bg-primary/5"
              )}>
                <ArrowUpDown className={cn(
                  "h-4 w-4 mr-2",
                  sortBy !== "date-desc" && "text-primary"
                )} />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">
                  <span className="flex items-center gap-2">
                    Newest First
                    {sortBy === "date-desc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
                <SelectItem value="date-asc">
                  <span className="flex items-center gap-2">
                    Oldest First
                    {sortBy === "date-asc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
                <SelectItem value="accuracy-desc">
                  <span className="flex items-center gap-2">
                    Highest Accuracy
                    {sortBy === "accuracy-desc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
                <SelectItem value="accuracy-asc">
                  <span className="flex items-center gap-2">
                    Lowest Accuracy
                    {sortBy === "accuracy-asc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
                <SelectItem value="score-desc">
                  <span className="flex items-center gap-2">
                    Highest Score
                    {sortBy === "score-desc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
                <SelectItem value="score-asc">
                  <span className="flex items-center gap-2">
                    Lowest Score
                    {sortBy === "score-asc" && <span className="text-primary">✓</span>}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
         </div>
       </div>
 
       {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quiz Streak</p>
                  <p className="text-2xl font-bold">{quizStreak.current} 🔥</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
         <Card className="bg-card/50 border-primary/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Total Quizzes</p>
                 <p className="text-2xl font-bold">{stats.totalQuizzes}</p>
               </div>
               <Trophy className="h-8 w-8 text-amber-500/50" />
             </div>
           </CardContent>
         </Card>
         <Card className="bg-card/50 border-primary/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                 <p className="text-2xl font-bold">{stats.avgAccuracy}%</p>
               </div>
               <Target className="h-8 w-8 text-primary/50" />
             </div>
           </CardContent>
         </Card>
         <Card className="bg-card/50 border-primary/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Best Score</p>
                 <p className="text-2xl font-bold">{stats.bestAccuracy}%</p>
               </div>
               <Award className="h-8 w-8 text-emerald-500/50" />
             </div>
           </CardContent>
         </Card>
         <Card className="bg-card/50 border-primary/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Avg Time/Q</p>
                 <p className="text-2xl font-bold">{stats.avgTimePerQuestion}s</p>
               </div>
               <Clock className="h-8 w-8 text-blue-500/50" />
             </div>
           </CardContent>
         </Card>
         <Card className="bg-card/50 border-primary/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm text-muted-foreground">Trend</p>
                 <p className="text-2xl font-bold capitalize">{stats.trend}</p>
               </div>
               {getTrendIcon()}
             </div>
           </CardContent>
         </Card>
       </div>
 
        {/* Achievements Section */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements ({earnedAchievements.length}/{ACHIEVEMENTS.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {earnedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r",
                    achievement.color
                  )}
                >
                  <div className="flex-shrink-0">{achievement.icon}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
              {lockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 opacity-50"
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {achievement.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-muted-foreground truncate">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
         </Card>

        {/* Weak Areas Analysis & Study Plan */}
        <div className="grid gap-4 lg:grid-cols-2">
          <WeakAreasAnalysis />
          <StudyPlanRecommendations />
        </div>

       {/* Performance Chart */}
       {chartData.length > 1 && (
         <Card className="bg-card/50 border-primary/20">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <BarChart3 className="h-5 w-5 text-primary" />
               Performance Trend
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                       <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis
                     dataKey="date"
                     stroke="hsl(var(--muted-foreground))"
                     fontSize={12}
                   />
                   <YAxis
                     domain={[0, 100]}
                     stroke="hsl(var(--muted-foreground))"
                     fontSize={12}
                   />
                   <Tooltip
                     contentStyle={{
                       backgroundColor: "hsl(var(--card))",
                       border: "1px solid hsl(var(--border))",
                       borderRadius: "8px",
                     }}
                     labelStyle={{ color: "hsl(var(--foreground))" }}
                   />
                   <Area
                     type="monotone"
                     dataKey="accuracy"
                     stroke="hsl(var(--primary))"
                     fill="url(#accuracyGradient)"
                     strokeWidth={2}
                     name="Accuracy %"
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Results List */}
       <Card className="bg-card/50 border-primary/20">
         <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Calendar className="h-5 w-5 text-primary" />
             Quiz Attempts ({filteredResults.length}{filteredResults.length !== results.length ? ` of ${results.length}` : ""})
           </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selection mode controls */}
              {isSelectionMode ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedIds.size === filteredResults.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(filteredResults.map((r) => r.id)));
                      }
                    }}
                    className="gap-1"
                  >
                    {selectedIds.size === filteredResults.length ? (
                      <>
                        <Square className="h-4 w-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        Select All ({filteredResults.length})
                      </>
                    )}
                  </Button>
                  {selectedIds.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeletingSelected}
                          className="gap-1"
                        >
                          {isDeletingSelected ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete Selected ({selectedIds.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete selected quizzes?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <span className="block">
                              This will permanently delete <strong>{selectedIds.size}</strong> selected quiz{selectedIds.size > 1 ? "zes" : ""}.
                            </span>
                            <span className="block text-muted-foreground">
                              {results.length - selectedIds.size} quiz{results.length - selectedIds.size !== 1 ? "zes" : ""} will remain.
                            </span>
                            <span className="block text-muted-foreground text-xs mt-2">
                              This action cannot be undone.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              setIsDeletingSelected(true);
                              try {
                                const { error } = await supabase
                                  .from("quiz_results")
                                  .delete()
                                  .in("id", Array.from(selectedIds));
                                if (error) throw error;
                                toast.success(`Deleted ${selectedIds.size} quiz${selectedIds.size > 1 ? "zes" : ""}`);
                                setSelectedIds(new Set());
                                setIsSelectionMode(false);
                                fetchResults();
                              } catch (err) {
                                console.error("Error deleting selected quizzes:", err);
                                toast.error("Failed to delete selected quizzes");
                              } finally {
                                setIsDeletingSelected(false);
                              }
                            }}
                          >
                            Delete Selected
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              ) : (
                <>
                  {filteredResults.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSelectionMode(true)}
                      className="gap-1"
                    >
                      <CheckSquare className="h-4 w-4" />
                      Select
                    </Button>
                  )}
                  {quizzesWithoutDetailsCount > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                          disabled={isDeletingOld}
                        >
                          {isDeletingOld ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Delete Old ({quizzesWithoutDetailsCount})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete old quizzes without details?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <span className="block">
                              This will permanently delete <strong>{quizzesWithoutDetailsCount}</strong> quiz{quizzesWithoutDetailsCount > 1 ? "zes" : ""} that don't have detailed question-by-question tracking.
                            </span>
                            <span className="block text-emerald-600 dark:text-emerald-400">
                              ✓ <strong>{quizzesWithDetailsCount}</strong> quiz{quizzesWithDetailsCount !== 1 ? "zes" : ""} with detailed review will remain.
                            </span>
                            <span className="block text-muted-foreground text-xs mt-2">
                              This action cannot be undone.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteOldQuizzes}>
                            Delete Old Quizzes
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {results.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all quiz history?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all your quiz results. This action cannot
                            be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleClearAll}>
                            Clear All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="text-center py-8 text-muted-foreground"></div>
           ) : filteredResults.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               {results.length === 0 
                 ? "No quiz attempts yet. Take a quiz to see your history here!"
                 : "No quizzes match the current filters."}
             </div>
           ) : (
             <div className="space-y-3 max-h-[500px] overflow-y-auto">
               {filteredResults.map((result) => {
                  const hasDetails = quizzesWithDetails.has(result.id);
                  const isSelected = selectedIds.has(result.id);
                  return (
                    <div
                      key={result.id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        isSelected 
                          ? "bg-primary/10 border-primary/30" 
                          : "bg-muted/30 hover:bg-muted/50",
                        isSelectionMode && "cursor-pointer"
                      )}
                      onClick={isSelectionMode ? () => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(result.id)) {
                            next.delete(result.id);
                          } else {
                            next.add(result.id);
                          }
                          return next;
                        });
                      } : undefined}
                    >
                      {isSelectionMode && (
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <Badge variant="outline" className={getQuizTypeBadge(result.quiz_type)}>
                           {result.quiz_type.toUpperCase()}
                         </Badge>
                         {result.difficulty && result.difficulty !== "all" && (
                           <Badge variant="outline" className={getDifficultyBadge(result.difficulty)}>
                             {result.difficulty}
                           </Badge>
                         )}
                         {result.category && result.category !== "all" && (
                           <Badge variant="outline" className="text-xs">
                             {result.category}
                           </Badge>
                         )}
                         {hasDetails ? (
                           <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs gap-1">
                             <FileText className="h-3 w-3" />
                             Detailed
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                             <EyeOff className="h-3 w-3" />
                             Summary only
                           </Badge>
                         )}
                       </div>
                       <div className="text-sm text-muted-foreground mt-1">
                         {format(new Date(result.completed_at), "MMM d, yyyy 'at' h:mm a")}
                       </div>
                     </div>
                     <div className="flex items-center gap-4 text-right">
                       <div>
                         <div className="font-semibold">
                           {result.score}/{result.total_questions}
                         </div>
                         <div className="text-xs text-muted-foreground">Correct</div>
                       </div>
                       <div>
                         <div
                           className={cn(
                             "font-semibold",
                             Number(result.accuracy) >= 80
                               ? "text-emerald-500"
                               : Number(result.accuracy) >= 50
                                 ? "text-amber-500"
                                 : "text-red-500"
                           )}
                         >
                           {result.accuracy}%
                         </div>
                         <div className="text-xs text-muted-foreground">Accuracy</div>
                       </div>
                       <div>
                         <div className="font-semibold">{result.avg_time_seconds}s</div>
                         <div className="text-xs text-muted-foreground">Avg Time</div>
                       </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(result.id)}
                          className={cn(
                            hasDetails 
                              ? "text-primary hover:text-primary" 
                              : "text-muted-foreground/50 hover:text-muted-foreground"
                          )}
                          title={hasDetails ? "View detailed review" : "Detailed review not available"}
                        >
                          {hasDetails ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <QuizResultExport result={result} />
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" aria-label="Delete quiz result" className="text-muted-foreground hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Delete this result?</AlertDialogTitle>
                           <AlertDialogDescription>
                             This will permanently delete this quiz result.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                           <AlertDialogAction onClick={() => handleDeleteResult(result.id)}>
                             Delete
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                 </div>
               );
               })}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
    </>
  );
 };
 
 export default QuizHistory;