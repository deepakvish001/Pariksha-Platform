import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles, Loader2, RefreshCw, Settings2, Target, Calendar, FileDown, ChevronDown,
  CalendarPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudyProfile } from "@/hooks/useStudyProfile";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useStudyPlan } from "@/hooks/useStudyPlan";
import { InlinePlanWizard } from "@/components/my-plan/InlinePlanWizard";
import { PlatformProfilesCard } from "@/components/my-plan/PlatformProfilesCard";
import { TodayTasksList } from "@/components/my-plan/TodayTasksList";
import { WeeklyPlanView } from "@/components/my-plan/WeeklyPlanView";
import { AdaptiveInsights } from "@/components/my-plan/AdaptiveInsights";
import { ProgressAnalytics } from "@/components/my-plan/ProgressAnalytics";
import { AIRecommendations } from "@/components/my-plan/AIRecommendations";
import { StreakHistoryChart } from "@/components/my-plan/StreakHistoryChart";
import { FocusTimerCard } from "@/components/my-plan/FocusTimerCard";
import { DailyCheckInDialog } from "@/components/my-plan/DailyCheckInDialog";
import { CatchUpButton } from "@/components/my-plan/CatchUpButton";
import { GoalProgressWidget } from "@/components/my-plan/GoalProgressWidget";
import { AddAdhocTaskDialog } from "@/components/my-plan/AddAdhocTaskDialog";
import { PlanCoachPanel } from "@/components/my-plan/PlanCoachPanel";
import { exportPlanToPdf } from "@/lib/my-plan/exportPlanPdf";
import { downloadPlanIcs } from "@/lib/my-plan/exportPlanIcs";
import { resolveTaskLink } from "@/lib/my-plan/taskLinks";
import { usePlanActivityLog } from "@/hooks/usePlanActivityLog";
import type { RecommendationMode } from "@/lib/adaptive/rerank";
import { toast } from "@/hooks/use-toast";

const todayIso = () => {
  const t = new Date(); t.setHours(0,0,0,0); return t.toISOString().slice(0,10);
};
const tomorrowIso = () => {
  const t = new Date(); t.setHours(0,0,0,0); t.setDate(t.getDate()+1);
  return t.toISOString().slice(0,10);
};

const MyPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, save } = useStudyProfile();
  const { stats } = usePlatformStats();
  const {
    plan, tasks, loading: planLoading, generating,
    generate, updateTaskStatus, moveTaskToDay, toggleLock, catchUp, addAdhocTask,
    bulkUpdateStatus, restoreStatuses, bulkMoveToDay, restoreDays,
  } = useStudyPlan();
  const { entries: activity, log: logActivity, clear: clearActivity } = usePlanActivityLog();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [recMode, setRecMode] = useState<RecommendationMode>(() => {
    if (typeof window === "undefined") return "adaptive";
    return (localStorage.getItem("myplan:recMode") as RecommendationMode) || "adaptive";
  });
  const [checkInOpen, setCheckInOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("myplan:recMode", recMode);
  }, [recMode]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?redirect=/learn/my-plan");
  }, [authLoading, user, navigate]);

  // Auto-prompt daily check-in once per day, after 6pm local, if there are unfinished tasks
  useEffect(() => {
    if (!user || tasks.length === 0) return;
    const today = todayIso();
    const lastShown = localStorage.getItem("myplan:checkin");
    if (lastShown === today) return;
    const hour = new Date().getHours();
    if (hour < 18) return;
    const hasUnfinished = tasks.some(
      (t) => t.day_date === today && (t.status === "pending" || t.status === "in_progress" || t.status === "partial")
    );
    if (hasUnfinished) {
      setCheckInOpen(true);
      localStorage.setItem("myplan:checkin", today);
    }
  }, [user, tasks]);

  // Keyboard shortcuts: J/K cycle through today's tasks, Enter toggles done, P exports PDF.
  useEffect(() => {
    if (!plan) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const today = todayIso();
      const todays = tasks.filter((t) => t.day_date === today);
      if (todays.length === 0 && e.key.toLowerCase() !== "p") return;
      const focusedId = document.activeElement?.id?.startsWith("task-")
        ? document.activeElement.id.replace(/^task-/, "")
        : null;
      const idx = focusedId ? todays.findIndex((t) => t.id === focusedId) : -1;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        const next = todays[Math.min(todays.length - 1, idx + 1)] ?? todays[0];
        document.getElementById(`task-${next.id}`)?.focus();
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        const prev = todays[Math.max(0, idx - 1)] ?? todays[0];
        document.getElementById(`task-${prev.id}`)?.focus();
      } else if (e.key === "Enter" && focusedId) {
        const t = todays.find((tt) => tt.id === focusedId);
        if (t) {
          e.preventDefault();
          updateTaskStatus(t.id, t.status === "done" ? "pending" : "done");
        }
      } else if ((e.key === "p" || e.key === "P") && profile) {
        e.preventDefault();
        exportPlanToPdf(plan, tasks, profile, 28);
        toast({ title: "PDF generated", description: "Your 28-day plan summary is downloading." });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [plan, tasks, profile, updateTaskStatus]);

  const daysLeft = useMemo(() => {
    if (!profile?.target_date) return null;
    return Math.max(0, Math.ceil((new Date(profile.target_date).getTime() - Date.now()) / 86400000));
  }, [profile]);

  const handleGenerate = async (opts?: { fromTomorrow?: boolean; preserveLocked?: boolean }) => {
    if (!profile) return;
    try {
      await generate(
        profile, stats, profile.topics_known,
        opts?.fromTomorrow ? { fromDayOffset: 1, preserveLocked: opts.preserveLocked } : undefined
      );
      toast({
        title: opts?.fromTomorrow ? "Plan updated from tomorrow" : "Plan generated",
        description: opts?.fromTomorrow
          ? "Today stays put. Future days were regenerated."
          : "Your personalized study plan is ready.",
      });
    } catch (e) {
      toast({
        title: "Plan generation failed", variant: "destructive",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const handleStartTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === "pending") await updateTaskStatus(taskId, "in_progress");
    const link = resolveTaskLink(task);
    if (!link) {
      const el = document.getElementById(`task-${taskId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCarryOver = async (taskId: string) => {
    await moveTaskToDay(taskId, tomorrowIso());
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showWizard = !profileLoading && (!profile || editProfileOpen);

  return (
    <div className="min-h-screen bg-background w-full">
      <Helmet>
        <title>My Plan — Personalized Study Dashboard</title>
        <meta name="description" content="AI-powered personalized study plan tailored to your goal, level, and coding profile stats." />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 sm:h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger />
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">My Plan</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Personalized, adaptive study schedule
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {profile && plan && (
              <CatchUpButton
                tasks={tasks}
                onCatchUp={() => catchUp(profile.weekday_minutes, profile.weekend_minutes)}
              />
            )}
            {profile && !editProfileOpen && (
              <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)} aria-label="Edit profile">
                <Settings2 className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit profile</span>
              </Button>
            )}
            {profile && plan && (
              <AddAdhocTaskDialog onAdd={addAdhocTask} />
            )}
            {profile && plan && (
              <PlanCoachPanel
                tasks={tasks}
                profile={profile}
                onUpdateTaskStatus={updateTaskStatus}
                onMoveTaskToDay={moveTaskToDay}
                onBulkMoveToDay={bulkMoveToDay}
                onRestoreDays={restoreDays}
                onLogActivity={logActivity}
              />
            )}
            {profile && plan && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="Export">
                    <FileDown className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export plan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      exportPlanToPdf(plan, tasks, profile, 28);
                      toast({ title: "PDF generated", description: "Your 28-day plan summary is downloading." });
                    }}
                  >
                    <FileDown className="h-3.5 w-3.5 mr-2" /> 28-day PDF summary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      downloadPlanIcs(tasks, { days: 28, startHour: 9 });
                      toast({
                        title: "Calendar file downloaded",
                        description: "Open the .ics in Google or Apple Calendar to subscribe.",
                      });
                    }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 mr-2" /> Calendar (.ics)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {profile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={generating} aria-label={plan ? "Re-plan" : "Generate plan"}>
                    {generating
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />}
                    <span className="hidden sm:inline">{plan ? "Re-plan" : "Generate plan"}</span>
                    {plan && <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Re-plan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleGenerate()}>
                    Regenerate full plan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerate({ fromTomorrow: true, preserveLocked: true })}>
                    Re-plan from tomorrow (keep locked)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleGenerate({ fromTomorrow: true, preserveLocked: false })}>
                    Re-plan from tomorrow (overwrite)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {showWizard && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <InlinePlanWizard
              initial={profile ?? undefined}
              onComplete={async (p) => {
                await save(p);
                setEditProfileOpen(false);
                toast({ title: "Profile saved", description: "Now connect a coding profile or generate your plan." });
              }}
            />
          </motion.div>
        )}

        {profile && !editProfileOpen && (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-3.5 w-3.5" /> Your goal
                    </div>
                    <p className="text-lg sm:text-xl font-semibold capitalize">{profile.goal.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize">{profile.level}</Badge>
                      <span>{profile.weekday_minutes} min weekday · {profile.weekend_minutes} min weekend</span>
                    </div>
                  </div>
                  {daysLeft != null && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <Calendar className="h-3 w-3" /> Target
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-primary">{daysLeft}</p>
                      <p className="text-xs text-muted-foreground">days left</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {!plan && !planLoading && (
              <Card className="p-8 text-center space-y-3">
                <h2 className="text-xl font-semibold">Ready to generate your plan</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  We'll use your profile {stats.length > 0 ? "and connected coding stats " : ""}to build a tailored schedule.
                </p>
                <Button onClick={() => handleGenerate()} disabled={generating}>
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate my plan
                </Button>
              </Card>
            )}

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {plan && (
                  <TodayTasksList
                    tasks={tasks}
                    onToggle={updateTaskStatus}
                    onLockToggle={toggleLock}
                    onStartTask={handleStartTask}
                    mode={recMode}
                  />
                )}
                {plan && (
                  <WeeklyPlanView
                    tasks={tasks}
                    onToggle={updateTaskStatus}
                    onMoveTask={moveTaskToDay}
                    onBulkUpdate={bulkUpdateStatus}
                    onRestore={restoreStatuses}
                    onLogActivity={logActivity}
                  />
                )}
                {plan && <StreakHistoryChart tasks={tasks} />}
                {plan && <ProgressAnalytics tasks={tasks} />}
              </div>
              <div className="space-y-4 sm:space-y-6">
                {plan && (
                  <GoalProgressWidget
                    tasks={tasks}
                    activity={activity}
                    onClearActivity={clearActivity}
                  />
                )}
                {plan && (
                  <FocusTimerCard
                    tasks={tasks}
                    onTaskCompleted={updateTaskStatus}
                  />
                )}
                {plan && (
                  <AIRecommendations
                    tasks={tasks}
                    onStart={(t) => handleStartTask(t.id)}
                    mode={recMode}
                    onModeChange={setRecMode}
                  />
                )}
                {plan && <AdaptiveInsights plan={plan} tasks={tasks} />}
                <PlatformProfilesCard />
              </div>
            </div>

            <DailyCheckInDialog
              open={checkInOpen}
              onOpenChange={setCheckInOpen}
              tasks={tasks}
              onUpdate={updateTaskStatus}
              onCarryOver={handleCarryOver}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default MyPlan;
