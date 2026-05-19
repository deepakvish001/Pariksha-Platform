import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";

function LegacyDashboardRedirect() {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(/^\/dashboard/, "/learn") + search + hash;
  return <Navigate to={next} replace />;
}
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AchievementNotificationProvider } from "@/contexts/AchievementNotificationContext";
import { LevelUpProvider } from "@/contexts/LevelUpContext";
import { PushNotificationProvider } from "@/contexts/PushNotificationContext";
import { FaviconNotificationProvider } from "@/contexts/FaviconNotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RouteRestorer } from "@/components/RouteRestorer";
import { CrossTabAuthSync } from "@/components/CrossTabAuthSync";
import { DashboardLayout } from "@/components/DashboardLayout";

import RouteSeo from "@/components/RouteSeo";
import B2BLanding from "@/b2b/pages/Landing";
import B2BOnboarding from "@/b2b/pages/Onboarding";
import B2BDashboard from "@/b2b/pages/Dashboard";
import B2BAssessmentsList from "@/b2b/pages/assessments/List";
import B2BAssessmentNew from "@/b2b/pages/assessments/New";
import B2BAssessmentDetail from "@/b2b/pages/assessments/Detail";
import B2BAssessmentLanding from "@/b2b/pages/assessments/Landing";
import StudentInviteLanding from "@/assessments/pages/InviteLanding";
import B2BAssessmentManage from "@/b2b/pages/assessments/Manage";
import B2BAttemptDetail from "@/b2b/pages/assessments/AttemptDetail";
import B2BCandidateDetail from "@/b2b/pages/assessments/CandidateDetail";
import B2BQuestionBank from "@/b2b/pages/QuestionBank";

import B2BTeam from "@/b2b/pages/Team";
import B2BJoinOrg from "@/b2b/pages/JoinOrg";
import B2BSettings from "@/b2b/pages/Settings";
import B2BInsightsFeedback from "@/b2b/pages/InsightsFeedback";
import B2BPricing from "@/b2b/pages/Pricing";
import { OrgWorkspace } from "@/b2b/context/OrgContext";
import { RequireOrgCapability } from "@/b2b/components/RequireOrgCapability";
import B2BStudents from "@/b2b/pages/Students";
import B2BPlacements from "@/b2b/pages/placements/PlacementsDashboard";
import B2BStudentDetail from "@/b2b/pages/StudentDetail";
import MyCollege from "@/pages/MyCollege";
import JoinStudent from "@/pages/JoinStudent";
import { ParikshaaShell } from "@/admin/parikshaa/ParikshaaShell";
import ParikshaaOverview from "@/admin/parikshaa/Overview";
import ParikshaaUsers from "@/admin/parikshaa/Users";
import ParikshaaOrgs from "@/admin/parikshaa/Orgs";
import ParikshaaModeration from "@/admin/parikshaa/Moderation";
import ParikshaaLeads from "@/admin/parikshaa/Leads";
import ParikshaaDemoRequests from "@/admin/parikshaa/DemoRequests";
import ParikshaaFunnel from "@/admin/parikshaa/Funnel";
import ParikshaaEmailPreview from "@/admin/parikshaa/EmailPreview";
import ParikshaaInviteSourceBackfill from "@/admin/parikshaa/InviteSourceBackfill";
import ParikshaaProctoring from "@/admin/parikshaa/Proctoring";
import StudentJoin from "@/assessments/pages/Join";
import StudentSideCamera from "@/assessments/pages/SideCamera";
import StudentSideCameraUpload from "@/assessments/pages/SideCameraUpload";
import MyAssessments from "@/assessments/pages/MyAssessments";
import StudentLobby from "@/assessments/pages/Lobby";
import StudentPreflight from "@/assessments/pages/Preflight";
import StudentPlayer from "@/assessments/pages/Player";
import IntegrityPolicy from "@/assessments/pages/IntegrityPolicy";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardMatrix from "./pages/DashboardMatrix";
import SubmissionsHistory from "./pages/dashboard/SubmissionsHistory";
import Leaderboard from "./pages/dashboard/Leaderboard";
import MyPlan from "./pages/dashboard/MyPlan";
import DashboardSheets from "./pages/DashboardSheets";
import DsaStudio from "./pages/learn/DsaStudio";
import DsaStudioProblem from "./pages/learn/DsaStudioProblem";
import DsaStudioPattern from "./pages/learn/DsaStudioPattern";
import DsaStudioPatternsPage from "./pages/learn/dsa-studio/PatternsPage";
import DsaStudioTricksPage from "./pages/learn/dsa-studio/TricksPage";
import DsaStudioEdgePage from "./pages/learn/dsa-studio/EdgePage";

