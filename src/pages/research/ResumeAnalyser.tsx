import { motion } from "framer-motion";
import { FileSearch, ArrowLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { ResumeUploadZone } from "@/components/resume/ResumeUploadZone";
import { AnalysisScoreCard } from "@/components/resume/AnalysisScoreCard";
import { AnalysisCriteriaCard } from "@/components/resume/AnalysisCriteriaCard";
import { AnalysisSuggestions } from "@/components/resume/AnalysisSuggestions";
import { AnalysisStrengths } from "@/components/resume/AnalysisStrengths";
import { AnalysisKeywords } from "@/components/resume/AnalysisKeywords";
import { ResumeAnalysisHistory } from "@/components/resume/ResumeAnalysisHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ResumeAnalyser = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Not logged in state
  if (!user) {
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
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign in Required</CardTitle>
              <CardDescription>
                Please sign in to analyze your resume and save your results
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate("/login")}>Sign In</Button>
            </CardContent>
          </Card>
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
        {currentAnalysis ? (
          // Analysis Results View
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={clearCurrentAnalysis}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Analyze Another Resume
              </Button>
            </div>

            {/* Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>{currentAnalysis.file_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentAnalysis.summary}</p>
              </CardContent>
            </Card>

            {/* Score Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnalysisScoreCard score={currentAnalysis.overall_score} />
              <div className="md:col-span-1 lg:col-span-2">
                <AnalysisCriteriaCard
                  atsScore={currentAnalysis.ats_score}
                  keywordScore={currentAnalysis.keyword_score}
                  formatScore={currentAnalysis.format_score}
                  contentScore={currentAnalysis.content_score}
                />
              </div>
            </div>

            {/* Suggestions and Strengths */}
            <div className="grid gap-6 md:grid-cols-2">
              <AnalysisSuggestions suggestions={currentAnalysis.suggestions} />
              <div className="space-y-6">
                <AnalysisStrengths strengths={currentAnalysis.strengths} />
                <AnalysisKeywords keywords={currentAnalysis.keywords_found} />
              </div>
            </div>
          </motion.div>
        ) : (
          // Upload View
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
