import { useState } from "react";
import { motion } from "framer-motion";
import { FileSearch, ArrowLeft, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResumeAnalysis, AnalysisResult } from "@/hooks/useResumeAnalysis";
import { ResumeUploadZone } from "@/components/resume/ResumeUploadZone";
import { AnalysisScoreCard } from "@/components/resume/AnalysisScoreCard";
import { AnalysisCriteriaCard } from "@/components/resume/AnalysisCriteriaCard";
import { AnalysisSuggestions } from "@/components/resume/AnalysisSuggestions";
import { AnalysisStrengths } from "@/components/resume/AnalysisStrengths";
import { AnalysisKeywords } from "@/components/resume/AnalysisKeywords";
import { ResumeAnalysisHistory } from "@/components/resume/ResumeAnalysisHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Demo analysis data for non-logged-in users
const DEMO_ANALYSIS: AnalysisResult = {
  id: "demo",
  user_id: "demo",
  file_name: "sample_resume.pdf",
  file_url: "",
  overall_score: 72,
  ats_score: 85,
  keyword_score: 68,
  format_score: 78,
  content_score: 65,
  suggestions: [
    { text: "Add quantifiable achievements with specific metrics (e.g., 'Increased sales by 25%')", priority: "high" },
    { text: "Include more industry-specific keywords relevant to your target role", priority: "high" },
    { text: "Add a professional summary section at the top of your resume", priority: "medium" },
    { text: "Consider adding relevant certifications or courses", priority: "medium" },
    { text: "Use more action verbs to start bullet points (Led, Developed, Implemented)", priority: "low" },
  ],
  strengths: [
    "Clear and professional formatting",
    "Good use of section headers",
    "Consistent date formatting throughout",
    "Education section is well-structured",
  ],
  keywords_found: [
    "Project Management",
    "Data Analysis",
    "Team Leadership",
    "Python",
    "SQL",
    "Agile",
    "Communication",
  ],
  summary: "Your resume has a solid foundation with good formatting and structure. To improve your score, focus on adding quantifiable achievements and industry-specific keywords. Consider including a professional summary to make a stronger first impression.",
  created_at: new Date().toISOString(),
};

const ResumeAnalyser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
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
  };

  // Determine which analysis to show (demo or real)
  const displayAnalysis = showDemo ? DEMO_ANALYSIS : currentAnalysis;

  // Not logged in state - show demo option
  if (!user && !showDemo) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger />
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
          <SidebarTrigger />
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
              {showDemo && (
                <Button onClick={() => navigate("/login")}>
                  Sign In to Analyze Your Resume
                </Button>
              )}
            </div>

            {/* Demo Banner */}
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="flex items-center gap-3 py-4">
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Demo Mode</p>
                      <p className="text-xs text-muted-foreground">
                        This is a sample analysis. Sign in to analyze your own resume!
                      </p>
                    </div>
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

            {/* Suggestions and Strengths */}
            <div className="grid gap-6 md:grid-cols-2">
              <AnalysisSuggestions suggestions={displayAnalysis.suggestions} />
              <div className="space-y-6">
                <AnalysisStrengths strengths={displayAnalysis.strengths} />
                <AnalysisKeywords keywords={displayAnalysis.keywords_found} />
              </div>
            </div>

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

            {/* Analysis History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