import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

import SheetDetail from "./pages/SheetDetail";

// Library Pages
import PositionResources from "./pages/library/PositionResources";
import PositionDetail from "./pages/library/PositionDetail";
import CompanyResources from "./pages/library/CompanyResources";
import CompanyDetail from "./pages/library/CompanyDetail";
import MassRecruitment from "./pages/library/MassRecruitment";
import InterviewQuestions from "./pages/library/InterviewQuestions";
import DSAQuestions from "./pages/library/DSAQuestions";
import SQLQuestions from "./pages/library/SQLQuestions";
import AptitudeQuestions from "./pages/library/AptitudeQuestions";
import CoreCSSubjects from "./pages/library/CoreCSSubjects";
import HandwrittenNotes from "./pages/library/HandwrittenNotes";
import Quiz from "./pages/library/Quiz";
import QuizHistory from "./pages/library/QuizHistory";
import CodingProblems from "./pages/library/CodingProblems";
import CodingProblemDetail from "./pages/library/CodingProblemDetail";
import DailyChallengeWeekly from "./pages/library/DailyChallengeWeekly";
import CodingLeaderboard from "./pages/library/CodingLeaderboard";

// Fundamentals Pages
import Language from "./pages/fundamentals/Language";
import OOPsConcepts from "./pages/fundamentals/OOPsConcepts";
import FundamentalsOverview from "./pages/fundamentals/Overview";

// System Design Pages
import HighLevelDesign from "./pages/system-design/HighLevelDesign";
import LowLevelDesign from "./pages/system-design/LowLevelDesign";
import SystemDesignOverview from "./pages/system-design/SystemDesignOverview";

// Research Pages
import ResearchOverview from "./pages/research/Overview";
import JobPortals from "./pages/research/JobPortals";
import ResumeTemplates from "./pages/research/ResumeTemplates";
import ResumeAnalyser from "./pages/research/ResumeAnalyser";
import ColdOutreach from "./pages/research/ColdOutreach";
import MyActivity from "./pages/research/MyActivity";

// Platform Pages
import AstraAI from "./pages/platform/AstraAI";
import AIGenerate from "./pages/platform/AIGenerate";
import MyPlans from "./pages/platform/ai/MyPlans";
import MyCourses from "./pages/platform/ai/MyCourses";
import MyGuides from "./pages/platform/ai/MyGuides";
import MyQuizzes from "./pages/platform/ai/MyQuizzes";
import StaffPicks from "./pages/platform/ai/StaffPicks";
import Community from "./pages/platform/ai/Community";
import AIContentDetail from "./pages/platform/ai/AIContentDetail";
import Resources from "./pages/platform/Resources";
import Collections from "./pages/platform/Collections";

import PublicProfile from "./pages/PublicProfile";
import { AdminRoute } from "@/components/AdminRoute";
import { ArenaLayout } from "@/arena/ArenaLayout";
import ArenaHome from "@/arena/pages/ArenaHome";
import ArenaQueue from "@/arena/pages/ArenaQueue";
import BattleRoom from "@/arena/pages/BattleRoom";
import BattleResult from "@/arena/pages/BattleResult";
import ArenaLeaderboard from "@/arena/pages/ArenaLeaderboard";
import ArenaFriends from "@/arena/pages/ArenaFriends";
import ArenaPrivate from "@/arena/pages/ArenaPrivate";
import ArenaHistory from "@/arena/pages/ArenaHistory";
import ArenaRoom from "@/arena/pages/ArenaRoom";
import ArenaJoinCode from "@/arena/pages/ArenaJoinCode";

