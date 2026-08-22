import { useState } from "react";
import { motion } from "framer-motion";
import { FileSearch, ArrowLeft, Sparkles, ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResumeAnalysis, AnalysisResult } from "@/hooks/useResumeAnalysis";
import { ResumeUploadZone } from "@/components/resume/ResumeUploadZone";
import { AnalysisScoreCard } from "@/components/resume/AnalysisScoreCard";
import { AnalysisCriteriaCard } from "@/components/resume/AnalysisCriteriaCard";
import { AnalysisSuggestions } from "@/components/resume/AnalysisSuggestions";
import { AnalysisStrengths } from "@/components/resume/AnalysisStrengths";
import { AnalysisKeywords } from "@/components/resume/AnalysisKeywords";
import { ResumeAnalysisHistory } from "@/components/resume/ResumeAnalysisHistory";
import { ResumeAnalysisPDFExport } from "@/components/resume/ResumeAnalysisPDFExport";
import { ResumeAnalysisPrintView } from "@/components/resume/ResumeAnalysisPrintView";
import { ResumeAnalysisComparison } from "@/components/resume/ResumeAnalysisComparison";
import { ResumeTemplateSuggestions } from "@/components/resume/ResumeTemplateSuggestions";
import { ResumeImprovementTracker } from "@/components/resume/ResumeImprovementTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Demo scenarios for non-logged-in users
interface DemoScenario {
  id: string;
  label: string;
  description: string;
  badgeColor: string;
  analysis: AnalysisResult;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "excellent",
    label: "Excellent Resume",
    description: "Senior developer with strong achievements",
    badgeColor: "bg-green-500/10 text-green-500 border-green-500/20",
    analysis: {
      id: "demo-excellent",
      user_id: "demo",
      file_name: "senior_developer_resume.pdf",
      file_url: "",
      overall_score: 92,
      ats_score: 95,
      keyword_score: 90,
      format_score: 94,
      content_score: 88,
      suggestions: [
        { text: "Consider adding a link to your GitHub portfolio or personal website", priority: "low" },
        { text: "You could add 1-2 more industry certifications to strengthen your profile", priority: "low" },
        { text: "Consider tailoring the summary for each specific job application", priority: "medium" },
        { text: "Add volunteer work or side projects to show broader interests", priority: "low" },
        { text: "Include languages spoken if applying to international companies", priority: "low" },
      ],
      strengths: [
        "Excellent use of quantifiable achievements (increased revenue by 40%)",
        "Strong action verbs throughout (Led, Architected, Optimized)",
        "Clear career progression and growth trajectory",
        "Well-organized sections with consistent formatting",
        "Relevant technical skills prominently displayed",
      ],
      keywords_found: [
        "System Architecture",
        "Team Leadership",
        "React",
        "Node.js",
        "AWS",
        "Microservices",
        "CI/CD",
        "Agile",
        "Scrum",
        "Performance Optimization",
      ],
      summary: "Outstanding resume! Your document excels in all key areas. The quantifiable achievements, clear structure, and relevant keywords make this highly effective for both ATS systems and human recruiters. Minor enhancements could include portfolio links and certifications.",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "average",
    label: "Average Resume",
    description: "Mid-level professional with room to improve",
    badgeColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    analysis: {
      id: "demo-average",
      user_id: "demo",
      file_name: "marketing_specialist_resume.pdf",
      file_url: "",
      overall_score: 68,
      ats_score: 75,
      keyword_score: 62,
      format_score: 72,
      content_score: 58,
      suggestions: [
        { text: "Add quantifiable achievements with specific metrics (e.g., 'Increased engagement by 35%')", priority: "high" },
        { text: "Include more industry-specific keywords like 'SEO', 'Google Analytics', 'A/B Testing'", priority: "high" },
        { text: "Add a professional summary section at the top highlighting key strengths", priority: "medium" },
        { text: "Consider adding relevant certifications (Google Ads, HubSpot, etc.)", priority: "medium" },
        { text: "Use more impactful action verbs to start bullet points", priority: "low" },
      ],
      strengths: [
        "Clear and professional formatting",
        "Good use of section headers",
        "Consistent date formatting throughout",
        "Education section is well-structured",
      ],
      keywords_found: [
        "Marketing",
        "Social Media",
        "Content Creation",
        "Campaign Management",
        "Email Marketing",
        "Brand Strategy",
      ],
      summary: "Your resume has a solid foundation with good formatting and structure. To significantly improve your score, focus on adding quantifiable achievements and industry-specific keywords. A professional summary would strengthen your first impression.",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "needs-work",
    label: "Needs Improvement",
    description: "Entry-level with common mistakes",
    badgeColor: "bg-red-500/10 text-red-500 border-red-500/20",
    analysis: {
      id: "demo-needs-work",
      user_id: "demo",
      file_name: "fresh_graduate_resume.pdf",
      file_url: "",
      overall_score: 42,
      ats_score: 45,
      keyword_score: 35,
      format_score: 52,
      content_score: 38,
      suggestions: [
        { text: "Remove the objective statement and replace with a professional summary", priority: "high" },
        { text: "Add specific achievements instead of just listing job duties", priority: "high" },
        { text: "Include relevant technical skills and tools you've used", priority: "high" },
        { text: "Remove personal information like age, marital status, and photo", priority: "high" },
        { text: "Add relevant coursework, projects, or internships to demonstrate experience", priority: "medium" },
      ],
      strengths: [
        "Contact information is clearly visible",
        "Education section includes GPA (good for recent grads)",
      ],
      keywords_found: [
        "Bachelor's Degree",
        "Microsoft Office",
        "Communication",
      ],
      summary: "This resume needs significant improvements to be competitive. The main issues are: lack of quantifiable achievements, missing industry keywords, and outdated formatting (objective statement). Focus on showcasing projects, internships, and specific skills relevant to your target role.",
      created_at: new Date().toISOString(),
    },
  },
];

const ResumeAnalyser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const {
    isUploading,
    isAnalyzing,
    uploadProgress,
    currentAnalysis,
    history,
    isLoadingHistory,
    analyzeResume,
    deleteAnalysis,
    isDeletingAnalysis,
    viewAnalysis,
    clearCurrentAnalysis,
    validateFile,
  } = useResumeAnalysis();

