 import { useState, useMemo } from "react";
 import { motion } from "framer-motion";
 import { 
   Brain, TrendingUp, Target, Clock, Calendar, Award, 
   CheckCircle, XCircle, BarChart3, Activity
 } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Progress } from "@/components/ui/progress";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { 
   AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
   Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
 } from "recharts";
 import { cn } from "@/lib/utils";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 import { format, subDays, startOfDay, differenceInDays } from "date-fns";
 
 interface SRSStats {
   totalReviews: number;
   masteredQuestions: number;
   activeQuestions: number;
   avgCorrectStreak: number;
   reviewsOverTime: { date: string; reviews: number; mastered: number }[];
   categoryBreakdown: { category: string; count: number; mastered: number }[];
   streakDistribution: { streak: number; count: number }[];
 }
 
 const categoryColors: Record<string, string> = {
   dsa: "#3b82f6",
   cs: "#a855f7", 
   sql: "#10b981",
   aptitude: "#f59e0b",
 };
 
 const categoryLabels: Record<string, string> = {
   dsa: "DSA",
   cs: "CS Core",
   sql: "SQL",
   aptitude: "Aptitude",
 };
 
 const SRSStatsDashboard = () => {
   const { user } = useAuth();
   const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");
 
   const { data: stats, isLoading } = useQuery({
     queryKey: ["srs-stats", user?.id, timeRange],
     queryFn: async (): Promise<SRSStats> => {
       if (!user) throw new Error("Not authenticated");
 
       const startDate = timeRange === "all" 
         ? undefined 
         : subDays(new Date(), timeRange === "7d" ? 7 : 30);
 
       // Fetch current active reviews
       const { data: activeReviews, error: activeError } = await supabase
         .from("quiz_spaced_repetition")
         .select("*")
         .eq("user_id", user.id);
 
       if (activeError) throw activeError;
 
       // Fetch quiz results to estimate mastered questions
       let resultsQuery = supabase
         .from("quiz_results")
         .select("*")
         .eq("user_id", user.id)
         .order("completed_at", { ascending: true });
 
       if (startDate) {
         resultsQuery = resultsQuery.gte("completed_at", startDate.toISOString());
       }
 
       const { data: quizResults, error: resultsError } = await resultsQuery;
       if (resultsError) throw resultsError;
 
       // Calculate stats
       const active = activeReviews || [];
       const results = quizResults || [];
 
       // Reviews over time (group by day)
       const reviewsByDay = new Map<string, { reviews: number; mastered: number }>();
       const daysToShow = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 60;
       
       for (let i = daysToShow - 1; i >= 0; i--) {
         const date = format(subDays(new Date(), i), "MMM dd");
         reviewsByDay.set(date, { reviews: 0, mastered: 0 });
       }
 
       // Count reviews from active items (using last_answered_at)
       for (const review of active) {
         const date = format(new Date(review.last_answered_at), "MMM dd");
         if (reviewsByDay.has(date)) {
           const existing = reviewsByDay.get(date)!;
           existing.reviews += review.review_count;
         }
       }
 
       // Add quiz completions as review sessions
       for (const result of results) {
         const date = format(new Date(result.completed_at), "MMM dd");
         if (reviewsByDay.has(date)) {
           const existing = reviewsByDay.get(date)!;
           existing.reviews += 1;
         }
       }
 
       const reviewsOverTime = Array.from(reviewsByDay.entries()).map(([date, data]) => ({
         date,
         reviews: data.reviews,
         mastered: data.mastered,
       }));
 
       // Category breakdown
       const categoryMap = new Map<string, { count: number; mastered: number }>();
       for (const review of active) {
         const cat = review.question_category;
         const existing = categoryMap.get(cat) || { count: 0, mastered: 0 };
         existing.count++;
         if (review.correct_streak >= 3) {
           existing.mastered++;
         }
         categoryMap.set(cat, existing);
       }
 
       const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
         category,
         count: data.count,
         mastered: data.mastered,
       }));
 
       // Streak distribution
       const streakCounts = [0, 0, 0, 0]; // 0, 1, 2, 3+
       for (const review of active) {
         const streak = Math.min(review.correct_streak, 3);
         streakCounts[streak]++;
       }
 
       const streakDistribution = [
         { streak: 0, count: streakCounts[0] },
         { streak: 1, count: streakCounts[1] },
         { streak: 2, count: streakCounts[2] },
         { streak: 3, count: streakCounts[3] },
       ];
 
       // Calculate totals
       const totalReviews = active.reduce((sum, r) => sum + r.review_count, 0);
       const avgStreak = active.length > 0 
         ? active.reduce((sum, r) => sum + r.correct_streak, 0) / active.length 
         : 0;
 
       // Estimate mastered (questions that had 3+ streak and were removed)
       const masteredEstimate = results
         .filter(r => r.accuracy >= 80)
         .reduce((sum, r) => sum + Math.floor(r.score / 3), 0);
 
       return {
         totalReviews,
         masteredQuestions: masteredEstimate,
         activeQuestions: active.length,
         avgCorrectStreak: Number(avgStreak.toFixed(1)),
         reviewsOverTime,
         categoryBreakdown,
         streakDistribution,
       };
     },
     enabled: !!user,
   });
 
   if (!user) {
     return null;
   }
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="py-12 text-center text-muted-foreground">
           <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
           Loading statistics...
         </CardContent>
       </Card>
     );
   }
 
   if (!stats) {
     return null;
   }
 
   const pieData = stats.categoryBreakdown.map(cat => ({
     name: categoryLabels[cat.category] || cat.category,
     value: cat.count,
     color: categoryColors[cat.category] || "#6b7280",
   }));
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       className="space-y-6"
     >
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
             <BarChart3 className="h-6 w-6 text-amber-500" />
           </div>
           <div>
             <h2 className="text-xl font-bold">Spaced Repetition Stats</h2>
             <p className="text-sm text-muted-foreground">Track your review progress over time</p>
           </div>
         </div>
         <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
           <TabsList>
             <TabsTrigger value="7d">7 Days</TabsTrigger>
             <TabsTrigger value="30d">30 Days</TabsTrigger>
             <TabsTrigger value="all">All Time</TabsTrigger>
           </TabsList>
         </Tabs>
       </div>
 
       {/* Summary Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                 <Target className="h-5 w-5 text-blue-500" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{stats.activeQuestions}</p>
                 <p className="text-xs text-muted-foreground">Active Questions</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                 <CheckCircle className="h-5 w-5 text-green-500" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{stats.masteredQuestions}</p>
                 <p className="text-xs text-muted-foreground">Mastered</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                 <Activity className="h-5 w-5 text-amber-500" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{stats.totalReviews}</p>
                 <p className="text-xs text-muted-foreground">Total Reviews</p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         <Card>
           <CardContent className="pt-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                 <TrendingUp className="h-5 w-5 text-purple-500" />
               </div>
               <div>
                 <p className="text-2xl font-bold">{stats.avgCorrectStreak}</p>
                 <p className="text-xs text-muted-foreground">Avg Streak</p>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Charts Row */}
       <div className="grid md:grid-cols-2 gap-6">
         {/* Activity Chart */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Calendar className="h-4 w-4" />
               Review Activity
             </CardTitle>
             <CardDescription>Questions reviewed per day</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.reviewsOverTime}>
                   <defs>
                     <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis 
                     dataKey="date" 
                     tick={{ fontSize: 10 }} 
                     tickLine={false}
                     axisLine={false}
                   />
                   <YAxis 
                     tick={{ fontSize: 10 }} 
                     tickLine={false}
                     axisLine={false}
                   />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'hsl(var(--card))', 
                       borderColor: 'hsl(var(--border))',
                       borderRadius: '8px',
                     }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="reviews" 
                     stroke="#f59e0b" 
                     strokeWidth={2}
                     fill="url(#reviewGradient)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
 
         {/* Category Distribution */}
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Brain className="h-4 w-4" />
               Category Distribution
             </CardTitle>
             <CardDescription>Questions by category</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="h-[200px]">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={pieData}
                       cx="50%"
                       cy="50%"
                       innerRadius={40}
                       outerRadius={70}
                       paddingAngle={3}
                       dataKey="value"
                     >
                       {pieData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Legend 
                       verticalAlign="bottom" 
                       height={36}
                       formatter={(value) => <span className="text-xs">{value}</span>}
                     />
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-muted-foreground">
                   No data yet
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Streak Progress */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Award className="h-4 w-4" />
             Mastery Progress
           </CardTitle>
           <CardDescription>Distribution of correct answer streaks (3 = mastered)</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="h-[150px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.streakDistribution} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                 <XAxis type="number" tick={{ fontSize: 10 }} />
                 <YAxis 
                   type="category" 
                   dataKey="streak" 
                   tick={{ fontSize: 10 }}
                   tickFormatter={(value) => value === 3 ? "3+ (Mastered)" : `${value} correct`}
                   width={100}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'hsl(var(--card))', 
                     borderColor: 'hsl(var(--border))',
                     borderRadius: '8px',
                   }}
                   formatter={(value) => [`${value} questions`, 'Count']}
                 />
                 <Bar 
                   dataKey="count" 
                   fill="#10b981" 
                   radius={[0, 4, 4, 0]}
                 />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 };
 
 export default SRSStatsDashboard;