import ArenaDaily from "@/arena/pages/ArenaDaily";
import ArenaSolo from "@/arena/pages/ArenaSolo";
import ArenaSoloSession from "@/arena/pages/ArenaSoloSession";
import ArenaSoloReport from "@/arena/pages/ArenaSoloReport";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProblemsList from "./pages/admin/AdminProblemsList";
import ProblemEditor from "./pages/admin/ProblemEditor";
import BulkImport from "./pages/admin/BulkImport";
import AuditLog from "./pages/admin/AuditLog";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";

import Broadcast from "./pages/admin/Broadcast";
import Reports from "./pages/admin/Reports";
import ArenaModeration from "./pages/admin/ArenaModeration";
import SettingsAndFlags from "./pages/admin/SettingsAndFlags";
import StorageBrowser from "./pages/admin/StorageBrowser";
import SystemHealth from "./pages/admin/SystemHealth";
import CronJobs from "./pages/admin/CronJobs";

import SupportInbox from "./pages/admin/SupportInbox";
import SecurityCenter from "./pages/admin/SecurityCenter";
import AchievementsAdmin from "./pages/admin/AchievementsAdmin";
import LeaderboardsAdmin from "./pages/admin/LeaderboardsAdmin";

import NotificationsAdmin from "./pages/admin/NotificationsAdmin";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AiInsightFeedback from "./pages/admin/AiInsightFeedback";
import QuizzesAdmin from "./pages/admin/QuizzesAdmin";

import SubmissionsAdmin from "./pages/admin/SubmissionsAdmin";
import SharedFolder from "./pages/SharedFolder";
import Achievements from "./pages/Achievements";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferences from "./pages/NotificationPreferences";

// Contests
import ContestsList from "./pages/contests/ContestsList";
import ContestDetail from "./pages/contests/ContestDetail";
import ContestLeaderboard from "./pages/contests/ContestLeaderboard";
import ContestPlayProblem from "./pages/contests/ContestPlayProblem";
import ContestKioskLayout from "./layouts/ContestKioskLayout";
import AdminContestsList from "./pages/admin/contests/AdminContestsList";
import ContestEditor from "./pages/admin/contests/ContestEditor";
import AdminContestRegistrations from "./pages/admin/contests/AdminContestRegistrations";
import AdminContestLeaderboard from "./pages/admin/contests/AdminContestLeaderboard";
import AdminContestProctor from "./pages/admin/contests/AdminContestProctor";
import AdminSessionForensics from "./pages/admin/contests/AdminSessionForensics";
import PublicIntegrityReport from "./pages/contests/PublicIntegrityReport";
import SideEyeMobile from "./pages/contests/SideEyeMobile";
import PublicVerifyReport from "./pages/contests/PublicVerifyReport";
import PublicSessionSealVerify from "./pages/contests/PublicSessionSealVerify";
import AdminSideEyeConsole from "./pages/admin/contests/AdminSideEyeConsole";
import AdminIntegrityQueue from "./pages/admin/contests/AdminIntegrityQueue";
import AdminBlogList from "./pages/admin/blog/AdminBlogList";
import AdminBlogEditor from "./pages/admin/blog/AdminBlogEditor";
import AdminBlogComments from "./pages/admin/blog/AdminBlogComments";
import AdminBlogAudit from "./pages/admin/blog/AdminBlogAudit";
import AdminBlogRevisions from "./pages/admin/blog/AdminBlogRevisions";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache aggressively — show data instantly from cache, refetch silently in background.
      staleTime: 60_000,           // 1 min: data is "fresh" → no refetch on mount/navigation
      gcTime: 10 * 60_000,         // 10 min: keep cached pages around when navigating away
      refetchOnWindowFocus: false, // don't refetch on tab focus
      refetchOnReconnect: "always",
      retry: 1,
    },
  },
});

// Protected layout - requires login + onboarding
const ProtectedDashboardWrapper = () => (
  <ProtectedRoute requireOnboarding>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </ProtectedRoute>
);

