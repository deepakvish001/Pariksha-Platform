import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AchievementNotificationProvider } from "@/contexts/AchievementNotificationContext";
import { LevelUpProvider } from "@/contexts/LevelUpContext";
import { PushNotificationProvider } from "@/contexts/PushNotificationContext";
import { FaviconNotificationProvider } from "@/contexts/FaviconNotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RouteRestorer } from "@/components/RouteRestorer";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardMatrix from "./pages/DashboardMatrix";
import SubmissionsHistory from "./pages/dashboard/SubmissionsHistory";
import DashboardSheets from "./pages/DashboardSheets";
import DashboardProfile from "./pages/DashboardProfile";
import DashboardProfileRedirect from "./pages/DashboardProfileRedirect";
import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./components/UnderConstruction";
import SheetDetail from "./pages/SheetDetail";
import FullStackRoadmap from "./pages/FullStackRoadmap";
import DashboardRoadmaps from "./pages/DashboardRoadmaps";
import DashboardRoadmapDetail from "./pages/DashboardRoadmapDetail";
import DashboardRoadmapCompare from "./pages/DashboardRoadmapCompare";

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
import Roadmap from "./pages/research/Roadmap";
import RoadmapDetail from "./pages/research/RoadmapDetail";
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
import MyRoadmaps from "./pages/platform/ai/MyRoadmaps";
import MyQuizzes from "./pages/platform/ai/MyQuizzes";
import RoadmapChat from "./pages/platform/ai/RoadmapChat";
import StaffPicks from "./pages/platform/ai/StaffPicks";
import Community from "./pages/platform/ai/Community";
import AIContentDetail from "./pages/platform/ai/AIContentDetail";
import Resources from "./pages/platform/Resources";
import Collections from "./pages/platform/Collections";

import PublicProfile from "./pages/PublicProfile";
import SharedFolder from "./pages/SharedFolder";
import Achievements from "./pages/Achievements";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/u/:username" element={<PublicProfile />} />
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
                <Route path="/dashboard" element={<ProtectedDashboardWrapper />}>
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="notifications" element={<NotificationCenter />} />
                  <Route path="notifications/preferences" element={<NotificationPreferences />} />
                </Route>

                {/* Public dashboard routes (viewable without login) */}
                <Route path="/dashboard" element={<PublicDashboardWrapper />}>
                  <Route index element={<DashboardMatrix />} />
                  <Route path="sheets" element={<DashboardSheets />} />
                  <Route path="sheets/:sheetId" element={<SheetDetail />} />
                  <Route path="profile" element={<DashboardProfile />} />
                  <Route path="submissions" element={<SubmissionsHistory />} />
                  <Route path="roadmaps" element={<DashboardRoadmaps />} />
                  <Route path="roadmaps/compare" element={<DashboardRoadmapCompare />} />
                  {/* Legacy generic detail (kept reachable for older bookmarks) */}
                  <Route path="roadmaps/:roadmapId/list" element={<DashboardRoadmapDetail />} />
                  {/* All roadmaps now use the interactive flow view */}
                  <Route path="roadmaps/:roadmapId" element={<FullStackRoadmap />} />
                  <Route path="roadmap/fullstack" element={<FullStackRoadmap />} />
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
                  <Route path="roadmap" element={<Roadmap />} />
                  <Route path="roadmap/:roadmapId" element={<RoadmapDetail />} />
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

                {/* Platform routes - protected */}
                <Route path="/platform" element={<ProtectedDashboardWrapper />}>
                  <Route path="ai" element={<AstraAI />} />
                  <Route path="ai/generate" element={<AIGenerate />} />
                  <Route path="ai/my-plans" element={<MyPlans />} />
                  <Route path="ai/my-courses" element={<MyCourses />} />
                  <Route path="ai/my-guides" element={<MyGuides />} />
                  <Route path="ai/my-roadmaps" element={<MyRoadmaps />} />
                  <Route path="ai/my-quizzes" element={<MyQuizzes />} />
                  <Route path="ai/roadmap-chat" element={<RoadmapChat />} />
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

                {/* Under Construction page for locked features */}
                <Route path="/under-construction" element={<PublicDashboardWrapper />}>
                  <Route index element={<UnderConstruction />} />
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
