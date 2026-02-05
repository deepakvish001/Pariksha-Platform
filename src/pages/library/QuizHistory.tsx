 import React, { useEffect, useState } from "react";
 import { format } from "date-fns";
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
   Trash2,
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
 
   useEffect(() => {
     fetchResults();
   }, [user, quizTypeFilter, timeFilter]);
 
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
         </div>
       </div>
 
       {/* Stats Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
         <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Calendar className="h-5 w-5 text-primary" />
             Quiz Attempts ({results.length})
           </CardTitle>
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
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="text-center py-8 text-muted-foreground">Loading...</div>
           ) : results.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               No quiz attempts yet. Take a quiz to see your history here!
             </div>
           ) : (
             <div className="space-y-3 max-h-[500px] overflow-y-auto">
               {results.map((result) => (
                 <div
                   key={result.id}
                   className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                 >
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
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
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
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default QuizHistory;