// Public layout - no auth required, just the dashboard shell
const PublicDashboardWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <PushNotificationProvider>
          <FaviconNotificationProvider>
          <AchievementNotificationProvider>
          <LevelUpProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteRestorer />
              <CrossTabAuthSync />
              <RouteSeo />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Legacy /dashboard → /learn redirect (one-shot, kept for old bookmarks) */}
                <Route path="/dashboard" element={<LegacyDashboardRedirect />} />
                <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />

                {/* B2B (Parikshaa for Teams) */}
                <Route path="/b2b" element={<B2BLanding />} />
                <Route path="/b2b/join/:token" element={<B2BJoinOrg />} />
                <Route path="/pricing" element={<B2BPricing />} />
                <Route path="/b2b/onboarding" element={<ProtectedRoute><B2BOnboarding /></ProtectedRoute>} />
                <Route path="/b2b/dashboard" element={<ProtectedRoute><B2BDashboard /></ProtectedRoute>} />
                <Route path="/b2b/assessments" element={<ProtectedRoute><B2BAssessmentsList /></ProtectedRoute>} />
                <Route path="/b2b/assessments/new" element={<ProtectedRoute><B2BAssessmentNew /></ProtectedRoute>} />
                <Route path="/b2b/assessments/:id" element={<ProtectedRoute><B2BAssessmentLanding /></ProtectedRoute>} />
                <Route path="/b2b/assessments/:id/edit" element={<ProtectedRoute><B2BAssessmentDetail /></ProtectedRoute>} />
                <Route path="/b2b/assessments/:id/manage" element={<ProtectedRoute><B2BAssessmentManage /></ProtectedRoute>} />
                <Route path="/b2b/assessments/:id/attempts/:attemptId" element={<ProtectedRoute><B2BAttemptDetail /></ProtectedRoute>} />
                <Route path="/b2b/assessments/:id/candidates/:candidateSeg" element={<ProtectedRoute><B2BCandidateDetail /></ProtectedRoute>} />
                <Route path="/b2b/question-bank/*" element={<ProtectedRoute><B2BQuestionBank /></ProtectedRoute>} />
                <Route path="/b2b/proctoring" element={<Navigate to="/b2b/assessments" replace />} />
                <Route path="/b2b/settings/team" element={<ProtectedRoute><B2BTeam /></ProtectedRoute>} />
                <Route path="/b2b/settings" element={<ProtectedRoute><B2BSettings /></ProtectedRoute>} />
                <Route path="/b2b/insights/feedback" element={<ProtectedRoute><B2BInsightsFeedback /></ProtectedRoute>} />
                <Route path="/b2b/students" element={<ProtectedRoute><B2BStudents /></ProtectedRoute>} />
                <Route path="/b2b/students/:studentId" element={<ProtectedRoute><B2BStudentDetail /></ProtectedRoute>} />
                <Route path="/b2b/placements" element={<ProtectedRoute><B2BPlacements /></ProtectedRoute>} />

                {/* Student-facing college home */}
                <Route path="/my/college" element={<ProtectedRoute><MyCollege /></ProtectedRoute>} />
                <Route path="/join/student" element={<JoinStudent />} />

                {/* Vanity org workspaces — members only, slug-resolved */}
                {(["companies", "colleges"] as const).map((seg) => {
                  const expectedType = seg === "companies" ? ("company" as const) : ("college" as const);
                  return (
                    <Route
                      key={seg}
                      path={`/${seg}/:slug`}
                      element={
                        <ProtectedRoute>
                          <OrgWorkspace expectedType={expectedType} />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<B2BDashboard />} />
                      <Route path="assessments" element={<B2BAssessmentsList />} />
                      <Route path="assessments/new" element={<RequireOrgCapability cap="assessments.write"><B2BAssessmentNew /></RequireOrgCapability>} />
                      <Route path="assessments/:id" element={<B2BAssessmentLanding />} />
                      <Route path="assessments/:id/edit" element={<B2BAssessmentDetail />} />
                      <Route path="assessments/:id/manage" element={<RequireOrgCapability cap="assessments.write"><B2BAssessmentManage /></RequireOrgCapability>} />
                      <Route path="assessments/:id/attempts/:attemptId" element={<B2BAttemptDetail />} />
                      <Route path="assessments/:id/candidates/:candidateSeg" element={<B2BCandidateDetail />} />
                      <Route path="question-bank/*" element={<B2BQuestionBank />} />
                      <Route path="proctoring" element={<Navigate to="assessments" replace />} />
                      <Route path="team" element={<RequireOrgCapability cap="members.invite"><B2BTeam /></RequireOrgCapability>} />
                      <Route path="settings" element={<RequireOrgCapability cap="org.editSettings"><B2BSettings /></RequireOrgCapability>} />
                      <Route path="insights/feedback" element={<B2BInsightsFeedback />} />
                      <Route path="students" element={<RequireOrgCapability cap="members.invite"><B2BStudents /></RequireOrgCapability>} />
                      <Route path="students/:studentId" element={<RequireOrgCapability cap="members.invite"><B2BStudentDetail /></RequireOrgCapability>} />
                      <Route path="placements" element={<B2BPlacements />} />
                    </Route>
                  );
                })}

                {/* Student-side assessments */}
                <Route path="/assessments/join/:token" element={<StudentInviteLanding />} />
                <Route path="/assessments/join/:token/claim" element={<StudentJoin />} />
                <Route path="/assessments/sidecam/:token" element={<StudentSideCamera />} />
                <Route path="/assessments/sidecam/:token/upload/:questionId" element={<StudentSideCameraUpload />} />
                <Route path="/assessments/integrity-policy" element={<IntegrityPolicy />} />
                <Route path="/assessments" element={<ProtectedRoute><MyAssessments /></ProtectedRoute>} />
                <Route path="/assessments/:attemptId/lobby" element={<ProtectedRoute><StudentLobby /></ProtectedRoute>} />
                <Route path="/assessments/:attemptId/preflight" element={<ProtectedRoute><StudentPreflight /></ProtectedRoute>} />
                <Route path="/assessments/:attemptId/play" element={<ProtectedRoute><StudentPlayer /></ProtectedRoute>} />

                <Route path="/shared/:shareCode" element={<SharedFolder />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected dashboard routes (personal pages) */}
                <Route path="/learn" element={<ProtectedDashboardWrapper />}>
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="notifications" element={<NotificationCenter />} />
                  <Route path="notifications/preferences" element={<NotificationPreferences />} />
                  <Route path="my-plan" element={<MyPlan />} />
                </Route>

                {/* Public dashboard routes (viewable without login) */}
                <Route path="/learn" element={<PublicDashboardWrapper />}>
                  <Route index element={<DashboardMatrix />} />
                  <Route path="sheets" element={<DashboardSheets />} />
                  <Route path="dsa-studio" element={<DsaStudio />} />
                  <Route path="dsa-studio/problems" element={<DsaStudio />} />
                  <Route path="dsa-studio/patterns" element={<DsaStudioPatternsPage />} />
                  <Route path="dsa-studio/tricks" element={<DsaStudioTricksPage />} />
                  <Route path="dsa-studio/edge" element={<DsaStudioEdgePage />} />
                  <Route path="dsa-studio/pattern/:patternId" element={<DsaStudioPattern />} />
                  <Route path="dsa-studio/:slug" element={<DsaStudioProblem />} />
                  <Route path="sheets/:sheetId" element={<SheetDetail />} />
                  
                  <Route path="leaderboard" element={<Leaderboard />} />
                  <Route path="submissions" element={<Leaderboard />} />
                </Route>

                {/* Public profile - inside dashboard layout so it shows the sidebar */}
                <Route element={<PublicDashboardWrapper />}>
                  <Route path="/u/:username" element={<PublicProfile />} />
                </Route>
                {/* Library routes - public */}
                <Route path="/library" element={<PublicDashboardWrapper />}>
                  <Route path="positions" element={<PositionResources />} />
                  <Route path="positions/:roleId" element={<PositionDetail />} />
                  <Route path="companies" element={<CompanyResources />} />
                  <Route path="companies/:companyId" element={<CompanyDetail />} />
                  <Route path="recruitment" element={<MassRecruitment />} />
                  <Route path="interview" element={<InterviewQuestions />} />
                  <Route path="dsa" element={<DSAQuestions />} />
                  <Route path="sql" element={<SQLQuestions />} />
                  <Route path="aptitude" element={<AptitudeQuestions />} />
                  <Route path="cs" element={<CoreCSSubjects />} />
                  <Route path="notes" element={<HandwrittenNotes />} />
                  <Route path="quiz" element={<Quiz />} />
                  <Route path="quiz-history" element={<QuizHistory />} />
                  <Route path="problems" element={<CodingProblems />} />
                  <Route path="problems/weekly" element={<DailyChallengeWeekly />} />
                  <Route path="problems/leaderboard" element={<CodingLeaderboard />} />
                  <Route path="problems/:slug" element={<CodingProblemDetail />} />
                </Route>

                {/* Contests - public */}
                <Route path="/contests" element={<PublicDashboardWrapper />}>
                  <Route index element={<ContestsList />} />
                  <Route path=":slug" element={<ContestDetail />} />
                  <Route path=":slug/leaderboard" element={<ContestLeaderboard />} />
                </Route>
                <Route path="/contests/:contestId/integrity" element={<PublicIntegrityReport />} />
                <Route path="/contests/sideeye/:token" element={<SideEyeMobile />} />

                {/* Contest kiosk — no sidebar/header, used while solving inside a secure session */}
                <Route path="/contests/:slug/play" element={<ContestKioskLayout />}>
                  <Route path=":problemSlug" element={<ContestPlayProblem />} />
                </Route>

                {/* Fundamentals routes - public */}
                <Route path="/fundamentals" element={<PublicDashboardWrapper />}>
                  <Route index element={<FundamentalsOverview />} />
                  <Route path="overview" element={<FundamentalsOverview />} />
                  <Route path="language" element={<Language />} />
                  <Route path="oops" element={<OOPsConcepts />} />
                </Route>

                {/* System Design routes - public */}
                <Route path="/system-design" element={<PublicDashboardWrapper />}>
                  <Route index element={<SystemDesignOverview />} />
                  <Route path="overview" element={<SystemDesignOverview />} />
                  <Route path="hld" element={<HighLevelDesign />} />
                  <Route path="lld" element={<LowLevelDesign />} />
                </Route>

                {/* Research routes - public (except activity) */}
                <Route path="/research" element={<PublicDashboardWrapper />}>
                  <Route index element={<ResearchOverview />} />
                  <Route path="overview" element={<ResearchOverview />} />
                  <Route path="jobs" element={<JobPortals />} />
                  <Route path="resume" element={<ResumeTemplates />} />
                  <Route path="analyser" element={<ResumeAnalyser />} />
                  <Route path="outreach" element={<ColdOutreach />} />
                </Route>

                {/* Research - protected routes */}
                <Route path="/research" element={<ProtectedDashboardWrapper />}>
                  <Route path="activity" element={<MyActivity />} />
                </Route>

                {/* Platform routes - public */}
                <Route path="/platform" element={<PublicDashboardWrapper />}>
                  <Route path="ai/staff-picks" element={<StaffPicks />} />
                  <Route path="ai/community" element={<Community />} />
                  <Route path="ai/content/:contentId" element={<AIContentDetail />} />
                  <Route path="resources" element={<Resources />} />
                </Route>

                {/* Blog - public */}
                <Route path="/blog" element={<PublicDashboardWrapper />}>
                  <Route index element={<BlogIndex />} />
                  <Route path=":slug" element={<BlogPost />} />
                </Route>

                {/* Platform routes - protected */}
                <Route path="/platform" element={<ProtectedDashboardWrapper />}>
                  <Route path="ai" element={<AstraAI />} />
                  <Route path="ai/generate" element={<AIGenerate />} />
                  <Route path="ai/my-plans" element={<MyPlans />} />
                  <Route path="ai/my-courses" element={<MyCourses />} />
                  <Route path="ai/my-guides" element={<MyGuides />} />
                  <Route path="ai/my-quizzes" element={<MyQuizzes />} />
                  <Route path="collections" element={<Collections />} />
                </Route>

                {/* Settings - public browsable */}
                <Route
                  path="/settings"
                  element={
                    <DashboardLayout>
                      <Settings />
                    </DashboardLayout>
                  }
                />



                {/* Admin routes - admin role required. AdminShell provides its own sidebar/layout. */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Outlet />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="problems" element={<AdminProblemsList />} />
                  <Route path="problems/new" element={<ProblemEditor />} />
                  <Route path="problems/import" element={<BulkImport />} />
                  <Route path="problems/:slug/edit" element={<ProblemEditor />} />
                  <Route path="audit" element={<AuditLog />} />
                  
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="roles" element={<AdminRoles />} />
                  
                  <Route path="broadcast" element={<Broadcast />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="arena-moderation" element={<ArenaModeration />} />
                  <Route path="settings" element={<SettingsAndFlags />} />
                  <Route path="storage" element={<StorageBrowser />} />
                  <Route path="system-health" element={<SystemHealth />} />
                  <Route path="cron-jobs" element={<CronJobs />} />

                  <Route path="support" element={<SupportInbox />} />
                  <Route path="security" element={<SecurityCenter />} />
                  <Route path="achievements" element={<AchievementsAdmin />} />
                  <Route path="leaderboards" element={<LeaderboardsAdmin />} />
                  
                  <Route path="notifications" element={<NotificationsAdmin />} />
                  <Route path="alerts" element={<AdminAlerts />} />
                  <Route path="ai-insight-feedback" element={<AiInsightFeedback />} />
                  <Route path="quizzes" element={<QuizzesAdmin />} />
                  
                  <Route path="submissions" element={<SubmissionsAdmin />} />
                  <Route path="contests" element={<AdminContestsList />} />
                  <Route path="contests/new" element={<ContestEditor />} />
                  <Route path="contests/:id/edit" element={<ContestEditor />} />
                  <Route path="contests/:id/registrations" element={<AdminContestRegistrations />} />
                  <Route path="contests/:id/leaderboard" element={<AdminContestLeaderboard />} />
                  <Route path="contests/:id/proctor" element={<AdminContestProctor />} />
                  <Route path="sideeye" element={<AdminSideEyeConsole />} />
                  <Route path="contests/integrity" element={<AdminIntegrityQueue />} />
                  <Route path="contests/sessions/:sessionId/forensics" element={<AdminSessionForensics />} />
                  <Route path="blog" element={<AdminBlogList />} />
                  <Route path="blog/new" element={<AdminBlogEditor />} />
                  <Route path="blog/:id/edit" element={<AdminBlogEditor />} />
                  <Route path="blog/:id/revisions" element={<AdminBlogRevisions />} />
                  <Route path="blog/comments" element={<AdminBlogComments />} />
                  <Route path="blog/audit" element={<AdminBlogAudit />} />
                </Route>
                <Route path="/verify/:reportId" element={<PublicVerifyReport />} />
                <Route path="/verify-seal/:sessionId" element={<PublicSessionSealVerify />} />

                {/* Arena - 1v1 battles */}
                <Route path="/arena" element={<ProtectedRoute><ArenaLayout /></ProtectedRoute>}>
                  <Route index element={<ArenaHome />} />
                  <Route path="queue" element={<ArenaQueue />} />
                  <Route path="battle/:id" element={<BattleRoom />} />
                  <Route path="result/:id" element={<BattleResult />} />
                  <Route path="leaderboard" element={<ArenaLeaderboard />} />
                  <Route path="friends" element={<ArenaFriends />} />
                  <Route path="private" element={<ArenaPrivate />} />
                  <Route path="history" element={<ArenaHistory />} />
                  <Route path="room/:code" element={<ArenaRoom />} />
                  <Route path="join/:code" element={<ArenaJoinCode />} />
                  <Route path="daily" element={<ArenaDaily />} />
                  <Route path="solo" element={<ArenaSolo />} />
                  <Route path="solo/session/:id" element={<ArenaSoloSession />} />
                  <Route path="solo/session/:id/report" element={<ArenaSoloReport />} />
                </Route>
                



                {/* Parikshaa Control Center (super-admin) */}
                <Route
                  path="/admin/parikshaa"
                  element={
                    <AdminRoute>
                      <ParikshaaShell />
                    </AdminRoute>
                  }
                >
                  <Route index element={<ParikshaaOverview />} />
                  <Route path="users" element={<ParikshaaUsers />} />
                  <Route path="orgs" element={<ParikshaaOrgs />} />
                  <Route path="moderation" element={<ParikshaaModeration />} />
                  <Route path="leads" element={<ParikshaaLeads />} />
                  <Route path="demo-requests" element={<ParikshaaDemoRequests />} />
                  <Route path="funnel" element={<ParikshaaFunnel />} />
                  <Route path="email-preview" element={<ParikshaaEmailPreview />} />
                  <Route path="invite-source-backfill" element={<ParikshaaInviteSourceBackfill />} />
                  <Route path="proctoring" element={<ParikshaaProctoring />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </LevelUpProvider>
          </AchievementNotificationProvider>
          </FaviconNotificationProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
