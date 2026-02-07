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
import DashboardSheets from "./pages/DashboardSheets";
import DashboardProfile from "./pages/DashboardProfile";
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
import Resources from "./pages/platform/Resources";
import Collections from "./pages/platform/Collections";

import PublicProfile from "./pages/PublicProfile";
import SharedFolder from "./pages/SharedFolder";
import Achievements from "./pages/Achievements";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferences from "./pages/NotificationPreferences";

const queryClient = new QueryClient();

// Layout wrapper for dashboard routes
const DashboardLayoutWrapper = () => (
  <ProtectedRoute requireOnboarding>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </ProtectedRoute>
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
                
                {/* Dashboard routes with shared layout */}
                <Route path="/dashboard" element={<DashboardLayoutWrapper />}>
                  <Route index element={<DashboardMatrix />} />
                  <Route path="sheets" element={<DashboardSheets />} />
                  <Route path="sheets/:sheetId" element={<SheetDetail />} />
                  <Route path="profile" element={<DashboardProfile />} />
                  <Route path="achievements" element={<Achievements />} />
                  <Route path="notifications" element={<NotificationCenter />} />
                  <Route path="notifications/preferences" element={<NotificationPreferences />} />
                </Route>

                {/* Library routes */}
                <Route path="/library" element={<DashboardLayoutWrapper />}>
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
                  
                </Route>

                {/* Fundamentals routes */}
                <Route path="/fundamentals" element={<DashboardLayoutWrapper />}>
                  <Route index element={<FundamentalsOverview />} />
                  <Route path="overview" element={<FundamentalsOverview />} />
                  <Route path="language" element={<Language />} />
                  <Route path="oops" element={<OOPsConcepts />} />
                </Route>

                {/* System Design routes */}
                <Route path="/system-design" element={<DashboardLayoutWrapper />}>
                  <Route index element={<SystemDesignOverview />} />
                  <Route path="overview" element={<SystemDesignOverview />} />
                  <Route path="hld" element={<HighLevelDesign />} />
                  <Route path="lld" element={<LowLevelDesign />} />
                </Route>

                {/* Research routes */}
                <Route path="/research" element={<DashboardLayoutWrapper />}>
                  <Route index element={<ResearchOverview />} />
                  <Route path="overview" element={<ResearchOverview />} />
                  <Route path="jobs" element={<JobPortals />} />
                  <Route path="roadmap" element={<Roadmap />} />
                  <Route path="roadmap/:roadmapId" element={<RoadmapDetail />} />
                  <Route path="resume" element={<ResumeTemplates />} />
                  <Route path="analyser" element={<ResumeAnalyser />} />
                  <Route path="outreach" element={<ColdOutreach />} />
                  <Route path="activity" element={<MyActivity />} />
                </Route>

                {/* Platform routes */}
                <Route path="/platform" element={<DashboardLayoutWrapper />}>
                  <Route path="ai" element={<AstraAI />} />
                  <Route path="ai/generate" element={<AIGenerate />} />
                  <Route path="resources" element={<Resources />} />
                  <Route path="collections" element={<Collections />} />
                </Route>

                {/* Settings */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute requireOnboarding>
                      <DashboardLayout>
                        <Settings />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

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
