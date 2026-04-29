import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, Settings2, Target, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudyProfile } from "@/hooks/useStudyProfile";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useStudyPlan } from "@/hooks/useStudyPlan";
import { PlanOnboardingWizard } from "@/components/my-plan/PlanOnboardingWizard";
import { PlatformProfilesCard } from "@/components/my-plan/PlatformProfilesCard";
import { TodayTasksList } from "@/components/my-plan/TodayTasksList";
import { WeeklyPlanView } from "@/components/my-plan/WeeklyPlanView";
import { AdaptiveInsights } from "@/components/my-plan/AdaptiveInsights";
import { toast } from "@/hooks/use-toast";

const MyPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, save } = useStudyProfile();
  const { stats } = usePlatformStats();
  const { plan, tasks, loading: planLoading, generating, generate, updateTaskStatus } = useStudyPlan();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/dashboard/my-plan");
    }
  }, [authLoading, user, navigate]);

  // Auto-open wizard if no profile yet
  useEffect(() => {
    if (!profileLoading && user && !profile) setWizardOpen(true);
  }, [profileLoading, profile, user]);

  const daysLeft = useMemo(() => {
    if (!profile?.target_date) return null;
    return Math.max(0, Math.ceil((new Date(profile.target_date).getTime() - Date.now()) / 86400000));
  }, [profile]);

  const handleGenerate = async () => {
    if (!profile) {
      setWizardOpen(true);
      return;
    }
    try {
      await generate(profile, stats, profile.topics_known);
      toast({ title: "Plan generated", description: "Your personalized study plan is ready." });
    } catch (e) {
      toast({
        title: "Plan generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            {profile && (
              <Button variant="outline" size="sm" onClick={() => setWizardOpen(true)}>
                <Settings2 className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Edit profile</span>
              </Button>
            )}
            <Button size="sm" onClick={handleGenerate} disabled={generating || !profile}>
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 sm:mr-1.5" />}
              <span className="hidden sm:inline">{plan ? "Re-plan" : "Generate plan"}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Goal header */}
        {profile && (
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
        )}

        {/* No profile yet */}
        {!profileLoading && !profile && (
          <Card className="p-8 text-center space-y-3">
            <Sparkles className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Build your personalized plan</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tell us your goal, level, and time budget. We'll generate a day-by-day schedule that adapts as you progress.
            </p>
            <Button onClick={() => setWizardOpen(true)}>Get started</Button>
          </Card>
        )}

        {/* No plan yet */}
        {profile && !plan && !planLoading && (
          <Card className="p-8 text-center space-y-3">
            <h2 className="text-xl font-semibold">Ready to generate your plan</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We'll use your profile {stats.length > 0 ? "and connected coding stats " : ""}to build a tailored schedule.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate my plan
            </Button>
          </Card>
        )}

        {/* Main grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {plan && <TodayTasksList tasks={tasks} onToggle={updateTaskStatus} />}
            {plan && <WeeklyPlanView tasks={tasks} onToggle={updateTaskStatus} />}
          </div>
          <div className="space-y-4 sm:space-y-6">
            {plan && <AdaptiveInsights plan={plan} tasks={tasks} />}
            <PlatformProfilesCard />
          </div>
        </div>
      </main>

      <PlanOnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initial={profile ?? undefined}
        onComplete={async (p) => {
          await save(p);
          toast({ title: "Profile saved" });
        }}
      />
    </div>
  );
};

export default MyPlan;