  const handleUpload = (file: File, jobDescription?: string) => {
    analyzeResume({ file, jobDescription });
  };

  const handleExitDemo = () => {
    setShowDemo(false);
    setDemoIndex(0);
  };

  const currentDemoScenario = DEMO_SCENARIOS[demoIndex];

  const handlePrevDemo = () => {
    setDemoIndex((prev) => (prev === 0 ? DEMO_SCENARIOS.length - 1 : prev - 1));
  };

  const handleNextDemo = () => {
    setDemoIndex((prev) => (prev === DEMO_SCENARIOS.length - 1 ? 0 : prev + 1));
  };

  // Determine which analysis to show (demo or real)
  const displayAnalysis = showDemo ? currentDemoScenario.analysis : currentAnalysis;

  // Not logged in state - show demo option
  if (!user && !showDemo) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Resume Analyser</h1>
                <p className="text-sm text-muted-foreground">AI-powered resume analysis</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">
          <div className="max-w-xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Get Your Resume Analyzed</CardTitle>
                  <CardDescription>
                    Sign in to upload your resume and get personalized AI feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <Button onClick={() => navigate("/login")} className="w-full max-w-xs">
                    Sign In to Analyze
                  </Button>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs">or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDemo(true)}
                    className="w-full max-w-xs"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    View Demo Analysis
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    See a sample analysis to understand how it works
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What We Analyze</CardTitle>
                  <CardDescription>Get comprehensive feedback on your resume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✓ ATS (Applicant Tracking System) compatibility</p>
                  <p>✓ Industry keyword optimization</p>
                  <p>✓ Format and structure assessment</p>
                  <p>✓ Content quality and impact statements</p>
                  <p>✓ Actionable improvement suggestions</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-orange flex items-center justify-center">
              <FileSearch className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Resume Analyser</h1>
              <p className="text-sm text-muted-foreground">AI-powered resume analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6">
        {displayAnalysis ? (
          // Analysis Results View
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Button
                variant="ghost"
                onClick={showDemo ? handleExitDemo : clearCurrentAnalysis}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {showDemo ? "Exit Demo" : "Analyze Another Resume"}
              </Button>
              <div className="flex items-center gap-2">
                {!showDemo && (
                  <>
                    <ResumeAnalysisPrintView analysis={displayAnalysis} />
                    <ResumeAnalysisPDFExport analysis={displayAnalysis} />
                    {history.length >= 2 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowComparison(!showComparison)}
                        className="gap-2"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        {showComparison ? "Hide Comparison" : "Compare"}
                      </Button>
                    )}
                  </>
                )}
                {showDemo && (
                  <Button onClick={() => navigate("/login")}>
                    Sign In to Analyze Your Resume
                  </Button>
                )}
              </div>
            </div>

            {/* Demo Banner with Scenario Toggle */}
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Demo Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Browse different resume examples to see how scoring works
                          </p>
                        </div>
                      </div>
                      
                      {/* Scenario Selector */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Previous demo scenario"
                          onClick={handlePrevDemo}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex flex-col items-center min-w-[140px]">
                          <Badge variant="outline" className={currentDemoScenario.badgeColor}>
                            {currentDemoScenario.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground mt-1">
                            {demoIndex + 1} of {DEMO_SCENARIOS.length}
                          </span>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Next demo scenario"
                          onClick={handleNextDemo}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Scenario Description */}
                    <p className="text-xs text-muted-foreground mt-3 text-center sm:text-left">
                      <span className="font-medium">{currentDemoScenario.label}:</span>{" "}
                      {currentDemoScenario.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>{displayAnalysis.file_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{displayAnalysis.summary}</p>
              </CardContent>
            </Card>

            {/* Score Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnalysisScoreCard score={displayAnalysis.overall_score} />
              <div className="md:col-span-1 lg:col-span-2">
                <AnalysisCriteriaCard
                  atsScore={displayAnalysis.ats_score}
                  keywordScore={displayAnalysis.keyword_score}
                  formatScore={displayAnalysis.format_score}
                  contentScore={displayAnalysis.content_score}
                />
              </div>
            </div>

            {/* Comparison Section */}
            {showComparison && !showDemo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ResumeAnalysisComparison
                  analyses={history}
                  onClose={() => setShowComparison(false)}
                />
              </motion.div>
            )}

            {/* Suggestions and Strengths */}
            <div className="grid gap-6 md:grid-cols-2">
              <AnalysisSuggestions suggestions={displayAnalysis.suggestions} />
              <div className="space-y-6">
                <AnalysisStrengths strengths={displayAnalysis.strengths} />
                <AnalysisKeywords keywords={displayAnalysis.keywords_found} />
              </div>
            </div>

            {/* Template Suggestions based on analysis */}
            {!showDemo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ResumeTemplateSuggestions analysis={displayAnalysis} />
              </motion.div>
            )}

            {/* CTA for demo users */}
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                    <div>
                      <h3 className="font-semibold">Ready to analyze your resume?</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign in to get personalized feedback on your actual resume
                      </p>
                    </div>
                    <Button onClick={() => navigate("/login")} size="lg">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        ) : (
          // Upload View (only for logged-in users)
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto"
            >
              <ResumeUploadZone
                onUpload={handleUpload}
                isUploading={isUploading}
                isAnalyzing={isAnalyzing}
                uploadProgress={uploadProgress}
                validateFile={validateFile}
              />
            </motion.div>

            {/* Quick Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-xl mx-auto"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Tips</CardTitle>
                  <CardDescription>Get the best results from your analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Use PDF format for best compatibility</p>
                  <p>• Include a job description for targeted feedback</p>
                  <p>• Ensure your resume is text-based (not an image)</p>
                  <p>• Remove any password protection before uploading</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Improvement Tracker */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl mx-auto"
              >
                <ResumeImprovementTracker history={history} />
              </motion.div>
            )}

            {/* Analysis History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto"
            >
              <ResumeAnalysisHistory
                history={history}
                isLoading={isLoadingHistory}
                onView={viewAnalysis}
                onDelete={deleteAnalysis}
                isDeleting={isDeletingAnalysis}
              />
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeAnalyser;
